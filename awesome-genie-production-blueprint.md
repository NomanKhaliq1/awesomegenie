# Awesome Genie

## Production-Level AI Client Onboarding Chatbot for AwesomeTech

---

## 1. Project Overview

**Awesome Genie** is a production-level AI chatbot system for AwesomeTech.

The chatbot will help potential clients:

- Understand AwesomeTech services
- Ask service-related questions
- Start client onboarding
- Provide project requirements
- Upload documents/assets
- Receive guided follow-up questions
- Generate a PM-ready project brief
- Create a structured Google Drive handoff folder
- Send qualified leads to the Admin/PM dashboard

This is **not** a simple chatbot wrapper around an AI API.

It is a complete AI onboarding system with:

- Client-facing chatbot
- Admin/PM dashboard
- Website knowledge sync
- Sitemap + Playwright rendered-page extraction
- Structured JSON-based RAG
- SLM/LLM routing
- Cost-saving logic
- Irrelevant question filtering
- File upload
- Requirement memory
- Completion score
- Google Drive folder creation
- AI-generated project brief
- Usage and cost logs
- Production-level database relationships

---

## 2. Product Name

```txt
Awesome Genie
```

Suggested tagline:

```txt
AI-powered client onboarding assistant for AwesomeTech.
```

Short description:

```txt
Awesome Genie helps AwesomeTech qualify leads, collect requirements, organize files, generate project briefs, and prepare client handoff automatically.
```

---

## 3. Implementation Roadmap

The production system should be built in phases. This prevents the project from becoming a large, risky chatbot build where database design, RAG quality, onboarding, file handling, and Google Drive automation are all attempted at once.

### Phase 0: Current Local RAG Proof of Concept

Status:

```txt
In progress / local prototype exists
```

Scope:

- Fetch AwesomeTech sitemap URLs.
- Render public pages with Playwright.
- Extract clean visible content into local JSON files.
- Generate `knowledge-index.json`.
- Generate `extraction-report.json`.
- Test local RAG retrieval helpers.

Exit criteria:

- Sitemap sync completes without failed extractions.
- Low-value pages are marked `skipped`.
- Useful pages have enough clean text, sections, buttons, forms, and links.
- `npm run test:rag` returns sensible source JSON for service questions.

### Phase 1: Supabase Foundation

Scope:

- Create Supabase project.
- Add production database migrations.
- Enable RLS.
- Seed service categories.
- Seed onboarding fields.
- Seed model settings.
- Seed prompt templates.
- Import current generated JSON into database tables.

Exit criteria:

- Database schema exists with constraints, indexes, and relationships.
- Local JSON can be imported into `website_json_sources`, `website_sections`, `knowledge_index`, and `rag_chunks`.
- Admin users can be created securely.

### Phase 2: Basic Chat + RAG

Scope:

- Build `/chat` UI.
- Build session start API.
- Build message API.
- Add rule engine.
- Add SLM intent/service classification.
- Add database-backed RAG retrieval.
- Return answers from approved AwesomeTech knowledge only.

Exit criteria:

- User can ask service questions.
- Chatbot retrieves relevant approved website sources.
- Irrelevant questions are blocked without expensive AI.
- Chat messages, routing decisions, RAG sources, and AI usage are logged.

### Phase 3: Dynamic Onboarding

Scope:

- Add onboarding state machine.
- Load questions from `onboarding_fields`.
- Extract and save requirement values.
- Calculate completion score.
- Ask next missing required question.

Exit criteria:

- Bot can collect basic client details.
- Bot can collect service-specific requirements.
- Requirement memory is persisted in `client_requirements` and `client_requirement_values`.
- Admin dashboard can show completion status.

### Phase 4: File Upload + Project Brief

Scope:

- Add Supabase Storage uploads.
- Validate file type and size.
- Extract text from supported files.
- Summarize uploaded files.
- Generate PM-ready project brief.

Exit criteria:

- Uploaded files are linked to the correct client/session.
- File summaries are saved.
- Project brief is generated from requirements, conversation, files, and RAG context.

### Phase 5: Google Drive Handoff + Admin Operations

Scope:

- Create client Google Drive folder.
- Create standard subfolders.
- Upload files, brief, conversation summary, and requirements JSON.
- Add retry-safe Drive logs.
- Build PM dashboard views.

Exit criteria:

- A qualified lead can be handed off to a PM with a complete Drive folder.
- Drive failures do not block onboarding completion.
- Admin can retry failed Drive syncs.

### Phase 6: Production Automation

Scope:

- Add WordPress webhook sync.
- Add single URL sync.
- Add RAG approval workflow.
- Add usage/cost dashboard.
- Add monitoring and alerting.
- Add optional embeddings/pgvector hybrid search.

Exit criteria:

- Website content can update without manual full sync.
- Only approved RAG sources are used by chatbot.
- AI cost and model routing are visible to admin users.

---

## 4. Recommended Tech Stack

### Frontend

```txt
Next.js
TypeScript
TailwindCSS
```

Reason:

- Best for chatbot UI
- Best for admin dashboard
- API routes can be handled in the same app
- Easy deployment on Vercel
- Clean TypeScript structure

### Backend

```txt
Next.js API Routes / Server Actions
```

Backend will handle:

- Chat messages
- AI routing
- Sitemap/WordPress sync
- JSON generation
- RAG retrieval
- File upload
- Google Drive integration
- Admin APIs
- Usage logs

### Database

```txt
Supabase PostgreSQL
```

Reason:

- PostgreSQL support
- JSONB support for generated page JSON
- Auth support
- Storage support
- Easy admin panel
- Can later support pgvector for advanced RAG

### Temporary File Storage

```txt
Supabase Storage
```

Used before files are copied/uploaded to Google Drive.

### Final Client File Storage

```txt
Google Drive API
```

Used for final client folders, uploaded files, project briefs, conversation summaries, and internal notes.

### AI Providers

Use provider abstraction so the project is not locked to one AI provider.

Possible providers:

```txt
Groq
Gemini
OpenRouter
```

Suggested usage:

```txt
SLM / Cheap Layer:
- Groq Gemma
- Groq Qwen small
- Gemini Flash

LLM / Reasoning Layer:
- Gemini Flash / Pro
- Groq Llama large
- OpenRouter larger model
```

