**docker-basics.md**

# Docker Basics (Node + TypeScript, prod-ready)

## 📌 What & why

Containerize your Node app so it runs the **same** everywhere. For production: a **small, non-root** image, **multi-stage build**, **cached deps**, clean **SIGTERM** shutdown, and a **healthcheck**. For dev: hot-reload via **volumes**.

------

## Multi-stage Dockerfile (Node 20, TypeScript, npm)

```dockerfile
# ---- 1) Base args
ARG NODE_VERSION=20
ARG APP_DIR=/usr/src/app

# ---- 2) Builder: installs dev deps & builds
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR ${APP_DIR}

# Faster, reproducible installs
ENV NODE_ENV=development
# If you compile native deps, you may need: apk add --no-cache python3 make g++

# Only copy files needed for dependency resolution
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build    # -> dist/

# ---- 3) Prune to production deps only
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR ${APP_DIR}
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- 4) Runtime: small, non-root, only what we need
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR ${APP_DIR}
ENV NODE_ENV=production
# Create non-root user (node exists by default on official images; keep it)
USER node

# Copy prod node_modules and built artifacts
COPY --chown=node:node --from=prod-deps ${APP_DIR}/node_modules ./node_modules
COPY --chown=node:node --from=builder   ${APP_DIR}/dist         ./dist
COPY --chown=node:node package.json ./

# Optional: tini as init to forward signals
# RUN apk add --no-cache tini
# ENTRYPOINT ["/sbin/tini","--"]

EXPOSE 3000
# Healthcheck hitting your /health
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node","dist/server.js"]
```

### Why each piece matters

- **Multi-stage**: dev deps (TS, types) never bloat the final image.
- `npm ci`: reproducible, fast installs (requires `package-lock.json`).
- **Cache mounts**: speeds repeat builds (`--mount=type=cache,target=/root/.npm`).
- **Non-root** `USER node`: better default security.
- **HEALTHCHECK**: lets orchestrators restart sick containers.
- **Alpine**: tiny; if native modules fight musl libc, switch to `node:20-bookworm-slim`.

------

## .dockerignore (critical for small, fast builds)

```
node_modules
dist
coverage
.git
.gitignore
*.log
Dockerfile*
docker-compose*.yml
.env*
.vscode
```

> We **copy package.json + lock first**, install deps, then copy source — so dependency layers cache nicely.

------

## Build & run (local)

```bash
# Build (enable BuildKit for cache mounts)
DOCKER_BUILDKIT=1 docker build -t my-api:dev .

# Run (pass envs; stop on Ctrl+C gracefully)
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL="postgres://user:pass@host:5432/app" \
  my-api:dev
```

> Docker will send **SIGTERM** on `docker stop`; ensure your app calls `server.close()` (we added that earlier).

------

## Dev with hot reload (Compose + volumes)

```yaml
# docker-compose.dev.yml
version: "3.9"
services:
  api:
    image: node:20-alpine
    working_dir: /usr/src/app
    command: sh -c "npm ci && npx tsx watch src/server.ts"
    ports: ["3000:3000"]
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
      CHOKIDAR_USEPOLLING: "1"   # handy on Docker Desktop/WSL
    volumes:
      - ./:/usr/src/app
      - /usr/src/app/node_modules  # anonymous volume to keep host node_modules from shadowing
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10
docker compose -f docker-compose.dev.yml up
```

**Notes**

- We run dev directly on `node:alpine` with **tsx watch**.
- Bind mount code → instant reloads; use polling if file events are flaky on your host.

------

## Prod Compose (build + run)

```yaml
# docker-compose.yml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_VERSION=20
    image: my-api:latest
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      LOG_LEVEL: info
    ports: ["3000:3000"]
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pgdata:
```

------

## NPM, Yarn, pnpm (quick swaps)

- **pnpm**

  - Replace `npm ci` with:

    ```dockerfile
    RUN corepack enable
    RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile
    ```

  - Copy `pnpm-lock.yaml`.

- **Yarn (Berry)**: use `yarn install --immutable`.

Keep lockfiles in the repo to enable **deterministic** installs.

------

## Small & secure images (options)

- Use `node:*-slim` (Debian) if native modules misbehave on Alpine.

- Go smaller with **distroless**:

  ```dockerfile
  FROM gcr.io/distroless/nodejs20-debian12
  WORKDIR /app
  COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
  COPY --from=builder   /usr/src/app/dist         ./dist
  USER nonroot
  EXPOSE 3000
  CMD ["dist/server.js"]
  ```

  *No shell; great for prod, trickier to debug.*

- Drop Linux capabilities & make FS ro (if your app doesn’t write):

  ```yaml
  services:
    api:
      read_only: true
      tmpfs: ["/tmp"]
      security_opt: ["no-new-privileges:true"]
  ```

------

## Healthchecks & readiness

- **Liveness**: container is alive (process running).
- **Readiness**: app ready to accept traffic (DB connected, migrations done).
   Expose `/health` and (optionally) `/ready`. In Kubernetes, wire them to `livenessProbe`/`readinessProbe`.

------

## Common pitfalls (and fixes)

- **Slow rebuilds** → copy lockfile first; separate **deps layer** from **source layer**; use BuildKit cache mounts.
- **Native module build errors** on Alpine → add `python3 make g++` in builder or switch to `*-slim`.
- **Root user in prod** → switch to `USER node`; ensure file ownership with `--chown`.
- **Signals ignored** → use Node’s SIGTERM handler; optionally run with an init (`--init` or `tini`).
- **Huge images** → prune dev deps in final stage; don’t copy `.git` or `node_modules` from host.
- **Time zone issues** → set `TZ` env or mount tzdata if needed: `apk add tzdata`.

------

## Buildx & multi-arch (Apple Silicon + AMD64)

```bash
docker buildx create --use
docker buildx build --platform=linux/amd64,linux/arm64 -t my-api:latest . --push
```

------

## Copy-paste snippets

**Graceful shutdown (recap)**

```ts
const server = app.listen(process.env.PORT || 3000);
['SIGTERM','SIGINT'].forEach(sig => process.on(sig, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}));
```

**Minimal HTTP health route**

```ts
app.get('/health', (_req, res) => res.json({ ok: true }));
```

**Compose override for local env**

```yaml
# docker-compose.override.yml
services:
  api:
    environment:
      - LOG_LEVEL=debug
    ports: ["3000:3000"]
```

------

## ✅ Interview Tips

- “I use a **multi-stage** Dockerfile: build with dev deps, copy only **dist + prod node_modules** to a **non-root** runtime.”
- “I cache installs by copying **lockfiles first** and using **BuildKit cache mounts**.”
- “Containers get a **SIGTERM**; my app calls `server.close()` for **graceful shutdown**.”
- “Healthchecks hit `/health`; in K8s I separate **readiness** from **liveness**.”
- “If native deps need glibc, I switch from **alpine** to **slim**.”

------

Want me to finish **ci-cd-tips.md** next?