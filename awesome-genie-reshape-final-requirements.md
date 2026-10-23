# Awesome Genie – Final Reshape Plan

## Production AI Onboarding Chatbot with Real RAG, LangChain, Pinecone, File Handling, Drive Handoff, and Minimal Admin Review

**Last updated:** June 5, 2026  
**Project:** Awesome Genie  
**Company:** AwesomeTech  
**Purpose:** Reshape the existing project into a proper production-level AI client onboarding chatbot based on the actual requirement.

---

# 1. Final Requirement

Awesome Genie is **not** just a normal chatbot and not just a dashboard project.

It is a **full AI client onboarding chatbot**.

The chatbot must:

- Answer AwesomeTech service questions using proper RAG
- Collect full project details from the client
- Understand client requirements dynamically
- Collect documents, images, logos, screenshots, PDFs, Word files, Excel files, ZIPs, and other assets
- Use uploaded documents as project context
- Generate a complete project brief
- Create a Google Drive folder
- Save all uploaded files and generated summaries in Drive
- Store chat history, requirements, and handoff logs
- Give the internal team a clean review screen

The main user-facing product is:

```txt
Awesome Genie Chatbot
```

The dashboard is only:

```txt
Internal support panel for reviewing chatbot output and handoff data.
```

---

# 2. Major Correction From Existing Project

The existing project already has a lot of useful parts, but the RAG layer must be rebuilt.

## Current wrong or incomplete approach

The project currently behaves mostly like:

```txt
User question
→ keyword/topic matching
→ knowledge_index / JSON source
→ answer
```

This is not proper production RAG.

## Required proper RAG approach

The new system must use:

```txt
content
→ chunks
→ embeddings
→ Pinecone vector database
→ query embedding
→ similarity search
→ retrieved chunks
→ LLM grounded answer
```

Required stack for RAG:

```txt
LangChain = RAG orchestration
Pinecone = vector database
Embedding model = converts text into vectors
LLM = generates final response from retrieved chunks
Supabase = app database, not vector database
```

---

# 3. Existing Work: What To Keep

Do not delete the entire project. Reshape it.

The following existing work is useful and should stay.

## 3.1 Website extraction work

Keep:

```txt
Sitemap extraction
Playwright rendered-page extraction
Clean website text extraction
website_json_sources
website_sections
approved_for_rag flags
extraction report
content quality checks
```

New role:

```txt
This is now the content preparation layer.
It prepares clean website sections that will be chunked and sent to Pinecone.
```

## 3.2 Supabase app foundation

Keep:

```txt
Supabase setup
admin login
service categories
onboarding fields
clients table
chat sessions
chat messages
client requirements
uploaded files
project briefs
drive logs
AI usage logs
RAG retrieval logs
website metadata tables
```

New role:

```txt
Supabase remains the application database and metadata store.
```

## 3.3 Chat widget and APIs

Keep:

```txt
Floating chatbot widget
Chat session start API
Chat message API
Enter-to-send behavior
Quick reply chips
Customer-facing clean tone
Internal terms hidden from customers
```

Modify:

```txt
Chatbot answers must use Pinecone vector retrieval as the primary RAG path.
```

## 3.4 Dynamic onboarding

Keep:

```txt
Service detection
Requirement memory
Multi-service support
Requirement values
Completion score
Client lead creation
Admin client list
Client detail page
Context-aware quick replies
```

Modify:

```txt
Free-text extraction should use:
rules first
then optional SLM fallback
then LLM only when needed.
```

## 3.5 Google Drive handoff

Keep:

```txt
Google Drive service account auth
Drive folder creation
project-brief.md generation
requirements.json generation
chat-transcript.txt generation
drive_folder_id and drive_folder_url updates
project_briefs insert
drive_logs
Drive failure-safe handling
```

Modify:

```txt
Drive handoff must also include uploaded files and file summaries.
```

---

# 4. Existing Work: What To Remove or Deprecate