### Website Knowledge Source

Primary:

```txt
Yoast Sitemap + Playwright rendered HTML
```

Sitemap index:

```txt
https://awesometechinc.com/sitemap_index.xml
```

Child sitemaps:

```txt
https://awesometechinc.com/page-sitemap.xml
https://awesometechinc.com/post-sitemap.xml
```

Optional metadata source:

```txt
https://awesometechinc.com/wp-json/wp/v2/pages
https://awesometechinc.com/wp-json/wp/v2/posts
```

Important:

```txt
The public rendered page is the primary source of truth for content extraction.
WordPress REST API is optional for metadata only.
```

### Deployment

```txt
Vercel
```

---

## 5. UI Theme & Branding

### Theme Colors

Use a clean light theme.

Primary colors:

```txt
White: #FFFFFF
Soft Pink: #FAF0F1
```

Usage:

```txt
Main page background: #FFFFFF
Admin dashboard background: #FAF0F1
Chat panel background: #FFFFFF
Cards: #FFFFFF
Soft sections: #FAF0F1
Forms: #FFFFFF
Modals: #FFFFFF
```

Avoid:

```txt
No dark theme
No dark sidebar
No heavy gradients
No flashy colors
No over-colorful dashboard
```

### Font

Use Lato globally.

```css
font-family: "Lato", sans-serif;
```

Apply Lato on:

- Chatbot
- Admin dashboard
- Login page
- Forms
- Tables
- Modals
- Buttons
- Project brief viewer
- JSON viewer

### Logo Handling

The logo will be provided manually inside the project folder.

Suggested folder:

```txt
/public/assets/logo/
```

Possible file names:

```txt
/public/assets/logo/logo.png
/public/assets/logo/logo.svg
/public/assets/logo/awesome-genie-logo.png
```

Implementation rule:

- Do not use external logo URL
- Pick logo from local project folder
- If logo exists, show it
- If logo does not exist, show text fallback: `Awesome Genie`

Suggested component:

```tsx
<img src="/assets/logo/logo.png" alt="Awesome Genie" />
```

Fallback text:

```txt
Awesome Genie
```

Logo should appear on:

- Chatbot header
- Admin sidebar
- Login page
- Dashboard top bar
- Project brief export header

### UI Style Direction

The design should feel:

- Clean
- Soft
- Modern
- Professional
- Spacious
- SaaS-style
- Easy to read
- Client-friendly

Use:

- Rounded cards
- Soft shadows
- Clear spacing
- Clean tables
- Simple buttons
- Minimal animations
- Light borders

---

## 6. High-Level System Flow

```txt
Visitor opens Awesome Genie
->
Chatbot greeting
->
User sends message
->
Rule engine checks relevance
->
SLM detects intent and service category
->
RAG checks AwesomeTech website knowledge if needed
->
Bot answers service question or starts onboarding
->
Bot collects requirements
->
Bot requests files
->
Files are uploaded
->
System checks completeness
->
LLM generates project brief
->
Google Drive folder is created
->
Files and brief are uploaded
->
Lead appears in PM dashboard
->
AI usage and routing logs are saved
```

---

## 7. Main Modules

### 7.1 Client Chatbot

Route:

```txt
/chat
```

Purpose:

The chatbot will interact with website visitors and potential clients.

Features:

- Greeting
- Chat messages
- Service detection
- Relevant question answering
- Irrelevant question blocking
- Client onboarding
- File upload
- Requirement collection
- Final confirmation
- Project brief generation
- Google Drive handoff

### 7.2 Admin / PM Dashboard

Route:

```txt
/admin/dashboard
```

Purpose:

Admin and project managers can review leads and system data.

Features:

- View leads
- View client details
- View conversations
- View requirements
- View uploaded files
- Open Google Drive folder
- Review AI project brief
- View website knowledge JSON
- Sync website knowledge
- View AI usage logs
- Configure model settings
- Manage onboarding fields
- Manage prompts
- Manage service categories

### 7.3 Website Knowledge Sync

Purpose:

Awesome Genie should understand AwesomeTech website content.

Production source:

```txt
Yoast sitemap
+
Playwright rendered HTML
+
optional WordPress REST API metadata
+
WordPress webhook updates
```

Flow:

```txt
Sitemap URLs
->
Playwright render public page
->
Extract final visible DOM
->
Clean content
->
Generate structured JSON
->
Save in database
->
Create knowledge index
->
Create section-level RAG chunks
->
Use in chatbot RAG
```

### 7.4 RAG Knowledge System

RAG means:

```txt
Retrieval Augmented Generation
```

In this project:

```txt
Retrieve AwesomeTech knowledge first
Then generate AI answer from that knowledge
```

Awesome Genie will use JSON-based RAG first, then optionally section-level chunks/embeddings later.

It will not send the full website to the AI.

Instead:

```txt
User question
->
Knowledge index search
->
Relevant source/chunks selected
->
Only selected context sent to AI
->
AI generates answer
```

Benefits:

- Less token usage
- Lower cost
- Better accuracy
- Less hallucination
- Faster answers
- Easy update when website content changes

### 7.5 AI Routing System

The chatbot must not use expensive AI for every message.

Layers:

```txt
Rule Engine
SLM
RAG
LLM
```

Rule Engine:

- No AI cost
- Reject obvious irrelevant questions
- Detect spam
- Detect basic keywords

SLM:

- Cheap model
- Intent detection
- Service detection
- Relevance classification
- Completeness checking
- Routing decision

LLM:

- Expensive model
- Used only for reasoning and generation
- Dynamic onboarding
- Document summaries
- Project brief

### 7.6 Google Drive Integration

Purpose:

After onboarding, client files and AI summaries should be organized in Google Drive.

Folder structure:

```txt
Awesome Genie Leads
`-- Client Company Name
    |-- 01 Uploaded Files
    |-- 02 AI Project Brief
    |-- 03 Internal Notes
    |-- 04 Conversation Summary
    `-- 05 Extracted Requirements
```

---

## 8. Complete Database Design

This section includes production-level tables, their relationships, and how the chatbot uses each table.

### 8.1 `admin_users`

Admin, PM, sales team, viewer users.

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

Roles:

```txt
admin
project_manager
sales
viewer
```

Relationships:

