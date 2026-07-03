# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --filter api...
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter api prisma:generate && pnpm --filter api build

FROM node:20-alpine
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=builder /repo ./
EXPOSE 3000
# Apply pending migrations, then start (docs/07 §4)
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/server.js"]
