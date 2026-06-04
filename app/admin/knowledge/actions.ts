"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdminUser } from "@/app/actions/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function approveKnowledgeSource(formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") || "");
  const source = await getSourceByUrl(url);
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error: sourceError } = await supabase
    .from("website_json_sources")
    .update({
      approved_for_rag: true,
      review_status: "approved",
      needs_review: false,
      sync_enabled: true,
      disabled_reason: null,
      approved_at: now,
      updated_at: now
    })
    .eq("id", source.id);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  await updateRagApproval(source.id, true, "approved");
  revalidateKnowledgePages();
}

export async function disableKnowledgeSource(formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") || "");
  const source = await getSourceByUrl(url);
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error: sourceError } = await supabase
    .from("website_json_sources")
    .update({
      approved_for_rag: false,
      review_status: "disabled",
      needs_review: false,
      sync_enabled: false,
      disabled_reason: "Disabled from admin knowledge review",
      updated_at: now
    })
    .eq("id", source.id);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  await updateRagApproval(source.id, false, "disabled");
  revalidateKnowledgePages();
}

export async function approveCoreKnowledgeSources(formData: FormData) {
  await requireAdmin();
  const urls = formData.getAll("urls").map((url) => String(url)).filter(Boolean);

  if (!urls.length) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data: sources, error } = await supabase
    .from("website_json_sources")
    .select("id")
    .in("url", urls);

  if (error) {
    throw new Error(error.message);
  }

  const sourceIds = (sources || []).map((source) => source.id);

  if (!sourceIds.length) {
    return;
  }

  const now = new Date().toISOString();
  const { error: sourceError } = await supabase
    .from("website_json_sources")
    .update({
      approved_for_rag: true,
      review_status: "approved",
      needs_review: false,
      sync_enabled: true,
      disabled_reason: null,
      approved_at: now,
      updated_at: now
    })
    .in("id", sourceIds);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const { error: indexError } = await supabase
    .from("knowledge_index")
    .update({
      approved_for_rag: true,
      review_status: "approved",
      is_active: true,
      updated_at: now
    })
    .in("source_id", sourceIds);

  if (indexError) {
    throw new Error(indexError.message);
  }

  const { error: chunkError } = await supabase
    .from("rag_chunks")
    .update({
      approved_for_rag: true,
      is_active: true,
      updated_at: now
    })
    .in("source_id", sourceIds);

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  revalidateKnowledgePages();
}

async function requireAdmin() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

async function getSourceByUrl(url: string) {
  if (!url) {
    throw new Error("Missing source URL.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("website_json_sources")
    .select("id")
    .eq("url", url)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Source not found.");
  }

  return data;
}

async function updateRagApproval(sourceId: string, approved: boolean, reviewStatus: "approved" | "disabled") {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error: indexError } = await supabase
    .from("knowledge_index")
    .update({
      approved_for_rag: approved,
      review_status: reviewStatus,
      is_active: approved,
      updated_at: now
    })
    .eq("source_id", sourceId);

  if (indexError) {
    throw new Error(indexError.message);
  }

  const { error: chunkError } = await supabase
    .from("rag_chunks")
    .update({
      approved_for_rag: approved,
      is_active: approved,
      updated_at: now
    })
    .eq("source_id", sourceId);

  if (chunkError) {
    throw new Error(chunkError.message);
  }
}

function revalidateKnowledgePages() {
  revalidatePath("/admin/knowledge");
  revalidatePath("/admin/dashboard");
}
