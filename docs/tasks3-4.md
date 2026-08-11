# Phase 3 — Dashboard & Statistics + Phase 4 — Export Foundation

**Phase 3 Duration:** Week 5
**Phase 4 Duration:** Weeks 6-7
**Dependencies:** Phase 2 (Sentence Management) complete

---

## Phase 3 — Dashboard & Statistics

### 3.1 Backend Tasks

#### Task 1: Implement GET /api/stats Endpoint

**Route:** `src/app/api/stats/route.ts`

| Method | Endpoint | Service Call | Description |
|--------|----------|-------------|-------------|
| GET | `/api/stats` | `statisticsService.getDashboardStats()` | Dashboard statistics |

**Response shape:**
```json
{
  "success": true,
  "data": {
    "totalSentences": 1000,
    "translated": 50,
    "pending": 950,
    "exported": 45,
    "lastExportAt": "2026-08-07T12:00:00.000Z"
  }
}
```

**Rules:**
- No authentication (V1)
- Return cached stats if available (optional Redis TTL 5 min)
- Handle database errors gracefully

---

### 3.2 Frontend Tasks

#### Task 2: Create Dashboard Page

**File:** `src/app/dashboard/page.tsx`

| Section | Component | Description |
|---------|-----------|-------------|
| KPI Cards | `StatsGrid` | 4 cards: Total, Translated, Pending, Exported |
| Last Export | `StatsCard` | Show last export date |
| Quick Actions | `QuickActions` | Buttons: Add Sentences, Go to Pending, Export |

---

#### Task 3: Create StatsCard Component

**File:** `src/components/dashboard/StatsCard.tsx`

| Prop | Type | Description |
|------|------|-------------|
| label | string | Card label (e.g., "Total Sentences") |
| value | number | Count value |
| icon | ReactNode | Optional icon |
| variant | "default" \| "success" \| "warning" | Color variant |

---

#### Task 4: Create StatsGrid Component

**File:** `src/components/dashboard/StatsGrid.tsx`

- Grid layout for 4 StatsCard components
- Responsive: 1 col mobile, 2 col tablet, 4 col desktop

---

#### Task 5: Create QuickActions Component

**File:** `src/components/dashboard/QuickActions.tsx`

| Button | Target | Description |
|--------|--------|-------------|
| Add Sentences | /sentences/add | Navigate to add form |
| Go to Pending | /sentences?status=PENDING | Filter sentences |
| Export to HF | /export | Navigate to export page |

---

#### Task 6: Create Stats Store

**File:** `src/store/statsStore.ts`

```typescript
interface StatsStore {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}
```

---

#### Task 7: Create Stats Service

