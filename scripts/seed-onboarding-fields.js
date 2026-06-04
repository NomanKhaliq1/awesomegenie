import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

dotenv.config({ path: ".env.local", override: true, quiet: true });

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket }
  }
);

const sharedFields = [
  ["company_name", "Company Name", "What is your company name?", "text", true, 10, null],
  ["contact_email", "Contact Email", "What email should our team use for follow-up?", "email", true, 20, null],
  ["contact_phone", "Contact Phone", "If phone is easier, what number should we use?", "phone", false, 25, null],
  ["project_overview", "Project Overview", "Can you describe the project in a few lines?", "textarea", true, 30, null],
  ["current_system", "Current System", "What system or platform are you using today?", "text", true, 40, null],
  ["workflow_goal", "Workflow Goal", "What workflow, process, or outcome do you want to improve?", "textarea", true, 50, null],
  ["pain_points", "Pain Points", "What is the biggest problem you want this project to solve?", "textarea", true, 60, null],
  ["success_goals", "Success Goals", "What would make this project successful for you?", "textarea", true, 70, null],
  ["timeline", "Timeline", "What timeline are you targeting?", "select", true, 80, ["ASAP", "2-4 weeks", "1-3 months", "3+ months", "Not sure"]],
  ["budget_range", "Budget Range", "Do you have a budget range in mind?", "select", false, 90, ["Under $10k", "$10k-$25k", "$25k-$50k", "$50k+", "Not sure"]],
  ["content_assets", "Content and Assets", "Do you already have documents, sample files, screenshots, or content we should use?", "textarea", false, 100, null]
];

const serviceSpecificFields = {
  mortgage_website_development: [
    ["required_features", "Required Features", "Which website features do you need, such as calculators, lead forms, applications, or document upload?", "textarea", true, 50, null],
    ["target_audience", "Target Audience", "Who is the website for: borrowers, loan officers, brokers, or internal teams?", "text", false, 60, null]
  ],
  mortgage_automation: [
    ["automation_scope", "Automation Scope", "Which mortgage workflow should be automated first?", "textarea", true, 50, null],
    ["integration_systems", "Integration Systems", "Which LOS, CRM, pricing, or document systems need to connect?", "textarea", false, 60, null]
  ],
  encompass_integration: [
    ["integration_goal", "Integration Goal", "What should the Encompass integration or automation accomplish?", "textarea", true, 50, null],
    ["integration_systems", "Integration Systems", "Which external systems should Encompass connect with?", "textarea", false, 60, null]
  ],
  mismo_integration: [
    ["source_target_systems", "Source and Target Systems", "Which systems need to send or receive MISMO data?", "textarea", true, 50, null],
    ["integration_direction", "Integration Direction", "Is this import, export, validation, mapping, or two-way sync?", "text", false, 60, null]
  ],
  power_bi_reporting: [
    ["data_sources", "Data Sources", "Which data sources should feed the dashboard?", "textarea", true, 50, null],
    ["dashboard_users", "Dashboard Users", "Who will use the dashboard and what decisions should it support?", "textarea", false, 60, null]
  ],
  sharepoint_services: [
    ["sharepoint_scope", "SharePoint Scope", "Do you need design, migration, automation, document management, or support?", "textarea", true, 50, null]
  ],
  custom_software_development: [
    ["product_scope", "Product Scope", "What product, workflow, or internal tool do you want to build?", "textarea", true, 50, null]
  ]
};

const { data: categories, error } = await supabase
  .from("service_categories")
  .select("id,slug");

if (error) {
  throw error;
}

let upserted = 0;

for (const category of categories || []) {
  const fields = [
    ...sharedFields,
    ...(serviceSpecificFields[category.slug] || [])
  ];

  for (const [field_key, label, question_text, field_type, is_required, order_index, options] of fields) {
    const { error: upsertError } = await supabase.from("onboarding_fields").upsert(
      {
        service_category_id: category.id,
        field_key,
        label,
        question_text,
        field_type,
        is_required,
        order_index,
        options
      },
      { onConflict: "service_category_id,field_key" }
    );

    if (upsertError) {
      throw upsertError;
    }

    upserted += 1;
  }
}

const { count } = await supabase
  .from("onboarding_fields")
  .select("*", { count: "exact", head: true });

console.log(`Onboarding field definitions upserted: ${upserted}`);
console.log(`Total onboarding fields: ${count || 0}`);
