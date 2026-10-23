# Awesome Genie Phase Status

Last updated: June 5, 2026

## Phase 0: Local WordPress RAG Proof of Concept

Status: Complete

Completed:
- WordPress page and post sync scripts.
- Sitemap extraction flow.
- Local JSON generation under `data/generated`.
- Cleaned page/post content extraction.
- `knowledge-index.json` generation.
- Local RAG helper functions.
- Extraction report with quality status.
- `npm run sync:wordpress`.
- `npm run test:rag`.

Remaining:
- None for the proof-of-concept scope.

## Phase 1: Supabase Foundation

Status: Complete

Completed:
- Supabase schema migration.
- Seed data for service categories and onboarding fields.
- Admin user bootstrap script.
- Supabase connection check script.
- Knowledge import into Supabase.
- Website sources, sections, RAG chunks, and knowledge index import.
- RAG approval flags.
- Admin login flow.
- Protected admin layout.
- Dashboard backed by Supabase/local extraction stats.

Remaining:
- Production RLS policy hardening before public launch.
- Final production admin/user role review.

## Phase 2: Chat Widget and Approved RAG

Status: Complete

Completed:
- Floating chatbot widget.
- Website preview page.
- Chat session start API.
- Chat message API.
- Approved-only RAG retrieval.
- Topic-aware retrieval filtering.
- Chat logs saved in Supabase.
- AI usage logs.
- RAG source metadata saved for admin audit.
- Customer-facing source links removed.
- Smart routing foundation for no-model, SLM, and LLM paths.
- Enter-to-send behavior in chat input.
- Context-aware quick reply chips.

Remaining:
- Real embeddable `/widget.js` script for external websites.
- Domain-specific embed configuration.
- File upload UI wiring.

## Phase 3: Dynamic Client Onboarding

Status: In Progress, mostly implemented

Completed:
- Central Awesome Genie behavior policy.
- Sales-style chat tone rules.
- Internal terms hidden from customers.
- Service detection.
- Multi-service session support.
- Requirement memory per session.
- Client lead creation.
- Requirement value storage.
- Completion scoring.
- Direct-answer mapping for short replies.
- Full intake fields seeded to Supabase.
- Phone number capture.
- Project overview capture.
- Current system capture.
- Workflow/project goal capture.
- Pain points capture.
- Success goals capture.
- Content/assets capture.
- Timeline and budget capture.
- Context-aware suggested replies per field.
- Admin clients list.
- Client requirement detail page.

Remaining:
- More robust free-text extraction for messy customer messages.
- Optional SLM-based requirement extraction when rules are not enough.
- File upload parsing into requirements.
- Better “That’s all” finalization behavior.
- Admin PM review actions after Drive handoff.

## Phase 4: Google Drive Handoff

Status: Started

Completed:
- Google Drive handoff service.
- Service-account JWT auth flow.
- Drive folder creation.
- `project-brief.md` generation.
- `requirements.json` generation.
- `chat-transcript.txt` generation.
- Supabase updates for `drive_folder_id`, `drive_folder_url`, and `drive_created` status.
- `project_briefs` insert.
- `drive_logs` logging.
- Chat-safe failure handling if Drive fails.

Remaining:
- Verify production Google Drive permissions.
- Add admin button to manually regenerate Drive handoff.
- Add Drive handoff status to client detail page.
- Add uploaded file forwarding to Drive.
- Improve project brief with AI-generated PM summary when paid/free model is available.

## Phase 5: Admin Review and PM Workflow

Status: Pending

Completed:
- Basic client and requirement review pages exist.
- Requirement values are visible in admin.

Remaining:
- PM review queue.
- Assign lead to admin/PM.
- Mark requirement as reviewed.
- Add notes and internal comments.
- Convert lead to project.
- Export/download handoff package.
- Manual approval before customer follow-up.

## Phase 6: AI Cost, Routing, and Observability

Status: Partially implemented

Completed:
- `AI_ENABLE_PAID_CALLS` switch.
- No-model route for onboarding and irrelevant messages.
- SLM route for normal relevant RAG answers.
- LLM route reserved for complex technical questions and PM summaries.
- Provider fallback order.
- Token and estimated cost logging.
- AI usage logs in Supabase.

Remaining:
- Provider/model settings editable from admin dashboard.
- Hard daily/session spend caps if needed later.
- Free-tier model configuration guide.
- Admin AI cost dashboard.
- Alerts for provider failures.

## Phase 7: Production Embed and Website Launch

Status: Pending

Completed:
- Chat widget UI exists inside the app.
- Dynamic embed snippet preview uses current host.

Remaining:
- Create real `/widget.js` loader.
- Support customer website domain configuration.
- Cross-origin-safe widget mount.
- Theme/config options per site.
- Production privacy and consent copy.
- Rate limiting and abuse protection.
- Production deployment env review.

## Phase 8: Post-Launch Enhancements

Status: Pending

Planned:
- Uploaded file analysis.
- Better document parsing.
- AI-generated PM brief.
- Lead scoring.
- CRM integration.
- Email notifications.
- Slack/Teams notifications.
- WordPress webhook sync.
- Knowledge source reapproval workflow after content changes.
- Multilingual support if needed.

## Current Next Best Steps

Recommended order:

1. Verify Google Drive service account permissions in production.
2. Add Drive handoff status and links to the admin client detail page.
3. Add manual “Create/Regenerate Drive Handoff” admin action.
4. Implement real embeddable `/widget.js`.
5. Add file upload support and send uploaded files to Drive.
6. Add optional free-tier SLM extraction for messy onboarding answers.
