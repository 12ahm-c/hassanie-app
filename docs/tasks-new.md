# Phase 5 — Export Full + Phase 6 — Production Hardening

**Phase 5 Duration:** Weeks 8-9
**Phase 6 Duration:** Week 10
**Dependencies:** Phase 4 (Export Foundation) complete

---

## Phase 5 — Export Full

### 5.1 Backend Tasks

#### Task 1: Enhance Export Service with Full Export Logic

**File:** `src/lib/services/export.service.ts`

| Method | Description | Return Type |
|--------|-------------|-------------|
| `exportToHuggingFace()` | Full export: download existing, merge, deduplicate, upload | `Promise<ExportResult>` |

**Export Flow:**
1. Fetch all TRANSLATED sentences
2. Download existing dataset from Hugging Face
3. Format new translations as `{arabic, hassani}` objects
4. Merge and deduplicate (based on arabic + hassani)
5. Generate JSONL
6. Upload merged dataset to Hugging Face
7. Update `exportedAt` for exported sentences

---

#### Task 2: Add Deduplication Logic

**File:** `src/lib/services/export.service.ts`

| Rule | Implementation |
|------|----------------|
| Dedup key | `${arabic}\|\|\|${hassani}` |
| Keep | All unique rows from existing + new |
| Remove | Rows where key already exists in existing |
| Count | Track duplicates removed for response |

---

#### Task 3: Add Transaction Support for Export

**File:** `src/lib/services/export.service.ts`

| Operation | Transaction |
|-----------|-------------|
| Update exportedAt | `prisma.$transaction()` for batch update |
| Rollback | On HF upload failure, revert exportedAt |

---

#### Task 4: Add Export Logging

**File:** `src/lib/logger.ts`

| Log Level | Event |
|-----------|-------|
| info | Export started, sentences count |
| info | Export completed, stats |
| warn | HF rate limit hit, retrying |
| error | Export failed, HF error |

---

#### Task 5: Enhance Export Routes

| Route | Method | Enhancement |
|-------|--------|-------------|
| `/api/export/hf` | POST | Idempotent (reject if job running), transaction support |
| `/api/export/dataset` | GET | Stream large files, proper Content-Type |

---

#### Task 6: Write Export Tests

| Test File | Cases |
|-----------|-------|
| `export.service.test.ts` | exportToHuggingFace full flow, deduplication, transaction rollback |
| `huggingface.service.test.ts` | mergeDatasets edge cases, upload with retry |
| `export.route.test.ts` | POST /export/hf idempotency, GET /export/dataset streaming |

---

### 5.2 Frontend Tasks

#### Task 7: Enhance Export Actions

| Enhancement | Description |
|-------------|-------------|
| Export progress | Show progress bar or step indicator |
| Export completion toast | Success notification via uiStore |
| Export failure retry | Retry button on error |
| Disable when empty | Button disabled when no translated sentences |

---

#### Task 8: Add Export Progress Component

**File:** `src/components/export/ExportProgress.tsx`

| Step | Description |
|------|-------------|
| 1 | Fetching translated sentences... |
| 2 | Downloading existing dataset... |
| 3 | Merging and deduplicating... |
| 4 | Uploading to Hugging Face... |
| 5 | Updating export status... |
| Done | Export complete! |

---

#### Task 9: Create Toast/Notification System

**File:** `src/store/uiStore.ts`

```typescript
interface UiStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}
```

---

#### Task 10: Enhance Export Store

**File:** `src/store/exportStore.ts`

| Action | Description |
|--------|-------------|
| exportToHF | Add progress tracking, toast on completion/failure |
| downloadDataset | Add loading toast |

---

#### Task 11: Write Frontend Tests

| Test File | Cases |
|-----------|-------|
| `ExportProgress.test.tsx` | Renders steps, shows current step |
| `uiStore.test.ts` | addToast, removeToast, auto-dismiss |

---

### 5.3 Definition of Done

- [ ] POST /api/export/hf exports all translated sentences to Hugging Face
- [ ] Dataset is merged with existing repository (deduplicated)
- [ ] User can download dataset as JSONL
- [ ] Export progress displayed
- [ ] Export failures handled with retry option
- [ ] Export button disabled when no translated sentences exist
- [ ] Export is idempotent (concurrent requests handled)
- [ ] Transaction support for export operations
- [ ] All tests pass

---

## Phase 6 — Production Hardening

### 6.1 Backend Tasks

#### Task 1: Add Comprehensive Error Handling

**File:** `src/lib/errors/`

