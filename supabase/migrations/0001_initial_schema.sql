create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text,
  email text unique not null,
  role text not null check (role in ('admin', 'project_manager', 'sales', 'viewer')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  is_active boolean default true,
  priority integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  contact_name text,
  email text,
  phone text,
  website text,
  industry text,
  country text,
  service_interest text,
  status text default 'new' check (status in ('new', 'onboarding', 'needs_more_info', 'qualified', 'rejected', 'drive_created', 'pm_reviewed', 'completed')),
  source text default 'chatbot',
  assigned_to uuid references admin_users(id),
  drive_folder_id text,
  drive_folder_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists onboarding_fields (
  id uuid primary key default gen_random_uuid(),
  service_category_id uuid references service_categories(id),
  field_key text not null,
  label text not null,
  question_text text not null,
  field_type text not null check (field_type in ('text', 'email', 'phone', 'url', 'select', 'multi_select', 'boolean', 'textarea', 'file', 'date', 'number')),
  is_required boolean default false,
  order_index integer default 0,
  options jsonb,
  help_text text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (service_category_id, field_key)
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_status text default 'active' check (session_status in ('active', 'waiting_for_user', 'needs_more_info', 'completed', 'abandoned', 'handoff_created')),
  current_state text default 'new_session',
  service_category_id uuid references service_categories(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  client_id uuid references clients(id),
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  message text,
  message_type text default 'text' check (message_type in ('text', 'file', 'summary', 'system_event', 'error')),
  source_type text,
  model_used text,
  intent text,
  service_category_id uuid references service_categories(id),
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists client_requirements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  service_category_id uuid references service_categories(id),
  service_type text,
  requirements_json jsonb default '{}'::jsonb,
  missing_fields_json jsonb default '[]'::jsonb,
  completion_score numeric default 0,
  confidence_score numeric,
  updated_by_model text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists client_requirement_values (
  id uuid primary key default gen_random_uuid(),
  client_requirement_id uuid references client_requirements(id),
  field_id uuid references onboarding_fields(id),
  field_key text not null,
  field_label text,
  value jsonb,
  is_missing boolean default false,
  confidence_score numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  message_id uuid references chat_messages(id),
  original_file_name text,
  file_type text,
  mime_type text,
  file_size bigint,
  supabase_storage_path text,
  supabase_public_url text,
  drive_file_id text,
  drive_file_url text,
  analysis_status text default 'pending' check (analysis_status in ('pending', 'skipped', 'analyzed', 'failed')),
  analysis_summary text,
  extracted_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_briefs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  brief_title text,
  brief_markdown text,
  brief_json jsonb,
  recommended_services jsonb,
  missing_information jsonb,
  complexity_level text check (complexity_level in ('low', 'medium', 'high', 'enterprise')),
  risk_level text check (risk_level in ('low', 'medium', 'high', 'unknown')),
  next_step text,
  drive_file_id text,
  drive_file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists drive_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  action text,
  folder_id text,
  file_id text,
  folder_url text,
  file_url text,
  status text,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists website_json_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text,
  external_id text,
  slug text,
  title text,
  url text unique,
  meta_title text,
  meta_description text,
  lastmod timestamptz,
  content_hash text,
  json_data jsonb,
  full_text text,
  word_count integer,
  headings_count integer,
  images_count integer,
  buttons_count integer,
  forms_count integer,
  search_summary text,
  keywords text[],
  sync_status text default 'pending' check (sync_status in ('pending', 'synced', 'skipped', 'failed', 'needs_review')),
  review_status text default 'pending_review' check (review_status in ('pending_review', 'approved', 'needs_review', 'skipped', 'disabled')),
  extraction_warnings text[],
  skip_reason text,
  sync_enabled boolean default true,
  approved_for_rag boolean default false,
  approved_by uuid references admin_users(id),
  approved_at timestamptz,
  disabled_reason text,
  needs_review boolean default false,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists website_sections (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id) on delete cascade,
  section_order integer,
  section_title text,
  section_type text,
  content text,
  content_hash text,
  word_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists website_assets (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id) on delete cascade,
  section_id uuid references website_sections(id) on delete cascade,
  asset_type text,
  url text,
  alt_text text,
  caption text,
  created_at timestamptz default now()
);

create table if not exists website_buttons (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id) on delete cascade,
  section_id uuid references website_sections(id) on delete cascade,
  label text,
  url text,
  button_type text,
  created_at timestamptz default now()
);

create table if not exists website_forms (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id) on delete cascade,
  section_id uuid references website_sections(id) on delete cascade,
  form_type text,
  form_id text,
  form_title text,
  submit_label text,
  fields_json jsonb,
  created_at timestamptz default now()
);

create table if not exists knowledge_index (
  id uuid primary key default gen_random_uuid(),
  source_id uuid unique references website_json_sources(id) on delete cascade,
  service_category_id uuid references service_categories(id),
  source_type text,
  title text,
  slug text,
  url text,
  keywords text[],
  summary text,
  priority integer default 0,
  is_active boolean default true,
  approved_for_rag boolean default false,
  review_status text default 'pending_review' check (review_status in ('pending_review', 'approved', 'needs_review', 'skipped', 'disabled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id) on delete cascade,
  section_id uuid references website_sections(id) on delete cascade,
  chunk_title text,
  chunk_text text,
  chunk_type text,
  keywords text[],
  token_estimate integer,
  embedding vector,
  metadata jsonb,
  is_active boolean default true,
  approved_for_rag boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rag_retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  message_id uuid references chat_messages(id),
  query text,
  selected_source_id uuid references website_json_sources(id),
  selected_chunk_ids jsonb,
  retrieval_method text,
  score numeric,
  context_tokens integer,
  created_at timestamptz default now()
);

create table if not exists model_settings (
  id uuid primary key default gen_random_uuid(),
  task_type text,
  provider text,
  model_name text,
  model_layer text,
  is_enabled boolean default true,
  max_tokens integer,
  temperature numeric,
  fallback_model text,
  cost_per_1k_input numeric,
  cost_per_1k_output numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  message_id uuid references chat_messages(id),
  client_id uuid references clients(id),
  provider text,
  model_name text,
  task_type text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric,
  routing_reason text,
  success boolean default true,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  task_type text,
  prompt_text text not null,
  variables jsonb,
  is_active boolean default true,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sync_jobs (
  id uuid primary key default gen_random_uuid(),
  sync_type text,
  source_url text,
  status text default 'pending',
  total_urls integer default 0,
  generated_count integer default 0,
  ok_count integer default 0,
  needs_review_count integer default 0,
  skipped_count integer default 0,
  failed_count integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_by uuid references admin_users(id),
  created_at timestamptz default now()
);

create table if not exists sync_job_items (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references sync_jobs(id) on delete cascade,
  url text,
  slug text,
  source_type text,
  status text,
  warning_codes text[],
  json_source_id uuid references website_json_sources(id),
  error_message text,
  created_at timestamptz default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text,
  event_type text,
  source_url text,
  payload jsonb,
  signature_valid boolean default false,
  processed boolean default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_admin_users_updated_at before update on admin_users for each row execute function set_updated_at();
create trigger set_service_categories_updated_at before update on service_categories for each row execute function set_updated_at();
create trigger set_clients_updated_at before update on clients for each row execute function set_updated_at();
create trigger set_onboarding_fields_updated_at before update on onboarding_fields for each row execute function set_updated_at();
create trigger set_chat_sessions_updated_at before update on chat_sessions for each row execute function set_updated_at();
create trigger set_client_requirements_updated_at before update on client_requirements for each row execute function set_updated_at();
create trigger set_client_requirement_values_updated_at before update on client_requirement_values for each row execute function set_updated_at();
create trigger set_uploaded_files_updated_at before update on uploaded_files for each row execute function set_updated_at();
create trigger set_project_briefs_updated_at before update on project_briefs for each row execute function set_updated_at();
create trigger set_website_json_sources_updated_at before update on website_json_sources for each row execute function set_updated_at();
create trigger set_website_sections_updated_at before update on website_sections for each row execute function set_updated_at();
create trigger set_knowledge_index_updated_at before update on knowledge_index for each row execute function set_updated_at();
create trigger set_rag_chunks_updated_at before update on rag_chunks for each row execute function set_updated_at();
create trigger set_model_settings_updated_at before update on model_settings for each row execute function set_updated_at();
create trigger set_prompt_templates_updated_at before update on prompt_templates for each row execute function set_updated_at();
create trigger set_system_settings_updated_at before update on system_settings for each row execute function set_updated_at();

create index if not exists idx_clients_email on clients(email);
create index if not exists idx_clients_status on clients(status);
create index if not exists idx_chat_sessions_client_id on chat_sessions(client_id);
create index if not exists idx_chat_messages_session_id on chat_messages(session_id);
create index if not exists idx_client_requirements_session_id on client_requirements(session_id);
create index if not exists idx_uploaded_files_session_id on uploaded_files(session_id);

create index if not exists idx_website_json_sources_url on website_json_sources(url);
create index if not exists idx_website_json_sources_slug on website_json_sources(slug);
create index if not exists idx_website_json_sources_review_status on website_json_sources(review_status);
create index if not exists idx_website_json_sources_approved on website_json_sources(approved_for_rag);
create index if not exists idx_website_json_sources_text on website_json_sources using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(full_text, '')));

create index if not exists idx_website_sections_source_id on website_sections(source_id);
create index if not exists idx_website_sections_text on website_sections using gin(to_tsvector('english', coalesce(section_title, '') || ' ' || coalesce(content, '')));

create index if not exists idx_knowledge_index_source_id on knowledge_index(source_id);
create index if not exists idx_knowledge_index_service_category_id on knowledge_index(service_category_id);
create index if not exists idx_knowledge_index_active_approved on knowledge_index(is_active, approved_for_rag);
create index if not exists idx_knowledge_index_text on knowledge_index using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '')));

create index if not exists idx_rag_chunks_source_id on rag_chunks(source_id);
create index if not exists idx_rag_chunks_section_id on rag_chunks(section_id);
create index if not exists idx_rag_chunks_active_approved on rag_chunks(is_active, approved_for_rag);
create index if not exists idx_rag_chunks_text on rag_chunks using gin(to_tsvector('english', coalesce(chunk_title, '') || ' ' || coalesce(chunk_text, '')));

alter table admin_users enable row level security;
alter table clients enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table client_requirements enable row level security;
alter table client_requirement_values enable row level security;
alter table uploaded_files enable row level security;
alter table project_briefs enable row level security;
alter table website_json_sources enable row level security;
alter table website_sections enable row level security;
alter table website_assets enable row level security;
alter table website_buttons enable row level security;
alter table website_forms enable row level security;
alter table knowledge_index enable row level security;
alter table rag_chunks enable row level security;
alter table rag_retrieval_logs enable row level security;
alter table ai_usage_logs enable row level security;
alter table drive_logs enable row level security;
alter table sync_jobs enable row level security;
alter table sync_job_items enable row level security;
alter table webhook_events enable row level security;
alter table system_settings enable row level security;
