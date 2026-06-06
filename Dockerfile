# ─── Stage 1: Build client ───────────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ─── Stage 2: Build server deps ──────────────────────────────────────────────
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma
COPY server/prisma.config.ts ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate

# ─── Stage 3: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S iqraa && adduser -S iqraa -G iqraa

COPY --from=server-deps /app/server /app/server
COPY --from=client-build /app/client/dist /app/client/dist

WORKDIR /app/server
RUN mkdir -p backups uploads && chown -R iqraa:iqraa /app

USER iqraa
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["npx", "tsx", "src/index.ts"]
