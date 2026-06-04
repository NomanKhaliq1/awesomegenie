"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdminUser } from "@/app/actions/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function markRequirementReviewed(formData: FormData) {
  await updateRequirementClientStatus(formData, "pm_reviewed");
}

export async function markRequirementNeedsInfo(formData: FormData) {
  await updateRequirementClientStatus(formData, "needs_more_info");
}

export async function markRequirementCompleted(formData: FormData) {
  await updateRequirementClientStatus(formData, "completed");
}

async function updateRequirementClientStatus(formData: FormData, status: string) {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/");
  }

  const requirementId = String(formData.get("requirement_id") || "");

  if (!requirementId) {
    throw new Error("Missing requirement ID.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: requirement, error } = await supabase
    .from("client_requirements")
    .select("id,client_id,session_id")
    .eq("id", requirementId)
    .single();

  if (error || !requirement) {
    throw new Error(error?.message || "Requirement not found.");
  }

  const now = new Date().toISOString();

  if (requirement.client_id) {
    const { error: clientError } = await supabase
      .from("clients")
      .update({ status, updated_at: now })
      .eq("id", requirement.client_id);

    if (clientError) {
      throw new Error(clientError.message);
    }
  }

  if (requirement.session_id) {
    const sessionStatus = status === "completed" ? "completed" : "needs_more_info";
    await supabase
      .from("chat_sessions")
      .update({ session_status: sessionStatus, updated_at: now })
      .eq("id", requirement.session_id);
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${requirementId}`);
  revalidatePath("/admin/dashboard");
}
