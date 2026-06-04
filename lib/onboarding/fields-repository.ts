import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type OnboardingFieldDefinition = {
  id: string;
  field_key: string;
  label: string;
  question_text: string;
  field_type: string;
  is_required: boolean;
  order_index: number;
  is_active: boolean;
};

export type ServiceOnboardingFields = {
  id: string;
  name: string;
  slug: string;
  fields: OnboardingFieldDefinition[];
};

export async function loadServiceOnboardingFields(): Promise<ServiceOnboardingFields[]> {
  const supabase = createSupabaseAdminClient();
  const { data: categories } = await supabase
    .from("service_categories")
    .select("id,name,slug,priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (!categories?.length) {
    return [];
  }

  const { data: fields } = await supabase
    .from("onboarding_fields")
    .select("id,service_category_id,field_key,label,question_text,field_type,is_required,order_index,is_active")
    .in("service_category_id", categories.map((category) => category.id))
    .order("order_index", { ascending: true });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    fields: (fields || [])
      .filter((field) => field.service_category_id === category.id)
      .map((field) => ({
        id: field.id,
        field_key: field.field_key,
        label: field.label,
        question_text: field.question_text,
        field_type: field.field_type,
        is_required: field.is_required,
        order_index: field.order_index,
        is_active: field.is_active
      }))
  }));
}
