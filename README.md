# Lingo Bridge — AI-Powered Language Services Platform

A monorepo for an AI-assisted translation and educational content platform focused on multilingual document workflows, quick translation, and learning-material generation.

## Overview

**Lingo Bridge** is a platform concept for a language center operating under an institutional framework. It brings together three main services in one system:

- Document translation for official and academic materials
- Instant translation for words, phrases, and paragraphs
- AI-assisted learning-material generation for subjects and proficiency levels

The repository is structured as a developer-oriented monorepo with a web app, an API backend, and a document-processing worker. It is designed for an institutional use case, with separate roles for clients, translators, and administrators.

## Features

- **Document translation workflow** for academic and formal files
- **Quick translation** interface for short-form and ad-hoc requests
- **AI-generated study materials** based on subject and CEFR level
- **Multi-role access model** for clients, translators, and admins
- **Monorepo architecture** with clear separation between web, API, and worker services
- **Environment-driven configuration** for API keys, database, and storage
- **Infra templates** for PostgreSQL, Redis, MinIO, and Docker Compose
- **Worker service** for OCR and document processing tasks

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Web Frontend** | React 18, TypeScript, Vite, Tailwind CSS | UI and client experience |
| **API Backend** | Node.js 20, Fastify, TypeScript | App backend and API layer |
| **Database** | PostgreSQL | Main relational database |
| **Queue / Background jobs** | Redis | Async task orchestration |
| **File Storage** | MinIO / S3-compatible storage | Upload and document storage |
| **AI** | Anthropic Claude (server-side) | Translation and content generation |
| **Document Worker** | Python 3.12, FastAPI, Tesseract, PyMuPDF, python-docx | OCR and document processing |
| **Workspace Manager** | pnpm workspaces | Monorepo dependency management |
| **Deployment** | Docker Compose, Caddy | Local infrastructure and production deployment |

## Architecture

```mermaid
graph TD
    Client[Client Web App] --> API[Fastify API]
    Translator[Translator Tools] --> API
    Admin[Admin Dashboard] --> API

    API --> DB[(PostgreSQL)]
    API --> Redis[(Redis)]
    API --> MinIO[(MinIO / S3)]
    API --> Claude[Anthropic Claude]

    DocWorker[Document Worker<br/>Python + OCR] --> API
    DocWorker --> MinIO
    DocWorker --> DB
```

## Repository Structure

```text
lingo-bridge/
├── README.md                  # Project overview and onboarding
├── CLAUDE.md                 # Claude Code project guidance
├── .env.example              # Root environment template
├── .gitignore                # Ignored build and local files
├── package.json              # Root workspace scripts
├── pnpm-workspace.yaml       # pnpm monorepo configuration
├── pnpm-lock.yaml            # Dependency lockfile
├── apps/
│   ├── web/                  # React frontend app
│   └── api/                  # Fastify API service
├── packages/
│   └── shared/               # Shared TypeScript definitions
├── services/
│   └── doc-worker/           # Python document processing worker
├── infra/
│   ├── docker-compose.yml    # Local infrastructure services
│   └── Caddyfile             # Reverse proxy config
├── docs/
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-DATABASE.md
│   ├── 04-API.md
│   ├── 05-DESIGN-SYSTEM.md
│   ├── 06-ROADMAP.md
│   └── 07-DEPLOYMENT.md
├── prototype/
│   └── lingo-bridge.html     # UI prototype reference
└── .github/
```

## Requirements

- Node.js 20+
- pnpm 9+
- Python 3.12+
- Docker and Docker Compose
- PostgreSQL 16 (recommended)
- Redis
- MinIO or S3-compatible storage
- Anthropic API key

## Installation

```bash
git clone https://github.com/Saidmurotov/lingo-bridge.git
cd lingo-bridge
pnpm install
cp .env.example .env
```

Then populate the environment file with your real secrets and service endpoints.

## Configuration

The repository includes a root `.env.example` with placeholders for:

```env
NODE_ENV=development
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
DB_USER=lingo
DB_PASSWORD=lingo
DB_NAME=lingobridge
DATABASE_URL="postgresql://lingo:lingo@localhost:5432/lingobridge?schema=public"
JWT_ACCESS_SECRET=CHANGE_ME_long_random
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=lingo-files
WORKER_TOKEN=CHANGE_ME_shared_secret_for_worker_callbacks
```

Important security note: `.env` files must never be committed. Only use `.env.example` as a template.

## Running the Project

### Install dependencies

```bash
pnpm install
```

### Start local infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis minio
```

### Start application services

```bash
pnpm dev
```

This starts the web and API services in parallel, typically on:

- Web: `http://localhost:5173`
- API: `http://localhost:3000`

The document worker can be started separately as needed:

```bash
cd services/doc-worker
uvicorn app.main:app --reload --port 8000
```

## Usage

### Application flow

1. Create or log in to an account
2. Upload a document for translation or processing
3. Choose translation mode (instant or document translation)
4. Review translated content and edit if needed
5. Generate learning content based on a chosen subject and level
6. Store results and export finalized output

### Typical roles

- **Client**: submits translation requests and receives outputs
- **Translator**: reviews and validates content
- **Admin**: manages users, content, and project workflows

## API and Backend

The app includes a Fastify API workspace under `apps/api`. The project config and package files indicate:

- Fastify server with CORS and rate limiting
- JWT authentication
- Multipart upload support
- Prisma integration
- Redis integration
- MinIO storage client
- Zod validation

### API service scripts

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api test
pnpm --filter api prisma:migrate
pnpm --filter api db:seed
```

## Database

The repository references PostgreSQL and Prisma, which suggests a relational backend for application data, user accounts, translations, and educational items. The actual schema is documented under the `docs/` folder and should be used as the source of truth.

## Testing

The workspace config indicates test scripts exist for each app package. Typical commands:

```bash
pnpm test
pnpm --filter web test
pnpm --filter api test
```

## Deployment

This repository includes infrastructure configuration for local deployment and production-oriented patterns:

- Docker Compose for PostgreSQL, Redis, and MinIO
- Caddyfile for reverse proxying
- Deployment guidance under `docs/07-DEPLOYMENT.md`
- Environment templates designed for separate app, DB, and worker configuration

## Screenshots and Demo

The repository includes a prototype HTML mockup in `prototype/lingo-bridge.html`, which suggests a design reference and UI flow sample for the product.

## Security

The repository explicitly documents the following security rule:

- Never expose Anthropic API keys to frontend code
- Keep secrets in local `.env` files only
- Do not commit `.env` files to Git

This project uses environment placeholders for secrets such as:

- `ANTHROPIC_API_KEY`
- `JWT_ACCESS_SECRET`
- `WORKER_TOKEN`
- `S3_SECRET_KEY`

## Future Improvements

- Add complete admin workflows and translator review tooling
- Expand document-format support beyond the initial MVP
- Improve translation quality validation and QA checks
- Add analytics dashboards and usage reporting
- Strengthen deployment automation and CI/CD pipelines
- Add richer caching and asynchronous job monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the relevant lint/test commands
5. Submit a pull request

## License

No explicit license file is present in the repository.

## Author

Saidmurotov