These parts should be removed, deprecated, or moved to fallback/debug only.

## 4.1 Remove JSON/keyword retrieval as primary RAG

Do not keep this as main logic:

```txt
User query
→ knowledge_index keyword match
→ full JSON source selected
→ answer
```

Allowed only as fallback:

```txt
If Pinecone is down, use approved keyword fallback.
```

## 4.2 Remove Supabase vector approach

Do not use Supabase as the vector database.

Remove/deprecate if added:

```txt
pgvector extension for main RAG
embedding vector columns in Supabase
match_rag_chunks RPC
Supabase vector similarity search
```

Supabase should only store:

```txt
metadata
logs
app data
Pinecone vector IDs
chunk text copy for audit
```

## 4.3 Remove full JSON-to-LLM answer flow

Do not send full page JSON to the LLM as primary context.

Wrong:

```txt
selected full JSON
→ LLM answer
```

Correct:

```txt
website section
→ chunk
→ embedding
→ Pinecone
→ top chunks
→ LLM answer
```

## 4.4 Remove unnecessary dashboard expansion

Avoid turning this into a full CRM.

Do not prioritize:

```txt
full sales pipeline
advanced PM workflow
heavy analytics
complex role hierarchy
full CRM conversion flow
large dashboard features
```

Keep only lightweight admin review features needed for chatbot output.

## 4.5 Remove customer-visible internal wording

Never show these to customers:

```txt
RAG
Pinecone
LangChain
vector
embedding
chunks
retrieval
similarity score
SLM
LLM
model route
token cost
source metadata
```

These are internal/admin-only terms.

## 4.6 Remove static business logic

These must not be hardcoded:

```txt
service categories
onboarding questions
required fields
prompt templates
model settings
fallback messages
file upload settings
Drive root folder
approved knowledge sources
theme/logo path
```

They should come from Supabase tables or environment config.

---

# 5. Final Architecture

```txt
Client / Website Visitor
↓
Awesome Genie Chatbot Widget
↓
Chat API
↓
Router Agent
↓
Intent Detection
↓
If knowledge needed:
   LangChain + Pinecone RAG
↓
If onboarding needed:
   DB-driven onboarding fields
↓
Requirement Memory
↓
File Upload Handling
↓
Uploaded File RAG
↓
Project Brief Generation
↓
Google Drive Handoff
↓
Internal Admin Review
```

---

# 6. Final Technology Stack

## Frontend

```txt
Next.js
TypeScript
TailwindCSS
```

## Backend

```txt
Next.js API Routes / Server Actions
```

## Application Database

```txt
Supabase PostgreSQL
```

## Vector Database

```txt
Pinecone
```

## RAG Framework

```txt
LangChain
```

## Embedding Provider

Configurable.

Possible options:

```txt
Gemini embeddings
OpenAI-compatible embeddings
HuggingFace/local embeddings
other low-cost/free embedding provider
```

Important:

```txt
Choose the embedding model first.
Create Pinecone index with the exact same vector dimension.
```

## LLM Provider

Configurable.

Possible options:

```txt
Gemini
Groq
OpenRouter
```

## Temporary File Storage

```txt
Supabase Storage
```

## Final Handoff Storage

```txt
Google Drive
```

---

# 7. Pinecone Setup

## 7.1 Pinecone index

Suggested index:

```txt
awesome-genie-rag
```

## 7.2 Vector type

```txt
Dense
```

## 7.3 Metric

```txt
cosine
```

## 7.4 Dimension

Dimension must match selected embedding model.

Examples:

```txt
384-dimensional embedding model  → Pinecone dimension 384
768-dimensional embedding model  → Pinecone dimension 768
1536-dimensional embedding model → Pinecone dimension 1536
```

Do not guess the dimension.

---

# 8. Pinecone Namespaces

Use separate namespaces.

## 8.1 Website namespace

```txt
website
```

Purpose:

```txt
Global AwesomeTech website knowledge.
```

