# CMS Preview & Publishing Workflow

This document explains how the new landing/mobile CMS workflow enables safe previews, approvals, and deployments for marketing teams.

## 1. Preview Mode

- All public landing/mobile endpoints now accept `previewToken` and `status` query params, e.g.:
  ```
  GET /api/public/landing/hero?locale=en-US&variant=default&previewToken=XXXX&status=draft
  ```
- Set `CMS_PREVIEW_TOKEN` in the API environment. Only matching tokens enable preview responses.
- Preview responses skip the edge cache and return `X-Preview-Mode: true`. Consumers (Next.js, Flutter) can surface “Preview” indicators if needed.

## 2. Publishing Workflow

1. **Draft** – Editors create/update blocks inside the CMS panel.
2. **Approval** – Approvers hit `Approve` in the CMS UI (POST `/cms/landing/:type/:id/approve`). This adds an immutable audit entry in `metadata.approvals` and flips status to `scheduled`.
3. **Publish** – When ready, use the `Publish` action (POST `/cms/landing/:type/:id/publish`) with optional schedule window to make the block live.
4. **Cache Invalidation** – Publishing automatically bumps Redis caches. Landing + mobile clients revalidate within 60 seconds.

### Status Reference

| Status     | Description                            | Visible on public endpoints |
|------------|----------------------------------------|-----------------------------|
| `draft`    | Editor working copy                    | No (except preview mode)    |
| `scheduled`| Awaiting go-live / approved            | No                          |
| `published`| Live content                           | Yes                         |
| `archived` | Historical reference (read-only)       | No                          |

## 3. Governance Checklist

- **Approvals logged**: Each approval captures reviewer id, timestamp, and optional notes in `metadata.approvals`.
- **Preview link**: CMS panel shows a copyable preview URL with the token so stakeholders can QA before publish.
- **Schema contract**: `services/api/src/schemas/cms-blocks.schema.json` defines the shared JSON Schema enforced by the API via AJV. Any change to block structure should edit this file first so landing + mobile clients stay in sync.
- **CI compatibility check**: `.github/workflows/ci-api.yml` (plus `cms-governance.yml`) lint the API, CMS panel, and landing page together to catch accidental schema/API breaks early.
- **Block catalog**: Supported landing/mobile blocks now include hero sections, CTA blocks, pricing tiers, testimonials, blog cards (`landing_blog_cards`), and feature comparison tables (`landing_comparison_tables`). Use the CMS “Experience” page to manage each type.

## 4. Rollout Steps

1. Set `CMS_PREVIEW_TOKEN` in API + Next.js environments.
2. Grant `marketing` role in the CMS panel so non-engineering teams can manage landing/mobile content.
3. Update onboarding documentation to reference this file and the CMS panel’s new “Experience” section.
4. Encourage QA to verify copy via preview links before publishing, especially for localized variants.

Following this workflow keeps landing and mobile messaging flexible while maintaining compliance and auditability. If additional states or review steps are required, extend the metadata approvals array rather than inventing new tables.

