# Awesome Genie

Production-level AI client onboarding chatbot for AwesomeTech.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Fill API keys in `.env.local`.

For the current local UI and JSON RAG preview, no AI keys are required yet. These are needed in later phases:

- Supabase keys: database and dashboard data
- AI provider keys: chat classification, RAG answer generation, project briefs
- Google Drive keys: final client handoff folders
- WordPress webhook secret: production webhook sync

4. Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
http://localhost:3000/admin/dashboard
http://localhost:3000/admin/knowledge
http://localhost:3000/chat
```

## Current POC Scripts

```bash
npm run sync:sitemap
npm run test:rag
```

Generated files:

```txt
data/generated/pages/
data/generated/posts/
data/generated/knowledge-index.json
data/generated/extraction-report.json
```

## Phase 1 Supabase Setup

1. Apply the database schema in Supabase SQL editor:

```txt
supabase/migrations/0001_initial_schema.sql
```

2. Apply seed data:

```txt
supabase/seed.sql
```

3. Verify the connection:

```bash
npm run supabase:check
```

4. Import generated website knowledge into Supabase:

```bash
npm run import:knowledge
```

5. Create the first dashboard admin:

```env
SUPABASE_ADMIN_EMAIL=admin@awesometechinc.com
SUPABASE_ADMIN_PASSWORD=replace-with-a-strong-password
```

```bash
npm run admin:bootstrap
```

Imported knowledge stays unapproved for RAG by default. The dashboard review step must approve sources before the production chatbot should use them.

## Phase 2 Chat API

```txt
POST /api/chat/start
POST /api/chat/message
GET  /api/chat/session/{id}
```

The chat endpoint retrieves only rows where approved RAG flags are enabled. If no approved source matches, the widget returns a safe fallback instead of guessing.

After approving core sources in `/admin/knowledge`, run:

```bash
npm run test:chat
```

## Phase 3 Onboarding Memory

```bash
npm run test:onboarding
```

This sends a short multi-turn project request, updates `client_requirements`, stores field-level values in `client_requirement_values`, and reports the completion score.
