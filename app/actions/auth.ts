"use server";

import { redirect } from "next/navigation";

import { createSupabaseAuthClient } from "@/lib/supabase/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/?error=missing_credentials");
  }

  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/?error=invalid_login");
  }

  const isAllowed = await isAllowedAdmin(email);

  if (!isAllowed) {
    await supabase.auth.signOut();
    redirect("/?error=not_admin");
  }

  redirect("/admin/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getCurrentAdminUser() {
  const supabase = await createSupabaseAuthClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user?.email) {
    return null;
  }

  const email = data.user.email.toLowerCase();

  if (!(await isAllowedAdmin(email))) {
    return null;
  }

  return {
    id: data.user.id,
    email,
    name: data.user.user_metadata?.full_name || email
  };
}

async function isAllowedAdmin(email: string) {
  const admin = createSupabaseAdminClient();

  const { count, error: countError } = await admin
    .from("admin_users")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return false;
  }

  if (!count) {
    return true;
  }

  const { data, error } = await admin
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return !error && Boolean(data);
}
