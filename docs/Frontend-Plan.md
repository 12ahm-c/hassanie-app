Based on the provided API Contract.md and architecture.md for the Hassaniya Translation Manager, and the structure of the previous frontend-plan.md, here is a complete and well-structured Frontend Plan tailored to the new application.

---

Hassaniya Translation Manager – Frontend Plan

Version: 1.0 – Août 2026
Document interne – équipe frontend

---

1. Purpose

This document enables the frontend team to work in parallel with the backend while avoiding contract drift. It does not authorize new endpoints, DTO fields, business rules, dependencies, or environment variables.

Frontend source of truth:

· API shapes/events/errors: API Contract.md
· Business behavior and MVP boundaries: architecture.md
· Runtime/API URLs: determined by environment (see section 3)
· Cross-team sequencing: defined in master planning

---

2. Ownership

Frontend owns:

· src/app/ (Next.js App Router pages)
· src/components/ (All UI components)
· src/hooks/ (Custom React hooks)
· src/services/ (API client and service layers)
· src/store/ (State management - Zustand)
· Frontend-only tests and UI documentation

Frontend must not edit backend, API routes, or database schemas unless explicitly assigned.

---

3. Current Runtime

Run from repository root:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

Backend REST base URL is:

```
http://localhost:3000/api  (Next.js API Routes) or http://localhost:3001/api
```