```txt
admin_users.auth_user_id -> Supabase auth.users.id
clients.assigned_to -> admin_users.id
```

### 8.2 `clients`

Every potential client/lead.

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

Statuses:

```txt
new
onboarding
needs_more_info
qualified
rejected
drive_created
pm_reviewed
completed
```

Relationships:

```txt
clients.id -> chat_sessions.client_id
clients.id -> chat_messages.client_id
clients.id -> client_requirements.client_id
clients.id -> uploaded_files.client_id
clients.id -> project_briefs.client_id
clients.id -> drive_logs.client_id
clients.id -> ai_usage_logs.client_id
clients.assigned_to -> admin_users.id
```

Important:

Client record can start as a placeholder. When user provides company/contact details, the same client record is updated.

### 8.3 `service_categories`

Services should be database-driven, not hardcoded.

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

Example records:

```txt
Mortgage Automation
Mortgage Website Development
Custom Mortgage Software
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

Relationships:

```txt
service_categories.id -> onboarding_fields.service_category_id
service_categories.id -> chat_sessions.service_category_id
service_categories.id -> chat_messages.service_category_id
service_categories.id -> client_requirements.service_category_id
service_categories.id -> knowledge_index.service_category_id
```

### 8.4 `onboarding_fields`

This is one of the most important tables because it keeps onboarding dynamic.

No hardcoded questions.

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

Field types:

```txt
text
email
phone
url
select
multi_select
boolean
textarea
file
date
number
```

Example for Mortgage Automation:

```json
{
  "field_key": "los_system",
  "label": "LOS System",
  "question_text": "Which LOS or CRM are you currently using",
  "field_type": "select",
  "options": ["Encompass", "BytePro", "MeridianLink", "Salesforce", "Other"],
  "is_required": true
}
```

Example for Mortgage Website:

```json
{
  "field_key": "needs_calculator",
  "label": "Mortgage Calculator Required",
  "question_text": "Do you need mortgage calculators on the website",
  "field_type": "boolean",
  "is_required": true
}
```

Relationships:

```txt
onboarding_fields.service_category_id -> service_categories.id
client_requirement_values.field_id -> onboarding_fields.id
```

### 8.5 `chat_sessions`

Every chatbot conversation session.

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

Session statuses:

```txt
active
waiting_for_user
needs_more_info
completed
abandoned
handoff_created
```

Current states:

```txt
new_session
greeting
relevance_check
service_detection
knowledge_answer
onboarding_started
collecting_basic_info
collecting_service_requirements
requesting_files
analyzing_files
checking_completeness
generating_summary
creating_drive_folder
completed
needs_human_followup
rejected_irrelevant
```

Relationships:

```txt
chat_sessions.id -> chat_messages.session_id
chat_sessions.id -> client_requirements.session_id
chat_sessions.id -> uploaded_files.session_id
chat_sessions.id -> project_briefs.session_id
chat_sessions.id -> rag_retrieval_logs.session_id
chat_sessions.id -> ai_usage_logs.session_id
chat_sessions.id -> drive_logs.session_id
```

### 8.6 `chat_messages`

Stores every user, assistant, system, and tool message.

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

Roles:

```txt
user
assistant
system
tool
```

Message types:

```txt
text
file
summary
system_event
error
```

Source types:

```txt
rule_engine
slm
llm
rag
drive
upload
system
```

Relationships:

```txt
chat_messages.session_id -> chat_sessions.id
chat_messages.client_id -> clients.id
chat_messages.service_category_id -> service_categories.id
ai_usage_logs.message_id -> chat_messages.id
rag_retrieval_logs.message_id -> chat_messages.id
uploaded_files.message_id -> chat_messages.id
```

### 8.7 `client_requirements`

Stores the overall requirement memory for a session.

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

Example `requirements_json`:

```json
{
  "company_name": "ABC Mortgage",
  "contact_name": "John Smith",
  "email": "john@abcmortgage.com",
  "service_type": "Mortgage Automation",
  "los_system": "Encompass",
  "workflow": "Loan status sync",
  "timeline": "6 weeks",
  "budget_range": "$15k-$50k",
  "uploaded_files": ["workflow.pdf"]
}
```

Relationships:

```txt
client_requirements.client_id -> clients.id
client_requirements.session_id -> chat_sessions.id
client_requirements.service_category_id -> service_categories.id
client_requirement_values.client_requirement_id -> client_requirements.id
```

### 8.8 `client_requirement_values`

Stores field-level requirement values.

This makes reporting, completeness score, and missing field detection much cleaner.

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

Use:

```txt
Dashboard field status
Completion score calculation
Missing items
Question progress
```

Relationships:

```txt
client_requirement_values.client_requirement_id -> client_requirements.id
client_requirement_values.field_id -> onboarding_fields.id
```

### 8.9 `uploaded_files`

Stores client uploaded assets/documents.

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
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Analysis statuses:

```txt
pending
skipped
analyzed
failed
```

Relationships:

```txt
uploaded_files.client_id -> clients.id
uploaded_files.session_id -> chat_sessions.id
uploaded_files.message_id -> chat_messages.id
drive_logs.file_id -> uploaded_files.drive_file_id
```

### 8.10 `project_briefs`

Final PM-ready AI brief.

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

Complexity levels:

```txt
low
medium
high
enterprise
```

Risk levels:

```txt
low
medium
high
unknown
```

### 8.11 `drive_logs`

Google Drive activity log.

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

Actions:

```txt
create_client_folder
create_subfolder
upload_file
create_project_brief
create_summary_file
create_requirements_json
```

---

## 9. RAG Database Tables

### 9.1 `website_json_sources`

Each page/post/service generated from sitemap + Playwright rendered extraction.

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
  review_status text default 'pending_review',
  extraction_warnings text[],
  skip_reason text,
  sync_enabled boolean default true,
  approved_for_rag boolean default false,
  approved_by uuid references admin_users(id),
  approved_at timestamp,
  disabled_reason text,
  needs_review boolean default false,
  last_synced_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Source types:

```txt
page
post
service
landing_page
case_study
resource
contact_page
```

Sync statuses:

```txt
pending
synced
skipped
failed
needs_review
```

Review statuses:

```txt
pending_review
approved
needs_review
skipped
disabled
```

Important:

```txt
approved_for_rag = true
```

Only approved content should be used by the chatbot.

Rules:

- `sync_status` describes extraction result.
- `review_status` describes admin/RAG readiness.
- `approved_for_rag = true` requires `review_status = approved`.
- `skipped` sources remain in the database for audit history but are not used by RAG.
- `extraction_warnings` should store values such as `LOW_WORD_COUNT`, `NO_HEADINGS`, `NO_VISIBLE_TEXT`, `TIMEOUT`, and `EXTRACTION_FAILED`.
- `skip_reason` explains why a URL is not useful for chatbot retrieval.
- `disabled_reason` explains why an approved source was later disabled.

### 9.2 `website_sections`

Page sections for section-level RAG.

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
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Section types:

```txt
hero
content_section
feature_section
faq_section
form_section
cta_section
testimonial_section
unknown
```

Relationships:

```txt
website_sections.source_id -> website_json_sources.id
rag_chunks.section_id -> website_sections.id
website_assets.section_id -> website_sections.id
website_buttons.section_id -> website_sections.id
website_forms.section_id -> website_sections.id
```

### 9.3 `website_assets`

Images/files found on pages.

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

Asset types:

```txt
image
video
pdf
download
icon
```

### 9.4 `website_buttons`

CTA buttons/links.

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

Button types:

```txt
cta
internal_link
external_link
phone
email
download
```

### 9.5 `website_forms`

Forms found on pages.

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

Form types:

```txt
contact_form_7
gravity_form
hubspot
custom_form
unknown_form
```

### 9.6 `knowledge_index`

Fast RAG index.

```sql
create table knowledge_index (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
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
  review_status text default 'pending_review',
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Use:

```txt
Match user query to relevant page/source.
```

Important:

```txt
knowledge_index.is_active = true
knowledge_index.approved_for_rag = true
website_json_sources.approved_for_rag = true
```

All three conditions must be true before a source is eligible for chatbot RAG.

### 9.7 `rag_chunks`

Production RAG chunks.

```sql
create table rag_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references website_json_sources(id),
  section_id uuid references website_sections(id),
  chunk_title text,
  chunk_text text,
  chunk_type text,
  keywords text[],
  token_estimate integer,
  embedding vector,
  metadata jsonb,
  is_active boolean default true,
  approved_for_rag boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Important:

If embeddings are not used in the first build, keep `embedding` nullable.

Start with keyword/hybrid RAG.

Later add Supabase pgvector.

Chunk types:

```txt
service_info
faq
feature
form_info
cta
general_content
```

### 9.8 `rag_retrieval_logs`

Every RAG retrieval attempt.

```sql
create table rag_retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id),
  message_id uuid references chat_messages(id),
  query text,
  selected_source_id uuid references website_json_sources(id),
  selected_chunk_ids jsonb,
  retrieval_method text,
  score numeric,
  context_tokens integer,
  created_at timestamp default now()
);
```

### 9.9 RAG Approval Rules

The chatbot must never use raw synced website content automatically.

Approval flow:

```txt
sync source
-> generate JSON
-> generate extraction report
-> mark ok / needs_review / skipped
-> admin reviews source
-> admin approves source for RAG
-> source becomes eligible for chatbot answers
```

Eligibility rules:

```txt
website_json_sources.approved_for_rag = true
knowledge_index.approved_for_rag = true
knowledge_index.is_active = true
rag_chunks.approved_for_rag = true
```

If a source has `review_status = needs_review`, the chatbot can show it in the admin dashboard but must not use it in customer-facing answers.

If a source has `review_status = skipped`, keep it for audit history but exclude it from:

- knowledge search
- chunk search
- chatbot context
- project brief generation

### 9.10 Required RAG Indexes

Add indexes before production launch:

```sql
create index idx_website_json_sources_url on website_json_sources(url);
create index idx_website_json_sources_slug on website_json_sources(slug);
create index idx_website_json_sources_review_status on website_json_sources(review_status);
create index idx_website_json_sources_approved on website_json_sources(approved_for_rag);
create index idx_website_json_sources_service_text on website_json_sources using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(full_text, '')));

