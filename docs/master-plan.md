Based on all the provided documents for the Hassaniya Translation Manager, here is a complete and well-structured Master Plan that breaks down the project into incremental phases with clear tasks for both backend and frontend teams.

---

Hassaniya Translation Manager – Master Plan

Version: 1.0 – Août 2026
Document de pilotage du projet – Équipes backend & frontend

---

1. Overview

1.1 Project Vision

Hassaniya Translation Manager is a lightweight web application that enables users to:

· Add Arabic sentences in bulk
· Translate them manually into Hassaniya
· Track translation progress via dashboard
· Export translated data as JSONL to Hugging Face Hub

1.2 Key Principles

Principle Description
Incremental Delivery Each phase adds value independently; early phases are usable
Backend-First API contract is the source of truth; frontend consumes it
Parallel Work Backend and frontend teams work simultaneously on agreed phases
Safe Rollback Each phase is deployable independently; rollback at phase level

1.3 MVP Scope

Minimum Viable Product (V1):

· Add Arabic sentences (batch + single)
· View sentence list with filters (status, exported, search)
· Add/update Hassaniya translations
· Dashboard with statistics
· Export to Hugging Face (preview + full export)
· Download dataset as JSONL
· No authentication (single user, internal use)

1.4 V2 Scope (Future)

· Multi-user authentication (JWT)
· User roles and permissions
· Asynchronous export jobs (BullMQ + Redis)
· Email notifications
· API rate limiting with Redis
· Activity logs and audit trail

---

2. Phases Overview

Phase Name Duration Backend Tasks Frontend Tasks Value Delivered
0 Infrastructure & Setup Week 1 Database schema, project structure Project setup, design system Foundation
1 Core Data Model Week 2 Sentence CRUD services None (backend-only) Database ready
2 Sentence Management Weeks 3-4 Sentence API endpoints Sentence list, add, edit, delete User can manage sentences
3 Dashboard & Stats Week 5 Statistics service + endpoint Dashboard with KPI cards Visibility on progress
4 Export Foundation Weeks 6-7 Hugging Face integration, export service Export preview, status User can preview export
5 Export Full Weeks 8-9 Full export with merge, download endpoint Export button, dataset download User can export to HF
6 Production Hardening Week 10 Error handling, logging, rate limiting Error states, loading, mobile Production-ready MVP
7 V2 (Future) TBD Authentication, async jobs, notifications Login, notifications Multi-user support

---

3. Phase 0 — Infrastructure & Setup

Duration: Week 1
Goal: Foundation ready for development

3.1 Backend Tasks

Task Owner Deliverable Dependencies
Setup project structure Backend Node.js + TypeScript project with folder structure None
Install Prisma Backend Prisma configured with PostgreSQL None
Define Prisma schema Backend Sentence model with fields and indexes None
Run initial migration Backend Database schema created Prisma schema
Configure environment variables Backend .env with DATABASE_URL None
Write seed script Backend Sample sentences for development Database
Setup API client structure Backend API routes folder with health check Project structure

3.2 Frontend Tasks

Task Owner Deliverable Dependencies
Setup Next.js project Frontend Next.js App Router with TypeScript None
Install Tailwind CSS Frontend Tailwind configuration Project setup
Install shadcn/ui Frontend UI component library (Button, Card, Table, etc.) Tailwind
Create global layout Frontend Root layout with header and footer shadcn/ui
Setup environment variables Frontend NEXT_PUBLIC_API_URL configuration None
Create API client Frontend ApiClient with GET/POST/PUT/DELETE methods None
Setup Zustand store(s) Frontend sentenceStore, statsStore, exportStore, uiStore Zustand
Create health check UI Frontend /api/health status indicator on admin panel API client

3.3 Shared Tasks

Task Owner Deliverable
Define TypeScript types Shared DTOs based on API Contract.md
Create shared constants Shared Statuses, pagination defaults, etc.
Setup Git repository DevOps GitHub repo with branch protection (main/staging/dev)

3.4 Definition of Done

