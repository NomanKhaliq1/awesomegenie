insert into service_categories (name, slug, description, priority) values
  ('Mortgage Automation', 'mortgage_automation', 'Automation for mortgage workflows, LOS, CRM, and operational processes.', 100),
  ('Mortgage Website Development', 'mortgage_website_development', 'Mortgage website design and development services.', 90),
  ('MISMO Integration', 'mismo_integration', 'MISMO data and integration services.', 80),
  ('Encompass Integration', 'encompass_integration', 'Encompass API, SDK, plugin, and automation services.', 80),
  ('BytePro Integration', 'bytepro_integration', 'BytePro integration, automation, and customization services.', 70),
  ('MeridianLink Integration', 'meridianlink_integration', 'MeridianLink integration and automation services.', 70),
  ('Power BI / Reporting', 'power_bi_reporting', 'Power BI dashboards, reporting, BI migration, and analytics.', 70),
  ('SharePoint Services', 'sharepoint_services', 'SharePoint design, development, migration, automation, and support.', 60),
  ('Salesforce Development', 'salesforce_development', 'Salesforce development, customization, and integration.', 60),
  ('Custom Software Development', 'custom_software_development', 'Custom software and product engineering services.', 50),
  ('Other', 'other', 'Fallback category for unclear or uncategorized projects.', 0)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  priority = excluded.priority,
  updated_at = now();

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'company_name', 'Company Name', 'What is your company name?', 'text', true, 10, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'contact_email', 'Contact Email', 'What email should our team use for follow-up?', 'email', true, 20, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'contact_phone', 'Contact Phone', 'If phone is easier, what number should we use?', 'phone', false, 25, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'project_overview', 'Project Overview', 'Can you describe the project in a few lines?', 'textarea', true, 30, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'current_system', 'Current System', 'What system or platform are you using today?', 'text', true, 40, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'workflow_goal', 'Workflow Goal', 'What workflow, process, or outcome do you want to improve?', 'textarea', true, 50, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'pain_points', 'Pain Points', 'What is the biggest problem you want this project to solve?', 'textarea', true, 60, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'success_goals', 'Success Goals', 'What would make this project successful for you?', 'textarea', true, 70, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'timeline', 'Timeline', 'What timeline are you targeting?', 'select', true, 80, '["ASAP", "2-4 weeks", "1-3 months", "3+ months", "Not sure"]'::jsonb
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'budget_range', 'Budget Range', 'Do you have a budget range in mind?', 'select', false, 90, '["Under $10k", "$10k-$25k", "$25k-$50k", "$50k+", "Not sure"]'::jsonb
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'content_assets', 'Content and Assets', 'Do you already have documents, sample files, screenshots, or content we should use?', 'textarea', false, 100, null
from service_categories
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'required_features', 'Required Features', 'Which website features do you need, such as calculators, lead forms, applications, or document upload?', 'textarea', true, 50, null
from service_categories where slug = 'mortgage_website_development'
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'automation_scope', 'Automation Scope', 'Which mortgage workflow should be automated first?', 'textarea', true, 50, null
from service_categories where slug = 'mortgage_automation'
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'integration_goal', 'Integration Goal', 'What should the Encompass integration or automation accomplish?', 'textarea', true, 50, null
from service_categories where slug = 'encompass_integration'
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'source_target_systems', 'Source and Target Systems', 'Which systems need to send or receive MISMO data?', 'textarea', true, 50, null
from service_categories where slug = 'mismo_integration'
on conflict (service_category_id, field_key) do nothing;

insert into onboarding_fields (service_category_id, field_key, label, question_text, field_type, is_required, order_index, options)
select id, 'data_sources', 'Data Sources', 'Which data sources should feed the dashboard?', 'textarea', true, 50, null
from service_categories where slug = 'power_bi_reporting'
on conflict (service_category_id, field_key) do nothing;

insert into model_settings (task_type, provider, model_name, model_layer, is_enabled, max_tokens, temperature)
values
  ('relevance_check', 'groq', 'qwen-small', 'slm', true, 512, 0.1),
  ('intent_detection', 'groq', 'qwen-small', 'slm', true, 768, 0.1),
  ('rag_answer', 'gemini', 'gemini-flash', 'llm', true, 1200, 0.2),
  ('requirement_extraction', 'gemini', 'gemini-flash', 'llm', true, 1200, 0.1),
  ('project_brief', 'gemini', 'gemini-pro', 'llm', true, 3000, 0.2)
on conflict do nothing;

insert into prompt_templates (name, task_type, prompt_text, variables)
values
  ('relevance_classifier_v1', 'relevance_check', 'Classify whether the user message is relevant to AwesomeTech services. Return strict JSON only.', '["message"]'::jsonb),
  ('rag_answer_v1', 'rag_answer', 'Answer using only approved AwesomeTech context. If context is insufficient, say the team can review the request. Return strict JSON only.', '["message", "rag_context"]'::jsonb),
  ('requirement_extractor_v1', 'requirement_extraction', 'Extract onboarding field values from the user message. Return strict JSON only.', '["message", "onboarding_fields", "current_requirements"]'::jsonb),
  ('project_brief_v1', 'project_brief', 'Generate a PM-ready project brief from client, requirements, files, conversation, and approved RAG context. Return strict JSON only.', '["client", "requirements", "files", "conversation", "rag_context"]'::jsonb)
on conflict (name) do update set
  task_type = excluded.task_type,
  prompt_text = excluded.prompt_text,
  variables = excluded.variables,
  updated_at = now();