## 8.2 Client file namespace

```txt
client-files-{clientId}-{sessionId}
```

Purpose:

```txt
Private uploaded files for one client/session only.
```

Example:

```txt
client-files-8dd213-sessiona92
```

Important:

```txt
Never search one client's file namespace for another client.
```

---

# 9. Supabase Role

Supabase remains required.

Pinecone does not replace Supabase.

## Supabase stores

```txt
clients
chat_sessions
chat_messages
client_requirements
client_requirement_values
uploaded_files
project_briefs
drive_logs
ai_usage_logs
rag_retrieval_logs
admin_users
service_categories
onboarding_fields
prompt_templates
model_settings
website_json_sources
website_sections
rag_chunks metadata
document_sources
document_chunks metadata
sync_jobs
webhook_events
system_settings
```

## Pinecone stores

```txt
vectors
embeddings
chunk metadata for search
similarity-searchable knowledge
```

---

# 10. Supabase Tables To Keep

## 10.1 `admin_users`

```sql
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text,
  email text unique not null,
  role text not null,
  avatar_url text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Roles:

```txt
admin
project_manager
sales
viewer
```

## 10.2 `clients`

```sql
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
  status text default 'new',
  source text default 'chatbot',
  assigned_to uuid references admin_users(id),
  drive_folder_id text,
  drive_folder_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.3 `service_categories`

```sql
create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  is_active boolean default true,
  priority integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.4 `onboarding_fields`

```sql
create table if not exists onboarding_fields (
  id uuid primary key default gen_random_uuid(),
  service_category_id uuid references service_categories(id),
  field_key text not null,
  label text not null,
  question_text text not null,
  field_type text not null,
  is_required boolean default false,
  order_index integer default 0,
  options jsonb,
  help_text text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.5 `chat_sessions`

```sql
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_status text default 'active',
  current_state text default 'new_session',
  service_category_id uuid references service_categories(id),
  started_at timestamp default now(),
  completed_at timestamp,
  last_message_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.6 `chat_messages`

```sql
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  client_id uuid references clients(id),
  role text not null,
  message text,
  message_type text default 'text',
  source_type text,
  model_used text,
  intent text,
  service_category_id uuid references service_categories(id),
  metadata jsonb,
  created_at timestamp default now()
);
```

## 10.7 `client_requirements`

```sql
create table if not exists client_requirements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  service_category_id uuid references service_categories(id),
  service_type text,
  requirements_json jsonb,
  missing_fields_json jsonb,
  completion_score numeric default 0,
  confidence_score numeric,
  updated_by_model text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.8 `client_requirement_values`

```sql
create table if not exists client_requirement_values (
  id uuid primary key default gen_random_uuid(),
  client_requirement_id uuid references client_requirements(id),
  field_id uuid references onboarding_fields(id),
  field_key text not null,
  field_label text,
  value jsonb,
  is_missing boolean default false,
  confidence_score numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.9 `uploaded_files`

```sql
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
  analysis_status text default 'pending',
  analysis_summary text,
  extracted_text text,
  pinecone_namespace text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.10 `project_briefs`

```sql
create table if not exists project_briefs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  brief_title text,
  brief_markdown text,
  brief_json jsonb,
  recommended_services jsonb,
  missing_information jsonb,
  complexity_level text,
  risk_level text,
  next_step text,
  drive_file_id text,
  drive_file_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 10.11 `drive_logs`

```sql
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
  created_at timestamp default now()
);
```

---

# 11. Website Content Tables

These tables store extracted content and metadata. They do not perform vector search.

## 11.1 `website_json_sources`

```sql
create table if not exists website_json_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text,
  external_id text,
  slug text,
  title text,
  url text unique,
  meta_title text,
  meta_description text,
  lastmod timestamp,
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
  sync_status text default 'pending',
  sync_enabled boolean default true,
  approved_for_rag boolean default false,
  pinecone_synced boolean default false,
  pinecone_namespace text default 'website',
  needs_review boolean default false,
  last_synced_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 11.2 `website_sections`

