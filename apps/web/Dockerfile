# Build from the repo root: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --filter web...
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter web build

# Static SPA served by nginx behind Caddy
FROM nginx:alpine
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