create index idx_website_sections_source_id on website_sections(source_id);
create index idx_website_sections_text on website_sections using gin(to_tsvector('english', coalesce(section_title, '') || ' ' || coalesce(content, '')));

create index idx_knowledge_index_source_id on knowledge_index(source_id);
create index idx_knowledge_index_service_category_id on knowledge_index(service_category_id);
create index idx_knowledge_index_active_approved on knowledge_index(is_active, approved_for_rag);
create index idx_knowledge_index_text on knowledge_index using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '')));

create index idx_rag_chunks_source_id on rag_chunks(source_id);
create index idx_rag_chunks_section_id on rag_chunks(section_id);
create index idx_rag_chunks_active_approved on rag_chunks(is_active, approved_for_rag);
create index idx_rag_chunks_text on rag_chunks using gin(to_tsvector('english', coalesce(chunk_title, '') || ' ' || coalesce(chunk_text, '')));
```

If pgvector is enabled later:

```sql
create index idx_rag_chunks_embedding on rag_chunks using ivfflat (embedding vector_cosine_ops);
```

Retrieval methods:

```txt
keyword_index
section_keyword
embedding
hybrid
manual
```

---

## 10. AI & Cost Tables

### 10.1 `model_settings`

Models should be configurable from DB.

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

Task types:

```txt
intent_detection
relevance_check
rag_answer
onboarding_question
requirement_extraction
file_summary
project_brief
```

Model layers:

```txt
rule
slm
llm
```

### 10.2 `ai_usage_logs`

Every AI call.

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

### 10.3 `prompt_templates`

Prompts should not be hardcoded.

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

Examples:

```txt
intent_classifier_prompt
rag_answer_prompt
onboarding_next_question_prompt
requirement_extraction_prompt
project_brief_prompt
file_summary_prompt
```

---

## 11. Sync & Webhook Tables

### 11.1 `sync_jobs`

Website sync runs.

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

Sync types:

```txt
manual
scheduled
webhook
sitemap
single_url
```

### 11.2 `sync_job_items`

Every URL/page sync result.

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

### 11.3 `webhook_events`

WordPress update events.

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

Event types:

```txt
post_created
post_updated
post_deleted
post_published
post_unpublished
```

---

## 12. System Settings

### 12.1 `system_settings`

System config should come from DB.

```sql
create table system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique,
  setting_value jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

