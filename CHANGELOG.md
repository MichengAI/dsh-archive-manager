# Changelog

[简体中文](CHANGELOG.zh-CN.md)

Published release notes are retained below; new versions are added without removing earlier entries.

## 0.1.19 — 2026-08-30

- Fixed the workspace-row **+** action on DSH `v0.1.2-alpha.1` by resolving the `uiWorkspace` service when the action runs, removing its dependency on plugin load order and avoiding the removed legacy `startSession` API.

Published package: [`@michengai/dsh-archive-manager@0.1.19`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.19).

## 0.1.18 — 2026-08-28

- Added client compatibility for the split store layout in DSH `v0.1.2-alpha.1` while preserving the legacy runtime fallback used by `v0.1.1-rc.2`.
- Restored the alpha Workspace navigation service required by the sidebar, conversation view, and directory picker when Archive Manager replaces the stock Workspace UI.
- Bound observable stores at the Settings boundary and kept subagent-lineage indexing local, preventing archived-chat startup and rendering failures on the alpha release.

Published package: [`@michengai/dsh-archive-manager@0.1.18`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.18).

## 0.1.17 — 2026-08-28

- Enabled npm Trusted Publishing through the repository's GitHub Actions release workflow.

Published package: [`@michengai/dsh-archive-manager@0.1.17`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.17).

## 0.1.16 — 2026-08-27

- Added a restore icon to archived-group bulk action menus for consistent action affordances.
- Shortened the ungrouped bulk action labels to **Restore all** and **Delete all**, avoiding repeated context and reducing menu width.

Published package: [`@michengai/dsh-archive-manager@0.1.16`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.16).

## 0.1.15 — 2026-08-26

- Hardened permanent deletion so missing transcripts clear stale archive, workspace, spill, and projection-cache data while failed physical deletion remains retryable.
- Cleared workspace and projection-cache tombstones when a session ID is reused, preventing valid replacement sessions from being blocked.
- Corrected batch deletion feedback and duplicate restore submission handling, and aligned client batch counts with the host's authoritative archive set.

Published package: [`@michengai/dsh-archive-manager@0.1.15`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.15).

## 0.1.14 — 2026-08-24

- Added project-scoped batch restore and permanent deletion, plus a page-level **Restore all** action.
- Added archived-chat sorting by last update, creation time, or title, backed by authoritative host creation metadata.
- Added confirmation, success, and partial-failure feedback for batch archive operations.

Published package: [`@michengai/dsh-archive-manager@0.1.14`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.14).

## 0.1.13 — 2026-08-23

- Added bilingual changelogs covering the five most recent releases.
- Linked the release history from both README editions and included it in the npm package.

Published package: [`@michengai/dsh-archive-manager@0.1.13`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.13).

## 0.1.12 — 2026-08-18

- Declared official DeepSeek packages as peer dependencies.
- Replaced the README header with the product banner.
- Removed local-only documentation from repository tracking.

Release tag: [`v0.1.12`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.12).

## 0.1.11 — 2026-08-17

- Fixed settings-page filtering, tombstone bypasses, and cold-reuse behavior.
- Removed obsolete client cascade code and normalized reused workspace paths.

Release tag: [`v0.1.11`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.11).

## 0.1.10 — 2026-08-17

- Isolated Escape handling in archive confirmation dialogs.
- Counted only visible conversations in archive totals.

Release tag: [`v0.1.10`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.10).

## 0.1.9 — 2026-08-17

- Removed client-side cascade deletes and surfaced sidebar operation errors.
- Restyled the project filter and refreshed plugin documentation.

Release tag: [`v0.1.9`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.9).
