# Lingo Bridge — Til markazi platformasi

> «Til ko'prigi» / **Lingo Bridge** Spin-off korxonasi uchun raqamli platforma.
> UrDPI (Urganch davlat pedagogika instituti) huzuridagi til markazining uchta asosiy xizmatini bir joyga yig'adi: **hujjat tarjimasi**, **tezkor tarjima**, va **o'quv materiali yaratish**.

Bu repozitoriy — g'oyadan production'gacha bo'lgan barcha rejalashtirish hujjatlarini o'z ichiga oladi. Ishlab chiqishni shu yerdan boshlash mumkin.

---

## Nima bu?

Platforma korxona NIZOMi (ustavi)dagi uch yo'nalishga to'g'ridan-to'g'ri asoslangan:

| Modul | Ustav asosi | Tavsif |
|---|---|---|
| **Hujjat tarjimasi** | §4.2 | Diplom, transkript, sertifikat, dissertatsiya, rasmiy hujjatlarni yuklab, tarjima qildirib, formatni saqlagan holda qaytarib olish. Notarial tasdiq oqimi bilan. |
| **Tezkor tarjima** | §4.2 | So'z/matnni bir zumda tarjima qilish. Akademik atamalar rejimi, tinglash (TTS), tarix. |
| **O'quv materiali** | §4.1, §3.3 | Fan + mavzu kiritib, CEFR darajasiga mos dars rejasi, mashqlar, test, lug'at va h.k. yaratish. |
| **Platforma o'zi** | §4.3 | "Onlayn platforma va AI vositalarini joriy etish" — ustavda alohida ko'zda tutilgan. |

Rollar: **Mijoz** (client), **Tarjimon** (translator), **Admin**.

---

## Tech stack

Monorepo (pnpm workspaces). Har bir servis alohida deploy qilinadi.

| Qatlam | Texnologiya | Sabab |
|---|---|---|
| **Web (frontend)** | React 18 + TypeScript + Vite + Tailwind | Prototipdagi dizayn tizimini olib o'tish oson; katta ekotizim. Flutter web ham muqobil. |
| **API (backend)** | Node.js 20 + Fastify + TypeScript + Prisma | Tezkor, tipizatsiyalangan, Postgres bilan yaxshi ishlaydi. |
| **Doc-worker** | Python 3.12 + FastAPI + Tesseract/PyMuPDF/python-docx | OCR va format saqlash Python'da ancha qulay. |
| **Ma'lumotlar** | PostgreSQL 16 | Asosiy DB. |
| **Navbat (queue)** | Redis + BullMQ | Uzoq davom etadigan tarjima ishlari uchun async job. |
| **Fayl saqlash** | MinIO (S3-uyg'un) | Yuklangan/tarjima qilingan fayllar. O'z serveringizda. |
| **AI** | Anthropic Claude (Sonnet) | Tarjima va material yaratish. **Faqat backend'dan chaqiriladi.** |
| **Deploy** | Docker Compose + Caddy | Sizning stack'ingizga mos (Docker, ghcr.io). |

> ⚠️ **Muhim qoida:** Anthropic API kaliti hech qachon frontend'ga chiqmaydi. Barcha AI chaqiruvlari `apps/api` yoki `services/doc-worker` orqali o'tadi.

---

## Repo tuzilishi

```
lingo-bridge/
├── README.md                 ← shu fayl
├── CLAUDE.md                 ← Claude Code uchun yo'riqnoma
├── docs/
│   ├── 01-PRD.md             ← Mahsulot talablari (nima quramiz)
│   ├── 02-ARCHITECTURE.md    ← Arxitektura va data flow
│   ├── 03-DATABASE.md        ← Postgres/Prisma sxemasi
│   ├── 04-API.md             ← REST API spetsifikatsiyasi
│   ├── 05-DESIGN-SYSTEM.md   ← Ranglar, shriftlar, komponentlar
│   ├── 06-ROADMAP.md         ← Bosqichma-bosqich reja + checklist
│   └── 07-DEPLOYMENT.md      ← Docker, env, prod setup
├── apps/
│   ├── web/                  ← React frontend
│   └── api/                  ← Fastify backend
├── services/
│   └── doc-worker/           ← Python OCR + tarjima ishchisi
├── packages/
│   └── shared/               ← Umumiy TS tiplar (web + api)
├── infra/
│   ├── docker-compose.yml
│   └── Caddyfile
└── prototype/
    └── lingo-bridge.html     ← Mavjud UI prototip (referens)
```

---

## Quick start (dev)

Talablar: Node 20+, pnpm 9+, Python 3.12+, Docker.

```bash
# 1. Repo va bog'liqliklar
git clone <repo-url> lingo-bridge && cd lingo-bridge
pnpm install

# 2. Env
cp .env.example .env      # ANTHROPIC_API_KEY va boshqalarni to'ldiring

# 3. Infra (Postgres + Redis + MinIO)
docker compose -f infra/docker-compose.yml up -d postgres redis minio

# 4. DB migratsiya + seed
pnpm --filter api prisma migrate dev
pnpm --filter api db:seed        # demo user: demo@lingobridge.uz / demo1234

# 5. Barchasini dev rejimda ishga tushirish
pnpm dev                          # web :5173, api :3000
# doc-worker alohida:
cd services/doc-worker && uvicorn app.main:app --reload --port 8000
```

Ochish: `http://localhost:5173`

---

## Qayerdan boshlash

1. **[docs/01-PRD.md](docs/01-PRD.md)** — nima quramiz, kimlar uchun.
2. **[docs/06-ROADMAP.md](docs/06-ROADMAP.md)** — bosqichlar. **Phase 1 (MVP)** dan boshlang.
3. **[docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md)** — tizim qanday ishlaydi.
4. Kod yozishdan oldin **[CLAUDE.md](CLAUDE.md)** ni o'qing.

MVP tartibi: Auth → Tezkor tarjima → O'quv materiali → Dashboard/Tarix. Hujjat tarjimasi (OCR + format) — Phase 2, chunki eng murakkab qism.

---

## Holat

🟢 **Tuzilma yaratilgan.** Monorepo (frontend React Vite + backend Fastify + doc-worker Python) yaratildi. Ma'lumotlar bazasi sxemasi (Prisma) yozildi.
Hozirda API va Backend mantiqlarini to'liq integratsiya qilish jarayoni boshlanmoqda.
