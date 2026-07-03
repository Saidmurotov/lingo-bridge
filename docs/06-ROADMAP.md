# 06 — Yo'l xaritasi (Roadmap)

> Bosqichma-bosqich qurish rejasi. Har bosqich oxirida aniq qabul mezoni bor. Checkbox'larni bajarilgan sari belgilang.

## Phase 0 — Setup (poydevor)

Maqsad: bo'sh, lekin ishlaydigan monorepo.

- [ ] Monorepo (pnpm workspaces): `apps/web`, `apps/api`, `packages/shared`, `services/doc-worker`, `infra`.
- [ ] ESLint + Prettier + TypeScript strict (butun repo bo'yicha).
- [ ] `infra/docker-compose.yml`: Postgres + Redis + MinIO.
- [ ] `apps/api`: Fastify skeleton, health endpoint, Prisma ulanishi.
- [ ] Prisma sxema (`docs/03`) + birinchi migratsiya + seed.
- [ ] `apps/web`: Vite + React + Tailwind, design token'lar (`docs/05`), routing skeleton.
- [ ] `.env.example` + `docs/07` bo'yicha env.
- [ ] CI: lint + typecheck + test (GitHub Actions).

**Qabul mezoni:** `pnpm dev` ishlaydi, web bo'sh sahifani ochadi, api health `200` qaytaradi, DB migratsiya o'tadi.

---

## Phase 1 — MVP (asosiy qiymat) ⭐

Maqsad: mijoz kirib, AI xizmatlaridan foydalanadi. **Eng muhim bosqich.**

### Auth
- [ ] `register / login / refresh / logout / me` (`docs/04` §2).
- [ ] Parol `argon2` hash; access + refresh token (rotatsiya).
- [ ] Auth middleware + `requireRole`.
- [ ] Frontend: Login sahifasi (prototipga mos), token saqlash, protected route'lar.

### Tezkor tarjima
- [ ] `POST /api/translate` — `lib/ai.ts` orqali Claude, tarixga yozish.
- [ ] Avto-aniqlash + akademik rejim.
- [ ] Frontend: ikki panelli oyna, swap, belgi hisoblagich, TTS (browser), nusxalash, so'nggi tarjimalar.

### O'quv materiali
- [ ] `POST /api/materials` — Claude, saqlash.
- [ ] Frontend: fan/mavzu/daraja/tur/til/izoh formasi, natija paneli (nusxa/yuklab olish).
- [ ] `GET /api/materials`, `GET /api/materials/:id`.

### Dashboard + Tarix
- [ ] `GET /api/history` (birlashtirilgan).
- [ ] Dashboard: statistika + tezkor amallar + so'nggi faoliyat.
- [ ] Tarix sahifasi + filtr.

### Umumiy
- [ ] Dark mode + mobil responsive (prototip token/layoutidan).
- [ ] Xato holatlari mijozga tushunarli xabar sifatida.
- [ ] AI endpoint'lariga rate limit.

**Qabul mezoni:** ro'yxatdan o'tgan mijoz tezkor tarjima va material yaratadi (real AI), tarixda ko'radi, mobil/dark ishlaydi.

---

## Phase 2 — Hujjat tarjimasi (murakkab qism)

Maqsad: fayl yuklab, tarjimasini olish. Async job + doc-worker.

### Backend + queue
- [ ] `POST /api/documents` (multipart, fayl validatsiya, MinIO'ga saqlash, job yaratish).
- [ ] Redis'ga job qo'yish (`docs/04` §8 payload).
- [ ] `GET /api/documents`, `GET /api/documents/:id`.
- [ ] `GET .../download` — presigned URL, egalik tekshiruvi.
- [ ] Holat yangilash: polling (MVP) yoki SSE.

### doc-worker (Python)
- [ ] Redis'dan job iste'mol qilish (BRPOP/worker loop).
- [ ] **DOCX (digital):** `python-docx` bilan matn ajratish → Claude tarjima → stil saqlab qaytarish. **(Birinchi shu ishlab turishi kerak.)**
- [ ] **Skan/rasm:** Tesseract OCR → tarjima → toza DOCX/PDF.
- [ ] **PDF (digital):** PyMuPDF matn bloklari; yoki PDF→DOCX→tarjima yo'li.
- [ ] Natijani MinIO'ga yozish, DB'da `JobFile(result)` + status yangilash.
- [ ] Xato bo'lsa `FAILED` + `errorMessage`.

### Frontend
- [ ] Drag-and-drop ko'p fayl yuklash + hujjat turi + opsiyalar.
- [ ] Job holat kartalari (progress + badge + yuklab olish).
- [ ] Polling/SSE bilan jonli yangilanish.

**Qabul mezoni:** mijoz DOCX yuklab, boshqa tilga tarjimasini yuklab oladi; skan hujjat uchun hech bo'lmasa toza matnli tarjima chiqadi.

---

## Phase 3 — Tarjimon oqimi + notarial + to'lov

Maqsad: professional/notarial xizmatlar va monetizatsiya.

- [ ] Tarjimon roli UI: tekshiruvdagi (`REVIEW`) buyurtmalar ro'yxati.
- [ ] `POST /api/documents/:id/verify` — AI qoralamasini tahrirlab tasdiqlash.
- [ ] Notarial belgilangan job avtomatik `DONE` bo'lmaydi → `REVIEW` → tarjimon tasdig'i.
- [ ] Admin panel: foydalanuvchilar, buyurtmalar, statistika.
- [ ] (Opsional) Narx + to'lov: Payme/Click integratsiyasi, buyurtma → to'lov → ish boshlanadi.
- [ ] Audit log ko'rinishi (admin).

**Qabul mezoni:** notarial buyurtma tarjimon tomonidan tekshirilib rasmiylashtiriladi; admin tizimni boshqaradi.

---

## Phase 4 — Sayqal (polish)

- [ ] **i18n:** interfeys UZ/EN/RU (satrlar allaqachon bir joyda — endi tarjima qatlamini qo'shish).
- [ ] Email bildirishnomalar (buyurtma tayyor bo'lganda).
- [ ] Analitika/monitoring (Sentry, oddiy metrikalar).
- [ ] Fayl tozalash cron (saqlash siyosati, `docs/03` §6).
- [ ] Performance: cache, lazy load, rasm optimizatsiya.
- [ ] E2E testlar (Playwright) — asosiy oqimlar.

**Qabul mezoni:** ko'p tilli, kuzatiladigan, ishonchli production tizim.

---

## Tavsiya etilgan tartib

```
Phase 0  →  Phase 1 (MVP)  →  ⏸ real foydalanuvchilarga ochish  →  Phase 2  →  Phase 3  →  Phase 4
```

Phase 1 dan keyin platforma allaqachon foydali (tezkor tarjima + material). Hujjat tarjimasi (Phase 2) eng ko'p vaqt oladi — MVP'ni bloklamang, keyin qo'shing.
