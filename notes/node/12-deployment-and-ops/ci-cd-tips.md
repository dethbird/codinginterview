**ci-cd-tips.md**

# CI/CD Tips (Node + TS + Docker, GitHub Actions examples)

## 📌 What & why

- **CI** (Continuous Integration): on every PR/push, **install → lint → typecheck → test → build**. Fast feedback, no flakiness.
- **CD** (Continuous Delivery/Deployment): ship the **same built artifact** to **staging → prod**, ideally **zero-downtime**, with **migrations** and **rollbacks**.

**Principles**

- Build **once**, deploy many (immutable artifacts).
- Keep pipelines **deterministic** (lockfiles, pinned base images).
- Separate **config from code** (env vars; see `env-config-dotenv.md`).
- **Fail fast** (thresholds, strict linters), but keep prod deploys **boring**.

------

## CI pipeline anatomy (practical)

1. **Setup**: cache deps, set Node version.
2. **Quality gates**: ESLint, TS typecheck, tests (unit + HTTP), coverage thresholds.
3. **Build**: compile TS, or build Docker image (for CD).
4. **Artifacts**: upload `dist/`, coverage HTML, and/or Docker image digest for later deployment.

------

## Baseline PR workflow (GitHub Actions)

```yaml
# .github/workflows/pr.yml
name: ci-pr
on:
  pull_request:
    branches: [ main ]
concurrency:
  group: ci-${{ github.ref }}        # cancel older runs for same PR
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node: [20]                   # add 18 if you support both
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: app_test
        ports: [ "5432:5432" ]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s --health-timeout=3s --health-retries=10
    env:
      NODE_ENV: test
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node ${{ matrix.node }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'               # or 'pnpm' / 'yarn'
      - run: npm ci

      - name: Lint & typecheck
        run: |
          npm run lint
          npm run typecheck

      - name: Run tests (with coverage)
        run: npm run test:cov

      - name: Upload coverage HTML
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.node }}
          path: coverage/
```

**Key params (you’ll set these a lot)**

- `concurrency`: kills redundant runs on new pushes.
- `services`: ephemeral DBs (Postgres) for integration tests.
- `actions/setup-node cache`: automatic npm/pnpm/yarn cache keyed by lockfile.

------

## Main branch build + push image (GHCR)

```yaml
# .github/workflows/build.yml
name: build
on:
  push:
    branches: [ main ]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write           # needed to push to GHCR
    env:
      IMAGE_NAME: ghcr.io/${{ github.repository }}/api
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha

      - name: Build & Push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          file: ./Dockerfile
          platforms: linux/amd64
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Export image digest
        run: echo "DIGEST=${{ steps.meta.outputs.tags }}" >> $GITHUB_OUTPUT
```

**Why this shape**

- **BuildKit cache** between runs (`cache-from/to: gha`) → fast.
- Publish **by branch/sha**; releases can add semver tags.

------

## Deploy to AWS ECS (OIDC, no long-lived keys)

```yaml
# .github/workflows/deploy-prod.yml
name: deploy-prod
on:
  workflow_dispatch: {}         # manual button, or: release: { types: [published] }
permissions:
  id-token: write               # OIDC to assume role
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<acct>:role/github-oidc-deployer
          aws-region: us-east-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push to ECR
        id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ secrets.ECR_REPO }}:prod-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Update ECS service
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ecs/taskdef.json            # templated with container image
          service: api
          cluster: prod
          wait-for-service-stability: true
```

**Notes**

- Configure an IAM role with a trust policy for GitHub OIDC → **no AWS keys in secrets**.
- Keep task definition JSON in repo; CI replaces the image tag or uses the `*-deploy-*` action variant that does it for you.
- ECS does **rolling updates** with health checks → zero downtime if your container exposes `/health`.

------

## Kubernetes deploy (Helm/Kustomize, basic)

```yaml
# .github/workflows/deploy-staging.yml
name: deploy-staging
on: { push: { branches: [ develop ] } }

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v4
        with: { version: 'v1.30.0' }
      - name: Kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KUBE_CONFIG }}" > ~/.kube/config
      - name: Set image & apply
        run: |
          kubectl set image deployment/api api=ghcr.io/${{ github.repository }}/api:sha-${GITHUB_SHA}
          kubectl rollout status deployment/api --timeout=180s
```

**Add-ons**: use **Helm** values files per env, or **Kustomize** overlays. Gate prod deploys with **environment protection rules** (manual approval).

------

## DB migrations (don’t break prod)

- Prefer **backward-compatible** migrations first (add columns, nullable), deploy code that writes both, then **clean up**.
- Where to run migrations:
  - **Pre-deploy step** (blocks rollout until success).
  - **InitContainer/Job** in K8s (serialized via leader lock).
  - **ECS task** run once, then service rollout.

**Example step**

```yaml
- name: Run migrations
  run: npm run migrate           # e.g., prisma migrate deploy / knex migrate:latest
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

------

## Monorepos (run only what changed)

Use **paths filters** to skip jobs if a package didn’t change.

```yaml
# .github/workflows/pr.yml (add a filter)
on:
  pull_request:
    paths:
      - 'packages/api/**'
      - '!**/*.md'
```

Or drive with **Turborepo/Nx**:

- Cache builds/tests.
- `turbo run test --filter=@myorg/api...[HEAD^1]`

------

## Speed & reliability tips

- **Cache deps** via `setup-node` cache or `actions/cache` keyed on lockfile.
- **Split jobs**: lint/typecheck in one, tests in parallel shards if large.
- **Flaky tests**: fix them; don’t retry in CI unless you’re quarantining temporarily.
- **Artifacts**: upload `coverage/`, `dist/` only when needed. Artifacts are great for debugging.
- **Conservative timeouts**: set job/step timeouts to catch hangs.

------

## Secrets & environments

- Use **Actions Environments** for staging/prod with **required reviewers** (manual approvals).
- Store secrets per environment; rotate regularly.
- Prefer **OIDC** to cloud providers over static keys.

------

## Releases & versioning

- Adopt **Conventional Commits** → generate **CHANGELOG** + **semver** via **semantic-release** or similar.
- Tag releases `vX.Y.Z`; your build workflow can publish Docker images with `latest` + semver tags.

------

## Example: full pipeline scripts (package.json)

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:cov": "vitest run --coverage",
    "build": "tsc -p tsconfig.json",
    "migrate": "prisma migrate deploy" // or knex migrate:latest
  }
}
```

------

## Rollbacks (practice them)

- ECS: redeploy previous task definition revision or image tag.
- K8s: `kubectl rollout undo deployment/api`.
- Keep **N-2** images and DB **down-migration** plans where safe.

------

## ✅ Interview Tips

- “CI runs **lint + typecheck + tests + coverage** on PR, with **ephemeral Postgres** as a service.”
- “We **build once** (Docker), push to registry, then **deploy by tag** to staging/prod with **OIDC** (no long-lived keys).”
- “Migrations run **before rollout** and we design them to be **backward-compatible**.”
- “Prod deploys are **zero-downtime** (ECS/K8s rolling) and gated by **environment approvals**.”
- “Pipelines use **concurrency** to cancel stale runs and **cache** deps for speed.”

------

Want to hop to **13-realtime/websockets-ws.md**, or circle back to any earlier section for refinement?