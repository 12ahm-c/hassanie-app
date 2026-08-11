Based on all the provided documents for the Hassaniya Translation Manager, here is a complete and well-structured AI Workflow document tailored to the new project.

---

AI Workflow for Hassaniya Translation Manager

Version: 1.0 – Août 2026
Document de référence pour l'assistance IA au développement

---

1. Purpose

This document defines the AI operating model for the Hassaniya Translation Manager project. The workflow is intentionally strict, human‑supervised, and designed to prevent hallucinations, scope creep, and architectural violations.

The core flow is:

```text
Orchestrator → Build → Review/Security → User approval / PR merge
```

· Orchestrator reads the governance docs, scopes the task, protects the architecture, and approves the work package.
· Build implements only the approved scope (backend, frontend, or docs) without deviating from contracts.
· Review/Security performs a read‑only audit for security, business rules, API compliance, and risk.

No other AI roles are used in the default workflow. All changes must be human‑validated before merging.

---

2. Source of Truth Hierarchy

Agents must respect this document hierarchy. In case of conflict, the highest‑ranked document prevails.

Rank Document Authority
1 docs/master-plan.md Project governance, phase sequencing, module boundaries, DoD, MVP scope
2 docs/architecture.md Business rules, data model, sentence workflow, export logic, scalability
3 docs/API-contract.md REST endpoints, DTOs, error codes, idempotency, pagination
4 docs/backend-plan.md Backend task sequencing, service ownership, tests
5 docs/frontend-plan.md Frontend task sequencing, component ownership, mock strategy
6 docs/infra-plan.md Deployment, environment variables, Redis, PostgreSQL, backups

Rule: If a required endpoint, field, error code, or business rule is missing from the above documents, the agent must stop and ask – never invent.

---

3. Agent Roles and Responsibilities

3.1 Orchestrator