```sql
create table if not exists website_sections (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_order integer,
  section_title text,
  section_type text,
  content text,
  content_hash text,
  word_count integer,
  pinecone_synced boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 11.3 `website_assets`

```sql
create table if not exists website_assets (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_id uuid references website_sections(id),
  asset_type text,
  url text,
  alt_text text,
  caption text,
  created_at timestamp default now()
);
```

## 11.4 `website_buttons`

```sql
create table if not exists website_buttons (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_id uuid references website_sections(id),
  label text,
  url text,
  button_type text,
  created_at timestamp default now()
);
```

## 11.5 `website_forms`

```sql
create table if not exists website_forms (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_id uuid references website_sections(id),
  form_type text,
  form_id text,
  form_title text,
  submit_label text,
  fields_json jsonb,
  created_at timestamp default now()
);
```

---

# 12. Pinecone Metadata Tables

## 12.1 `rag_chunks`

This table stores metadata and Pinecone vector IDs. Actual embeddings live in Pinecone.

```sql
create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_id uuid references website_sections(id),

  pinecone_vector_id text unique,
  pinecone_namespace text default 'website',

  chunk_title text,
  chunk_text text not null,
  chunk_type text default 'website_section',
  chunk_index integer,

  keywords text[],
  token_estimate integer,
  content_hash text,
  metadata jsonb,

  is_active boolean default true,
  approved_for_rag boolean default true,

  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Do not store vector embeddings in this table.

## 12.2 `rag_retrieval_logs`

```sql
create table if not exists rag_retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  message_id uuid references chat_messages(id),
  query text,

  pinecone_namespace text,
  selected_chunk_ids jsonb,
  selected_source_ids jsonb,
  selected_source_urls jsonb,
  similarity_scores jsonb,

  retrieval_method text default 'pinecone_vector',
  context_tokens integer,
  created_at timestamp default now()
);
```

---

# 13. Uploaded File RAG Tables

## 13.1 `document_sources`

```sql
create table if not exists document_sources (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  uploaded_file_id uuid references uploaded_files(id),

  source_type text default 'uploaded_file',
  file_name text,
  mime_type text,

  extracted_text text,
  extraction_status text,
  pinecone_namespace text,

  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 13.2 `document_chunks`

```sql
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_source_id uuid references document_sources(id),
  client_id uuid references clients(id),
  session_id uuid references chat_sessions(id),
  uploaded_file_id uuid references uploaded_files(id),

  pinecone_vector_id text unique,
  pinecone_namespace text,

  chunk_text text not null,
  chunk_title text,
  chunk_index integer,
  token_estimate integer,
  content_hash text,
  metadata jsonb,

  is_active boolean default true,

  created_at timestamp default now()
);
```

---

# 14. AI, Memory, Settings Tables

## 14.1 `model_settings`

```sql
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
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 14.2 `ai_usage_logs`

```sql
create table if not exists ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  message_id uuid references chat_messages(id),
  client_id uuid references clients(id),
  task_type text,
  model_layer text,
  provider text,
  model_name text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric,
  routing_reason text,
  success boolean,
  error_message text,
  created_at timestamp default now()
);
```

## 14.3 `prompt_templates`

```sql
create table if not exists prompt_templates (
  id uuid primary key default gen_random_uuid(),
  prompt_key text unique not null,
  name text,
  task_type text,
  system_prompt text,
  user_prompt_template text,
  variables jsonb,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 14.4 `conversation_summaries`

```sql
create table if not exists conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  client_id uuid references clients(id),
  summary_text text,
  summary_json jsonb,
  message_count integer,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 14.5 `system_settings`