Examples:

```txt
company_name
drive_root_folder_id
max_file_upload_size
allowed_file_types
enable_auto_drive_creation
enable_wordpress_sync
default_theme_color
logo_path
chatbot_fallback_message
default_language
```

---

## 13. Complete Table Relationship Map

```txt
admin_users
  `-- clients.assigned_to

clients
  |-- chat_sessions
  |-- chat_messages
  |-- client_requirements
  |-- uploaded_files
  |-- project_briefs
  |-- drive_logs
  `-- ai_usage_logs

chat_sessions
  |-- chat_messages
  |-- client_requirements
  |-- uploaded_files
  |-- project_briefs
  |-- rag_retrieval_logs
  |-- ai_usage_logs
  `-- drive_logs

service_categories
  |-- onboarding_fields
  |-- chat_sessions
  |-- chat_messages
  |-- client_requirements
  `-- knowledge_index

onboarding_fields
  `-- client_requirement_values

client_requirements
  `-- client_requirement_values

website_json_sources
  |-- website_sections
  |-- website_assets
  |-- website_buttons
  |-- website_forms
  |-- knowledge_index
  |-- rag_chunks
  `-- rag_retrieval_logs

website_sections
  |-- website_assets
  |-- website_buttons
  |-- website_forms
  `-- rag_chunks

chat_messages
  |-- ai_usage_logs
  |-- rag_retrieval_logs
  `-- uploaded_files

sync_jobs
  `-- sync_job_items
```

---

## 14. Production Chatbot Flow With DB Writes

### Step 1: Session Start

User opens chatbot.

System:

```txt
1. Create client placeholder.
2. Create chat_session.
3. Insert assistant greeting in chat_messages.
```

DB writes:

```txt
clients
chat_sessions
chat_messages
```

State:

```txt
chat_sessions.current_state = greeting
```

### Step 2: User Sends Message

User:

```txt
I need mortgage automation.
```

System:

```txt
1. Insert user message in chat_messages.
2. Run rule engine.
3. If unclear, run SLM intent detection.
4. Save AI usage log if SLM used.
```

DB writes:

```txt
chat_messages
ai_usage_logs
```

### Step 3: Intent & Service Detection

SLM output:

```json
{
  "intent": "client_onboarding",
  "service_category": "mortgage_automation",
  "confidence": 0.94
}
```

System:

```txt
1. Match service_category with service_categories table.
2. Update chat_sessions.service_category_id.
3. Update chat_sessions.current_state.
```

DB writes:

```txt
chat_sessions
chat_messages.metadata
```

### Step 4: RAG Retrieval

System:

```txt
1. Search knowledge_index by query.
2. Find matching website_json_sources.
3. Optionally search rag_chunks.
4. Build RAG context.
5. Log retrieval.
```

DB reads:

```txt
knowledge_index
website_json_sources
website_sections
rag_chunks
```

DB writes:

```txt
rag_retrieval_logs
```

### Step 5: Generate Bot Response

LLM input:

```txt
User message
Current session state
Requirement memory
Relevant RAG context
Available onboarding fields from DB
```

LLM output:

```txt
Which LOS or CRM are you currently using
```

DB writes:

```txt
chat_messages
ai_usage_logs
```

### Step 6: Requirement Extraction

User answers:

```txt
We use Encompass.
```

System:

```txt
1. Detect field: los_system.
2. Save value in client_requirements.requirements_json.
3. Save field-level value in client_requirement_values.
4. Recalculate completion score.
5. Update missing fields.
```

DB writes:

```txt
client_requirements
client_requirement_values
chat_sessions
```

### Step 7: Next Question Selection

System:

```txt
1. Load onboarding_fields for selected service.
2. Check which required fields are missing.
3. Pick next highest priority missing field.
4. Ask next question.
```

DB reads:

```txt
onboarding_fields
client_requirement_values
client_requirements
```

DB writes:

```txt
chat_messages
```

Important:

```txt
Questions come from DB, not hardcoded.
```

### Step 8: File Request

When required file-type fields are missing:

Bot:

```txt
Please upload your workflow document, screenshots, or API documentation if available.
```

DB reads:

```txt
onboarding_fields where field_type = file
```

### Step 9: File Upload

User uploads file.

System:

```txt
1. Upload file to Supabase Storage.
2. Insert file metadata.
3. Link file to session and client.
4. If document, mark analysis_status = pending.
```

DB writes:

```txt
uploaded_files
chat_messages
```

### Step 10: File Analysis

Background process:

```txt
1. Extract text if PDF/DOCX/TXT.
2. Use LLM to summarize.
3. Save extracted_text and analysis_summary.
4. Add extracted requirements if found.
```

DB writes:

```txt
uploaded_files
client_requirements
client_requirement_values
ai_usage_logs
```

### Step 11: Completeness Check

System:

```txt
1. Count required fields.
2. Count completed fields.
3. Calculate score.
4. Update missing_fields_json.
```

Example:

```txt
Required: 10
Completed: 8
Score: 80%
```

DB writes:

```txt
client_requirements.completion_score
client_requirements.missing_fields_json
```

### Step 12: Final Confirmation

If completion score is acceptable:

Bot:

```txt
I have enough information to prepare your onboarding package. Would you like me to generate the project brief now
```

DB update:

```txt
chat_sessions.current_state = checking_completeness
```

### Step 13: Project Brief Generation

System:

```txt
1. Load client.
2. Load requirements.
3. Load uploaded file summaries.
4. Load relevant RAG service context.
5. Generate PM-ready project brief.
6. Save brief.
```

DB reads:

```txt
clients
client_requirements
uploaded_files
website_json_sources
rag_chunks
chat_messages
```

DB writes:

```txt
project_briefs
ai_usage_logs
chat_messages
```

### Step 14: Google Drive Handoff

System:

```txt
1. Create client folder.
2. Create subfolders.
3. Upload client files.
4. Create project brief file.
5. Create conversation summary file.
6. Create requirements JSON file.
7. Save Drive links.
```

DB writes:

```txt
clients.drive_folder_id
clients.drive_folder_url
uploaded_files.drive_file_id
uploaded_files.drive_file_url
project_briefs.drive_file_id
project_briefs.drive_file_url
drive_logs
```

