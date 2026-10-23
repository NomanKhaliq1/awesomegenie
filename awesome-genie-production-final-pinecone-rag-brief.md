# Awesome Genie – Final Production Brief & Cleanup Plan

**Project:** Awesome Genie  
**Company:** AwesomeTech  
**Last Updated:** June 5, 2026  
**Primary Goal:** Production-level AI client onboarding chatbot with real RAG using LangChain + Pinecone, Supabase for app data, automated website knowledge updates, file handling, memory management, Google Drive handoff, and admin/PM review.

---

## 1. Final Decision

Awesome Genie must be a **complete production chatbot**, not only a UI, not only JSON search, and not only a RAG demo.

The final system must include:

```txt
Chatbot
Dynamic onboarding
Proper RAG
LangChain
Pinecone vector database
Embedding model
LLM response generation
File handling
Client requirement memory
Context management
Google Drive handoff
Admin/PM dashboard
Logs and audit trail
Auto-update pipeline for website knowledge
```

---

## 2. Main Correction

The earlier system used this type of retrieval:

```txt
User question
→ knowledge_index / JSON search
→ selected JSON
→ answer
```

This is **not enough** for proper production RAG.

That old retrieval can stay only as an emergency fallback, but it must not be the main retrieval method.

The required production RAG flow is:

```txt
Website or uploaded content
→ text extraction
→ chunking
→ embeddings
→ Pinecone vector database
→ user query embedding
→ similarity search
→ top relevant chunks
→ LLM grounded answer
```

---

## 3. Final System Roles

### Supabase

Supabase will be used only as the **application database**.

It stores:

```txt
clients
chat sessions
chat messages
requirements
uploaded file metadata
project briefs
Drive logs
AI usage logs
RAG retrieval logs
admin users
service categories
onboarding fields
prompt templates
model settings
website source metadata
website sections
sync jobs
webhook events
system settings
```

Supabase should **not** be used as the main vector database.

---

### Pinecone

Pinecone will be the **proper vector database**.

It stores:

```txt
website chunks
uploaded document chunks
embeddings
vector metadata
similarity-searchable knowledge
```

Pinecone is where the real RAG search happens.

---

### LangChain

LangChain will be used for:

```txt
document preparation
text splitting/chunking
embedding generation
Pinecone vector store integration
retriever flow
RAG chain
context building
LLM answer generation flow
```

---

### LLM Provider

LLM provider will generate final answers using retrieved context.

Possible providers:

```txt
Gemini
Groq
OpenRouter
```

The exact provider should remain configurable.

---

### Embedding Provider

Embedding provider will convert chunks and user questions into vectors.

Possible options:

```txt
Gemini embeddings
OpenAI-compatible embeddings
HuggingFace/local embedding model
other low-cost/free embedding provider
```

Embedding model must be chosen before creating Pinecone index because Pinecone dimension must match embedding output dimension.

---

## 4. What Existing Work Is Useful

The following existing work is useful and should remain:

```txt
Sitemap extraction
Playwright rendered-page extraction
Clean website content
website_json_sources
website_sections
approved_for_rag flags
Chat widget
Chat session API
Chat message API
Dynamic onboarding fields
Client lead creation
Requirement memory
Completion scoring
Chat logs
AI usage logs
Google Drive handoff service
Project brief generation
Supabase admin login
Admin client list
Client requirement detail page
```

These are still valuable.

Their role changes slightly:

```txt
Website extraction + JSON/sections = content preparation layer
Pinecone + LangChain = actual RAG layer
Supabase = app data and metadata layer
```

---

## 5. What Must Be Removed or Deprecated

This section is important. Remove unnecessary code and do not keep duplicated retrieval logic.

---

### 5.1 Remove JSON/keyword retrieval as the primary RAG path

Remove or deprecate this as primary logic:

```txt
User query
→ knowledge_index keyword search
→ full JSON selected
→ LLM answer
```

This can remain only as fallback if Pinecone retrieval fails.

Correct primary flow:

```txt
User query
→ query embedding
→ Pinecone vector similarity search
→ top chunks
→ LLM answer
```

---

### 5.2 Do not use Supabase pgvector

Do not use Supabase pgvector as the main vector database.

Remove/deprecate:

```txt
embedding vector columns in Supabase
match_rag_chunks SQL RPC
Supabase vector similarity search
pgvector-based retrieval code
```

Only keep Supabase for metadata and logs.

---

### 5.3 Remove direct full JSON context passing

Do not pass entire page JSON directly to LLM as the main answer method.

Remove/deprecate:

```txt
selected full page JSON → LLM context
all JSON files → LLM context
large unchunked content → LLM context
```

Correct:

```txt
sections → chunks → embeddings → Pinecone → top chunks → LLM
```

---

### 5.4 Remove unused local-only RAG scripts from production path

The following can stay only for development/debugging:

```txt
npm run sync:wordpress
npm run test:rag
local data/generated JSON files
local knowledge-index.json
local extraction-report.json
```

They must not be the production RAG path.

Production must use:

```txt
Supabase source records
Pinecone vectors
LangChain retriever
```

---

### 5.5 Remove customer-visible internal wording

Customer must never see:

```txt
RAG
Pinecone
LangChain
vector
embedding
chunks
retrieval
similarity search
SLM
LLM
model routing
source metadata
```

These terms can appear only in:

```txt
admin logs
developer logs
debug screens
internal documentation
```

---

### 5.6 Remove hardcoded business logic

Do not hardcode these in code:

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
theme/logo settings
```

These must come from Supabase/config.

---

## 6. Supabase Tables To Keep

Supabase remains the application database. Keep these tables.

---

### 6.1 `admin_users`

Purpose:

```txt
Admin, PM, sales, and viewer users.
```

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

---

### 6.2 `clients`

Purpose:

```txt
Stores lead/client record created from chatbot onboarding.
```

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

---

### 6.3 `service_categories`

Purpose:

```txt
Dynamic services used by chatbot and onboarding.
```

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

Example records:

```txt
Mortgage Automation
Mortgage Website Development
MISMO Integration
Encompass Integration
BytePro Integration
MeridianLink Integration
Power BI / Reporting
Salesforce Development
Custom Software Development
CRM Integration
LOS Admin Services
Other
```

---

### 6.4 `onboarding_fields`

Purpose:

```txt
Dynamic onboarding questions per service.
```

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

---

### 6.5 `chat_sessions`

Purpose:

```txt
Stores each chatbot session.
```

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

---

### 6.6 `chat_messages`

Purpose:

```txt
Stores every user, assistant, system, and tool message.
```

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

---

### 6.7 `client_requirements`

Purpose:

```txt
Stores structured onboarding memory.
```

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

---

### 6.8 `client_requirement_values`

Purpose:

```txt
Stores field-level requirement values for reporting and completion scoring.
```

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

---

### 6.9 `uploaded_files`

Purpose:

```txt
Stores uploaded file metadata and Drive link info.
```

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

---

### 6.10 `project_briefs`

Purpose:

```txt
Stores PM-ready project brief.
```

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

---

### 6.11 `drive_logs`

Purpose:

```txt
Stores Google Drive handoff logs.
```

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

## 7. Website Content Metadata Tables To Keep

These tables store extracted website content and metadata. Pinecone stores vectors, not Supabase.

---

### 7.1 `website_json_sources`

Purpose:

```txt
Stores extracted page/post/source metadata and cleaned full text.
```

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

---

### 7.2 `website_sections`

Purpose:

```txt
Stores extracted sections. These sections become source material for chunking.
```

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

---

### 7.3 `website_assets`

Purpose:

```txt
Stores images/files found on website pages.
```

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

---

### 7.4 `website_buttons`

Purpose:

```txt
Stores CTA buttons and page links.
```

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

---

### 7.5 `website_forms`

Purpose:

```txt
Stores forms detected on website pages.
```

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

## 8. Pinecone Metadata Tables In Supabase

These tables store metadata and mappings only.

---

### 8.1 `rag_chunks`

Purpose:

```txt
Stores chunk metadata and Pinecone vector IDs.
The actual vectors live in Pinecone.
```

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

Important:

```txt
Do not store embedding vectors here if Pinecone is the vector database.
Only store pinecone_vector_id and metadata.
```

---

### 8.2 `rag_retrieval_logs`

Purpose:

```txt
Stores which chunks were retrieved for each answer.
```

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

## 9. Uploaded File RAG Tables

---

### 9.1 `document_sources`

Purpose:

```txt
Stores extracted uploaded file text.
```

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

---

### 9.2 `document_chunks`

Purpose:

```txt
Stores uploaded file chunk metadata and Pinecone vector IDs.
```

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

Important:

```txt
Client document chunks must be searched only inside their own client/session namespace.
```

---

## 10. AI, Prompt, Memory, and Settings Tables

---

### 10.1 `model_settings`

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

---

### 10.2 `ai_usage_logs`

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

---

### 10.3 `prompt_templates`

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

---

### 10.4 `conversation_summaries`

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

---

### 10.5 `system_settings`

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

## 11. Sync and Webhook Tables

---

### 11.1 `sync_jobs`

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

---

### 11.2 `sync_job_items`

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

---

### 11.3 `webhook_events`

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

## 12. Tables/Columns Not Needed In Supabase

Do not keep these if they were added earlier:

```txt
embedding vector columns in Supabase
pgvector extension for project RAG
match_rag_chunks RPC function
Supabase vector-search-only tables
duplicate knowledge_index table if it is only used for keyword primary retrieval
old local-only JSON lookup tables if unused
```

If `knowledge_index` is already used for admin/search metadata, it can remain as metadata only. It must not be the primary RAG retrieval table.

If a table is unused by:

```txt
admin dashboard
chat flow
content sync
Pinecone metadata
logs
onboarding
Drive handoff
```

then remove it or mark it deprecated.

---

## 13. Pinecone Index Setup

### 13.1 Index name

```txt
awesome-genie-rag
```

### 13.2 Vector type

```txt
Dense
```

### 13.3 Metric

```txt
cosine
```

### 13.4 Dimension

Dimension must match the embedding model.

Examples:

```txt
384 dimension embedding model → Pinecone dimension 384
768 dimension embedding model → Pinecone dimension 768
1536 dimension embedding model → Pinecone dimension 1536
```

Do not create Pinecone index until embedding model is selected.

---

## 14. Pinecone Namespaces

Use:

```txt
website
client-files-{clientId}-{sessionId}
```

Examples:

```txt
website
client-files-2f3a-client-id-9c8e-session-id
```

Reason:

```txt
website namespace = global AwesomeTech knowledge
client-files namespace = private uploaded client documents
```

---

## 15. RAG Ingestion Pipeline

### 15.1 Website ingestion

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

### 15.2 Stable Pinecone vector IDs

Use deterministic IDs.

Website chunk vector ID format:

```txt
website-{sourceId}-{sectionId}-{chunkIndex}
```

Uploaded file chunk vector ID format:

```txt
file-{clientId}-{sessionId}-{uploadedFileId}-{chunkIndex}
```

Benefits:

```txt
easy update
easy delete
easy audit
no duplicate vectors
clear Supabase ↔ Pinecone mapping
```

---

## 16. Website Update Automation

Pinecone must not be manually maintained.

### 16.1 WordPress webhook

When WordPress content changes:

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
Recreate embeddings
↓
Upsert/delete Pinecone vectors
↓
Update pinecone_synced flags
```