```sql
create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique,
  setting_value jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

---

# 15. Sync and Webhook Tables

## 15.1 `sync_jobs`

```sql
create table if not exists sync_jobs (
  id uuid primary key default gen_random_uuid(),
  sync_type text,
  status text,
  started_at timestamp,
  completed_at timestamp,
  total_urls integer,
  processed_urls integer,
  ok_count integer,
  needs_review_count integer,
  failed_count integer,
  error_message text,
  created_at timestamp default now()
);
```

## 15.2 `sync_job_items`

```sql
create table if not exists sync_job_items (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references sync_jobs(id),
  source_url text,
  slug text,
  status text,
  word_count integer,
  headings_count integer,
  images_count integer,
  buttons_count integer,
  forms_count integer,
  warnings jsonb,
  error_message text,
  created_at timestamp default now()
);
```

## 15.3 `webhook_events`

```sql
create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_source text,
  event_type text,
  payload jsonb,
  status text,
  processed_at timestamp,
  error_message text,
  created_at timestamp default now()
);
```

---

# 16. Tables or Code Not Needed

Remove or deprecate:

```txt
Supabase pgvector migration
embedding vector columns in Supabase
match_rag_chunks RPC
primary keyword-only RAG functions
primary JSON-only answer functions
old full-JSON LLM context builder
duplicate knowledge_index primary retrieval logic
unused dashboard modules not needed for chatbot review
unused local-only scripts from production path
```

Keep as debug/fallback only:

```txt
local JSON files
knowledge-index.json
extraction-report.json
keyword fallback retrieval
manual sync button
```

---

# 17. Website RAG Ingestion Pipeline

```txt
Approved website_json_sources
↓
website_sections
↓
LangChain text splitter
↓
chunks
↓
embedding provider
↓
Pinecone upsert into "website" namespace
↓
rag_chunks metadata saved in Supabase
↓
pinecone_synced = true
```

Rules:

```txt
Only ingest approved_for_rag sources.
Do not ingest needs_review sources unless approved.
Use content_hash to avoid duplicate upserts.
Use stable pinecone_vector_id for each chunk.
Deactivate/delete old vectors when content changes.
```

---

# 18. Stable Pinecone Vector IDs

## Website chunks

```txt
website-{sourceId}-{sectionId}-{chunkIndex}
```

## Uploaded file chunks

```txt
file-{clientId}-{sessionId}-{uploadedFileId}-{chunkIndex}
```

Benefits:

```txt
easy updates
easy deletes
easy audit
no duplicates
clear mapping between Supabase and Pinecone
```

---

# 19. Automated Pinecone Updates

Pinecone must not be manually maintained.

## 19.1 WordPress webhook

```txt
WordPress page/post update
↓
Webhook hits Awesome Genie
↓
Backend receives URL/post ID
↓
Render updated page
↓
Extract latest content
↓
Update Supabase website source/sections
↓
Regenerate chunks
↓
Create embeddings
↓
Upsert/delete Pinecone vectors
↓
Update pinecone_synced flags
```

Endpoint:

```txt
POST /api/webhooks/wordpress-content-updated
```

## 19.2 Daily sitemap cron backup

```txt
Daily sitemap scan
↓
Compare lastmod/content hash
↓
Detect changed URLs
↓
Resync only changed pages
↓
Update Pinecone automatically
```

## 19.3 Manual admin sync

Manual sync is backup only.

```txt
Sync All
Sync Single URL
Re-ingest to Pinecone
```

---

# 20. LangChain Files Required

Create/update:

```txt
/lib/langchain/embeddingProvider.ts
/lib/langchain/pineconeClient.ts
/lib/langchain/chunkWebsiteSections.ts
/lib/langchain/ingestWebsiteChunksToPinecone.ts
/lib/langchain/retrieveWebsiteChunksFromPinecone.ts
/lib/langchain/ingestUploadedFilesToPinecone.ts
/lib/langchain/retrieveClientFileChunksFromPinecone.ts
/lib/langchain/buildRagContext.ts
/lib/langchain/ragAnswer.ts
/lib/langchain/logRetrieval.ts
```

---

# 21. Required Scripts

## 21.1 `npm run rag:ingest`

Should:

```txt
read approved website_sections from Supabase
split content into chunks
generate embeddings
upsert vectors into Pinecone namespace "website"
save rag_chunks metadata into Supabase
mark website_sections.pinecone_synced = true
mark website_json_sources.pinecone_synced = true where applicable
log total sections processed
log total chunks created
log total chunks upserted
log failed chunks
```

## 21.2 `npm run rag:test`

Should:

```txt
run sample queries
generate query embeddings
query Pinecone
print matched chunks
print source URLs
print similarity scores
print context preview
```

Sample queries:

```txt
Do you build mortgage websites?
Do you provide MISMO integration?
Do you work with Encompass?
Do you provide Power BI dashboards?
How can I contact AwesomeTech?
```

---

# 22. Chatbot Flow With Proper RAG

## `POST /api/chat/message`

```txt
1. Validate session.
2. Save user message in Supabase.
3. Run rule engine.
4. If irrelevant:
   - return no-model fallback
   - save assistant response
   - log no-model route