· Project runs locally (npm run dev)
· Database schema created (Prisma)
· Health check endpoint returns 200 OK
· Health check UI shows status
· Environment variables documented

---

4. Phase 1 — Core Data Model (Backend-Only)

Duration: Week 2
Goal: Sentence CRUD services implemented

4.1 Backend Tasks

Task Owner Deliverable Dependencies
Implement phrase.service.ts Backend createBatch(), createSingle(), findAll(), findOne(), updateTranslation(), deleteOne(), deleteMany() Prisma schema
Implement statistics.service.ts Backend getDashboardStats() with aggregations Phrase service
Write unit tests for services Backend Jest tests for all service methods Services
Add validation (Zod) Backend Schemas for all inputs None

4.2 Frontend Tasks

(Backend-only phase; frontend waits)

4.3 Definition of Done

· All service methods pass unit tests
· Validation schemas defined for all inputs
· Statistics service returns correct counts

---

5. Phase 2 — Sentence Management

Duration: Weeks 3-4
Goal: Full sentence CRUD on frontend

5.1 Backend Tasks

Task Owner Deliverable Dependencies
Implement POST /api/sentences/batch Backend Batch creation endpoint Phrase service
Implement POST /api/sentences Backend Single creation endpoint Phrase service
Implement GET /api/sentences Backend List with filters, pagination, search Phrase service
Implement GET /api/sentences/:id Backend Single sentence detail Phrase service
Implement PUT /api/sentences/:id Backend Update translation endpoint Phrase service
Implement DELETE /api/sentences/:id Backend Delete single sentence Phrase service
Implement DELETE /api/sentences Backend Bulk delete with filters Phrase service
Add error handling Backend Standard error responses (400, 404, 409, 500) None
Write integration tests Backend API endpoint tests with supertest All endpoints

5.2 Frontend Tasks

Task Owner Deliverable Dependencies
Create SentenceList page Frontend /sentences with table, filters, pagination API client, sentenceStore
Create AddSentenceForm Frontend /sentences/add with textarea for batch input API client, sentenceStore
Create EditTranslationModal Frontend Inline/Modal for editing Hassaniya translation API client, sentenceStore
Create StatusBadge component Frontend PENDING / TRANSLATED badges None
Create SentenceFilters component Frontend Status, exported, search filters None
Create Pagination component Frontend Page navigation with page and limit None
Integrate APIs with store Frontend All sentence CRUD operations in Zustand API client, sentenceStore
Add loading/error/empty states Frontend All screens handle UI states Components

5.3 Definition of Done

· User can add multiple sentences at once
· User can view list with filters and pagination
· User can edit translation (inline or modal)
· User can delete individual sentences
· User can bulk delete with filters
· All CRUD operations show loading/error/empty states
· Responsive table on mobile

---

6. Phase 3 — Dashboard & Statistics

Duration: Week 5
Goal: Dashboard with real statistics

6.1 Backend Tasks

Task Owner Deliverable Dependencies
Implement GET /api/stats Backend Statistics endpoint Statistics service
Add caching (optional) Backend Redis TTL for stats (5 min) Redis config

6.2 Frontend Tasks

Task Owner Deliverable Dependencies
Create Dashboard page Frontend /dashboard with KPI cards API client, statsStore
Create StatsCard component Frontend Reusable card with count and label None
Create StatsGrid component Frontend Grid layout for 4 cards StatsCard
Create QuickActions component Frontend Buttons: Add Sentences, Go to Pending, Export None
Implement auto-refresh Frontend Stats refresh every 60 seconds statsStore
Integrate stats API Frontend Fetch stats on page load API client, statsStore

6.3 Definition of Done

· Dashboard shows total, translated, pending, exported counts
· Last export date displayed
· Quick action buttons navigate to correct pages
· Stats auto-refresh
· Loading and error states handled

---

7. Phase 4 — Export Foundation

Duration: Weeks 6-7
Goal: Preview export and status tracking

7.1 Backend Tasks

