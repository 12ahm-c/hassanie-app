# Phase 1 — Core Data Model (Backend-Only)

**Duration:** Week 2
**Goal:** Sentence CRUD services implemented
**Scope:** Backend-only — frontend waits

---

## 1.1 Backend Tasks

### Task 1: Implement `phrase.service.ts`

**File:** `src/lib/services/phrase.service.ts`

| Method | Description | Return Type |
|--------|-------------|-------------|
| `createBatch(phrases: string[])` | Insert multiple Arabic sentences, skip duplicates | `Promise<BatchResult>` |
| `createSingle(arabic: string)` | Insert one Arabic sentence | `Promise<Sentence>` |
| `findAll(filters, pagination)` | List sentences with status/exported/search filters + pagination | `Promise<PaginatedResult>` |
| `findOne(id: number)` | Get a single sentence by ID | `Promise<Sentence \| null>` |
| `updateTranslation(id: number, hassaniya: string)` | Update Hassaniya text, auto-set status to TRANSLATED | `Promise<Sentence>` |
| `deleteOne(id: number)` | Delete a single sentence | `Promise<void>` |
| `deleteMany(filter)` | Bulk delete with filters | `Promise<{ deletedCount: number }>` |

**Rules:**
- Every `hassaniya` update must auto-update `status` (TRANSLATED if non-empty, PENDING if empty)
- Use `prisma.$transaction()` for batch operations
- Validate all inputs with Zod before service calls

---

### Task 2: Implement `statistics.service.ts`

**File:** `src/lib/services/statistics.service.ts`

| Method | Description | Return Type |
|--------|-------------|-------------|
| `getDashboardStats()` | Return aggregated counts for dashboard | `Promise<DashboardStats>` |

**Returns:**
```typescript
{
  totalSentences: number;
  translated: number;
  pending: number;
  exported: number;
  lastExportAt: string | null;
}
```

---

### Task 3: Add Zod Validation Schemas

**File:** `src/lib/validators/phrase.validator.ts`

| Schema | Purpose |
|--------|---------|
| `createBatchSchema` | Validate array of Arabic strings (non-empty, trimmed) |
| `createSingleSchema` | Validate single Arabic string (non-empty, trimmed) |
| `findAllSchema` | Validate query params: status, exported, search, page, limit |
| `updateTranslationSchema` | Validate hassaniya string (non-empty, trimmed) |
| `deleteManySchema` | Validate bulk delete filter |

---

### Task 4: Write Unit Tests for Services

**Files:** `src/lib/services/__tests__/phrase.service.test.ts`, `statistics.service.test.ts`

| Test Area | Cases |
|-----------|-------|
| `createBatch` | Inserts multiple, skips duplicates, returns correct counts |
| `createSingle` | Inserts one, rejects duplicate |
| `findAll` | Filters by status, exported, search; pagination works |
| `findOne` | Returns sentence or null |
| `updateTranslation` | Updates hassaniya, sets status to TRANSLATED |
| `updateTranslation` (empty) | Clears hassaniya, sets status to PENDING |
| `deleteOne` | Removes sentence, returns void |
| `deleteMany` | Removes matching sentences, returns count |
| `getDashboardStats` | Returns correct aggregated counts |

---

## 1.2 Frontend Tasks

*(Backend-only phase — frontend waits)*

---

## 1.3 Definition of Done

- [ ] All `phrase.service.ts` methods implemented and pass unit tests
- [ ] `statistics.service.ts` returns correct dashboard counts
- [ ] Zod validation schemas defined for all inputs
- [ ] `npm run test` passes with 0 failures
- [ ] No regressions on Phase 0 (project runs, DB schema exists, health check OK)