5. If relevant:
   - run router/SLM if needed
   - detect intent and service category
6. If service/company knowledge is needed:
   - generate query embedding
   - search Pinecone namespace "website"
   - retrieve top chunks
   - build RAG context
   - call LLM with grounded prompt
   - save rag_retrieval_logs
7. If onboarding is active:
   - load service_categories
   - load onboarding_fields
   - update client_requirements
   - update client_requirement_values
   - calculate completion_score
   - ask next missing required question
8. Save assistant response.
9. Save ai_usage_logs.
10. Return response to widget.
```

---

# 23. Uploaded File RAG Flow

When user uploads PDF/DOCX/TXT:

```txt
1. Upload file to Supabase Storage.
2. Save uploaded_files row.
3. Extract text.
4. Create document_sources row.
5. Split text into chunks using LangChain.
6. Generate embeddings.
7. Upsert vectors into Pinecone namespace client-files-{clientId}-{sessionId}.
8. Save document_chunks metadata in Supabase.
9. Use these chunks only for that client/session.
```

For images/logos:

```txt
1. Save file.
2. Store metadata.
3. Upload to Drive during handoff.
4. Do not embed unless image analysis is explicitly added later.
```

---

# 24. Google Drive Handoff

When onboarding is complete:

```txt
1. Load client info.
2. Load requirements.
3. Load chat transcript.
4. Load uploaded files.
5. Retrieve website chunks from Pinecone.
6. Retrieve client file chunks from Pinecone.
7. Generate project brief.
8. Create Google Drive folder.
9. Upload original files.
10. Upload project-brief.md.
11. Upload requirements.json.
12. Upload chat-transcript.txt.
13. Upload file-summaries.md if available.
14. Save Drive links in Supabase.
15. Log drive_logs.
```

Drive folder structure:

```txt
Awesome Genie Leads
└── Client Company Name
    ├── 01 Uploaded Files
    ├── 02 Project Brief
    ├── 03 Requirements
    ├── 04 Chat Transcript
    ├── 05 File Summaries
    └── 06 Internal Notes
```

---

# 25. Context Management

Send only this to LLM:

```txt
system prompt
current user message
current session state
last 5-8 messages
structured requirement memory
missing fields
retrieved website chunks
retrieved client file chunks if needed
conversation summary if conversation is long
```

Do not send:

```txt
full website
full database
all JSON files
other clients' files
unapproved RAG sources
full raw chat history every time
```

---

# 26. Memory Management

Memory layers:

```txt
Raw memory:
chat_messages

Structured memory:
client_requirements
client_requirement_values

Compressed memory:
conversation_summaries

Global knowledge memory:
Pinecone website namespace

