# Phase 2 — Sentence Management

**Duration:** Weeks 3-4
**Goal:** Full sentence CRUD on frontend
**Dependencies:** Phase 1 (Core Data Model) complete

---

## 2.1 Backend Tasks

### Task 1: Implement Sentence API Routes

| Route | Method | Service Call | Description |
|-------|--------|-------------|-------------|
| `/api/sentences/batch` | POST | `phraseService.createBatch()` | Batch creation endpoint |
| `/api/sentences` | POST | `phraseService.createSingle()` | Single creation endpoint |
| `/api/sentences` | GET | `phraseService.findAll()` | List with filters, pagination, search |
| `/api/sentences/:id` | GET | `phraseService.findOne()` | Single sentence detail |
| `/api/sentences/:id` | PUT | `phraseService.updateTranslation()` | Update translation endpoint |
| `/api/sentences/:id` | DELETE | `phraseService.deleteOne()` | Delete single sentence |
| `/api/sentences` | DELETE | `phraseService.deleteMany()` | Bulk delete with filters |

**Rules:**
- Validation with Zod on all requests
- Error handling with try/catch and standard response envelope `{ success, data, error, meta }`
- Standard HTTP status codes (200, 201, 204, 400, 404, 409, 500)
- No business logic in routes — delegate to services

---

### Task 2: Add Error Handling Middleware

**File:** `src/lib/errors/`

| Error Class | HTTP Code | Usage |
|-------------|-----------|-------|
| `ValidationError` | 400 | Zod validation failures |
| `NotFoundError` | 404 | Sentence not found |
| `DuplicateError` | 409 | Duplicate arabic text |
| `AppError` | 500 | Base class for all errors |

---

### Task 3: Write Integration Tests

**File:** `src/app/api/__tests__/sentences.test.ts`

| Test Area | Cases |
|-----------|-------|
| POST /sentences/batch | Creates multiple, handles duplicates, validates input |
| POST /sentences | Creates one, rejects duplicate, validates input |
| GET /sentences | Returns paginated list, filters work, search works |
| GET /sentences/:id | Returns sentence, 404 on missing |
| PUT /sentences/:id | Updates translation, auto-sets status, 404 on missing |
| DELETE /sentences/:id | Deletes sentence, 404 on missing |
| DELETE /sentences | Bulk deletes with filters, returns count |

---

## 2.2 Frontend Tasks

### Task 4: Create SentenceList Page

**File:** `src/app/sentences/page.tsx`

- Table with columns: ID, Arabic, Hassaniya, Status (badge), Exported, Created At, Actions
- Filters: Status (All/PENDING/TRANSLATED), Exported (All/Yes/No), Search box
- Pagination: Page navigation with page and limit
- Actions per row: Edit (inline/modal), Delete (with confirmation)
- States: loading, error, empty, success

---

### Task 5: Create AddSentenceForm

**File:** `src/app/sentences/add/page.tsx`

- Textarea for pasting multiple Arabic sentences (one per line)
- Submit button with loading state
- Success feedback: number added, duplicates skipped
- Error handling: validation errors, duplicate detection

---

### Task 6: Create EditTranslationModal

**File:** `src/components/sentences/EditTranslationModal.tsx`

- Field: Hassaniya translation text input
- Save button (updates status automatically)
- Clear button (sets translation to empty, status to PENDING)

---

### Task 7: Create Reusable Components

| Component | File | Purpose |
|-----------|------|---------|
| `StatusBadge` | `src/components/sentences/StatusBadge.tsx` | PENDING / TRANSLATED badges |
| `SentenceFilters` | `src/components/sentences/SentenceFilters.tsx` | Status, exported, search filters |
| `Pagination` | `src/components/shared/Pagination.tsx` | Page navigation |
| `LoadingSpinner` | `src/components/shared/LoadingSpinner.tsx` | Loading state |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | Empty list state |
| `ErrorState` | `src/components/shared/ErrorState.tsx` | Error display |

---

### Task 8: Integrate APIs with Zustand Store

**File:** `src/store/sentenceStore.ts`

```typescript
interface SentenceStore {
  sentences: Sentence[];
  filters: { status?: string; exported?: boolean; search?: string };
  pagination: { page: number; limit: number; total: number };
  isLoading: boolean;
  error: string | null;

  fetchSentences: (filters?: Filters) => Promise<void>;
  addSentences: (phrases: string[]) => Promise<BatchResult>;
  updateTranslation: (id: number, hassaniya: string) => Promise<void>;
  deleteSentence: (id: number) => Promise<void>;
  clearFilters: () => void;
}
```

---

### Task 9: Create API Client Service

**File:** `src/services/sentence.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `findAll(params)` | GET /sentences | List with filters |
| `createBatch(phrases)` | POST /sentences/batch | Batch create |
| `createSingle(arabic)` | POST /sentences | Single create |
| `updateTranslation(id, hassaniya)` | PUT /sentences/:id | Update translation |
| `delete(id)` | DELETE /sentences/:id | Delete one |
| `deleteMany(filter)` | DELETE /sentences | Bulk delete |

---

## 2.3 Definition of Done

- [ ] All 7 API routes implemented and return correct response envelope
- [ ] Zod validation on all inputs
- [ ] Error handling with standard error codes
- [ ] User can add multiple sentences at once
- [ ] User can view list with filters and pagination
- [ ] User can edit translation (inline or modal)
- [ ] User can delete individual sentences
- [ ] User can bulk delete with filters
- [ ] All CRUD operations show loading/error/empty states
- [ ] Responsive table on mobile
- [ ] Integration tests pass
- [ ] `npm run test` passes with 0 failures
- [ ] `npm run typecheck` passes