Endpoint:

```txt
POST /api/webhooks/wordpress-content-updated
```

Webhook should verify secret:

```txt
WORDPRESS_WEBHOOK_SECRET
```

---

### 16.2 Daily scheduled backup sync

If webhook misses any update:

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

---

### 16.3 Manual admin sync

Manual button should exist only for admin backup:

```txt
Regenerate RAG for this URL
Sync All
Re-ingest to Pinecone
```

Manual sync is not the primary update method.

---

## 17. LangChain Files Required

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

## 18. Required Scripts

### 18.1 `npm run rag:ingest`

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

---

### 18.2 `npm run rag:test`

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

## 19. Chatbot Flow With Proper RAG

### 19.1 `POST /api/chat/message`

Flow:

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

## 20. Uploaded File RAG Flow

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

---

## 21. Project Brief Generation Flow

```txt
1. Load client info.
2. Load chat session.
3. Load recent messages.
4. Load conversation summary.
5. Load client_requirements.
6. Load uploaded_files.
7. Retrieve website chunks from Pinecone namespace "website".
8. Retrieve uploaded file chunks from Pinecone namespace client-files-{clientId}-{sessionId}.
9. Build PM context.
10. Generate AI project brief.
11. Save project_briefs row.
12. Create Google Drive folder.
13. Upload:
    - project-brief.md
    - requirements.json
    - chat-transcript.txt
    - uploaded files
14. Save Drive links.
15. Update client status.
16. Save drive_logs.
```

---

## 22. Context Management

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

## 23. Memory Management

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

## 24. Agentic Architecture

Customer sees one assistant:

```txt
Awesome Genie
```

Internally:

```txt
Router Agent
Knowledge Agent
Onboarding Agent
File Agent
Memory Agent
Drive Handoff Agent
```

### Router Agent

Decides:

```txt
irrelevant
service question
onboarding
file upload
handoff
unknown
```

### Knowledge Agent

Uses:

```txt
LangChain + Pinecone
```

### Onboarding Agent

Uses:

```txt
service_categories
onboarding_fields
client_requirements
client_requirement_values
```

### File Agent

Uses:

```txt
uploaded_files
document_sources
document_chunks
Pinecone client namespace
```

### Memory Agent

Uses:

```txt
chat_messages
client_requirements
conversation_summaries
```

### Drive Handoff Agent

Uses:

```txt
project_briefs
drive_logs
uploaded_files
Google Drive API
```

---