Client document memory:
Pinecone client-files namespace
```

---

# 27. Agentic Architecture

Customer sees only:

```txt
Awesome Genie
```

Internal modules:

```txt
Router Agent
Knowledge Agent
Onboarding Agent
File Agent
Memory Agent
Drive Handoff Agent
```

## Router Agent

```txt
detects irrelevant / service question / onboarding / file / handoff / unknown
```

## Knowledge Agent

```txt
uses LangChain + Pinecone for website knowledge answers
```

## Onboarding Agent

```txt
uses service_categories, onboarding_fields, client_requirements
```

## File Agent

```txt
handles file upload, text extraction, file chunking, and file vectors
```

## Memory Agent

```txt
manages chat messages, requirements, conversation summaries
```

## Drive Handoff Agent

```txt
creates Drive folder and handoff files
```

---

# 28. Admin Review Panel

The admin panel should be lightweight and focused.

Required views:

```txt
Client list
Client detail
Chat transcript
Requirement values
Uploaded files
Project brief
Drive folder link
RAG retrieval logs
AI usage logs
Sync/RAG source status
```

Not required right now:

```txt
full CRM pipeline
advanced analytics
complex role workflows
large PM management suite
```

---

# 29. Admin Audit Requirements

Admin should see:

```txt
user message
bot response
intent
service category
model route
model used
estimated tokens/cost
Pinecone namespace
retrieved chunk titles
retrieved source URLs
similarity scores
requirement values updated
Drive handoff status
file processing status
```

---

# 30. API Routes

## Chat APIs

```txt
POST /api/chat/start
POST /api/chat/message
POST /api/chat/upload
POST /api/chat/complete
GET  /api/chat/session/:id
```

## RAG APIs

```txt
POST /api/rag/ingest
POST /api/rag/test
POST /api/rag/retrieve
```

## Knowledge APIs

```txt
POST /api/sync/sitemap
POST /api/sync/single-url
POST /api/webhooks/wordpress-content-updated
GET  /api/knowledge/sources
GET  /api/knowledge/source/:id
PATCH /api/knowledge/source/:id
POST /api/knowledge/source/:id/approve
```

## Admin APIs

```txt
GET   /api/admin/dashboard
GET   /api/admin/clients
GET   /api/admin/clients/:id
PATCH /api/admin/clients/:id/status
PATCH /api/admin/clients/:id/assign
GET   /api/admin/usage
GET   /api/admin/settings
PATCH /api/admin/settings
GET   /api/admin/onboarding-fields
POST  /api/admin/onboarding-fields
PATCH /api/admin/onboarding-fields/:id
```

## Drive APIs

```txt
POST /api/drive/create-client-folder
POST /api/drive/upload-file
POST /api/drive/create-brief
GET  /api/drive/folder/:clientId
POST /api/drive/retry-sync/:clientId
```

---

# 31. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PINECONE_API_KEY=
PINECONE_INDEX_NAME=awesome-genie-rag
PINECONE_NAMESPACE_WEBSITE=website

EMBEDDING_PROVIDER=
EMBEDDING_MODEL=
EMBEDDING_DIMENSION=

LLM_PROVIDER=
LLM_MODEL=

GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_ROOT_FOLDER_ID=

WORDPRESS_WEBHOOK_SECRET=
WORDPRESS_BASE_URL=https://awesometechinc.com

APP_URL=
```

---

# 32. Customer-Facing Rules

Customer should see:

```txt
helpful answers
clear onboarding questions
professional sales tone
simple file upload requests
confirmation messages
```

Customer should not see:

```txt
RAG
Pinecone
LangChain
vector
embedding
chunks
retrieval
SLM
LLM
similarity score
internal logs
source debugging
```

---

# 33. Production Safety Requirements

```txt
Do not expose API keys.
Do not send private files to wrong client folder.
Do not retrieve client file chunks across clients/sessions.
Do not use unapproved RAG sources.
Do not rely on one AI model only.
Do not lose chat messages if AI fails.
Do not block onboarding if Drive fails.
Do not render raw unsafe HTML.
Do not use LLM for every irrelevant message.
Do not guess company services if no context is retrieved.
Pinecone updates must be automated through webhook/cron.
Manual sync is backup only.
```

