# Awesome Genie – Final Production Requirements

**Last updated:** June 5, 2026  
**Project:** Awesome Genie  
**Goal:** Production-level AI client onboarding chatbot with proper RAG using LangChain, Pinecone vector database, embeddings, chatbot onboarding, file handling, memory/context management, Google Drive handoff, and admin audit workflow.

---

## 1. Main Correction

The current system has useful work completed, but the RAG layer must be upgraded.

### Current issue

Current retrieval is mostly:

```txt
User question
→ keyword/topic matching
→ knowledge_index / JSON source
→ answer
```

This is useful as a content-preparation layer, but it is not a proper production RAG pipeline.

### Required RAG process

```txt
Website / uploaded content
→ text extraction
→ chunking
→ embedding model
→ vector database
→ similarity search
→ retrieved chunks
→ LLM grounded answer
```

For Awesome Genie:

```txt
LangChain = RAG orchestration
Pinecone = vector database
Supabase = application database
LLM provider = final answer generator
Embedding provider = converts chunks and queries into vectors
```

---

## 2. Final Architecture Decision

### Supabase remains in the project

Supabase is not being removed. Supabase is the normal application database.

Supabase stores:

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
sync_jobs
webhook_events
system_settings
```

### Pinecone is the proper vector database

Pinecone stores:

```txt
website chunks
uploaded document chunks
embeddings
chunk metadata used for similarity search
```

### LangChain is used for the actual RAG pipeline

LangChain handles:

```txt
document preparation
text splitting / chunking
embedding generation
Pinecone vector store integration
retriever logic
RAG chain
context preparation
LLM call orchestration
```

---

## 3. What Existing Work Should Stay

The following work is still useful and must not be removed.

### Local content extraction POC

Keep:

```txt
Sitemap extraction flow
Playwright rendered page extraction
Cleaned website content
Local JSON generation under data/generated
knowledge-index.json for debugging/reference
extraction-report.json for content QA
npm run sync:wordpress
npm run test:rag
```

New role:

```txt
This is now the content extraction and knowledge preparation layer.
It is not the final RAG retrieval layer.
```

### Supabase foundation

Keep:

```txt
Supabase schema
service categories
onboarding fields
admin user bootstrap
Supabase connection scripts
knowledge import
website sources
website sections
RAG approval flags
admin login
protected admin layout
dashboard backed by stats
```

New role:

```txt
Supabase remains the application database and website-content metadata database.
```

### Chat widget and approved knowledge system

Keep:

```txt
Floating chatbot widget
Website preview page
Chat session start API
Chat message API
Chat logs in Supabase
AI usage logs
RAG source metadata logs
Internal terms hidden from customers
Enter-to-send behavior
Quick reply chips
```

Modify:

```txt
Approved-only keyword/JSON retrieval must be replaced with Pinecone vector retrieval as the primary RAG path.
Keyword/JSON retrieval can remain only as fallback.
```

### Dynamic client onboarding

Keep:

```txt
Awesome Genie behavior policy
sales-style chat tone
internal terms hidden from customers
service detection
multi-service session support
requirement memory per session
client lead creation
requirement value storage
completion scoring
direct-answer mapping for short replies
full intake fields seeded to Supabase
phone number capture
project overview capture
current system capture
workflow/project goal capture
pain points capture
success goals capture
content/assets capture
timeline and budget capture
context-aware suggested replies
admin clients list
client requirement detail page
```

Modify:

```txt
Free-text requirement extraction should use rule-first + optional SLM fallback.
Onboarding flow must continue to use DB-driven fields.
No hardcoded onboarding questions.
```

### Google Drive handoff

Keep:

```txt
Google Drive handoff service
service-account JWT auth flow
Drive folder creation
project-brief.md generation
requirements.json generation
chat-transcript.txt generation
Supabase updates for drive_folder_id, drive_folder_url, drive_created status
project_briefs insert
drive_logs logging
chat-safe failure handling if Drive fails
```

Modify:

```txt
Project brief should use:
- structured requirements
- conversation summary
- retrieved website chunks from Pinecone
- retrieved uploaded document chunks from Pinecone
```

---

## 4. What Must Be Replaced or Deprecated

### Remove as primary RAG

Do not use this as the main RAG path:

```txt
User query
→ knowledge_index keyword match
→ selected JSON
→ answer
```

This can stay as fallback only.

### Do not use Supabase pgvector as the main vector DB

The requirement is Pinecone as the proper vector database.

```txt
Do not use Supabase pgvector as the main vector DB.
Do not store embeddings in Supabase as the primary retrieval system.
```

### Do not pass full JSON directly to the LLM as primary retrieval

Avoid:

```txt
selected full page JSON
→ direct LLM context
```

Correct flow:

```txt
clean website sections
→ chunks
→ embeddings
→ Pinecone vector search
→ top chunks only
→ LLM context
```

### Do not show internal terms to customers

Customer should never see:

```txt
RAG
LangChain
Pinecone
vector
embedding
chunks
retrieval
similarity search
model route
SLM
LLM
```

Admin/debug screens can show these.

---

## 5. Final Production System Flow

```txt
User opens chatbot
↓
Chat session starts in Supabase
↓
User sends message
↓
Rule engine checks irrelevant/spam messages
↓
Router/SLM detects intent and service category
↓
If company/service knowledge is needed:
   LangChain creates query embedding
   Pinecone retrieves top similar chunks
   RAG context is built
   LLM answers using retrieved chunks
