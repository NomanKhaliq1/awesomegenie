import { inferServiceArea, inferServiceCategorySlug } from "@/lib/chat/intent";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type OnboardingField = {
  id: string;
  service_category_id: string;
  field_key: string;
  label: string;
  question_text: string;
  field_type: string;
  is_required: boolean;
  order_index: number;
  options: string[] | null;
};

type RequirementRow = {
  id: string;
  requirements_json: Record<string, unknown> | null;
  service_category_id: string | null;
  service_type: string | null;
};

export type OnboardingUpdate = {
  started: boolean;
  was_existing: boolean;
  service_category_id?: string;
  service_category_slug?: string;
  service_type: string;
  client_id?: string | null;
  requirement_id?: string;
  completion_score: number;
  missing_fields: string[];
  next_question?: string;
  suggested_replies: string[];
  captured_fields: string[];
  requirements: Record<string, unknown>;
};

export async function updateOnboardingFromMessage(params: {
  sessionId: string;
  message: string;
  forceStart?: boolean;
}): Promise<OnboardingUpdate | null> {
  const supabase = createSupabaseAdminClient();
  const existing = await loadExistingRequirement(params.sessionId);
  const lowerMessage = params.message.toLowerCase();
  const existingServiceSlug = existing?.service_category_id
    ? await getServiceSlug(existing.service_category_id)
    : "";
  const inferredServiceSlug = inferServiceCategorySlug(params.message);
  const shouldStartNewRequirement =
    Boolean(existing) &&
    (Boolean(params.forceStart) || /\b(?:i|we)\s+(?:also\s+)?need\b/.test(lowerMessage)) &&
    inferredServiceSlug !== "other" &&
    inferredServiceSlug !== existingServiceSlug;
  const activeRequirement = shouldStartNewRequirement ? null : existing;

  if (!params.forceStart && !activeRequirement) {
    return null;
  }

  const serviceSlug = activeRequirement?.service_category_id
    ? existingServiceSlug || (await getServiceSlug(activeRequirement.service_category_id))
    : inferServiceCategorySlug(params.message);
  const serviceArea =
    activeRequirement?.service_type ||
    inferServiceArea(params.message) ||
    serviceSlug.replaceAll("_", " ");
  const serviceCategory = await getServiceCategory(serviceSlug);

  if (!serviceCategory) {
    return null;
  }

  const fields = await loadOnboardingFields(serviceCategory.id);
  const currentRequirements = activeRequirement?.requirements_json || carryForwardSharedRequirements(existing?.requirements_json);
  const extracted = extractFieldValues(params.message, fields, currentRequirements);
  const requirements: Record<string, unknown> = {
    ...currentRequirements,
    service_type: serviceArea,
    ...extracted
  };
  const missingFields = fields
    .filter((field) => field.is_required && !hasValue(requirements[field.field_key]))
    .map((field) => field.field_key);
  const completionScore = calculateCompletionScore(fields, requirements);
  const nextQuestionField = getNextQuestionField(fields, requirements);
  const requirement = await upsertRequirement({
    id: activeRequirement?.id,
    sessionId: params.sessionId,
    serviceCategoryId: serviceCategory.id,
    serviceType: serviceArea,
    requirements,
    missingFields,
    completionScore
  });
  const clientId = await upsertClientFromRequirements({
    sessionId: params.sessionId,
    serviceType: serviceArea,
    requirements,
    completionScore
  });

  if (clientId) {
    await attachClientToSessionAndRequirement({
      sessionId: params.sessionId,
      requirementId: requirement.id,
      clientId
    });
  }

  await syncRequirementValues(requirement.id, fields, requirements);

  return {
    started: true,
    was_existing: Boolean(activeRequirement),
    service_category_id: serviceCategory.id,
    service_category_slug: serviceCategory.slug,
    service_type: serviceArea,
    client_id: clientId,
    requirement_id: requirement.id,
    completion_score: completionScore,
    missing_fields: missingFields,
    next_question: nextQuestionField?.question_text,
    suggested_replies: nextQuestionField
      ? buildSuggestedReplies(nextQuestionField, serviceCategory.slug)
      : ["Add more details", "Share files later", "That's all"],
    captured_fields: Object.keys(extracted),
    requirements
  };
}

