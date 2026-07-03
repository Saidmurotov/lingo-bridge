# Lingo Bridge Deployment Guide

This guide outlines how to deploy the Lingo Bridge monorepo to a production environment (either on-premise or a cloud provider like DigitalOcean or AWS).

## 1. Prerequisites

- A Linux server (Ubuntu 22.04 LTS recommended)
- Docker and Docker Compose installed
- A domain name (e.g., `lingobridge.uz`) pointed to your server's IP address
- API Keys: Anthropic API Key for the AI integration

## 2. Environment Configuration

Clone the repository to your server:
```bash
git clone https://github.com/your-org/lingo-bridge.git
cd lingo-bridge
```

Copy the `.env.example` file and configure it:
```bash
cp .env.example .env
nano .env
```
Ensure you update:
- `JWT_SECRET`: Set to a secure random string.
- `DATABASE_URL`: Ensure credentials match your Postgres setup.
- `ANTHROPIC_API_KEY`: Add your live Claude 3 Opus API key.
- `DOMAIN`: Set to your production domain name for Caddy SSL generation.

## 3. Building Production Images

The `docker-compose.yml` file is configured to build the necessary containers. 

```bash
docker compose build
```

This will build:
- The React Vite frontend (statically served by Caddy/Nginx)
- The Node.js Fastify API backend
- The Python FastAPI Document Worker

## 4. Database Migration

Before starting the application, run the Prisma migrations to set up the Postgres schema:

```bash
docker compose run --rm api npx prisma migrate deploy
```

## 5. Starting the Services

Run the full stack in detached mode:

```bash
docker compose up -d
```

Caddy will automatically provision TLS/SSL certificates via Let's Encrypt for your domain.

## 6. Verifying the Deployment

- Web App: `https://your-domain.com`
- API Health Check: `https://your-domain.com/api/health`
- MinIO Console: `http://your-server-ip:9001` (Ensure this port is firewalled and only accessible via VPN or SSH tunnel in production).

## 7. Scaling and Maintenance

- **Worker Scaling:** If document translation queues get long, you can scale the Python worker:
  `docker compose up -d --scale worker=3`
- **Logs:** View logs for any service using:
  `docker compose logs -f api`
- **Updates:** To update the application:
  `git pull`, `docker compose build`, `docker compose up -d`