Environment variables (provided by backend team / DevOps) will override these in staging/production.

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_HUGGINGFACE_REPO=ahmed200512/hassanie_claude-translation
```

---

4. Frontend Rules

· Use the central API client shell; do not scatter raw fetch logic when a shared client method exists.
· Every async screen must include loading, error, empty, and success states.
· Mobile/tablet behavior must be considered in each visible feature slice (responsive grid, touch-friendly buttons).
· Frontend mocks must match the API contract exactly and be clearly labeled as mocks.
· Do not invent DTO fields to make UI easier.
· Do not expose secrets in NEXT_PUBLIC_*. Only intentionally public browser keys may be exposed after documentation.
· Do not import backend code.
· Do not implement hidden business rules in the UI; backend remains authoritative.

UI Component and Icon Rules

· Use shadcn/ui-style components for reusable UI primitives.
· Use lucide-react as the default icon library.
· Keep shared components accessible: semantic HTML, keyboard support, focus states, labels, sufficient contrast.
· Keep UI primitives presentation-focused; do not embed API contract assumptions or business rules inside generic components.

---

5. Mock Data and Backend Swap Rule

The frontend team may use mock data before backend endpoints are ready, but mocks must be shaped exactly like API Contract.md.

Mock Rules

· Mock responses must use the standard envelope: { success, data, error, meta }.
· Mock success data must match the documented endpoint response shape exactly.
· Mock errors must use documented error.code, error.message, and optional error.fields shape.
· Mock IDs must be integer IDs (as per Prisma schema).
· Mock timestamps must be ISO 8601 UTC strings.
· Pagination: offset-based (page, limit, total).

Backend Swap Rule

· UI code should call an adapter/API-client layer, not hardcode mock imports inside components.
· Replacing mocks with real backend calls should require changing the data source only, not rewriting screens.
· If a needed field is missing from the API contract, stop and request contract approval instead of adding it to the mock.

---

6. Phase-by-Phase Frontend Work

Phase 1 — Layout & Infrastructure

Deliverables:

· Project setup with Next.js App Router
· Tailwind CSS configuration
· shadcn/ui component library setup (Button, Input, Card, Table, Badge, etc.)
· Global layout (src/app/layout.tsx)
· Navigation sidebar with links (dashboard, sentences, export)
· Environment configuration (src/lib/env.ts)

Pages:

· / → Redirect to /dashboard

Do not:

· Add authentication (V1 has no auth)
· Add complex state management

---

Phase 2 — Dashboard & Statistics

Deliverables:

· Dashboard page (/dashboard) showing:
  · Total sentences count
  · Translated sentences count
  · Pending sentences count
  · Exported sentences count
  · Last export date
· KPI cards with animated counters
· Quick action buttons (Add Sentences, Go to Pending, Export to HF)

Endpoint to integrate:

· GET /api/stats → statisticsService.getDashboardStats()

Mock data shape:

```typescript
{
  success: true,
  data: {
    totalSentences: 1000,
    translated: 50,
    pending: 950,
    exported: 45,
    lastExportAt: "2026-08-07T12:00:00.000Z"
  },
  error: null,
  meta: null
}
```

Do not:

· Perform calculations client-side – display only what backend sends
· Cache stale data beyond 5 minutes

---

Phase 3 — Sentence Management (Core)

Deliverables:

3.1 Sentence List (/sentences)

· Table with columns: ID, Arabic, Hassaniya, Status (badge), Exported, Created At, Actions
· Filters:
  · Status filter (All, PENDING, TRANSLATED)
  · Exported filter (All, Exported, Not Exported)
  · Search box (search in Arabic text)
· Pagination: Page navigation with page and limit
· Actions per row:
  · Edit (opens inline or modal with translation input)
  · Delete (with confirmation)

Endpoint to integrate:

· GET /api/sentences → phraseService.findAll()

Mock data shape:

```typescript
{
  success: true,
  data: [
    {
      id: 1,
      arabic: "المحكمة رفضت قبول شهادة الأخ...",
      hassaniya: "المحكمة آبات تقبل شهادة الأخ...",
      status: "TRANSLATED",
      exportedAt: "2026-08-07T12:00:00.000Z",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-07T11:30:00.000Z"
    }
  ],
  error: null,
  meta: { page: 1, limit: 20, total: 150, pendingCount: 60, translatedCount: 90 }
}
```

3.2 Add Sentences (/sentences/add)

· Textarea for pasting multiple Arabic sentences (one per line)
· Submit button with loading state
· Success feedback: Number of added sentences, duplicates skipped
· Error handling: Validation errors, duplicate detection

Endpoint to integrate:

· POST /api/sentences/batch → phraseService.createBatch()

Mock data shape:

```typescript
{
  success: true,
  data: {
    created: [{ id: 1, arabic: "..." }],
    duplicates: [{ arabic: "...", message: "Skipped: already exists" }],
    totalCreated: 2,
    totalDuplicates: 0
  },
  error: null,
  meta: null
}
```

3.3 Edit Translation (Inline/Modal)

· Field: Hassaniya translation text input
· Save button (updates status automatically)
· Clear button (sets translation to empty, status to PENDING)

Endpoint to integrate:

· PUT /api/sentences/:id → phraseService.updateTranslation()

Do not:

· Allow editing Arabic text (prevents duplication issues)
· Allow batch edits without backend support

---

Phase 4 — Export Management

Deliverables:

4.1 Export Page (/export)

· Export status card:
  · Last export date
  · Number of sentences exported
  · Current job status (Idle, Processing, Completed, Failed)
· Preview section:
  · Button "Preview Export" → shows first 10 translated sentences in JSONL format
  · Display as code block or formatted table
· Export action:
  · "Export to Hugging Face" button with loading state
  · Disabled when no translated sentences exist
  · Disabled when export is already running
· Download section:
  · "Download Dataset (JSONL)" button

Endpoints to integrate:

· POST /api/export/preview → exportService.previewExport()
· POST /api/export/hf → exportService.exportToHuggingFace()
· GET /api/export/status → exportService.getExportStatus()
· GET /api/export/dataset → File download (JSONL)

Mock data shape:

```typescript
// Preview
{
  success: true,
  data: {
    preview: [
      { arabic: "...", hassani: "..." }
    ],
    count: 50
  },
  error: null,
  meta: null
}

