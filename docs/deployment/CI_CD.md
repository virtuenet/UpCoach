# UpCoach CI/CD Strategy

This document defines the end-to-end automation plan for the monorepo. It covers pipeline stages, GitHub Actions workflow breakdown, environments, and release gates.

## Goals

1. **Fast feedback** – under 10 minutes for PR validation.
2. **Deterministic builds** – reproducible artefacts for API, Web, and Mobile.
3. **Security + compliance** – mandatory checks (lint, tests, dependency scanning) before deploy.
4. **Safe releases** – staging promotion with manual approvals + automated smoke tests.

## Workflow Overview

| Workflow | Scope | Triggers | Key Jobs |
|----------|-------|----------|----------|
| `ci-api.yml` | `services/api` | PRs touching backend files, nightly | Install, lint, `npm run type-check`, Jest suites (unit/integration), build Docker image, push to GHCR (PR tags). |
| `ci-web.yml` | `apps/web`, shared packages | Web PRs, nightly | pnpm install, lint, Vitest/Jest, Cypress component tests (stubbed), build Next/React artefact, upload to GH Pages artifact storage. |
| `ci-mobile.yml` | `mobile-app` | Mobile PRs, nightly | Flutter doctor, `flutter format --set-exit-if-changed`, unit/widget tests, build debug apk, upload artifact. |
| `cd-main.yml` | All services | Merge to `main`, manual promote | Fan-in from successful CI artefacts, run smoke tests, deploy to staging, wait for health checks, optional approval to prod, run post-deploy verification + notify Slack. |

### Stage Definitions

1. **Prepare**
   - Checkout with `fetch-depth: 2`.
   - Setup Node/PNPM caches (API/Web) and Flutter cache (mobile).
   - Restore Prisma/Sequelize migrations cache for API.

2. **Quality Gate**
   - ESLint/TS lint for JS/TS packages.
   - `npm run type-check` (API), `pnpm run type-check` (Web), `flutter analyze` (Mobile).
   - Dependency scanning via `npm audit --omit=dev` and `trivy fs .` (API image).

3. **Test**
   - API: `npm run test`, `npm run test:integration`.
   - Web: `pnpm run test`, `pnpm run test:e2e` (playwright smoke subset).
   - Mobile: `flutter test`.

4. **Build Artefacts**
   - API Docker image tagged `ghcr.io/upcoach/api:${{ github.sha }}` plus `:pr-${{ github.event.number }}`.
   - Web static build zipped + uploaded via `actions/upload-artifact`.
   - Mobile debug APK (`build/app/outputs/apk/debug/app-debug.apk`).

5. **CD (main branch)**
   - Reuse artefacts in `cd-main.yml` via `workflow_run`.
   - Deploy to staging (API: Helm/k8s or Render, Web: Vercel/Netlify CLI, Mobile: TestFlight + Play Console tracks).
   - Run Playwright smoke tests + API health checks.
   - Require manual approval (`environment: production`) before prod deploy.
   - Notify Slack via webhook summarising deployment.

## Environment & Secrets Strategy

| Secret | Location | Usage |
|--------|----------|-------|
| `GHCR_PAT` | GitHub Actions secrets | Push/pull API Docker images. |
| `STAGING_API_URL`, `PROD_API_URL` | Actions vars | Endpoints for smoke tests. |
| `VERCEL_TOKEN`, `NETLIFY_AUTH_TOKEN` | Actions secrets | Web deploy. |
| `APPLE_API_KEY`, `GOOGLE_PLAY_JSON` | Encrypted secrets (mobile env) | Mobile uploads. |
| `SLACK_WEBHOOK_URL` | Org secret | Deployment notifications. |

Use [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) (`staging`, `production`) to scope secrets + require approvals.

## Job Graph (Simplified)

```
ci-api.yml
  prepare -> lint -> type-check -> test-unit -> test-integration -> build-image -> upload-artifact

ci-web.yml
  prepare -> lint -> type-check -> test -> build -> upload-artifact

ci-mobile.yml
  prepare -> format-check -> analyze -> test -> build-apk -> upload-artifact

cd-main.yml
  needs: [ci-api.yml, ci-web.yml, ci-mobile.yml]
  download-artifacts -> deploy-staging -> smoke-tests -> approval -> deploy-prod -> post-deploy
```

## Rollback & Observability Hooks

- Deploy jobs emit version metadata to Sentry/DataDog via API.
- Post-deploy smoke test failures automatically trigger `rollback` job (redeploy previous artefact tag).
- Artefact metadata stored in `docs/deployment/releases.json` (future work) for auditing.

## Next Steps

1. Scaffold GitHub Actions workflows under `.github/workflows/` using this spec.
2. Set up GHCR registry + environment secrets.
3. Implement Playwright/Smoke suites referenced above.
4. Automate release notes generation and attach to GitHub Releases.
# UpCoach CI/CD Blueprint

_Last updated: November 21, 2025_

This document defines the standardized CI/CD stages for all UpCoach surfaces (API, Web, Mobile). The goal is to ensure every change follows the same lifecycle: **lint → unit tests → integration tests → build → deploy → smoke tests.**

---

## 1. Pipeline Overview

