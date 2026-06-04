import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type RequirementSummary = {
  id: string;
  client_id: string | null;
  session_id: string | null;
  service_type: string | null;
  completion_score: number | null;
  missing_fields_json: string[] | null;
  requirements_json: Record<string, unknown> | null;
  updated_at: string | null;
  service_categories: { name: string | null; slug: string | null } | null;
};

type RawRequirementSummary = Omit<RequirementSummary, "service_categories"> & {
  service_categories:
    | { name: string | null; slug: string | null }
    | Array<{ name: string | null; slug: string | null }>
    | null;
};

export async function loadRequirementSummaries(limit = 50): Promise<RequirementSummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_requirements")
    .select(
      "id,client_id,session_id,service_type,completion_score,missing_fields_json,requirements_json,updated_at,service_categories(name,slug)"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data || []) as RawRequirementSummary[]).map((row) => ({
    ...row,
    service_categories: Array.isArray(row.service_categories)
      ? row.service_categories[0] || null
      : row.service_categories
  }));
}

export type ClientLeadSummary = {
  id: string;
  company_name: string | null;
  email: string | null;
  service_interest: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RequirementDetail = RequirementSummary & {
  client_requirement_values: Array<{
    id: string;
    field_key: string;
    field_label: string | null;
    value: unknown;
    is_missing: boolean | null;
    confidence_score: number | null;
  }>;
  clients: {
    id: string;
    company_name: string | null;
    email: string | null;
    service_interest: string | null;
    status: string | null;
  } | null;
};

export async function loadClientLeadSummaries(limit = 50): Promise<ClientLeadSummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id,company_name,email,service_interest,status,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return data || [];
}

export async function loadRequirementDetail(id: string): Promise<RequirementDetail | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_requirements")
    .select(
      "id,client_id,session_id,service_type,completion_score,missing_fields_json,requirements_json,updated_at,service_categories(name,slug),clients(id,company_name,email,service_interest,status),client_requirement_values(id,field_key,field_label,value,is_missing,confidence_score)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as RequirementDetail & {
    service_categories:
      | { name: string | null; slug: string | null }
      | Array<{ name: string | null; slug: string | null }>
      | null;
    clients:
      | RequirementDetail["clients"]
      | Array<NonNullable<RequirementDetail["clients"]>>
      | null;
  };

  return {
    ...row,
    service_categories: Array.isArray(row.service_categories)
      ? row.service_categories[0] || null
      : row.service_categories,
    clients: Array.isArray(row.clients) ? row.clients[0] || null : row.clients,
    client_requirement_values: [...(row.client_requirement_values || [])].sort((a, b) =>
      a.field_key.localeCompare(b.field_key)
    )
  };
}

export async function loadRequirementStats() {
  const rows = await loadRequirementSummaries(500);

  return {
    total: rows.length,
    qualified: rows.filter((row) => Number(row.completion_score || 0) >= 80).length,
    needsInfo: rows.filter((row) => Number(row.completion_score || 0) < 80).length,
    averageCompletion: rows.length
      ? Math.round(rows.reduce((total, row) => total + Number(row.completion_score || 0), 0) / rows.length)
      : 0
  };
}