↓
If onboarding is active:
   Requirement memory updates
   Completion score recalculates
   Next DB-driven question is asked
↓
If files are uploaded:
   File is stored
   Text is extracted
   File chunks are embedded into Pinecone
↓
When complete:
   Project brief is generated
   Drive folder is created
   Handoff files are uploaded
↓
Admin/PM reviews lead, requirements, brief, retrieved sources, logs, and Drive links
```

---

## 6. Tech Stack

```txt
Frontend: Next.js + TypeScript + TailwindCSS
Backend: Next.js API Routes / Server Actions
Application DB: Supabase PostgreSQL
Vector DB: Pinecone
RAG Framework: LangChain
Temporary File Storage: Supabase Storage
Final File Handoff: Google Drive API
Website Source: Yoast sitemap + Playwright rendered HTML
Optional Metadata Source: WordPress REST API
```

Embedding provider must be configurable.

Possible options:

```txt
Gemini embeddings
OpenAI-compatible embeddings
HuggingFace/local embedding model
other free/low-cost embedding provider
```

LLM provider must be configurable.

Possible options:

```txt
Gemini
Groq
OpenRouter
```

---

## 7. Pinecone RAG Architecture

### Pinecone index

Suggested index name:

```txt
awesome-genie-rag
```

### Pinecone namespaces

Use separate namespaces:

```txt
website
client-files-{clientId}-{sessionId}
```

Examples:

```txt
website
client-files-abc123-session456
```

Reason:

```txt
Website knowledge is global.
Client uploaded files must be private and scoped to the correct client/session.
```

---

## 8. Pinecone Vector Metadata

### Website chunk metadata

Each website vector should include:

```json
{
  "chunk_id": "mortgage-website-development-services__section-2__chunk-1",
  "source_type": "website",
  "source_id": "supabase-website-source-uuid",
  "section_id": "supabase-section-uuid",
  "page_title": "Mortgage Website Development Services",
  "section_title": "Mortgage Website Features",
  "source_url": "https://awesometechinc.com/mortgage-website-development-services/",
  "chunk_text": "Clean chunk text here...",
  "approved_for_rag": true
}
```

### Client file chunk metadata

Each client file vector should include:

```json
{
  "chunk_id": "uploaded-file-id__chunk-1",
  "source_type": "client_file",
  "client_id": "client uuid",
  "session_id": "session uuid",
  "uploaded_file_id": "uploaded file uuid",
  "file_name": "requirements.pdf",
  "chunk_text": "Extracted file chunk text...",
  "visibility": "client_session_only"
}
```

Important:

```txt
Client file chunks must never be retrieved across different clients or sessions.
```

---

## 9. Supabase Tables Required

Supabase stores application data, content metadata, and logs. It does not act as the main vector database.

### 9.1 admin_users

```sql
create table admin_users (
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

### 9.2 clients

```sql
create table clients (
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

### 9.3 service_categories

```sql
create table service_categories (
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

### 9.4 onboarding_fields

```sql
create table onboarding_fields (
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

### 9.5 chat_sessions

```sql
create table chat_sessions (
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

### 9.6 chat_messages

```sql
create table chat_messages (
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

### 9.7 client_requirements

```sql
create table client_requirements (
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

### 9.8 client_requirement_values

```sql
create table client_requirement_values (
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

### 9.9 uploaded_files

```sql
create table uploaded_files (
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

### 9.10 project_briefs

```sql
create table project_briefs (
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

### 9.11 drive_logs

```sql
create table drive_logs (
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

## 10. Website Knowledge Tables in Supabase

These tables store extracted content and metadata, not the vector search itself.

### 10.1 website_json_sources

```sql
create table website_json_sources (
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

### 10.2 website_sections

```sql
create table website_sections (
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

### 10.3 website_assets

```sql
create table website_assets (
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

### 10.4 website_buttons

```sql
create table website_buttons (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_id uuid references website_sections(id),
  label text,
  url text,
  button_type text,
  created_at timestamp default now()
);
```

### 10.5 website_forms

```sql
create table website_forms (
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

## 11. RAG Metadata Tables in Supabase

These tables store logs and metadata. Pinecone stores actual vectors.

### 11.1 rag_chunks

This table stores chunk metadata and Pinecone vector IDs.

```sql
create table rag_chunks (
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

### 11.2 rag_retrieval_logs

```sql
create table rag_retrieval_logs (
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

## 12. Uploaded File RAG Tables

### 12.1 document_sources

```sql
create table document_sources (
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

### 12.2 document_chunks

```sql
create table document_chunks (
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

## 13. AI, Prompt, and Settings Tables

### 13.1 model_settings

```sql
create table model_settings (
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

### 13.2 ai_usage_logs

```sql
create table ai_usage_logs (
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

### 13.3 prompt_templates

```sql
create table prompt_templates (
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

### 13.4 conversation_summaries

```sql
create table conversation_summaries (
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

### 13.5 system_settings

```sql
create table system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique,
  setting_value jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

---

## 14. Sync and Webhook Tables

### 14.1 sync_jobs

```sql
create table sync_jobs (
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

### 14.2 sync_job_items

```sql
create table sync_job_items (
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

### 14.3 webhook_events

```sql
create table webhook_events (
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

## 15. Core RAG Pipeline

### 15.1 Website RAG ingestion

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
Pinecone upsert
↓
rag_chunks metadata saved in Supabase
↓
pinecone_synced = true
```

### 15.2 Website RAG query

```txt
User asks service/company question
↓
Query embedding generated
↓
Pinecone namespace: website
↓
Similarity search
↓
Top 5 chunks retrieved
↓
Context built
↓
LLM answers using context only
↓
rag_retrieval_logs saved
↓
ai_usage_logs saved
```

### 15.3 Uploaded file RAG ingestion

```txt
User uploads PDF/DOCX/TXT
↓
Supabase Storage upload
↓
Text extraction
↓
document_sources row
↓
LangChain text splitter
↓
chunks
↓
embedding provider
↓
Pinecone namespace: client-files-{clientId}-{sessionId}
↓
document_chunks metadata saved in Supabase
```

### 15.4 Uploaded file RAG query

```txt
Project brief generation
↓
Query generated from project requirements
↓
Pinecone namespace: client-files-{clientId}-{sessionId}
↓
Similarity search
↓
Relevant uploaded file chunks retrieved
↓
LLM uses file context + website context + requirements
↓
PM brief generated
```

---

## 16. LangChain Files Required

Create/update these files:

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

## 17. Required Scripts

### npm run rag:ingest

This should:

```txt
read approved website_sections from Supabase
split content into chunks
generate embeddings
upsert vectors into Pinecone namespace website
save rag_chunks metadata into Supabase
mark website_sections.pinecone_synced = true
mark website_json_sources.pinecone_synced = true where applicable
log total sections processed
log total chunks created
log total chunks upserted
log failed chunks
```

### npm run rag:test

This should:

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

Pass criteria:

```txt
Each query retrieves relevant chunks from Pinecone vector similarity search.
Keyword/JSON search must not be the primary method.
```

---

## 18. Chatbot Flow With Proper RAG

### POST /api/chat/message

Internal flow:

```txt
1. Validate session.
2. Save user message in Supabase.
3. Run rule engine.
4. If irrelevant:
   - return no-model fallback response
   - save assistant message
   - log no-model route
5. If relevant:
   - run router/SLM if needed
   - detect intent and service category
6. If service/company knowledge is needed:
   - generate query embedding
   - search Pinecone namespace website
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

## 19. Project Brief Generation Flow

### POST /api/chat/complete

Flow:

```txt
1. Load client info.
2. Load chat session.
3. Load recent messages.
4. Load conversation summary.
5. Load client_requirements.
6. Load uploaded_files.
7. Retrieve website chunks from Pinecone namespace website.
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

## 20. Context Management

Do not send everything to the LLM.

Send only:

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

## 21. Memory Management

Memory layers:

```txt
Raw memory: chat_messages
Structured memory: client_requirements + client_requirement_values
Compressed memory: conversation_summaries
External knowledge memory: Pinecone website namespace
Client document memory: Pinecone client-files namespace
```

---

## 22. Agentic Architecture

User sees only one assistant:

```txt
Awesome Genie
```

Internal logical agents:

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

For:

```txt
AwesomeTech website/service questions
```

### Onboarding Agent

Uses:

```txt
service_categories
onboarding_fields
client_requirements
client_requirement_values
```

For:

```txt
next question
requirement extraction
completion score
```

### File Agent

Uses:

```txt
uploaded_files
document_sources
document_chunks
Pinecone client namespace
```

For:

```txt
file upload
text extraction
chunking
embedding
file summary
```

### Memory Agent

Uses:

```txt
chat_messages
client_requirements
conversation_summaries
```

For:

```txt
memory updates
summary compression
context management
```

### Drive Handoff Agent

Uses:

```txt
project_briefs
drive_logs
uploaded_files
Google Drive API
```

For:

```txt
Drive folder
project brief
requirements JSON
chat transcript
uploaded files
```

---

## 23. Environment Variables

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

## 24. Admin Audit Requirements

Admin should be able to see:

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

## 25. API Routes

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

### Google Drive APIs

```txt
POST /api/drive/create-client-folder
POST /api/drive/upload-file
POST /api/drive/create-brief
GET  /api/drive/folder/:clientId
POST /api/drive/retry-sync/:clientId
```

---

## 26. No Static Data Rule

These must come from DB/config:

```txt
service categories
onboarding questions
required fields
prompt templates
model settings
fallback messages
file upload settings
Drive root folder
approved RAG sources
theme/logo settings
```

Allowed hardcoded:

```txt
emergency fallback response
basic enum values
system safety fallback
default empty states
```

---

## 27. Customer-Facing Rules

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
LangChain
Pinecone
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

## 28. Production Safety Requirements

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
```

---

## 29. Acceptance Criteria

The system is accepted only if all of these work:

```txt
1. Pinecone index is configured.
2. LangChain is used for chunking/retrieval/RAG flow.
3. npm run rag:ingest creates embeddings from approved website sections.
4. Website chunks are upserted into Pinecone.
5. rag_chunks metadata is saved in Supabase.
6. npm run rag:test retrieves relevant chunks using Pinecone vector similarity.
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
18. Supabase remains app DB.
19. Pinecone is the vector DB.
```

---

## 30. Updated Build Order

```txt
1. Keep existing Supabase app DB.
2. Add Pinecone configuration.
3. Add LangChain dependencies.
4. Build embedding provider wrapper.
5. Build Pinecone client wrapper.
6. Convert approved website_sections into chunks.
7. Ingest website chunks into Pinecone.
8. Save chunk metadata in Supabase rag_chunks.
9. Build Pinecone vector retriever.
10. Build RAG context builder.
11. Build LLM grounded answer function.
12. Update /api/chat/message to use Pinecone retrieval.
13. Keep keyword retrieval as fallback only.
14. Add rag:ingest script.
15. Add rag:test script.
16. Add RAG retrieval logs.
17. Add admin audit view for retrieved chunks.
18. Add uploaded file RAG ingestion.
19. Update project brief generation to use website + file chunks.
20. Final test with service questions and onboarding flow.
```

---

## 31. Explanation for Sir

```txt
Supabase will remain the application database for clients, chat history, requirements, files, Drive logs, AI logs, prompts, model settings, and admin dashboard data.

Pinecone will be used as the proper vector database for RAG. Website sections and uploaded documents will be chunked using LangChain, converted into embeddings using an embedding model, and stored in Pinecone.

When a user asks a question, the system will create a query embedding, search Pinecone using vector similarity, retrieve the top relevant chunks, and pass only those chunks to the LLM for a grounded answer.

The old JSON/keyword retrieval will remain only as a fallback. The primary path will be actual RAG:
chunking + embeddings + Pinecone vector search + retrieved context + LLM answer.
```

---

## 32. Short Explanation

```txt
Awesome Genie will use Supabase for app data and Pinecone for vector search. LangChain will chunk website and uploaded file content, generate embeddings, store vectors in Pinecone, retrieve relevant chunks by similarity search, and pass those chunks to the LLM for accurate chatbot answers and onboarding support.
```