### Step 15: PM Dashboard

PM sees new lead.

Dashboard reads:

```txt
clients
chat_sessions
client_requirements
uploaded_files
project_briefs
drive_logs
```

PM can:

```txt
View conversation
View extracted requirements
Open Drive folder
Assign PM
Change status
Mark as reviewed
```

---

## 15. Chat API Internal Flow

### `POST /api/chat/message`

Input:

```json
{
  "sessionId": "uuid",
  "message": "I need mortgage automation"
}
```

Internal flow:

```txt
1. Validate session.
2. Save user message.
3. Run rule engine.
4. If irrelevant, return redirect response.
5. Run SLM classifier if needed.
6. Update session intent/service.
7. Retrieve RAG context if needed.
8. Load requirement memory.
9. Load onboarding fields.
10. Generate response.
11. Extract/update requirements.
12. Calculate next state.
13. Save assistant message.
14. Save AI usage logs.
15. Return response.
```

Output:

```json
{
  "reply": "Which LOS or CRM are you currently using",
  "sessionId": "uuid",
  "state": "collecting_service_requirements",
  "intent": "client_onboarding",
  "service_category": "mortgage_automation",
  "completion_score": 30,
  "missing_fields": ["los_system", "workflow", "timeline"],
  "source": "llm",
  "rag_used": true
}
```

---

## 16. RAG Pipeline To DB

### Sync Source

Production source:

```txt
Yoast sitemap
+
Playwright rendered HTML
+
WordPress webhook updates
```

Flow:

```txt
Sitemap URLs
->
Playwright render page
->
Extract final visible content
->
Generate structured JSON
->
Save to website_json_sources
->
Save sections to website_sections
->
Save images/buttons/forms
->
Create knowledge_index record
->
Create rag_chunks
->
Approve for RAG
```

### Chatbot RAG Flow

```txt
User question
->
Search knowledge_index
->
Find relevant website_json_sources
->
Find relevant website_sections/rag_chunks
->
Build short context
->
Send context to LLM
->
Answer user
```

RAG context should include:

```txt
Page title
Page summary
Relevant section titles
Relevant section content
Forms if needed
Buttons/CTA if needed
Source URL
```

---

## 17. Dynamic Onboarding Flow

### Source of Questions

Questions come from:

```txt
service_categories
onboarding_fields
prompt_templates
```

Not from hardcoded code.

### Example: Mortgage Automation

`service_categories`:

```txt
Mortgage Automation
```

`onboarding_fields`:

```txt
los_system
workflow_to_automate
current_manual_steps
api_docs_available
number_of_users
timeline
budget_range
uploaded_workflow_docs
```

Bot asks one question at a time based on missing required fields.

### Example Flow

```txt
User: I need mortgage automation.
Bot: Which LOS or CRM are you currently using
User: Encompass.
Bot: What workflow are you trying to automate
User: Loan status sync.
Bot: Do you have API documentation or screenshots of the current workflow
```

---

## 18. File Upload Flow

### `POST /api/chat/upload`

Input:

```txt
sessionId
clientId
file
```

Internal flow:

```txt
1. Validate session.
2. Validate file type and size.
3. Upload to Supabase Storage.
4. Insert uploaded_files row.
5. Insert chat_messages row with message_type = file.
6. If file is analyzable, enqueue file analysis.
7. Return uploaded file metadata.
```

Allowed files come from:

```txt
system_settings.allowed_file_types
system_settings.max_file_upload_size
```

---

## 19. Project Brief Generation Flow

### `POST /api/chat/complete`

Input:

```json
{
  "sessionId": "uuid"
}
```

Internal flow:

```txt
1. Load client.
2. Load session.
3. Load chat history.
4. Load client requirements.
5. Load uploaded file summaries.
6. Load relevant RAG service context.
7. Load project_brief_prompt from prompt_templates.
8. Use LLM to generate PM-ready brief.
9. Save brief in project_briefs.
10. Create Google Drive handoff if enabled.
11. Save assistant completion message.
12. Update session and client status.
```

---

## 20. Admin Dashboard Pages

### 20.1 Dashboard Home

Cards:

```txt
Total Leads
New Leads
Qualified Leads
Needs More Info
Completed Onboarding
AI Briefs Generated
Drive Folders Created
Estimated AI Cost
```

### 20.2 Clients Page

Table columns:

```txt
Client
Email
Service
Status
Completion %
Files
Created Date
Assigned PM
Drive Link
```

Actions:

```txt
View
Assign PM
Change Status
Open Drive Folder
```

### 20.3 Client Detail Page

Sections:

```txt
Client Information
Conversation Timeline
Extracted Requirements
Field-Level Requirements
Missing Information
Uploaded Files
File Summaries
AI Project Brief
Google Drive Folder
Internal Notes
AI Routing Logs
RAG Retrieval Logs
```

### 20.4 Knowledge Page

Shows:

```txt
Synced pages
Synced posts
Synced services
JSON status
Word count
Headings count
Last synced date
Sync status
Approved for RAG
Needs review
```

Actions:

```txt
Sync All
Sync Single URL
View JSON
View Sections
View Chunks
Approve for RAG
Disable from RAG
Regenerate JSON
```

### 20.5 Onboarding Fields Page

Purpose:

Manage dynamic onboarding questions.

Fields:

```txt
Service Category
Field Key
Question Text
Field Type
Options
Required
Order
Active/Inactive
```

### 20.6 AI Usage Page

Shows:

```txt
Rule engine responses
SLM calls
LLM calls
RAG answers
Estimated cost
Tokens used
Model routing reasons
Failed AI calls
```

### 20.7 Settings Page

Sections:

```txt
AI Providers
Model Settings
Prompt Templates
Google Drive Settings
Website Sync Settings
File Upload Settings
Chatbot Behavior
Admin Users
Theme Settings
Logo Settings
```

---

## 21. API Routes

### Chat APIs

```txt
POST /api/chat/start
POST /api/chat/message
POST /api/chat/upload
POST /api/chat/complete
GET  /api/chat/session/:id
```

### Knowledge / RAG APIs