---

# 34. Acceptance Criteria

The reshaped project is accepted only if:

```txt
1. Pinecone index is configured.
2. LangChain is used for chunking/retrieval/RAG.
3. rag:ingest creates embeddings from approved website sections.
4. Website chunks are upserted into Pinecone.
5. rag_chunks metadata is saved in Supabase.
6. rag:test retrieves relevant chunks using Pinecone similarity search.
7. Chatbot service answers use Pinecone-retrieved chunks.
8. Keyword/JSON search is fallback only.
9. Onboarding still collects requirements dynamically.
10. Requirements save into Supabase.
11. File uploads still save.
12. Uploaded text documents can be chunked and embedded into Pinecone client namespace.
13. Project brief uses requirements + website chunks + uploaded file chunks.
14. Google Drive handoff still works.
15. Admin logs show retrieved chunks and similarity scores.
16. Customer never sees internal RAG/vector/LangChain/Pinecone terms.
17. AI usage logs and RAG retrieval logs are saved.
18. Pinecone updates automatically through webhook/cron ingestion.
19. Manual sync is backup only.
20. Existing unnecessary pgvector/JSON-primary retrieval code is removed or deprecated.
```

---

# 35. Build Order

```txt
1. Audit existing code and mark old JSON/keyword retrieval as fallback only.
2. Remove/deprecate Supabase pgvector-related code if any.
3. Keep Supabase app DB and existing onboarding/handoff system.
4. Add Pinecone configuration.
5. Select embedding model and confirm dimension.
6. Create Pinecone index.
7. Add LangChain dependencies.
8. Build embedding provider wrapper.
9. Build Pinecone client wrapper.
10. Build website section chunker.
11. Ingest approved website sections into Pinecone.
12. Save chunk metadata in Supabase rag_chunks.
13. Add rag:ingest script.
14. Add rag:test script.
15. Build Pinecone vector retriever.
16. Build RAG context builder.
17. Build grounded LLM answer function.
18. Update /api/chat/message to use Pinecone retrieval.
19. Keep keyword/JSON fallback only for failures.
20. Add RAG retrieval logs.
21. Add admin audit view for retrieved chunks.
22. Add uploaded file RAG ingestion.
23. Update project brief generation to use website + file chunks.
24. Add WordPress webhook auto-update pipeline.
25. Add daily sitemap cron backup.
26. Test complete onboarding flow.
27. Test Drive handoff with uploaded files.
28. Final cleanup of unused code and tables.
```

---

# 36. Final Explanation For Sir

```txt
The project is being reshaped into a proper production AI onboarding chatbot.

Supabase remains the application database for clients, chat history, requirements, files, Drive logs, AI logs, prompts, model settings, admin dashboard data, and website metadata.

Pinecone is now the vector database for the real RAG layer. Website sections and uploaded documents are chunked using LangChain, converted into embeddings, and stored in Pinecone.

When a user asks a question, the system creates a query embedding, searches Pinecone using vector similarity, retrieves top relevant chunks, and sends only those chunks to the LLM for a grounded response.

The old JSON/keyword retrieval is no longer the primary path. It remains only as fallback.

Pinecone is not manually maintained. Website updates trigger a WordPress webhook, the backend re-renders the updated page, regenerates chunks and embeddings, and automatically upserts/deletes Pinecone vectors. A daily sitemap cron works as backup.

The chatbot still performs full onboarding: it collects client project details, files, documents, images, logos, requirements, generates project brief, and creates Google Drive handoff.
```

---

# 37. Short Explanation

```txt
Awesome Genie is a full AI onboarding chatbot. It uses Supabase for app data and Pinecone for vector search. LangChain chunks website and uploaded file content, creates embeddings, stores vectors in Pinecone, retrieves relevant chunks through similarity search, and sends them to the LLM for accurate chatbot answers and project onboarding. It also collects client files and creates a Google Drive handoff package.
```