Responsibility Description
Read governance Load master-plan.md, architecture.md, API-contract.md, and the relevant phase plan.
Classify task Type: docs, backend, frontend, infra, contract, architecture, critical-module.
Check dependencies Ensure prerequisite phases (see master plan dependency graph) are completed.
Define exact scope List what behavior will be added/modified.
List allowed files Explicit paths (e.g., src/lib/services/*, src/app/sentences/*).
List forbidden files e.g., src/app/admin/* when working on sentence management.
Approve cross‑cutting changes API contract, database schema, environment variables, dependencies, CI/CD, scaffolding.
Assign to Build only when safe If scope touches critical modules (see master plan §12), must request Review/Security before Build starts.
Summarize verification After Build, produce a change summary for the user/PR.

3.2 Build Agent

Build implements the approved work inside the scoped files. It never makes independent design decisions.

Mandatory steps before editing:

1. Restate the approved task scope (verbatim from Orchestrator).
2. List all files that will be created or modified.
3. Confirm that no forbidden files are touched.
4. Confirm that no API contract, schema, env, dependency, or scaffold change is required – or if required, that Orchestrator has explicitly approved it.

During implementation, Build must:

· Follow the exact API contract (endpoint paths, request/response shapes, error codes, envelopes).
· Enforce business rules inside services, not routes/controllers (see architecture §3).
· Use the central API client on frontend (no direct backend calls).
· Keep backend business logic out of API routes.
· Add or update tests once the testing framework is in place.
· Respect module boundaries (master plan §4): never call a service from another service without proper abstraction.
· Stop immediately if the work expands beyond the approved scope.

Build must not:

· Invent endpoints, DTO fields, error codes, or pagination rules.
· Invent business rules (e.g., export logic, status transitions, deduplication).
· Add environment variables, npm packages, CI steps, or scaffolding without approval.
· Mix refactoring, formatting changes, or unrelated features.
· Store secrets, sessions, or durable state on the filesystem (use PostgreSQL or Redis).
· Change database schema or indexes without approval.

3.3 Review/Security Agent

Review/Security is read‑only unless explicitly asked to fix. It inspects the Build's output before PR/handoff.

Review checklist:

· Scope compliance – No files outside allowed list, no unrelated changes.
· API contract – Every implemented endpoint matches API-contract.md exactly; no undocumented fields; standard {success, data, error, meta} envelope.
· Business rules – Logic lives in services; status transitions (PENDING → TRANSLATED) are correct; deduplication logic works.
· Validation – All inputs validated with Zod/schemas; duplicate Arabic text rejected with 409 DUPLICATE.
· Critical modules (master plan §12) – Extra scrutiny on sentence CRUD, export to Hugging Face, deduplication logic, idempotency.
· Idempotency – POST /sentences/batch and POST /export/hf use idempotency keys.
· Data integrity – Arabic text is unique; status automatically updated when hassaniya changes.
· Export integrity – Only TRANSLATED sentences are exported; deduplication based on (arabic, hassani).
· Error handling – No stack traces leaked to client; proper 4xx/5xx codes.
· Testing & verification – Build provided verification steps (curl, manual tests, screenshots).
· Infrastructure – Environment variables follow infra-plan.md; no hardcoded secrets.

Output format:

1. Findings (severity: Critical / High / Medium / Low) with file/line references.
2. Open questions (if any).
3. Residual risk summary.
4. Go/No‑Go recommendation.

---

4. Task Lifecycle (Step‑by‑Step)

```text
1. Task creation (from phase plan)
   ↓
2. Orchestrator reads master-plan.md, architecture, API contract
   ↓
3. Orchestrator classifies task, checks dependencies
   ↓
4. Orchestrator defines scope, allowed files, and flags if critical module
   ↓
5. [If critical module] Orchestrator requests early Review/Security (optional)
   ↓
6. Build Agent restates scope, lists files, implements
   ↓
7. Build stops if scope expands – escalates to Orchestrator
   ↓
8. Review/Security Agent performs read‑only audit
   ↓
9. Review/Security produces findings and Go/No‑Go
   ↓
10. User approval or PR created with change summary
   ↓
11. Merge and deployment (manual or CI)
```

Stop conditions (Build must halt and escalate):

· Missing or conflicting API contract definition.
· Required database schema/index change not approved.
· Environment variable or new dependency needed.
· Scaffolding changes (new folder structure, new module) not approved.
· Scope expands beyond the allowed files.

---

5. Anti‑Hallucination Rules

5.1 API & DTO

Before using any endpoint, field, error code, pagination param, or event:

1. Locate it in docs/API-contract.md.
2. If not found → treat as unavailable.
3. Ask for a contract update instead of inventing it.
4. After implementation, verify no undocumented fields remain.

5.2 Business Rules

Before applying any business rule (e.g., status transition, export logic, deduplication):

1. Locate it in docs/architecture.md or docs/master-plan.md.
2. If the rule is ambiguous or missing → stop and ask.
3. Never silently choose between conflicting rules.

5.3 Database & Models

Before referencing a table, field, or index:

1. Verify it exists in architecture.md §7 (Database schema).
2. Do not add fields unless approved via a schema change task.

5.4 Module Boundaries

Before calling a function or importing a module:

1. Check the module boundary rules in master-plan.md §4.
2. Cross‑module dependencies require service‑level APIs and a review.

---

6. Critical Escalation Rules

The Orchestrator must escalate (request human input) and stop the workflow when the task touches or changes:

· API contract – any endpoint, DTO, error code, idempotency behavior.
· Database schema – new table, field, index, or change to existing schema.
· Sentence CRUD – creation, update, deletion logic.
· Export pipeline – Hugging Face integration, merge logic, deduplication.
· Hugging Face client – dataset download/upload logic.
· Status transitions – PENDING ↔ TRANSLATED logic.
· Idempotency – any new idempotent endpoint.
· Environment variables or deployment configuration – new variables, provider changes.
· Dependencies or package files – adding/upgrading any npm package.
· CI/CD or scaffolding – new scripts, build steps, or folder structure.

For these areas, the Build agent must not proceed without explicit Orchestrator approval and, if required, a separate design task.

---

7. PR and Task Size Rules

· One PR = one task (one module slice, one docs update, one infra change).
· Do not mix bug fixes, refactoring, formatting, and new features in the same PR.
· Critical modules (see master plan §12) require small PRs and mandatory Review/Security approval.
· API contract changes must be isolated in a separate PR and approved by both frontend and backend leads.
· Schema/index changes must include rollout and rollback notes in the PR description.
· PR description must contain:
  · Changed files
  · How it was verified (manual tests, curl, unit tests)
  · Risks (if any)
  · Screenshots for UI changes

---

8. Definition of Done for AI Tasks

A task is DONE only when:

· Scope matches the Orchestrator's approved description.
· All source documents (master-plan.md, architecture.md, API-contract.md) were consulted.
· No invented endpoints, fields, or business rules exist.
· API contract is followed exactly.
· Business rules are enforced inside services (not routes).
· Tests are added/updated (once testing tooling exists).
· Frontend async screens have loading, error, and empty states.
· Critical modules have Review/Security approval.
· PR summary includes changed files, verification steps, risks.
· No unrelated formatting, refactoring, or features included.

---

9. Prompt Templates

9.1 Orchestrator Task Definition

```markdown
Task: [name]
Type: [docs | backend | frontend | infra | contract | architecture | critical-module]
Phase: [Phase number from master plan]

Read first:
- docs/master-plan.md (sections: [relevant phases, module boundaries])
- docs/architecture.md (sections: [business rules, models])
- docs/API-contract.md (sections: [endpoints used])
- docs/[backend|frontend]-plan.md (task sequencing)

Scope:
- [specific behavior to implement]

Allowed files:
- [list of paths]

Forbidden files:
- [list of paths]

Cross‑cutting changes allowed? [yes/no – if yes, list: contract, schema, env, deps, scaffold]

Acceptance criteria:
- [list]

Verification:
- [curl examples, UI interactions, test commands]
```

9.2 Build Agent Restatement

```markdown
## Build task restatement

Task: [name]
Scope (from Orchestrator):
- [copy scope]

Planned files:
- [list of files to create/modify]

No changes outside these files.
I will stop if I need to touch: [forbidden files or patterns].

Verification plan:
- [steps]

Proceeding.
```

9.3 Review/Security Task

```markdown
## Review of [PR / task name]

**Mode**: Read‑only

**Checked against**:
- master-plan.md
- architecture.md
- API-contract.md

**Findings** (by severity):

### Critical
- [file:line] – description

### High
- ...

### Medium
- ...

### Low
- ...

**Open questions**:
- ?

**Residual risk summary**:
- ?

**Recommendation**: [Go / No‑Go / Changes required]

**Sign off**: [Reviewer]
```

---

10. Relationship with Human Governance

The AI workflow is a support to human developers, not a replacement.

· Humans define the master plan, architecture, and API contract.
· Humans approve all PRs.
· Humans decide when to escalate out of the AI loop.
· The AI agents act as strict, rule‑following executors and auditors.

If the AI detects an inconsistency in the source documents, it must report the inconsistency and ask for clarification – never silently resolve it.

---

11. Critical Module Identification

Critical modules (from master plan §12) require extra scrutiny:

Module Reason Review Focus
Sentence CRUD Core data integrity Unique constraint, status transitions, validation
Export to Hugging Face External API integration Authentication, merge logic, deduplication
Hugging Face client Data loss risk Error handling, retry logic, data integrity
Database schema Data integrity Indexes, constraints, migrations
Idempotency Prevent duplicates Key generation, storage, response logic
Environment config Security Secrets, rate limiting, API keys

---

12. Anti‑Hallucination Examples

Example 1: Inventing an Endpoint

❌ Build must not:

```typescript
// This endpoint is NOT in API Contract
app.post('/api/sentences/translate-batch', ...)
```

✅ Build must:

```typescript
// Use only documented endpoints
POST /api/sentences/batch   // documented in API Contract
PUT /api/sentences/:id      // documented in API Contract
```

Example 2: Inventing a Field

❌ Build must not:

```typescript
interface Sentence {
  id: number;
  arabic: string;
  hassaniya: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // ❌ Not in API Contract
  translatedAt: Date;
  // ❌ Not in API Contract
  translatorName: string;
}
```

✅ Build must:

```typescript
// Use only documented fields
interface Sentence {
  id: number;              // API Contract §Appendix A
  arabic: string;          // API Contract §Appendix A
  hassaniya: string | null;// API Contract §Appendix A
  status: string;          // API Contract §Appendix A
  exportedAt: string | null; // API Contract §Appendix A
  createdAt: string;       // API Contract §Appendix A
  updatedAt: string;       // API Contract §Appendix A
}
```

Example 3: Inventing a Business Rule

❌ Build must not:

```typescript
// ❌ Not documented in architecture.md
export function autoTranslate(arabic: string): string {
  // ... AI-based translation
}
```

✅ Build must:

```typescript
// ✅ Follow documented workflow
// Translations are MANUAL (architecture.md §4)
// User adds translation via PUT /sentences/:id
// Status automatically updated to TRANSLATED
```

---

End of AI Workflow for Hassaniya Translation Manager – Version 1.0 – Août 2026

This document is enforced for all AI‑assisted development.