| Stage | Description | Applies To |
|-------|-------------|-----------|
| `setup` | Install toolchain, restore caches, validate secrets | All services |
| `lint` | ESLint / Flutter analyze / Markdown lint | API, Web, Mobile |
| `type-check` | `tsc --noEmit` / Dart `flutter analyze --no-fatal-infos` | API, Web, Mobile |
| `unit-test` | Jest / Vitest / Flutter test suites | API, Web, Mobile |
| `integration-test` | API contract tests, Playwright smoke, Flutter integration | API, Web |
| `build` | Produce deployable artifacts (Docker image, Next.js build, Flutter bundle) | API, Web, Mobile |
| `security` | Dependency audit (`npm audit`, `flutter pub outdated --mode=null-safety`) + Snyk if enabled | All |
| `deploy-staging` | Auto deploy to staging with feature previews | API, Web |
| `deploy-production` | Manual approval gates + canary checks | API, Web |
| `mobile-delivery` | Upload artifacts to Firebase App Distribution / TestFlight | Mobile |
| `smoke-tests` | Post-deploy API ping + synthetic browser tests (Lighthouse/Playwright) | API, Web |

---

## 2. Required Inputs

| Secret | Source | Usage |
|--------|--------|-------|
| `NODE_AUTH_TOKEN` | GitHub Packages | Private npm installs |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS IAM | S3 artifact uploads |
| `STAGING_KUBECONFIG` / `PROD_KUBECONFIG` | Kubernetes secrets | API deploys |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Vercel | Frontend deploys |
| `FIREBASE_TOKEN` / `APP_STORE_CONNECT_KEY` | Firebase / Apple | Mobile delivery |
| `STRIPE_SECRET_KEY`, `SENTRY_AUTH_TOKEN` | Stripe / Sentry | Runtime smoke tests |

### Workflow Files

- `.github/workflows/ci-api.yml` – API lint/test/build/audit
- `.github/workflows/ci-web.yml` – Web lint/test/build
- `.github/workflows/ci-mobile.yml` – Flutter analyze/test/build
- `.github/workflows/cd-deploy.yml` – Staging + production deployments (API & Web)

---

## 3. Job Matrix

### 3.1 Backend (`services/api`)

1. `lint-api`: `npm run lint`
2. `typecheck-api`: `npm run type-check`
3. `unit-api`: `npm run test -- --runInBand`
4. `integration-api`: `npm run test:integration`
5. `build-api`: `npm run build` → build Docker image → push to registry
6. `deploy-api-staging`: `kubectl --context=staging apply -f k8s/backend-deployment.yaml`
7. `deploy-api-prod`: manual approval + `kubectl --context=prod rollout restart deployment/api`
8. `smoke-api`: `node scripts/health-check.js --env=prod`

### 3.2 Web (`apps/landing-page`, `apps/admin-panel`, etc.)

1. `lint-web`: `pnpm lint --filter=web...`
2. `typecheck-web`: `pnpm type-check --filter=web...`
3. `unit-web`: `pnpm test --filter=web... --runInBand`
4. `integration-web`: Playwright tests against preview URL
5. `build-web`: `pnpm turbo run build --filter=web...`
6. `deploy-web-staging`: `vercel deploy --prebuilt --env=staging`
7. `deploy-web-prod`: manual approval + `vercel deploy --prod`
8. `lighthouse`: run Lighthouse CI on production URL

### 3.3 Mobile (`mobile-app`)

1. `lint-mobile`: `flutter analyze`
2. `unit-mobile`: `flutter test`
3. `build-android`: `flutter build appbundle --flavor=prod`
4. `build-ios`: `flutter build ipa --flavor=prod`
5. `distribute-staging`: Firebase App Distribution upload
6. `distribute-prod`: TestFlight / Play Store internal track

---

## 4. Triggers & Branch Policies

| Branch | Trigger | Deployment |
|--------|---------|------------|
| `main` | push, PR | Deploy to staging automatically; production manual |
| `release/*` | push | Deploy to production after approvals |
| `feature/*` | PR | Run CI matrix, publish preview URLs only |

- Require PR approvals + status checks (`lint`, `unit`, `integration`, `build`) before merge.
- Enforce conventional commits via `commitlint` job.

---

## 5. Failure Escalation

| Stage | Owner | Action |
|-------|-------|--------|
| `lint` / `type-check` | Author | Fix code style / types |
| `unit-test` | Author + module owner | Investigate regressions |
| `integration-test` | QA lead | Re-run flaky tests, open incident |
| `deploy` | DevOps | Rollback via `kubectl rollout undo` or `vercel rollback` |
| `smoke-tests` | On-call SRE | Page on-call, trigger incident response |

---

## 6. Roadmap

- [ ] Add Datadog Quality Gates (error budgets, Apdex)
- [ ] Introduce performance budget tests (Artillery) in nightly workflow
- [ ] Cache Flutter dependencies to reduce mobile build time
- [ ] Add vulnerability scanning job (Trivy) before deploy

---

**Related files:** `.github/workflows/ci-api.yml`, `.github/workflows/ci-web.yml`, `.github/workflows/ci-mobile.yml`, `docs/deployment/templates/production-env-template.md`