## 25. Admin Audit Requirements

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

## 26. API Routes

### Chat APIs

```txt
POST /api/chat/start
POST /api/chat/message
POST /api/chat/upload
POST /api/chat/complete
GET  /api/chat/session/:id
```

### RAG APIs

```txt
POST /api/rag/ingest
POST /api/rag/test
POST /api/rag/retrieve
```

### Knowledge APIs

```txt
POST /api/sync/sitemap
POST /api/sync/single-url
POST /api/webhooks/wordpress-content-updated
GET  /api/knowledge/sources
GET  /api/knowledge/source/:id
PATCH /api/knowledge/source/:id
POST /api/knowledge/source/:id/approve
```

### Admin APIs

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

### Drive APIs

```txt
POST /api/drive/create-client-folder
POST /api/drive/upload-file
POST /api/drive/create-brief
GET  /api/drive/folder/:clientId
POST /api/drive/retry-sync/:clientId
```

---

## 27. Environment Variables

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

## 28. Project File Structure

```txt
/lib/langchain
  embeddingProvider.ts
  pineconeClient.ts
  chunkWebsiteSections.ts
  ingestWebsiteChunksToPinecone.ts
  retrieveWebsiteChunksFromPinecone.ts
  ingestUploadedFilesToPinecone.ts
  retrieveClientFileChunksFromPinecone.ts
  buildRagContext.ts
  ragAnswer.ts
  logRetrieval.ts

/lib/onboarding
  stateMachine.ts
  loadOnboardingFields.ts
  updateRequirementMemory.ts
  calculateCompletionScore.ts
  getNextQuestion.ts

/lib/drive
  googleDriveClient.ts
  createClientFolder.ts
  uploadFile.ts
  createTextFile.ts

/lib/sync
  fetchSitemap.ts
  renderWithPlaywright.ts
  extractRenderedContent.ts
  saveWebsiteSource.ts
  syncSingleUrl.ts
  webhookSync.ts

/lib/ai
  router.ts
  ruleEngine.ts
  slmClassifier.ts
  llmProvider.ts
  costTracker.ts

/app/api/chat
  start/route.ts
  message/route.ts
  upload/route.ts
  complete/route.ts

/app/api/rag
  ingest/route.ts
  test/route.ts
  retrieve/route.ts
```

---

## 29. Acceptance Criteria

System is accepted only if:

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
```

---

## 30. Build Order

```txt
1. Clean old retrieval code.
2. Keep Supabase app DB.
3. Add Pinecone config.
4. Add LangChain dependencies.
5. Select embedding model and confirm dimension.
6. Create Pinecone index.
7. Build embedding provider wrapper.
8. Build Pinecone client wrapper.
9. Convert approved website_sections into chunks.
10. Ingest website chunks into Pinecone.
11. Save chunk metadata in Supabase rag_chunks.
12. Build Pinecone vector retriever.
13. Build RAG context builder.
14. Build LLM grounded answer function.
15. Update /api/chat/message to use Pinecone retrieval.
16. Keep keyword retrieval as fallback only.
17. Add rag:ingest script.
18. Add rag:test script.
19. Add RAG retrieval logs.
20. Add admin audit view for retrieved chunks.
21. Add uploaded file RAG ingestion.
22. Update project brief generation to use website + file chunks.
23. Add WordPress webhook auto-update pipeline.
24. Add daily sitemap cron backup.
25. Final test with service questions and onboarding.
```

---

## 31. Explanation for Sir

```txt
Supabase will remain the application database for clients, chat history, requirements, files, Drive logs, AI logs, prompts, model settings, admin dashboard data, and website metadata.

Pinecone will be used as the proper vector database for RAG. Website sections and uploaded documents will be chunked using LangChain, converted into embeddings using an embedding model, and stored in Pinecone.

When a user asks a question, the system creates a query embedding, searches Pinecone using vector similarity, retrieves the top relevant chunks, and passes only those chunks to the LLM for a grounded answer.

The old JSON/keyword retrieval will remain only as fallback. The primary path will be actual RAG:
chunking + embeddings + Pinecone vector search + retrieved context + LLM answer.

Pinecone will not be manually maintained. Website updates will trigger a WordPress webhook, the backend will re-render the updated page, regenerate chunks and embeddings, and upsert/delete Pinecone vectors automatically. A daily sitemap cron will run as backup.
```

---

## 32. Short Explanation

```txt
Awesome Genie uses Supabase for app data and Pinecone for vector search. LangChain chunks website and uploaded file content, generates embeddings, stores vectors in Pinecone, retrieves relevant chunks through similarity search, and sends those chunks to the LLM for accurate chatbot answers and onboarding support.
```