```txt
POST /api/sync/sitemap
POST /api/sync/single-url
POST /api/webhooks/wordpress-content-updated
GET  /api/knowledge/sources
GET  /api/knowledge/source/:id
PATCH /api/knowledge/source/:id
POST /api/knowledge/source/:id/approve
GET  /api/knowledge/chunks/:sourceId
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

## 22. Project File Structure

```txt
/app
  /chat
    page.tsx
  /admin
    /login
      page.tsx
    /dashboard
      page.tsx
    /clients
      page.tsx
    /clients/[id]
      page.tsx
    /knowledge
      page.tsx
    /knowledge/[id]
      page.tsx
    /onboarding-fields
      page.tsx
    /sync
      page.tsx
    /usage
      page.tsx
    /settings
      page.tsx
  /api
    /chat/start
      route.ts
    /chat/message
      route.ts
    /chat/upload
      route.ts
    /chat/complete
      route.ts
    /sync/sitemap
      route.ts
    /sync/single-url
      route.ts
    /webhooks/wordpress-content-updated
      route.ts
    /knowledge/sources
      route.ts
    /knowledge/source/[id]
      route.ts
    /drive/create-client-folder
      route.ts
    /drive/upload-file
      route.ts
    /admin/clients
      route.ts
    /admin/dashboard
      route.ts

/components
  /chat
    ChatBox.tsx
    ChatMessage.tsx
    FileUpload.tsx
    TypingIndicator.tsx
    SuggestedPrompts.tsx
  /admin
    AdminSidebar.tsx
    DashboardCards.tsx
    ClientTable.tsx
    ClientDetail.tsx
    KnowledgeTable.tsx
    JsonViewer.tsx
    UsageTable.tsx
    OnboardingFieldsTable.tsx
  /shared
    Button.tsx
    Input.tsx
    Modal.tsx
    Badge.tsx
    Logo.tsx

/lib
  /ai
    router.ts
    ruleEngine.ts
    slmClassifier.ts
    llmProvider.ts
    prompts.ts
    costTracker.ts
    requirementExtractor.ts
    summaryGenerator.ts
  /rag
    retrieveRelevantSources.ts
    retrieveRelevantChunks.ts
    buildRagContext.ts
    generateRagAnswer.ts
    logRagRetrieval.ts
  /sync
    fetchSitemap.ts
    renderWithPlaywright.ts
    extractRenderedContent.ts
    generateWebsiteJson.ts
    saveKnowledgeToDb.ts
    syncSingleUrl.ts
  /onboarding
    stateMachine.ts
    loadOnboardingFields.ts
    updateRequirementMemory.ts
    calculateCompletionScore.ts
    getNextQuestion.ts
  /drive
    googleDriveClient.ts
    createClientFolder.ts
    uploadFile.ts
    createTextFile.ts
  /supabase
    client.ts
    admin.ts
  /utils
    hashContent.ts
    sanitizeFileName.ts
    estimateTokens.ts
    validateFile.ts

/public
  /assets
    /logo
      logo.png

/types
  client.ts
  chat.ts
  ai.ts
  rag.ts
  sync.ts
  drive.ts
  database.ts
  onboarding.ts
```

---

## 23. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

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

## 24. No Static Data Rule

These items must come from DB, not hardcoded:

```txt
Service categories
Onboarding questions
Required fields
Model settings
Prompt templates
Theme settings
Logo path
RAG knowledge
File upload settings
Google Drive root folder
Chatbot fallback messages
Website sync settings
```

Hardcoded allowed:

```txt
Basic enum fallback values
Critical safety fallback
Default empty states
Emergency fallback response
```

---

## 25. Implementation Hardening Requirements

These are required before production launch.

### 25.1 Database Constraints

Every status-like field should have a database `check` constraint or a controlled enum table.

Examples:

```sql
alter table admin_users
add constraint admin_users_role_check
check (role in ('admin', 'project_manager', 'sales', 'viewer'));

alter table clients
add constraint clients_status_check
check (status in ('new', 'onboarding', 'needs_more_info', 'qualified', 'rejected', 'drive_created', 'pm_reviewed', 'completed'));