// Export
{
  success: true,
  data: {
    jobId: "exp_123456789",
    status: "COMPLETED",
    message: "Export job completed successfully",
    sentencesExported: 50,
    datasetSizeBefore: 100,
    datasetSizeAfter: 150,
    duplicatesRemoved: 0
  },
  error: null,
  meta: null
}
```

Do not:

· Generate JSONL client-side – use backend download endpoint
· Allow multiple simultaneous exports – rely on backend idempotence
· Display raw JSONL if too large (use preview limit)

---

Phase 5 — State Management (Zustand)

Store Structure:

Store Responsibility
sentenceStore Sentence list, filters, pagination, selected sentence, CRUD operations
statsStore Dashboard statistics, last export date
exportStore Export status, job ID, export progress
uiStore Sidebar open/close, modal visibility, loading flags, toast messages

Example store (sentenceStore):

```typescript
interface SentenceStore {
  sentences: Sentence[];
  filters: { status?: string; exported?: boolean; search?: string };
  pagination: { page: number; limit: number; total: number };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSentences: (filters?: Filters) => Promise<void>;
  addSentences: (phrases: string[]) => Promise<BatchResult>;
  updateTranslation: (id: number, hassaniya: string) => Promise<void>;
  deleteSentence: (id: number) => Promise<void>;
  clearFilters: () => void;
}
```

Do not:

· Create stores for UI-only state (use local state)
· Store API responses in multiple stores (single source of truth)
· Mutate store state directly (use immer or spread operators)

---

Phase 6 — API Client & Services

Structure:

```typescript
// src/lib/api/client.ts
export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    // Implementation with query params
  }
  
  async post<T>(path: string, body?: any): Promise<T> {
    // Implementation with JSON body
  }
  
  async put<T>(path: string, body?: any): Promise<T> {
    // Implementation
  }
  
  async delete<T>(path: string): Promise<T> {
    // Implementation
  }
  
  async download(path: string, filename: string): Promise<void> {
    // Implementation for file downloads
  }
}

// src/lib/services/sentence.service.ts
export class SentenceService {
  constructor(private client: ApiClient) {}
  
  async findAll(params: SentenceFilters): Promise<PaginatedResponse<Sentence>> {
    return this.client.get('/sentences', params);
  }
  
  async createBatch(phrases: string[]): Promise<BatchResult> {
    return this.client.post('/sentences/batch', { phrases });
  }
  
  async updateTranslation(id: number, hassaniya: string): Promise<Sentence> {
    return this.client.put(`/sentences/${id}`, { hassaniya });
  }
  
  async delete(id: number): Promise<void> {
    return this.client.delete(`/sentences/${id}`);
  }
}
```

Do not:

· Use any type – use DTO types from API Contract.md
· Mix service concerns (e.g., SentenceService shouldn't handle export)
· Call API client directly from components (use services)

---

Phase 7 — Hooks

Custom Hooks:

```typescript
// src/hooks/useSentences.ts
export const useSentences = () => {
  const store = useSentenceStore();
  // ... delegates to store actions
  return {
    sentences: store.sentences,
    isLoading: store.isLoading,
    error: store.error,
    fetchSentences: store.fetchSentences,
    addSentences: store.addSentences,
    updateTranslation: store.updateTranslation,
    deleteSentence: store.deleteSentence,
  };
};

// src/hooks/useStats.ts
export const useStats = () => {
  const store = useStatsStore();
  return {
    stats: store.stats,
    isLoading: store.isLoading,
    fetchStats: store.fetchStats,
  };
};

// src/hooks/useExport.ts
export const useExport = () => {
  const store = useExportStore();
  return {
    status: store.status,
    jobId: store.jobId,
    preview: store.preview,
    exportToHF: store.exportToHF,
    previewExport: store.previewExport,
    downloadDataset: store.downloadDataset,
  };
};

