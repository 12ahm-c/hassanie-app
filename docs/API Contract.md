Based on the newly generated architecture.md for the Hassaniya Translation Manager project and the structure of the previous API Contract.md, here is a complete and well-structured API Contract document tailored to the new application.

---

Hassaniya Translation Manager — API Contract

Version: 1.0 – V1
Date: Août 2026
Base URL: https://api.hassaniya-translation.com/v1

This document defines the exact request and response shapes for every HTTP endpoint of the Hassaniya Translation Manager API.
It is the single source of truth for frontend and backend teams.

---

Table of Contents

1. Conventions
2. Auth (Optionnel V2)
3. Sentences
4. Statistics
5. Export
6. Health
7. Appendix A – Shared DTOs
8. Appendix B – Error Codes

---

1. Conventions

1.1 Base URL & Versioning

Environment URL
Production https://api.hassaniya-translation.com/v1
Staging https://api.staging.hassaniya-translation.com/v1
Local http://localhost:3000/api

1.2 Authentication (V1)

V1 Note: For the initial MVP version, authentication is disabled to simplify development and usage for a single translator. The application is intended for internal/controlled access.

If authentication is required, the following convention applies:

All endpoints (except login) require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

· accessToken lifetime: 24 hours
· refreshToken lifetime: 7 days

1.3 Standard Response Envelope