alter table website_json_sources
add constraint website_json_sources_review_status_check
check (review_status in ('pending_review', 'approved', 'needs_review', 'skipped', 'disabled'));
```

Required constraints:

- Unique `website_json_sources.url`.
- Unique `service_categories.slug`.
- Unique `prompt_templates.name`.
- Unique active onboarding field per service and `field_key`.
- Foreign keys for all relationship columns.
- `not null` on required business fields.
- `created_at` and `updated_at` defaults.
- `updated_at` trigger on mutable tables.

### 25.2 Required Indexes

Create indexes for:

- All foreign keys.
- All frequently filtered status fields.
- `clients.email`.
- `chat_sessions.client_id`.
- `chat_messages.session_id`.
- `client_requirements.session_id`.
- `uploaded_files.session_id`.
- `website_json_sources.url`.
- `website_json_sources.slug`.
- `knowledge_index.source_id`.
- `rag_chunks.source_id`.
- Full-text search over website titles, summaries, sections, and chunks.

### 25.3 Supabase RLS Rules

RLS must be enabled on production tables.

Minimum rules:

- Public users can only create or read their own active chat session through controlled API routes.
- Admin dashboard reads require authenticated admin user.
- Admin mutations require role checks.
- Service role key is only used server-side.
- Uploaded files are scoped to the correct `client_id` and `session_id`.
- RAG approval actions require `admin` or `project_manager`.

Do not expose raw Supabase service-role access to the browser.

### 25.4 AI JSON Contracts

Every AI classification or extraction call must return strict JSON that is validated before use.

Relevance classification:

```json
{
  "is_relevant": true,
  "reason": "User is asking about AwesomeTech services.",
  "confidence": 0.92
}
```

Intent and service detection:

```json
{
  "intent": "client_onboarding",
  "service_category_slug": "mortgage_automation",
  "confidence": 0.94,
  "requires_rag": true
}
```

Requirement extraction:

```json
{
  "field_values": [
    {
      "field_key": "los_system",
      "value": "Encompass",
      "confidence": 0.96
    }
  ],
  "missing_fields": ["workflow_to_automate", "timeline"],
  "completion_score": 25
}
```

RAG answer generation:

```json
{
  "answer": "Yes. AwesomeTech provides mortgage website development services...",
  "source_urls": ["https://awesometechinc.com/mortgage-website-development-services/"],
  "confidence": 0.88,
  "needs_human_followup": false
}
```

Project brief generation:

```json
{
  "brief_title": "Mortgage Automation Project Brief",
  "summary": "Client needs Encompass workflow automation...",
  "requirements": {},
  "recommended_services": [],
  "missing_information": [],
  "complexity_level": "medium",
  "risk_level": "low",
  "next_step": "PM review"
}
```

If JSON validation fails:

- Save the raw model output in an error log.
- Do not update requirement memory.
- Ask a safe clarification question or escalate to human follow-up.

### 25.5 Google Drive Idempotency

Drive operations must be retry-safe.

Rules:

- Check whether the client folder already exists before creating a new one.
- Store IDs for every created folder and file.
- Use deterministic subfolder names.
- Do not create duplicate Drive folders on retry.
- Save every Drive attempt in `drive_logs`.
- Allow admin retry from dashboard.

Recommended folder metadata to store:

```json
{
  "root_folder_id": "...",
  "client_folder_id": "...",
  "uploaded_files_folder_id": "...",
  "brief_folder_id": "...",
  "internal_notes_folder_id": "...",
  "conversation_summary_folder_id": "...",
  "requirements_folder_id": "..."
}
```

### 25.6 Current POC Import Requirement

The current local files should be treated as the seed source for Phase 1:

```txt
data/generated/pages/*.json
data/generated/posts/*.json
data/generated/knowledge-index.json
data/generated/extraction-report.json
```

Production import should:

- Upsert by URL.
- Preserve `status`, `warnings`, and `skip_reason`.
- Import sections, images, buttons, forms, and links.
- Create knowledge index records only for non-skipped sources.
- Create chunks only for approved or reviewable content.
- Never mark sources approved automatically.

---

## 26. Production Safety

Important safeguards:

```txt
Do not expose API keys.
Do not send private files to the wrong client folder.
Do not use unapproved RAG sources.
Do not rely on one AI model only.
Do not lose chat messages if AI fails.
Do not block onboarding if Drive fails.
Do not render raw unsafe HTML.
Do not use LLM for every irrelevant message.
Do not guess company services if RAG has no answer.
```

Failure handling:

If LLM fails:

```txt
Save user message.
Return fallback.
Mark session as needs_human_followup.
```

If Drive fails:

```txt
Keep Supabase files.
Mark Drive sync as failed.
Admin can retry.
```

If RAG retrieval fails:

```txt
Bot says it can collect requirement and pass it to the team.
Do not guess company services.
```

---

## 27. Security Requirements

```txt
Admin dashboard must be protected by login.
Supabase RLS should be enabled.
Service role key must only be used server-side.
Google private key must only be used server-side.
File upload validation is required.
Only allowed file types should be accepted.
File size limit should be enforced.
User input should be sanitized.
Raw WordPress HTML must not be rendered without sanitization.
AI prompts must not expose secrets.
Uploaded files should be linked only to correct client/session.
Drive links should be stored securely.
Webhook secret must be verified.
Only approved RAG content should be used by chatbot.
```

---

## 28. Logging Requirements

Log:

```txt
User messages
Bot messages
AI model used
Routing decision
RAG source used
RAG chunk used
Token estimate
Estimated cost
File uploads
Drive actions
Sync actions
Webhook events
Errors
Completion score updates
Requirement extraction updates
```

---

## 29. Final Production Build Order

```txt
1. Supabase schema with relationships
2. Seed service_categories
3. Seed onboarding_fields
4. Seed model_settings
5. Seed prompt_templates
6. Build chat UI
7. Build session creation
8. Build chat message API
9. Build rule engine
10. Build SLM classifier
11. Build RAG DB tables
12. Import existing generated JSON into DB
13. Build RAG retrieval
14. Build onboarding state machine
15. Build requirement extractor
16. Build completion score engine
17. Build file upload
18. Build project brief generator
19. Build Google Drive handoff
20. Build admin dashboard
21. Build sync webhook
22. Build usage/cost dashboard
23. Production error handling
24. Final testing
```

---

## 30. Final Demo Flow

Demo should show:

```txt
1. Admin logs in.
2. Admin syncs AwesomeTech sitemap/pages.
3. System generates clean JSON and DB records.
4. Admin views generated JSON/sections/chunks.
5. Admin approves source for RAG.
6. User opens chatbot.
7. User asks service question.
8. Bot answers using RAG context.
9. User asks irrelevant question.
10. Bot rejects without expensive AI.
11. User starts onboarding.
12. Bot asks DB-driven service-specific questions.
13. User uploads file.
14. Bot extracts/summarizes requirements.
15. Bot calculates completion score.
16. Bot generates project brief.
17. System creates Google Drive folder.
18. Dashboard shows new lead.
19. Admin opens lead detail.
20. Admin opens Drive folder.
21. Usage dashboard shows rule/SLM/LLM routing.
```

---

## 31. Manager Explanation

Awesome Genie is a production-level AI chatbot for AwesomeTech client onboarding.

It uses:

```txt
Rule engine for irrelevant questions
SLM for cheap classification and routing
JSON/section-based RAG for AwesomeTech website knowledge
LLM for onboarding conversation and project brief generation
Google Drive API for client handoff
Admin dashboard for PM review
Database-driven onboarding fields
Model/prompt settings from DB
Usage and cost logging
```

The system syncs AwesomeTech website content using sitemap and Playwright rendered extraction, converts each page/post into structured database records, builds a knowledge index, creates section-level RAG chunks, and retrieves only relevant context for each user query.

This keeps chatbot answers accurate, reduces token cost, avoids hallucination, and makes the system easier to update when website content changes.

---

## 32. Short Explanation

Awesome Genie is an AI chatbot that helps AwesomeTech onboard clients.

It answers service questions from AwesomeTech website data, filters irrelevant questions, collects project requirements, accepts file uploads, generates a project brief, creates a Google Drive folder, and gives the project manager a ready-to-review lead.

---

## 33. Most Important Development Principle

Do not build a simple chatbot wrapper.

Build a complete AI onboarding system where:

```txt
Data is structured
Website knowledge is synced
AI routing is controlled
Cost is tracked
Irrelevant questions are blocked
RAG is used for company knowledge
LLM is used only where needed
Client handoff is automated
Everything configurable comes from DB
```
