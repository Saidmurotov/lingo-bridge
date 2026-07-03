# 04 — API spetsifikatsiyasi

> `apps/api` REST interfeysi. Bazaviy yo'l: `/api`. JSON only. Auth: `Authorization: Bearer <accessToken>`.

## 1. Konvensiyalar

**Muvaffaqiyat:**
```json
{ "data": { /* ... */ } }
```

**Xato:**
```json
{ "error": { "code": "INVALID_INPUT", "message": "Email noto'g'ri" } }
```

**Xato kodlari (HTTP + code):**

| HTTP | code | Ma'no |
|---|---|---|
| 400 | `INVALID_INPUT` | Zod validatsiya xatosi |
| 401 | `UNAUTHORIZED` | Token yo'q/yaroqsiz |
| 403 | `FORBIDDEN` | Rol/egalik yetarli emas |
| 404 | `NOT_FOUND` | Resurs topilmadi |
| 409 | `CONFLICT` | Masalan email band |
| 413 | `FILE_TOO_LARGE` | Fayl hajmi cheklovdan katta |
| 415 | `UNSUPPORTED_MEDIA` | MIME ruxsat etilmagan |
| 429 | `RATE_LIMITED` | Ko'p so'rov |
| 500 | `INTERNAL` | Server xatosi |