export function buildOnboardingReply(update: OnboardingUpdate) {
  if (update.next_question) {
    if (update.captured_fields.includes("company_name")) {
      return `Got it. ${update.next_question}`;
    }

    if (update.captured_fields.includes("contact_email")) {
      return `Thanks, I saved that email. ${update.next_question}`;
    }

    if (update.captured_fields.length) {
      return `That helps. ${update.next_question}`;
    }

    return update.next_question;
  }

  return buildQualifiedReply(update);
}

function buildQualifiedReply(update: OnboardingUpdate) {
  const companyName = asString(update.requirements.company_name);
  const email = asString(update.requirements.contact_email);
  const phone = asString(update.requirements.contact_phone);
  const projectOverview = asString(update.requirements.project_overview);
  const currentSystem = asString(update.requirements.current_system);
  const workflowGoal =
    asString(update.requirements.integration_goal) ||
    asString(update.requirements.automation_scope) ||
    asString(update.requirements.workflow_goal) ||
    asString(update.requirements.source_target_systems) ||
    asString(update.requirements.data_sources) ||
    asString(update.requirements.required_features);
  const painPoints = asString(update.requirements.pain_points);
  const successGoals = asString(update.requirements.success_goals);
  const timeline = asString(update.requirements.timeline);
  const budget = asString(update.requirements.budget_range);
  const contentAssets = asString(update.requirements.content_assets);
  const details = [
    companyName ? `Company: ${companyName}` : "",
    email ? `Email: ${email}` : "",
    phone ? `Phone: ${phone}` : "",
    projectOverview ? `Project: ${projectOverview}` : "",
    currentSystem ? `Current system: ${currentSystem}` : "",
    workflowGoal ? `Goal: ${workflowGoal}` : "",
    painPoints ? `Pain point: ${painPoints}` : "",
    successGoals ? `Success goal: ${successGoals}` : "",
    timeline ? `Timeline: ${timeline}` : "",
    budget ? `Budget: ${budget}` : "",
    contentAssets ? `Files/content: ${contentAssets}` : ""
  ].filter(Boolean);

  return [
    "Perfect, I have a solid project snapshot now.",
    details.length ? details.join("\n") : "",
    "You can add more details, share files later, or tell me if this is enough for now."
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function loadExistingRequirement(sessionId: string): Promise<RequirementRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("client_requirements")
    .select("id,requirements_json,service_category_id,service_type")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function getServiceCategory(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("service_categories")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

async function getServiceSlug(serviceCategoryId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("service_categories")
    .select("slug")
    .eq("id", serviceCategoryId)
    .maybeSingle();

  return data?.slug || "other";
}

async function loadOnboardingFields(serviceCategoryId: string): Promise<OnboardingField[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("onboarding_fields")
    .select("id,service_category_id,field_key,label,question_text,field_type,is_required,order_index,options")
    .eq("service_category_id", serviceCategoryId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  return data || [];
}

async function upsertRequirement(params: {
  id?: string;
  sessionId: string;
  serviceCategoryId: string;
  serviceType: string;
  requirements: Record<string, unknown>;
  missingFields: string[];
  completionScore: number;
}) {
  const supabase = createSupabaseAdminClient();
  const payload = {
    session_id: params.sessionId,
    service_category_id: params.serviceCategoryId,
    service_type: params.serviceType,
    requirements_json: params.requirements,
    missing_fields_json: params.missingFields,
    completion_score: params.completionScore,
    confidence_score: 0.75,
    updated_by_model: "phase3_rule_extractor",
    updated_at: new Date().toISOString()
  };

  if (params.id) {
    const { data, error } = await supabase
      .from("client_requirements")
      .update(payload)
      .eq("id", params.id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("client_requirements")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function syncRequirementValues(
  requirementId: string,
  fields: OnboardingField[],
  requirements: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("client_requirement_values")
    .delete()
    .eq("client_requirement_id", requirementId);

  const rows = fields.map((field) => ({
    client_requirement_id: requirementId,
    field_id: field.id,
    field_key: field.field_key,
    field_label: field.label,
    value: requirements[field.field_key] ?? null,
    is_missing: !hasValue(requirements[field.field_key]),
    confidence_score: hasValue(requirements[field.field_key]) ? 0.75 : null
  }));

  if (rows.length) {
    const { error } = await supabase.from("client_requirement_values").insert(rows);
    if (error) throw new Error(error.message);
  }
}

async function upsertClientFromRequirements(params: {
  sessionId: string;
  serviceType: string;
  requirements: Record<string, unknown>;
  completionScore: number;
}) {
  const email = asString(params.requirements.contact_email);
  const phone = asString(params.requirements.contact_phone);
  const companyName = asString(params.requirements.company_name);

  if (!email && !companyName && !phone) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const status = params.completionScore >= 80 ? "qualified" : "onboarding";
  const payload = {
    company_name: companyName || null,
    email: email || null,
    phone: phone || null,
    service_interest: params.serviceType,
    status,
    source: "chatbot",
    updated_at: new Date().toISOString()
  };

  if (email) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return data.id as string;
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

async function attachClientToSessionAndRequirement(params: {
  sessionId: string;
  requirementId: string;
  clientId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("chat_sessions")
    .update({
      client_id: params.clientId,
      updated_at: now
    })
    .eq("id", params.sessionId);

  await supabase
    .from("client_requirements")
    .update({
      client_id: params.clientId,
      updated_at: now
    })
    .eq("id", params.requirementId);
}

function extractFieldValues(
  message: string,
  fields: OnboardingField[],
  currentRequirements: Record<string, unknown>
) {
  const values: Record<string, string> = {};
  const text = message.trim();

  for (const field of fields) {
    if (field.field_key === "contact_email") {
      const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (match) values[field.field_key] = match[0];
    }

    if (field.field_key === "contact_phone") {
      const match = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
      if (match) values[field.field_key] = match[0].trim();
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "company_name") {
      const match =
        text.match(/\b(?:company|business|organization)\s+(?:is|name is)\s+([^,.]+)/i) ||
        text.match(/\bwe are\s+([^,.]+)/i);
      if (match) values[field.field_key] = match[1].replace(/\s+and\s+.*$/i, "").trim();
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = text.replace(/^["']|["']$/g, "").trim();
      }
    }

    if (field.field_key === "timeline") {
      const lower = text.toLowerCase();
      if (lower.includes("asap") || lower.includes("urgent")) values[field.field_key] = "ASAP";
      else if (lower.includes("2-4 weeks")) values[field.field_key] = "2-4 weeks";
      else if (lower.includes("1-3 months")) values[field.field_key] = "1-3 months";
      else if (lower.includes("3+ months")) values[field.field_key] = "3+ months";
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "budget_range") {
      const lower = text.toLowerCase();
      if (lower.includes("under $10k") || lower.includes("under 10k")) values[field.field_key] = "Under $10k";
      else if (lower.includes("$10k") || lower.includes("10k")) values[field.field_key] = "$10k-$25k";
      else if (lower.includes("$25k") || lower.includes("25k")) values[field.field_key] = "$25k-$50k";
      else if (lower.includes("$50k") || lower.includes("50k")) values[field.field_key] = "$50k+";
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "current_system") {
      const lower = text.toLowerCase();
      if (lower.includes("encompass")) values[field.field_key] = "Encompass";
      else if (lower.includes("bytepro")) values[field.field_key] = "BytePro";
      else if (lower.includes("meridianlink")) values[field.field_key] = "MeridianLink";
      else if (lower.includes("power bi")) values[field.field_key] = "Power BI";
      else if (lower.includes("sharepoint")) values[field.field_key] = "SharePoint";
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "workflow_goal") {
      const lower = text.toLowerCase();
      const looksLikeDetail =
        lower.includes("need") ||
        lower.includes("workflow") ||
        lower.includes("automate") ||
        lower.includes("dashboard") ||
        lower.includes("integration") ||
        lower.includes("website") ||
        lower.includes("reporting");
      if (text.length > 20 && looksLikeDetail) values[field.field_key] = text.slice(0, 500);
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "project_overview" || field.field_key === "pain_points" || field.field_key === "success_goals" || field.field_key === "content_assets") {
      if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "data_sources") {
      const dataSources = extractKnownSystems(text, ["salesforce", "sql", "excel", "csv", "encompass", "hubspot", "quickbooks"]);
      if (dataSources.length) values[field.field_key] = dataSources.join(", ");
    }

    if (field.field_key === "dashboard_users") {
      const match = text.match(/\b(?:users|used by|for)\s+([^,.]+)/i);
      if (match) values[field.field_key] = match[1].trim();
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "required_features") {
      const features = extractKnownSystems(text, ["calculator", "calculators", "lead form", "application", "document upload", "borrower portal", "pricing"]);
      if (features.length) values[field.field_key] = features.join(", ");
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "automation_scope" || field.field_key === "integration_goal") {
      const lower = text.toLowerCase();
      if (lower.includes("automate") || lower.includes("automation") || lower.includes("integration") || lower.includes("sync")) {
        values[field.field_key] = text.slice(0, 500);
      } else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "source_target_systems" || field.field_key === "integration_systems") {
      const systems = extractKnownSystems(text, ["encompass", "bytepro", "meridianlink", "salesforce", "los", "crm", "sql"]);
      if (systems.length) values[field.field_key] = systems.join(", ");
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "integration_direction") {
      const lower = text.toLowerCase();
      if (lower.includes("two-way") || lower.includes("sync")) values[field.field_key] = "Two-way sync";
      else if (lower.includes("import")) values[field.field_key] = "Import";
      else if (lower.includes("export")) values[field.field_key] = "Export";
      else if (lower.includes("mapping")) values[field.field_key] = "Mapping";
      else if (lower.includes("validation")) values[field.field_key] = "Validation";
      else if (looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = normalizeDirectFieldAnswer(text);
      }
    }

    if (field.field_key === "sharepoint_scope" || field.field_key === "product_scope") {
      if (text.length > 20 || looksLikeDirectAnswerToMissingField(text, field.field_key, fields, currentRequirements)) {
        values[field.field_key] = text.slice(0, 500);
      }
    }
  }

  return values;
}

function looksLikeDirectAnswerToMissingField(
  text: string,
  fieldKey: string,
  fields: OnboardingField[],
  requirements: Record<string, unknown>
) {
  const nextMissingField = getNextQuestionField(fields, requirements);
  const plainText = text.trim();

  if (nextMissingField?.field_key !== fieldKey) {
    return false;
  }

  if (fieldKey === "company_name") {
    return /^[a-z0-9][a-z0-9 .&'-]{1,60}$/i.test(plainText) && !plainText.includes("@");
  }

  if (fieldKey === "contact_phone" || fieldKey === "current_system" || fieldKey === "timeline" || fieldKey === "budget_range") {
    return plainText.length >= 2 && plainText.length <= 80;
  }

  if (
    fieldKey === "project_overview" ||
    fieldKey === "workflow_goal" ||
    fieldKey === "automation_scope" ||
    fieldKey === "integration_goal" ||
    fieldKey === "pain_points" ||
    fieldKey === "success_goals" ||
    fieldKey === "content_assets" ||
    fieldKey === "required_features" ||
    fieldKey === "source_target_systems" ||
    fieldKey === "integration_systems" ||
    fieldKey === "dashboard_users" ||
    fieldKey === "sharepoint_scope" ||
    fieldKey === "product_scope"
  ) {
    return plainText.length >= 3 && plainText.length <= 500;
  }

  return false;
}

function normalizeDirectFieldAnswer(text: string) {
  return text.replace(/^["']|["']$/g, "").trim();
}

function getNextQuestionField(fields: OnboardingField[], requirements: Record<string, unknown>) {
  const priority = [
    "company_name",
    "contact_email",
    "contact_phone",
    "project_overview",
    "current_system",
    "source_target_systems",
    "integration_goal",
    "automation_scope",
    "data_sources",
    "required_features",
    "workflow_goal",
    "pain_points",
    "success_goals",
    "integration_systems",
    "dashboard_users",
    "target_audience",
    "content_assets",
    "timeline",
    "budget_range"
  ];
  const recommendedOptionalFields = new Set([
    "contact_phone",
    "budget_range",
    "content_assets",
    "integration_systems",
    "integration_direction",
    "dashboard_users",
    "target_audience"
  ]);
  const missingRequiredFields = fields.filter((field) => field.is_required && !hasValue(requirements[field.field_key]));
  const missingRecommendedFields = fields.filter(
    (field) =>
      !field.is_required &&
      recommendedOptionalFields.has(field.field_key) &&
      !hasValue(requirements[field.field_key])
  );

  return (
    [...missingRequiredFields, ...missingRecommendedFields].sort((a, b) => {
      const aRank = priority.includes(a.field_key) ? priority.indexOf(a.field_key) : 999;
      const bRank = priority.includes(b.field_key) ? priority.indexOf(b.field_key) : 999;
      return aRank - bRank || a.order_index - b.order_index;
    })[0]
  );
}

function calculateCompletionScore(fields: OnboardingField[], requirements: Record<string, unknown>) {
  const requiredFields = fields.filter((field) => field.is_required);
  if (!requiredFields.length) return 100;

  const completed = requiredFields.filter((field) => hasValue(requirements[field.field_key])).length;
  return Math.round((completed / requiredFields.length) * 100);
}

function buildSuggestedReplies(field: OnboardingField | undefined, serviceSlug: string) {
  if (!field) return [];

  if (field.field_key === "contact_phone") {
    return ["Email is better", "I can share later", "Skip for now"];
  }

  if (field.field_key === "project_overview") {
    return ["Automation project", "Integration project", "Reporting dashboard", "Website project"];
  }

  if (field.field_key === "current_system") {
    if (serviceSlug === "encompass_integration") return ["Encompass", "Encompass + Salesforce", "Encompass + CRM", "Not sure"];
    if (serviceSlug === "mismo_integration") return ["Encompass", "BytePro", "MeridianLink", "Other LOS"];
    if (serviceSlug === "power_bi_reporting") return ["Excel", "SQL database", "Salesforce", "Encompass"];
    return ["Encompass", "BytePro", "MeridianLink", "Other"];
  }

  if (field.field_key === "integration_goal") {
    return ["Status updates", "CRM sync", "Custom plugin", "API integration"];
  }

  if (field.field_key === "automation_scope") {
    return ["Loan status updates", "Document workflow", "Task assignment", "CRM sync"];
  }

  if (field.field_key === "source_target_systems") {
    return ["LOS to MISMO", "MISMO to LOS", "Two-way sync", "Need guidance"];
  }

  if (field.field_key === "data_sources") {
    return ["Excel + SQL", "Salesforce", "Encompass", "Multiple sources"];
  }

  if (field.field_key === "required_features") {
    return ["Lead form", "Mortgage calculator", "Borrower portal", "Document upload"];
  }

  if (field.field_key === "workflow_goal") {
    return ["Reduce manual work", "Improve reporting", "Connect systems", "Speed up processing"];
  }

  if (field.field_key === "pain_points") {
    return ["Manual data entry", "Slow processing", "Reporting gaps", "System disconnects"];
  }

  if (field.field_key === "success_goals") {
    return ["Save staff time", "Reduce errors", "Faster turnaround", "Better visibility"];
  }

  if (field.field_key === "content_assets") {
    return ["I have documents", "I have screenshots", "Need help creating content", "No files yet"];
  }

  if (field.field_key === "timeline") {
    return ["ASAP", "2-4 weeks", "1-3 months", "Not sure"];
  }

  if (field.field_key === "budget_range") {
    return ["Under $10k", "$10k-$25k", "$25k-$50k", "Not sure"];
  }

  return [];
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function asString(value: unknown) {
  if (!hasValue(value)) return "";
  return String(value).trim();
}

function extractKnownSystems(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return [
    ...new Set(
      terms
        .filter((term) => lower.includes(term))
        .map((term) =>
          term
            .split(" ")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        )
    )
  ];
}

function carryForwardSharedRequirements(requirements?: Record<string, unknown> | null) {
  if (!requirements) {
    return {};
  }

  const sharedKeys = ["company_name", "contact_email", "contact_phone", "timeline", "budget_range"];
  return Object.fromEntries(
    sharedKeys
      .filter((key) => hasValue(requirements[key]))
      .map((key) => [key, requirements[key]])
  );
}
