# 07 — Deploy va infratuzilma

> Docker Compose bilan lokal va prod. Sizning stack'ingizga mos (Docker, `ghcr.io`).

## 1. Muhit o'zgaruvchilari (`.env`)

`.env.example` dan nusxa oling. **Hech qachon `.env` ni git'ga qo'ymang.**

```bash
# --- App ---
NODE_ENV=production
API_PORT=3000
WEB_ORIGIN=https://lingobridge.uz          # CORS uchun

# --- Database ---
DATABASE_URL=postgresql://lingo:CHANGE_ME@postgres:5432/lingobridge

# --- Auth ---
JWT_ACCESS_SECRET=CHANGE_ME_long_random
JWT_REFRESH_SECRET=CHANGE_ME_another_random
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# --- Anthropic (faqat server) ---
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# --- Redis (queue) ---
REDIS_URL=redis://redis:6379

# --- MinIO (S3 storage) ---
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=CHANGE_ME
S3_SECRET_KEY=CHANGE_ME
S3_BUCKET=lingo-files
S3_REGION=us-east-1

# --- Fayl siyosati ---
MAX_UPLOAD_MB=20
FILE_RETENTION_SOURCE_DAYS=30
FILE_RETENTION_RESULT_DAYS=90

# --- doc-worker ---
WORKER_CONCURRENCY=2
TESSERACT_LANGS=eng+rus+uzb
```

> **Maslahat:** `JWT_*` va MinIO kalitlarini `openssl rand -hex 32` bilan yarating.

## 2. docker-compose (`infra/docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lingo
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: lingobridge
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lingo"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    ports: ["9001:9001"]        # konsol (faqat ichki tarmoqda och)
    volumes: [miniodata:/data]

  api:
    image: ghcr.io/<org>/lingo-api:latest
    env_file: [../.env]
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
      minio: { condition: service_started }
    # migratsiya avtomatik: entrypoint'da `prisma migrate deploy`

  doc-worker:
    image: ghcr.io/<org>/lingo-doc-worker:latest
    env_file: [../.env]
    depends_on:
      redis: { condition: service_started }
      minio: { condition: service_started }
      postgres: { condition: service_healthy }

  web:
    image: ghcr.io/<org>/lingo-web:latest
    # statik build; Caddy tomonidan uzatiladi (pastda)

  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddydata:/data
    depends_on: [api, web]

volumes:
  pgdata: {}
  redisdata: {}
  miniodata: {}
  caddydata: {}
```

## 3. Reverse proxy (`infra/Caddyfile`)

Caddy avtomatik HTTPS (Let's Encrypt) beradi.

```
lingobridge.uz {
    # API
    handle /api/* {
        reverse_proxy api:3000
    }
    # Frontend (statik SPA)
    handle {
        root * /srv/web
        try_files {path} /index.html
        file_server
    }
    encode gzip zstd
}
```

> Muqobil: Nginx. Lekin Caddy bilan TLS sozlash ancha sodda.

## 4. Migratsiya (prod)

API konteyneri ishga tushganda `prisma migrate deploy` ni entrypoint'da bajaradi (yangi migratsiyalarni xavfsiz qo'llaydi). Yoki qo'lda:

```bash
docker compose run --rm api pnpm prisma migrate deploy
```

MinIO bucket'ni birinchi ishga tushirishda yarating (init script yoki `mc mb local/lingo-files`).

## 5. Image build va push (ghcr.io)

Har servis uchun `Dockerfile`. GitHub Actions bilan avtomatlashtiring:

```yaml
# .github/workflows/release.yml (qisqartirilgan)
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
- uses: docker/build-push-action@v6
  with:
    context: ./apps/api
    push: true
    tags: ghcr.io/<org>/lingo-api:latest,ghcr.io/<org>/lingo-api:${{ github.sha }}
# web va doc-worker uchun ham xuddi shunday
```

Deploy: serverda `docker compose pull && docker compose up -d`.

## 6. Xavfsizlik (prod checklist)

- [ ] MinIO konsoli (9001) va Postgres (5432) tashqariga ochilmagan — faqat ichki tarmoq.
- [ ] `.env` fayl huquqlari `600`, git'da yo'q.
- [ ] Barcha `CHANGE_ME` qiymatlar almashtirilgan (kuchli tasodifiy).
- [ ] HTTPS majburiy (Caddy avtomatik).
- [ ] CORS faqat `WEB_ORIGIN` ga ruxsat.
- [ ] Rate limit yoqilgan (auth + AI endpoint'lari).
- [ ] Backuplar: Postgres `pg_dump` cron + MinIO ma'lumot volume backup.
- [ ] Anthropic kaliti faqat `api`/`doc-worker` env'ida.

## 7. Backup (oddiy)

```bash
# Postgres
docker compose exec -T postgres pg_dump -U lingo lingobridge | gzip > backup_$(date +%F).sql.gz

# MinIO — miniodata volume'ini muntazam arxivlang (yoki `mc mirror` bilan boshqa joyga)
```

## 8. Kuzatuv (Phase 4)

- Loglar: `docker compose logs -f api` / strukturaviy JSON log (pino).
- Xatolar: Sentry (api + web + worker).
- Sog'liq: `GET /api/health`, `GET /api/ready` (DB/Redis/MinIO tekshiruvi).
