# apps/web/Dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* .
RUN npm ci
COPY . .
RUN npm run build

# Production stage (serve static files via nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Optional: custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