| Error Type | HTTP Code | Usage |
|------------|-----------|-------|
| All API routes | try/catch | Every route wrapped with handleApiError |
| Database errors | 500 | Connection failures, query errors |
| HF API errors | 500 | Export failures, rate limits |
| Validation errors | 400 | Invalid input, missing fields |
| Not found | 404 | Missing resources |
| Duplicate | 409 | Unique constraint violations |

---

#### Task 2: Add Structured Logging

**File:** `src/lib/logger.ts`

| Level | Usage |
|-------|-------|
| info | Request received, export started/completed |
| warn | Rate limit hit, retry attempt |
| error | Export failed, database error |
| debug | Query details, response times |

**Format:**
```json
{
  "level": "info",
  "message": "Export completed",
  "data": { "sentencesExported": 50, "duration": "12s" },
  "timestamp": "2026-08-08T10:00:00.000Z",
  "requestId": "req_abc123"
}
```

---

#### Task 3: Add Rate Limiting

**File:** `src/lib/rate-limit.ts`

| Config | Value |
|--------|-------|
| Window | 1 minute |
| Max requests | 100 per IP |
| Storage | In-memory (V1) or Upstash Redis (V2) |

---

#### Task 4: Add Idempotency for POST Endpoints

| Endpoint | Idempotency Key |
|----------|-----------------|
| POST /sentences/batch | Request body hash |
| POST /export/hf | Job ID (reject if running) |

---

#### Task 5: Add Health Check Endpoint

**File:** `src/app/api/health/route.ts`

| Check | Description |
|-------|-------------|
| database | Query SELECT 1 |
| huggingface | Token configured |
| status | ok / degraded |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-08T14:32:11.000Z",
  "services": {
    "database": "connected",
    "huggingface": "configured"
  }
}
```

---

#### Task 6: Write Integration Tests

| Test File | Cases |
|-----------|-------|
| `health.route.test.ts` | Returns 200 with services status |
| `error-handling.test.ts` | All error types return correct codes |
| `rate-limit.test.ts` | Rate limiting blocks excess requests |

---

### 6.2 Frontend Tasks

#### Task 7: Accessibility Pass

| Item | Description |
|------|-------------|
| Keyboard navigation | All interactive elements focusable |
| Screen reader | Labels on all inputs, buttons |
| Contrast | Text meets WCAG AA (4.5:1) |
| Focus states | Visible focus rings |

---

#### Task 8: Responsive Pass

| Screen | Behavior |
|--------|----------|
| Mobile (<640px) | Single column, stacked filters, scrollable table |
| Tablet (640-1024px) | 2-column grid, filters wrap |
| Desktop (>1024px) | Full layout |

---

#### Task 9: Performance Pass

| Optimization | Description |
|--------------|-------------|
| Lazy loading | Dynamic imports for modals |
| Memoization | useMemo for expensive calculations |
| Code splitting | Separate chunks per route |
| Image optimization | Next.js Image component |

---

#### Task 10: Error Boundary Implementation

**File:** `src/components/shared/ErrorBoundary.tsx`

| Feature | Description |
|---------|-------------|
| Catch errors | React error boundary for each page |
| Fallback UI | User-friendly error message |
| Reset | Button to retry |

---

#### Task 11: Toast Notifications

| Action | Toast Type |
|--------|-----------|
| Sentence added | success |
| Translation updated | success |
| Sentence deleted | success |
| Export completed | success |
| Export failed | error |
| API error | error |

---

#### Task 12: Production Build Verification

| Check | Command |
|-------|---------|
| Build passes | `npm run build` |
| No TypeScript errors | `npm run typecheck` |
| No lint errors | `npm run lint` |
| All tests pass | `npm run test` |

---

### 6.3 Definition of Done

- [ ] All endpoints have proper error handling and logging
- [ ] Rate limiting active on all API routes
- [ ] All POST endpoints are idempotent
- [ ] All screens have accessibility labels
- [ ] All screens work on mobile
- [ ] Error boundaries on all pages
- [ ] Toast notifications for all actions
- [ ] Production build passes with no errors/warnings
- [ ] Health check endpoint returns 200 OK

---

## Dependency Map

```
Phase 5 (Export Full)          Phase 6 (Production Hardening)
       |                              |
   exportToHuggingFace           Error handling
       |                         Structured logging
   Deduplication                 Rate limiting
       |                         Idempotency
   Transaction support           Health check
       |                         Error boundaries
   Export progress UI            Toast notifications
       |                         Accessibility
   Toast system                  Responsive
       |                         Performance
   Full export flow              Build verification
```