Task Owner Deliverable Dependencies
Implement export.service.ts Backend previewExport() method Phrase service
Implement POST /api/export/preview Backend Preview endpoint (first 10 translations) Export service
Implement GET /api/export/status Backend Export status endpoint Export service
Implement Hugging Face client Backend HuggingFaceClient with dataset download/upload None
Add error handling Backend Standard error responses (422, 500) None

7.2 Frontend Tasks

Task Owner Deliverable Dependencies
Create Export page Frontend /export with status card API client, exportStore
Create ExportStatusCard component Frontend Shows last export, job status None
Create ExportPreview component Frontend Shows first 10 entries as code/table API client, exportStore
Implement preview API Frontend Fetch preview on button click API client, exportStore
Implement status polling Frontend Poll status during export exportStore

7.3 Definition of Done

· User can preview export (first 10 translated sentences)
· Preview displayed as formatted JSON/table
· Export status card shows current state
· Status polling works during export

---

8. Phase 5 — Export Full

Duration: Weeks 8-9
Goal: Full export to Hugging Face and dataset download

8.1 Backend Tasks

Task Owner Deliverable Dependencies
Implement exportToHuggingFace() Backend Full export with merge + upload Hugging Face client, export service
Implement POST /api/export/hf Backend Export endpoint (idempotent) Export service
Implement GET /api/export/dataset Backend Download endpoint (JSONL file) Export service
Add deduplication logic Backend Remove duplicates based on (arabic, hassani) Export service
Add transaction support Backend prisma.$transaction() for export Prisma
Add logging Backend Export logs for debugging Logger

8.2 Frontend Tasks

Task Owner Deliverable Dependencies
Implement export to HF Frontend Export button with loading state API client, exportStore
Implement dataset download Frontend Download button with file handling API client, exportStore
Add export progress Frontend Progress bar or step indicator exportStore
Add export completion toast Frontend Success notification uiStore
Add error handling Frontend Export failure with retry option None

8.3 Definition of Done

· User can export all translated sentences to Hugging Face
· Dataset is merged with existing repository (deduplicated)
· User can download dataset as JSONL
· Export progress displayed
· Export failures handled with retry option
· Export button disabled when no translated sentences exist

---

9. Phase 6 — Production Hardening

Duration: Week 10
Goal: Production-ready MVP

9.1 Backend Tasks

Task Owner Deliverable Dependencies
Add comprehensive error handling Backend All errors captured and logged None
Add logging (Pino/Winston) Backend Structured logs with request ID None
Implement rate limiting Backend 100 req/min per IP (using Upstash or in-memory) None
Add idempotency for POST endpoints Backend Idempotency keys for batch and export None
Write integration tests Backend End-to-end tests (add → translate → export) All services
Health check endpoint Backend GET /api/health with DB check None

9.2 Frontend Tasks

Task Owner Deliverable Dependencies
Accessibility pass Frontend Keyboard navigation, screen reader labels All components
Responsive pass Frontend All screens work on mobile/tablet All pages
Performance pass Frontend Lazy loading, memoization, chunk splitting All components
Error boundary implementation Frontend React error boundaries for all pages None
Add toast notifications Frontend Success/error toasts for all actions uiStore
Production build verification Frontend npm run build passes All code

9.3 Definition of Done

· All endpoints have proper error handling and logging
· Rate limiting active on all API routes
· All POST endpoints are idempotent
· All screens have accessibility labels
· All screens work on mobile
· Build passes with no errors/warnings

---

10. Phase 7 — V2 (Future)

Duration: TBD (Post-MVP)

10.1 Backend Tasks

Task Priority Deliverable
Authentication (JWT) High Login, refresh, logout endpoints
User management High CRUD for users (admin only)
RBAC (roles) Medium admin, translator roles
Async export jobs High BullMQ + Redis for long exports
Email notifications Medium Export completion emails
Activity logs Low Audit trail of all actions
API rate limiting with Redis Medium Distributed rate limiting

10.2 Frontend Tasks