// src/hooks/useDebounce.ts (utility)
export const useDebounce = <T>(value: T, delay: number): T => {
  // ... debounce implementation for search
};
```

---

Phase 8 — UI Components

Component Structure:

```
src/components/
├── ui/                     # shadcn/ui primitives (Button, Card, Input, etc.)
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── MainLayout.tsx
├── dashboard/
│   ├── StatsCard.tsx
│   ├── StatsGrid.tsx
│   └── QuickActions.tsx
├── sentences/
│   ├── SentenceTable.tsx
│   ├── SentenceRow.tsx
│   ├── StatusBadge.tsx
│   ├── SentenceFilters.tsx
│   ├── AddSentenceForm.tsx
│   └── EditTranslationModal.tsx
├── export/
│   ├── ExportStatusCard.tsx
│   ├── ExportPreview.tsx
│   ├── ExportActions.tsx
│   └── DatasetDownload.tsx
└── shared/
    ├── LoadingSpinner.tsx
    ├── ErrorState.tsx
    ├── EmptyState.tsx
    ├── Pagination.tsx
    └── Toast.tsx
```

Component Example (SentenceTable):

```typescript
// src/components/sentences/SentenceTable.tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SentenceTableProps {
  sentences: Sentence[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const SentenceTable: React.FC<SentenceTableProps> = ({ sentences, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Arabic</TableHead>
          <TableHead>Hassaniya</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Exported</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sentences.map((sentence) => (
          <TableRow key={sentence.id}>
            <TableCell>{sentence.id}</TableCell>
            <TableCell className="max-w-xs truncate">{sentence.arabic}</TableCell>
            <TableCell className="max-w-xs truncate">{sentence.hassaniya || '—'}</TableCell>
            <TableCell>
              <Badge variant={sentence.status === 'TRANSLATED' ? 'success' : 'warning'}>
                {sentence.status}
              </Badge>
            </TableCell>
            <TableCell>{sentence.exportedAt ? '✅' : '❌'}</TableCell>
            <TableCell>
              <Button size="sm" variant="ghost" onClick={() => onEdit(sentence.id)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(sentence.id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

---

Phase 9 — Routing (Next.js App Router)

Pages Structure:

```
src/app/
├── (dashboard)/
│   ├── layout.tsx                # Dashboard layout with sidebar
│   ├── page.tsx                  # Redirect to /dashboard
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page
│   ├── sentences/
│   │   ├── page.tsx              # Sentence list
│   │   └── add/
│   │       └── page.tsx          # Add sentences form
│   └── export/
│       └── page.tsx              # Export management
├── layout.tsx                    # Root layout
└── page.tsx                      # Landing/Redirect
```

Navigation Structure:

```typescript
// src/components/layout/Sidebar.tsx
const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/sentences', icon: FileText, label: 'Sentences' },
  { href: '/sentences/add', icon: Plus, label: 'Add Sentences' },
  { href: '/export', icon: Upload, label: 'Export' },
];
```

---

Phase 10 — Production Hardening

Deliverables:

· Accessibility pass (keyboard navigation, screen reader labels)
· Responsive / mobile pass (tables scrollable, forms usable on small screens)
· Performance pass (lazy loading, memoization, pagination)
· Empty/error/loading consistency across all screens
· Production build verification (npm run build)
· Error boundary implementation for React components
· Toast notifications for success/error feedback

---

7. Frontend Definition of Done

· Uses documented API contract only
· Mock data, if used, matches API Contract.md exactly and can be swapped for backend responses through the API client/adapter layer
· Handles loading, error, empty, and success states
· Mobile layout reviewed
· No backend imports
· No secret exposure
· npm run lint, npm run typecheck, and npm run build pass

---

8. Checklist Production

Step Status
Environment variables configured ☐
API client points to correct base URL ☐
Mock data replaced with real endpoints ☐
All screens handle loading/error/empty states ☐
Responsive design verified ☐
Accessibility basics (labels, focus, contrast) ☐
Production build passes ☐
Zustand stores initialized correctly ☐
Toast notifications for user feedback ☐

---

Fin du document – Frontend Team Plan Hassaniya Translation Manager V1.0