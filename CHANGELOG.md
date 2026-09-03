# Changelog

[简体中文](CHANGELOG.zh-CN.md)

Published release notes are retained below; new versions are added without removing earlier entries.

## 0.1.26 — 2026-09-03

- Fixed the Windows CI host-test fixture to use the same native realpath representation as DSH's asynchronous session-path index, preventing valid workspace sessions from being filtered out only in the test environment.
- Added an initialization regression assertion that verifies accounted workspace sessions remain visible after path membership validation.

## 0.1.25 — 2026-09-03

- Added **Archive all chats** to each workspace action menu. The entry is hidden when no active chats remain, and the client refreshes its session list after a successful batch archive.
- Added a red outlined confirmation style for **Archive all** with hover and keyboard-focus states.
- Kept the path-safe `session_projcache_archive_manager_v2` domain as the only write target. Startup now imports missing entries from the short-lived old-name v2 domain, old-name v1 domain, and supported DSH cache formats without overwriting newer records.
- Added RC2-to-current isolated compatibility coverage and made it a release gate: CI and `prepublishOnly` now run `test:compat`; CI no longer assumes pnpm exists before Corepack enables it.

## 0.1.24 — 2026-09-02

- Upgraded the development test stack to DSH `0.1.2-alpha.5` and `@deepseek-ai/cordis` `4.0.2`, while retaining the existing `>=0.1.0-rc.5 <0.2.0` DSH runtime peer declarations.
- Switched primary client integration tests to the current `dsh-client-store` contract and retained a tested optional `dsh-client-runtime` fallback for older hosts.
- Added a reproducible pnpm alpha-resolution policy that disables automatic peer installation and records the approved newly published packages.

## 0.1.23 — 2026-09-01

- Fixed missing sidebar pending-state indicators on DSH `v0.1.2-alpha.2`: workspace rows now read pending UI interactions from the `ui-session` `pendingInteractions` Map.
- Whitelisted the official visible pending states (`question`, `approval`, and `plan-review`) before passing them to row rendering, so unknown future states are ignored safely.
- Kept the legacy `SessionSummary.pendingInteraction` fallback and added regression coverage for grouped, flat, and search result rows.

Published package: [`@michengai/dsh-archive-manager@0.1.23`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.23).

## 0.1.22 — 2026-09-01

- Added arbitrary archived-chat selection in **Settings → Archived**, including per-row checkboxes, select-all for the current filtered results, cross-project selection, batch restore, and confirmed batch permanent deletion.
- Kept selected operations on the existing authoritative host batch path, so stale records, partial deletion failures, and retry behavior match existing project-wide and all-chat actions.
- Refreshed the client session projection after restoring chats so restored sessions immediately reappear in their original workspace.

Published package: [`@michengai/dsh-archive-manager@0.1.22`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.22).

## 0.1.21 — 2026-08-31

- Preserved the projection-cache `put()` Promise contract when a tombstone suppresses a deleted Session write, so DSH `v0.1.2-alpha.2` cold-read write-back remains fail-soft instead of throwing a synchronous `TypeError`.
- Added direct `put(...).catch(...)` regression coverage for alpha.2 while retaining the `putSoft` path used by DSH `v0.1.1-rc.2`, and clarified the separate safe cache domain and migration behavior.

Published package: [`@michengai/dsh-archive-manager@0.1.21`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.21).

## 0.1.20 — 2026-08-31

- Kept IM and other non-filesystem-safe Session ids unchanged while persisting projection checkpoints under fixed-length safe keys, preventing DSH `v0.1.2-alpha.2` from using colons as Windows filenames.
- Added resumable, add-only cache import from the DSH `v0.1.1-rc.2` whole-file format and from clean alpha per-record profiles, so existing users retain cached projections across either upgrade path.
- Rebuild missing archived-session projections from the retained transcript on demand and refresh the client list, so legacy archive markers remain fully visible whether their old cache row exists or not.

Published package: [`@michengai/dsh-archive-manager@0.1.20`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.20).

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