Task Priority Deliverable
Login page High /login with email/password
Protected routes High Route guards based on auth status
User management High User list and create form (admin)
Notifications center Medium In-app notifications with Socket.IO
Export progress bar High Real-time export progress updates
Responsive improvements Low Enhanced mobile experience

---

11. Phase Dependency Map

```
Phase 0 (Setup)
    ↓
Phase 1 (Core Data Model)
    ↓
Phase 2 (Sentence Management) ←──┐
    ↓                              │
Phase 3 (Dashboard & Stats)        │ (Parallel)
    ↓                              │
Phase 4 (Export Foundation)        │
    ↓                              │
Phase 5 (Export Full) ←────────────┘
    ↓
Phase 6 (Production Hardening)
    ↓
Phase 7 (V2 - Future)
```

---

12. Risk Management

Risk Probability Impact Mitigation
Hugging Face API rate limits Medium High Add retry logic with exponential backoff; limit export frequency
Database performance with many sentences Low Medium Add indexes on status and exported_at; paginate list queries
Export job timeout (Vercel 10s limit) Medium High Move to async queue (V2); in V1, optimize query and limit batch size
Duplicate sentences Medium Medium Use arabic unique constraint; handle duplicate errors gracefully
Missing translations on export Low Low Only export TRANSLATED sentences; status validation
Data loss during export Low High Transaction support; backup before export; rollback on failure

---

13. Go-Live Criteria

· All Phase 0-6 tasks completed
· All endpoints pass integration tests
· All screens pass accessibility audit
· Production build passes without errors
· Database migrations applied to production
· Environment variables configured
· Health check endpoint returns 200 OK
· Hugging Face token valid and has write permissions
· Monitoring and logging configured
· Rollback procedure documented

---

14. Rollback Strategy

14.1 Rollback Triggers

· Error rate > 2% for 5 minutes
· Critical functionality broken (add sentences, export)
· Database migration failure
· Hugging Face authentication failure

14.2 Rollback Steps

Vercel (Frontend + Backend API):

```bash
# Option 1: Vercel Dashboard
# 1. Go to Production Deployment
# 2. Click "Promote to Production" for previous deployment

# Option 2: CLI
vercel promote <previous-deployment-url>
```

Database (Neon):

```sql
-- Option 1: Point-in-time recovery
-- Restore to timestamp before deployment

-- Option 2: Migration rollback
npx prisma migrate reset --force
npx prisma migrate deploy --preview-feature
```

14.3 Rollback Time

· Vercel: < 1 minute
· Database: 2-3 minutes (with Neon PITR)

---

15. Phase Timeline (Estimated)

Phase Duration Start End Backend FT Frontend FT
Phase 0 1 week Week 1 Week 1 1 1
Phase 1 1 week Week 2 Week 2 1 0
Phase 2 2 weeks Week 3 Week 4 1 1
Phase 3 1 week Week 5 Week 5 0.5 1
Phase 4 2 weeks Week 6 Week 7 1 1
Phase 5 2 weeks Week 8 Week 9 1 1
Phase 6 1 week Week 10 Week 10 0.5 1
Total 10 weeks    

---

16. Appendices

A. Phase Completion Checklist

For each phase, confirm:

· All endpoints documented in API Contract implemented
· All frontend pages built and integrated
· All tests passing
· No regression on previous phases
· Documentation updated
· Phase demo prepared

B. Communication Cadence

Meeting Frequency Attendees
Standup Daily Frontend + Backend teams
Sync Weekly Full team (PM, FE, BE, QA)
Phase review End of each phase Full team with demo
Retro End of each phase Full team

C. Key Milestones

Milestone Phase Date (target)
Infrastructure ready Phase 0 End Week 1
Core data model Phase 1 End Week 2
Sentence management (first usable UI) Phase 2 End Week 4
Dashboard operational Phase 3 End Week 5
Export preview working Phase 4 End Week 7
Full export to HF working Phase 5 End Week 9
Production MVP Phase 6 End Week 10

---

Fin du document – Master Plan Hassaniya Translation Manager V1.0