**File:** `src/services/stats.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| getStats() | GET /stats | Fetch dashboard statistics |

---

#### Task 8: Write Tests

| Test File | Cases |
|-----------|-------|
| `statistics.service.test.ts` | getDashboardStats returns correct counts, handles null lastExportAt |
| `stats.route.test.ts` | GET /api/stats returns 200, handles errors |

---

### 3.3 Definition of Done

- [ ] GET /api/stats endpoint implemented
- [ ] Dashboard shows total, translated, pending, exported counts
- [ ] Last export date displayed
- [ ] Quick action buttons navigate to correct pages
- [ ] Loading and error states handled
- [ ] All tests pass

---

## Phase 4 — Export Foundation

### 4.1 Backend Tasks

#### Task 1: Implement Export Service

**File:** `src/lib/services/export.service.ts`

| Method | Description | Return Type |
|--------|-------------|-------------|
| `previewExport()` | Return first 10 translated sentences | `Promise<PreviewResult>` |
| `generateJSONL()` | Generate JSONL content from translated sentences | `Promise<string>` |
| `getExportStatus(jobId)` | Get status of export job | `Promise<ExportStatus>` |

**PreviewResult type:**
```typescript
interface PreviewResult {
  preview: { arabic: string; hassani: string }[];
  count: number;
}
```

**ExportStatus type:**
```typescript
interface ExportStatus {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt: string | null;
  totalProcessed: number;
  failedItems: string[];
  error: string | null;
}
```

---

#### Task 2: Implement Hugging Face Client

**File:** `src/lib/services/huggingface.service.ts`

| Method | Description |
|--------|-------------|
| `downloadDataset()` | Download existing dataset from HF repo |
| `uploadDataset(content)` | Upload JSONL content to HF repo |

**Config:**
```env
HUGGINGFACE_TOKEN=hf_...
HUGGINGFACE_REPO=ahmed200512/hassanie_claude-translation
```

**Rules:**
- Use Hugging Face Hub API (REST)
- Handle rate limits (30 req/min free tier)
- Retry with exponential backoff on 429

---

#### Task 3: Implement Export Routes

| Route | Method | Service Call | Description |
|-------|--------|-------------|-------------|
| `/api/export/preview` | POST | `exportService.previewExport()` | Preview first 10 entries |
| `/api/export/status` | GET | `exportService.getExportStatus()` | Get job status |
| `/api/export/hf` | POST | `exportService.exportToHuggingFace()` | Trigger full export |
| `/api/export/dataset` | GET | `exportService.generateJSONL()` | Download JSONL file |

---

#### Task 4: Implement Export Validation

**File:** `src/lib/validators/export.validator.ts`

| Schema | Purpose |
|--------|---------|
| `previewSchema` | Validate preview request (empty body OK) |
| `exportStatusSchema` | Validate jobId query param |
| `exportHfSchema` | Validate export request (empty body OK) |

---

#### Task 5: Write Export Tests

| Test File | Cases |
|-----------|-------|
| `export.service.test.ts` | previewExport returns 10 items, generateJSONL formats correctly, getExportStatus returns status |
| `huggingface.service.test.ts` | downloadDataset fetches content, uploadDataset sends content, handles rate limits |
| `export.route.test.ts` | All 4 routes return correct responses |

---

### 4.2 Frontend Tasks

#### Task 6: Create Export Page

**File:** `src/app/export/page.tsx`

| Section | Component | Description |
|---------|-----------|-------------|
| Status Card | `ExportStatusCard` | Last export, job status |
| Preview | `ExportPreview` | First 10 entries as code/table |
| Actions | `ExportActions` | Export button, download button |

---

#### Task 7: Create ExportStatusCard Component

**File:** `src/components/export/ExportStatusCard.tsx`

| Field | Description |
|-------|-------------|
| Last Export | Date of last successful export |
| Job Status | Idle / Processing / Completed / Failed |
| Sentences Exported | Count from last export |

---

#### Task 8: Create ExportPreview Component

**File:** `src/components/export/ExportPreview.tsx`

- Button "Preview Export" triggers preview API
- Displays first 10 translated sentences as JSONL code block
- Loading state while fetching preview

---

#### Task 9: Create Export Actions Component

**File:** `src/components/export/ExportActions.tsx`

| Button | Action | Disabled When |
|--------|--------|---------------|
| Export to Hugging Face | Triggers POST /api/export/hf | No translated sentences or export running |
| Download Dataset | Triggers GET /api/export/dataset | No translated sentences |

---

#### Task 10: Create Export Store

**File:** `src/store/exportStore.ts`

```typescript
interface ExportStore {
  status: ExportStatus | null;
  preview: { arabic: string; hassani: string }[] | null;
  previewCount: number;
  isLoading: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  fetchPreview: () => Promise<void>;
  exportToHF: () => Promise<void>;
  downloadDataset: () => Promise<void>;
}
```

---

#### Task 11: Create Export Service

**File:** `src/services/export.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| preview() | POST /export/preview | Get preview data |
| getStatus() | GET /export/status | Get job status |
| exportToHF() | POST /export/hf | Trigger export |
| downloadDataset() | GET /export/dataset | Download JSONL file |

---

#### Task 12: Write Frontend Tests

| Test File | Cases |
|-----------|-------|
| `ExportStatusCard.test.tsx` | Renders status, shows loading |
| `ExportPreview.test.tsx` | Shows preview, handles empty |
| `ExportActions.test.tsx` | Buttons enabled/disabled correctly |

---

### 4.3 Definition of Done

- [ ] POST /api/export/preview returns first 10 translated sentences
- [ ] GET /api/export/status returns job status
- [ ] POST /api/export/hf triggers export to Hugging Face
- [ ] GET /api/export/dataset downloads JSONL file
- [ ] Export page shows status card, preview, and actions
- [ ] Preview displays formatted JSONL
- [ ] Export button disabled when no translated sentences
- [ ] Status polling works during export
- [ ] All tests pass

---

## Dependency Map

```
Phase 3 (Dashboard)     Phase 4 (Export Foundation)
       |                        |
   GET /stats            POST /export/preview
       |                 GET /export/status
   Dashboard page        POST /export/hf
       |                 GET /export/dataset
   StatsCard             Export page
   StatsGrid             ExportStatusCard
   QuickActions          ExportPreview
                         ExportActions
```