**Paginatsiya (ro'yxatlar):** `?page=1&limit=20` → javobda `{ data: { items, total, page, limit } }`.

---

## 2. Auth

### `POST /api/auth/register`
```json
// request
{ "email": "user@mail.uz", "password": "min8chars", "fullName": "Ism Familiya" }
// 201 → { "data": { "user": { "id", "email", "fullName", "role" } } }
```

### `POST /api/auth/login`
```json
// request
{ "email": "demo@lingobridge.uz", "password": "demo1234" }
// 200
{ "data": {
    "accessToken": "eyJ...",           // ~15 min
    "refreshToken": "eyJ...",          // ~30 kun
    "user": { "id", "email", "fullName", "role" }
} }
```

### `POST /api/auth/refresh`
```json
{ "refreshToken": "eyJ..." }
// 200 → { "data": { "accessToken": "...", "refreshToken": "..." } }  // rotatsiya
```

### `POST /api/auth/logout`
```json
{ "refreshToken": "eyJ..." }   // token bekor qilinadi
// 204
```

### `GET /api/auth/me`  *(auth)*
```json
// 200 → { "data": { "id", "email", "fullName", "role", "createdAt" } }
```

---

## 3. Tezkor tarjima

### `POST /api/translate`  *(auth)*
Sinxron. Backend Claude'ni chaqiradi, tarixga yozadi.
```json
// request
{
  "text": "The hypothesis was rejected.",
  "fromLang": null,            // null = avto-aniqlash
  "toLang": "UZ",
  "academic": true             // akademik atamalar rejimi
}
// 200
{ "data": {
    "id": "cku...",
    "resultText": "Gipoteza rad etildi.",
    "detectedLang": "EN"       // avto-aniqlangan bo'lsa
} }
```

---

## 4. O'quv materiali

### `POST /api/materials`  *(auth)*
Sinxron. Claude material yaratadi.
```json
// request
{
  "subject": "Ingliz tili",
  "topic": "Present Perfect",
  "level": "B1",
  "type": "EXERCISES",
  "outputLang": "UZ",
  "notes": "10 ta gap, kalitlari bilan"
}
// 201
{ "data": { "id": "cku...", "content": "..." } }
```

### `GET /api/materials`  *(auth)* — o'z materiallari ro'yxati (paginatsiya).
### `GET /api/materials/:id`  *(auth)* — bitta material.

---

## 5. Hujjat tarjimasi

### `POST /api/documents`  *(auth)*
`multipart/form-data`. Fayl(lar) + opsiyalar. Job yaratadi, **asinxron**.

Form maydonlari:
- `files[]` — bir yoki bir nechta fayl (PDF/DOCX/JPG/PNG, har biri ≤ 20MB)
- `docType` — `DIPLOMA | TRANSCRIPT | CERTIFICATE | DISSERTATION | OTHER`
- `fromLang`, `toLang` — `UZ | EN | RU`
- `notarize`, `keepFormat`, `urgent` — boolean

```json
// 202 Accepted
{ "data": {
    "jobId": "cku...",
    "status": "QUEUED",
    "files": [ { "id", "originalName", "sizeBytes" } ]
} }
```

### `GET /api/documents`  *(auth)* — o'z buyurtmalari (status bilan, paginatsiya).

### `GET /api/documents/:id`  *(auth)*
Bitta buyurtma holati. UI shu bilan polling qiladi (yoki SSE, 6-bo'lim).
```json
{ "data": {
    "id": "cku...",
    "status": "DONE",
    "docType": "DIPLOMA",
    "fromLang": "UZ", "toLang": "EN",
    "notarize": false,
    "files": [
      { "id", "kind": "source", "originalName": "diplom.pdf" },
      { "id", "kind": "result", "originalName": "diplom_en.docx" }
    ],
    "completedAt": "2026-07-01T..."
} }
```

### `GET /api/documents/:id/files/:fileId/download`  *(auth)*
Egalik tekshiriladi → MinIO **presigned URL** (302 redirect yoki `{ data: { url } }`).

### `POST /api/documents/:id/verify`  *(auth, TRANSLATOR/ADMIN)* — *Phase 3*
Notarial buyurtmani tarjimon tasdiqlaydi (tahrirlangan natijani yuklab, `DONE` qiladi).
```json
{ "resultFileId": "cku...", "note": "Tekshirildi" }
// 200 → { "data": { "status": "DONE" } }
```

---

## 6. Real-time holat (tanlov)

Job holatini yangilash uchun ikki variant:

- **Polling** (sodda, MVP): web `GET /api/documents/:id` ni har 2–3 sekundda chaqiradi holat `DONE`/`FAILED` bo'lguncha.
- **SSE** (yaxshiroq): `GET /api/documents/:id/events` — server holat o'zgarganda push qiladi. WebSocket shart emas; SSE yetarli.

---

## 7. Tarix

### `GET /api/history`  *(auth)*
Barcha xizmatlarni birlashtirilgan ko'rinishda qaytaradi (tezkor tarjima + material + hujjat), sana bo'yicha.
```json
{ "data": { "items": [
    { "type": "quick",    "id": "...", "summary": "EN→UZ: The hypothesis...", "createdAt": "..." },
    { "type": "material", "id": "...", "summary": "Ingliz tili / Present Perfect / B1", "createdAt": "..." },
    { "type": "document", "id": "...", "summary": "Diplom UZ→EN", "status": "DONE", "createdAt": "..." }
], "total": 42, "page": 1, "limit": 20 } }
```
Filtr: `?type=quick|material|document`.

---

## 8. Redis job payload (api → doc-worker)

`api` navbatga quyidagini qo'yadi (worker shu formatni kutadi):
```json
{
  "jobId": "cku...",
  "docType": "DIPLOMA",
  "fromLang": "UZ",
  "toLang": "EN",
  "notarize": false,
  "keepFormat": true,
  "sourceFiles": [
    { "fileId": "...", "storageKey": "jobs/<jobId>/source/diplom.pdf", "mimeType": "application/pdf" }
  ]
}
```
Worker natijani MinIO'ga `jobs/<jobId>/result/...` sifatida yozadi, DB'da `JobFile(kind="result")` yaratadi va `status`ni yangilaydi (`DONE` yoki notarial bo'lsa `REVIEW`).

---

## 9. Rate limiting

- Auth endpoint'lari: IP bo'yicha qattiqroq (brute-force'ga qarshi).
- AI endpoint'lari (`/translate`, `/materials`): foydalanuvchi bo'yicha limit (masalan daqiqasiga N) — Anthropic xarajatini nazoratda tutish uchun.
- Fastify `@fastify/rate-limit` + Redis store.