Every response (success or failure) uses this envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": null
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERR_CODE",
    "message": "Human readable description",
    "fields": { "fieldName": "reason" }
  },
  "meta": null
}
```

For paginated lists, meta contains pagination metadata:

```json
"meta": {
  "page": 1,
  "limit": 20,
  "total": 150
}
```

1.4 HTTP Status Codes

Code Meaning
200 OK – read or update succeeded
201 Created – resource was created
204 No Content – delete succeeded, no body
400 Validation error – malformed request body/query
401 Unauthenticated – token missing or invalid
403 Forbidden – authenticated but lacks permission
404 Not Found
409 Conflict – duplicate or invalid state transition
422 Unprocessable – semantically wrong
500 Internal Server Error

1.5 Standard Error Codes

Code HTTP Description
VALIDATION_ERROR 400 Input validation failed (see error.fields)
AUTH_REQUIRED 401 No token provided or invalid credentials
TOKEN_EXPIRED 401 Access token expired – call /auth/refresh
TOKEN_INVALID 401 Token signature invalid or revoked
FORBIDDEN 403 Role lacks required permission
NOT_FOUND 404 Resource does not exist
DUPLICATE 409 Unique field already taken (e.g., arabic text)
INVALID_STATE 409 Operation not allowed in current state
INVALID_FILE 422 File type or size not allowed
EXPORT_FAILED 500 Hugging Face export operation failed
INTERNAL 500 Unhandled server error – check logs

1.6 Pagination

Offset-based pagination for all list endpoints: ?page=1&limit=20

· Default limit=20, maximum limit=100
· Response meta includes page, limit, total

1.7 Field Types

Type Format / Example
ObjectId 24 hex chars: "65f2a1b3c4d5e6f7a8b9c0d1"
timestamp ISO 8601 UTC: "2026-08-08T14:32:11.000Z"
URL string, valid URL

---

2. Auth (Optionnel V2)

Note: Les endpoints d'authentification sont inclus pour une éventuelle évolution V2. En V1, ils ne sont pas implémentés.

2.1 POST /auth/login

Auth: Public
Description: Authenticate using email and password.

Request:

```json
{
  "email": "translator@hassaniya.com",
  "password": "string"
}
```

Success (200):

```json
{
  "success": true,
  "data": {
    "user": { /* UserDTO */ },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "error": null,
  "meta": null
}
```

Errors: 401 AUTH_REQUIRED

2.2 POST /auth/refresh

Auth: Public (refresh token in body)
Description: Obtain new access/refresh tokens.

Request:

```json
{
  "refreshToken": "string"
}
```

Success (200): same shape as /auth/login

Errors: 401 TOKEN_INVALID

---

3. Sentences

3.1 POST /sentences/batch

Auth: Public (V1) / Bearer (V2)
Description: Add multiple Arabic sentences at once. Each sentence is created as a separate record with PENDING status.

Request:

```json
{
  "phrases": [
    "المحكمة رفضت قبول شهادة الأخ لأنها تدخل ضمن الأشخاص الذين لديهم عداوة مباشرة مع الخصم",
    "قضية إبطال وصية المتوفى تدخل ضمن الاختصاص الحصري لقضاء الأسرة هنا في العاصمة"
  ]
}
```

Validation Rules:

· phrases is required, non-empty array (min 1, max 100 per batch)
· Each phrase must be a non-empty string (min 2 characters, max 5000)
· Duplicate phrases (based on exact arabic text) are ignored with a warning

Success (201):

```json
{
  "success": true,
  "data": {
    "created": [
      { "id": "65f...", "arabic": "المحكمة رفضت..." },
      { "id": "65f...", "arabic": "قضية إبطال..." }
    ],
    "duplicates": [
      { "arabic": "جملة مكررة", "message": "Skipped: already exists" }
    ],
    "totalCreated": 2,
    "totalDuplicates": 0
  },
  "error": null,
  "meta": null
}
```

Errors:

· 400 VALIDATION_ERROR – Invalid input format
· 409 DUPLICATE – All phrases are duplicates (only if all are duplicates)

3.2 POST /sentences

Auth: Public (V1) / Bearer (V2)
Description: Add a single Arabic sentence.

Request:

```json
{
  "arabic": "المحكمة رفضت قبول شهادة الأخ..."
}
```

Success (201):

```json
{
  "success": true,
  "data": { /* SentenceDTO */ },
  "error": null,
  "meta": null
}
```

Errors:

· 400 VALIDATION_ERROR – Invalid input
· 409 DUPLICATE – Sentence already exists

3.3 GET /sentences

Auth: Public (V1) / Bearer (V2)
Description: List all sentences with optional filters.

Query Params:

· page (integer, default: 1)
· limit (integer, default: 20, max: 100)
· status (string: PENDING, TRANSLATED) – filter by translation status
· search (string) – search in Arabic text
· exported (boolean) – filter by exportedAt presence

Success (200):

```json
{
  "success": true,
  "data": [ /* SentenceDTO[] */ ],
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pendingCount": 60,
    "translatedCount": 90
  }
}
```

3.4 GET /sentences/:id

Auth: Public (V1) / Bearer (V2)
Description: Get a single sentence by its ID.

Path Param: id (ObjectId)

Success (200): SentenceDTO

Errors: 404 NOT_FOUND

3.5 PUT /sentences/:id

Auth: Public (V1) / Bearer (V2)
Description: Update a sentence – primarily used to add or modify the Hassaniya translation.

Request: (all fields optional)

```json
{
  "hassaniya": "المحكمة آبات تقبل شهادة الأخ بيه عنو داخلة الناس الي عندهم عداوة مباشرة مع الخصم"
}
```

Behavior:

· If hassaniya is provided and non-empty, the status is automatically set to TRANSLATED.
· If hassaniya is set to null or empty string, the status is set to PENDING.

Success (200): updated SentenceDTO

Errors:

· 404 NOT_FOUND
· 400 VALIDATION_ERROR

3.6 DELETE /sentences/:id

Auth: Public (V1) / Bearer (V2)
Description: Delete a sentence permanently.

Success (204): No body

Errors: 404 NOT_FOUND

3.7 DELETE /sentences

Auth: Public (V1) / Bearer (V2)
Description: Bulk delete sentences – can delete all or filter by status/exported state.

Request:

```json
{
  "filter": {
    "status": "PENDING",      // Optional: PENDING, TRANSLATED, ALL
    "exported": false,        // Optional: true, false
    "ids": ["id1", "id2"]    // Optional: specific IDs to delete
  }
}
```

Success (200):

```json
{
  "success": true,
  "data": {
    "deletedCount": 45
  },
  "error": null,
  "meta": null
}
```

Errors: 400 VALIDATION_ERROR

---

4. Statistics

4.1 GET /stats

Auth: Public (V1) / Bearer (V2)
Description: Get dashboard statistics.

Success (200):

```json
{
  "success": true,
  "data": {
    "totalSentences": 1000,
    "translated": 50,
    "pending": 950,
    "exported": 45,
    "lastExportAt": "2026-08-07T12:00:00.000Z"
  },
  "error": null,
  "meta": null
}
```

---

5. Export

5.1 POST /export/hf

Auth: Public (V1) / Bearer (V2)
Description: Trigger the export process to Hugging Face. This operation:

1. Fetches all TRANSLATED sentences.
2. Downloads the existing dataset from ahmed200512/hassanie_claude-translation.
3. Merges new translations (deduplicating based on (arabic, hassani)).
4. Uploads the merged dataset back to Hugging Face.

Request: (empty body)

Success (200):

```json
{
  "success": true,
  "data": {
    "jobId": "exp_123456789",
    "status": "PENDING",
    "message": "Export job started successfully",
    "sentencesExported": 50,
    "datasetSizeBefore": 100,
    "datasetSizeAfter": 150,
    "duplicatesRemoved": 0
  },
  "error": null,
  "meta": null
}
```

Errors:

· 422 INVALID_STATE – No translated sentences to export
· 500 EXPORT_FAILED – Hugging Face API error

5.2 GET /export/status

Auth: Public (V1) / Bearer (V2)
Description: Get the status of the last or current export job.

Query Params:

· jobId (string, optional) – Specific job ID to query

Success (200):

```json
{
  "success": true,
  "data": {
    "jobId": "exp_123456789",
    "status": "COMPLETED",   // PENDING, PROCESSING, COMPLETED, FAILED
    "startedAt": "2026-08-08T10:00:00.000Z",
    "completedAt": "2026-08-08T10:05:00.000Z",
    "totalProcessed": 50,
    "failedItems": [],
    "error": null
  },
  "error": null,
  "meta": null
}
```

Errors: 404 NOT_FOUND – Job not found

5.3 POST /export/preview

Auth: Public (V1) / Bearer (V2)
Description: Preview the JSONL content that would be exported to Hugging Face, without actually performing the upload.

Request: (empty body)

Success (200):

```json
{
  "success": true,
  "data": {
    "preview": [
      {
        "arabic": "المحكمة رفضت قبول شهادة الأخ...",
        "hassani": "المحكمة آبات تقبل شهادة الأخ..."
      },
      {
        "arabic": "قضية إبطال وصية المتوفى...",
        "hassani": "قضية إبطال وصية المرحوم..."
      }
    ],
    "count": 50
  },
  "error": null,
  "meta": null
}
```

Errors:

· 422 INVALID_STATE – No translated sentences to preview

5.4 GET /export/dataset

Auth: Public (V1) / Bearer (V2)
Description: Download the full dataset as a JSONL file (the same format uploaded to Hugging Face).

Success (200): Binary file (JSONL) with Content-Type: application/x-ndjson and Content-Disposition: attachment; filename="dataset.jsonl"

Errors:

· 422 INVALID_STATE – No translated sentences to export
· 500 INTERNAL – File generation error

---

6. Health

6.1 GET /health

Auth: Public
Description: Health check endpoint for monitoring.

Success (200):

```json
{
  "status": "ok",
  "timestamp": "2026-08-08T14:32:11.000Z",
  "services": {
    "database": "connected",
    "huggingface": "reachable"
  }
}
```

---

Appendix A – Shared DTOs

SentenceDTO

```json
{
  "id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "arabic": "المحكمة رفضت قبول شهادة الأخ لأنها تدخل ضمن الأشخاص الذين لديهم عداوة مباشرة مع الخصم",
  "hassaniya": "المحكمة آبات تقبل شهادة الأخ بيه عنو داخلة الناس الي عندهم عداوة مباشرة مع الخصم",
  "status": "TRANSLATED",
  "exportedAt": "2026-08-07T12:00:00.000Z",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-07T11:30:00.000Z"
}
```

UserDTO (V2)

```json
{
  "id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "name": "Traducteur Principal",
  "email": "translator@hassaniya.com",
  "role": "translator",
  "createdAt": "2026-08-01T00:00:00.000Z",
  "lastActiveAt": "2026-08-08T14:30:00.000Z"
}
```

---

Appendix B – Error Codes

Code HTTP Description
AUTH_REQUIRED 401 No token provided or invalid credentials
TOKEN_EXPIRED 401 Access token expired
TOKEN_INVALID 401 Token signature invalid
FORBIDDEN 403 Role lacks permission
NOT_FOUND 404 Resource does not exist
VALIDATION_ERROR 400 Input validation failed
DUPLICATE 409 Unique field violation (e.g., duplicate Arabic text)
INVALID_STATE 422 Operation not allowed in current state
INVALID_FILE 422 File type or size not allowed
EXPORT_FAILED 500 Hugging Face export operation failed
INTERNAL 500 Server error

---

End of API Contract – Hassaniya Translation Manager V1

This document is the single source of truth for all API interactions. All changes require team approval and must be kept in sync with implementation.