# Changelog

[简体中文](CHANGELOG.zh-CN.md)

Published release notes are retained below; new versions are added without removing earlier entries.

## Unreleased

- Support DeepSeek Harness `0.1.7-alpha.1` while remaining compatible with the previously supported hosts.
- Keep the official session list when it provides a menu slot, and add Delete session there. Older hosts still use this plugin's session list.
- Archiving a running session asks before stopping its work. A recorded pin is cleared in the same archive.
- Legacy automation repair follows the host's current session generation, including fourth-generation logs.
- Settings controls use the host's buttons, inputs, tabs, and disclosures where those controls exist. Hosts without the segmented tabs supply the same control locally. Sort, project filter, and the half-selected checkbox stay as they are.

## 1.0.2 - 2026-09-21

- Fix legacy session repair incorrectly rejecting Windows short and extended paths while retaining protection against directory links.

## 1.0.1 - 2026-09-21

- Fix navigation errors and incorrect turn counts when session data is malformed.
- Remove personal information from documentation screenshots and reduce package size.

## 1.0.0 - 2026-09-21

The first 1.0 release expands session organization, search, previews, and targeted repair since 0.1.44. The package name and existing data remain unchanged; no session migration is required. Existing archive, restore, permanent deletion, and native conversation navigation remain available.

### Lists and shared filters

- Archived and Unarchived share title/content search, project, favorites, and updated-date filters. Titles-only remains the default; switch scope on the left of the search box and open dates on the right. The end date includes the entire local day; dates can be cleared independently and the popover closes on outside clicks.
- Compact collapsible project groups provide clickable titles, right-side stars and archive/restore icons, and applicable More actions for restore-and-open, preview, copying, and deletion.
- Sort by update time, creation time, title, or most/fewest turns. Group counts follow filters and empty states match the active tab.
- Select all covers filtered results, including collapsed groups. Switching tabs clears selection; filtering preserves it and reports hidden selections. Project-wide actions remain independent of filters.
- Remove redundant page-wide Restore all / Delete all buttons while retaining selection-based and project actions. Operation results remain scoped to their tab.

### Favorites, idle cleanup, and batch actions

- Star or unstar on either tab and filter to favorites. Host-persisted favorites survive archive, restore, and browser changes. Unknown indexes and read failures do not remove favorites; cleanup requires confirmed artifact absence.
- On Unarchived, preview idle candidates using 1–36,500 whole days and the current filters; deselect individual candidates before confirmation. Exclude favorites, the current conversation, running sessions, pending interactions, and sessions with active subagents or no valid activity time.
- Recheck favorites and activity before archiving. Batch archive, restore, and delete show progress and successful/skipped/failed/remaining results. Stop at the first failure and retry only remaining items; delete retries still require confirmation.
- Undo the most recent successful archive batch, including successful retries, while the management page remains open. Permanent deletion cannot be undone.

### Content search and quick preview

- Search persisted user and assistant text with snippets and highlights. Read failures remain visible and retryable; obsolete responses cannot replace results after filters change.
- Preview archived sessions without restoring them, showing context around the first match or up to eight recent messages. Unarchived snippets open the full conversation.
- Render Markdown tables, quotes, code blocks, and role labels, with a source/highlight mode, a wider dialog, and action icons.
- Fix Unicode offsets after case folding, split surrogate pairs on truncation, Escape closing Settings as well as preview, and previews reopening after tab switches.

### Turn counts and session location

- Show user submission counts on both tabs, including image submissions and inherited branch messages; exclude assistant replies, tool calls, and injected messages.
- Sort by most/fewest turns with unknown counts always last; inspect and retry detail failures.
- Copy session IDs and paths separately from More. Official JSONL storage exposes the session directory; other backends use a valid host-provided path. Missing paths and clipboard failures are reported explicitly.

### Diagnosis and targeted repair

- Collect archived read failures, including IDs without summaries, in collapsible diagnostic cards with classified advice and technical details.
- Prefer stable error codes for missing files, permissions, and corruption, with message-based compatibility fallbacks. Unavailable repair preserves the original classification and appends its limitation.
- Diagnose and explicitly confirm repair for supported legacy automation message sources. Eligibility depends on artifacts, host format validation, and a write lease, not just error wording. Sessions must be archived and closed in every DSH process.
- Retain original logs, text, automation attribution, and inheritance data. Publish a new generation only after host re-encoding and validation; create private repair files. Publication never overwrites existing logs and fails safely if hard links are unavailable.

### UI, localization, and compatibility

- Align selection, checkboxes, focus, warnings, updates, and highlights with official theme tokens; refine date controls, diagnostic cards, stars, and action icons.
- Complete Chinese/English diagnosis, preview, update, and error messages. Language changes no longer cause extra detail reads; fix copy-error and empty-state text.
- Refresh Archived/Unarchived screenshots and both READMEs, including filter, undo, repair, and search boundaries.
- Retain support for DSH 0.1.0-rc.8, 0.1.1-rc.2, 0.1.2-rc.1, 0.1.5-rc.1, 0.1.5-rc.2, 0.1.6-alpha.1, and 0.1.6-alpha.2. Coexist with Codex UI; no new sidebar pinning or favorites features are introduced.
- searchSessionContent is the canonical API for both archive states. Keep searchArchivedContent as the archived-only compatibility entry for older hosts/clients; do not dispatch duplicate searches.

### Limits and validation

- Content search and turn counts have no persistent index. Read at most 20 sessions per batch, sequentially. Narrow filters for large or long logs; no scale or latency guarantee is established. In-flight batches cannot be interrupted; cancellation prevents subsequent batches and stale results.
- Queries accept up to 200 characters. Search excludes tools, attachments, reasoning, system messages, and plugin injections. Preview limits each message to 2,000 UTF-16 code units without splitting Unicode characters; open the native conversation for full content.
- No scheduled background archiving. Favorite protection applies only to idle cleanup. Reopen management to see favorites changed elsewhere; closing or refreshing clears undo history.
- Repair is not a general recovery tool: missing files, permissions, and unsupported corruption receive advice, never forced deletion or truncation. Permanent deletion is irreversible. Task summaries and Markdown export are not added.
- The functional candidate passed local regressions, isolated supported-host matrices, and real DSH 0.1.6-alpha.2 browser smoke tests covering search, preview, favorites, batches, diagnosis, and repair. Real model submission, streaming, tool approvals, and unknown host versions are outside this validation claim.
- The host Settings shell still has an extremely narrow-screen obstruction; full mobile layout support is not claimed.

## 0.1.44 - 2026-09-18

- Opening an archived session from Settings no longer falsely reports that the host did not keep the conversation.
- Support DeepSeek Harness `0.1.6-alpha.2` while remaining compatible with earlier hosts. The archive page, opening archives, and permanent deletion keep working after the official API changes.

## 0.1.43 - 2026-09-16

- Support DeepSeek Harness 0.1.6 while remaining compatible with earlier hosts. Settings keeps only this plugin's archive page, and the sidebar archive menu works on 0.1.6.
- Opening an archived session, or restoring and opening it, returns to the original workspace and group instead of being cleared immediately.
- Batch archive and restore continue one session at a time. A later failure keeps earlier changes, and missing sessions no longer break the action.

## 0.1.42 - 2026-09-14

- Add Archived / Unarchived tabs with Archived selected by default. Select sessions across projects for batch archiving, or archive all chats in a project or ungrouped section from its menu.
- Unify session action labels and make batch archive buttons and menu actions easier to identify. Keep the confirmation dialog open with an error on archive failure for direct retries, and clear stale feedback.
- Add the Typert `workspaceRegistry/archiveSessions` endpoint accepting `{ sessionIds: string[] }` to archive sessions across projects, with deduplication, idempotency, and whole-batch rejection for invalid sessions.

## 0.1.41 - 2026-09-14

- Improve the archived-session bulk action bar with grouped selection details and actions, fixing wrapped button labels in narrow content areas.
- Simplify the bar when nothing is selected and show cross-filter selection counts and scope separately so hidden selections remain clear.

## 0.1.40 - 2026-09-13

- Open archived sessions in the native DSH conversation view and continue chatting while keeping them archived, or restore and open them.
- Close the settings overlay after an archived conversation opens successfully; keep settings open and show an error on failure, with a restore-and-open alternative when host navigation adaptation is unavailable.
- Localize archive navigation errors and avoid unnecessary warnings when older hosts load or open archives successfully.

## 0.1.39 - 2026-09-11

- Preserve the Codex UI workspace list, styling, and dedicated interactions when both plugins are installed, while keeping archive management available.
- Delegate the home workspace picker and session navigation to the official DSH plugin while retaining the custom archive sidebar, directory creation, restore, and batch management, reducing navigation API drift across host upgrades.
- Isolate sidebar directory synchronization failures so they do not interrupt other plugins registering directory components. If your Profile manually disables the official `ui-workspace`, remove that override before upgrading; otherwise the archive sidebar and settings page cannot load.

## 0.1.38 - 2026-09-11

- Support DeepSeek Harness `0.1.5-rc.2` while retaining compatibility with the four previously supported versions.

## 0.1.37 - 2026-09-10

- Fix rebuilt archive summaries remaining unusable on DSH `0.1.5-rc.1`; caches with missing or outdated format versions are rebuilt from the session transcript and reused on subsequent visits.

## 0.1.36 - 2026-09-10

- Harden release delivery: align dependency cooling preflight and synchronize bilingual GitHub Releases only after confirming the exact npm version and commit; recover already-published releases without reinstalling or republishing.
- Wait for npm latest propagation to avoid incorrectly marking new releases as non-Latest; fix negative timeout values and deadline diagnostics while preserving abort causes and ordinary network errors.
- Add release recovery, CLI, bilingual notes, and deadline regressions; plugin runtime behavior and the four-version compatibility range remain unchanged.

## 0.1.35 - 2026-09-10

- Support DSH `0.1.5-rc.1`: restore workspace selection, session opening, and fork navigation; dismiss global panels when opening or creating sessions, and suppress stale navigation and draft handoff after panel switches or disposal.
- Route sidebar open/fork actions through the new navigation service with legacy fallbacks; restrict DSH peers to `0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1` and pin development dependencies to `0.1.5-rc.1`.
- Add navigation and sidebar wiring regressions, validate those four exact versions in the isolated matrix; explicitly provide Zustand/Immer required by the official Store in Node tests.
- Passed real browser acceptance in an isolated DSH `0.1.5-rc.1` Web Profile: archive/restore, deletion and subagent cascades, cross-filter batch deletion, workspace and global-panel navigation, forks, content search, and restart persistence; no external model calls were made.


## 0.1.34 - 2026-09-09

- Unified settings headings, descriptions, and action layouts; maintenance controls no longer squeeze titles or versions. The layout adapts to native DSH settings without Codex UI.

## 0.1.33 - 2026-09-08

- Added real live-session deletion coverage for `0.1.3-alpha.2` with JSONL and Zstandard: verify pending event durability, write-handle closure before directory removal, completion notification, archive bookkeeping cleanup, and no resurrection after reopening storage or a later flush; no production deletion change was required.

- Validate isolated storage test entry points, dependency versions, and resolved paths before loading host modules to prevent false failures from local legacy links; add `test:latest`, build before the matrix, and assert a single completion event for legacy live deletion.

- Added an isolated full regression matrix for DSH `0.1.1-rc.2` / Cordis `4.0.1`, `0.1.2-rc.1` / `4.0.2`, and `0.1.3-alpha.2` / `4.0.2`, passing 134, 134, and 137 tests respectively; corrected legacy client/event test fixtures and explicitly accepted the `0.1.1-rc.2` prerelease peer range.

- Added compatibility with DeepSeek Harness `0.1.3-alpha.2` (official master `c389f96`), including persistence snapshot listings and read-only session handles while retaining legacy API paths.
- Fixed sessions remaining under Ungrouped after batch deletion on the newer host (#19): remove every log generation in the session directory, confirm persistence removal before committing bookkeeping and broadcasting completion, and include cold subagents in cascading deletion.
- Updated development dependencies and added isolated tests against real JSONL / Zstandard storage, covering queries and reopening storage after deletion, fork preservation, and archived projection reads.

## 0.1.32 - 2026-09-07

- Fixed leftover session directories after deletion (#16): remove the entire session-owned directory after validating the official JSONL layout, preserve shared/unknown-backend parent directories, and refuse deletion through directory links.
- Added regression coverage for directory and attachment cleanup, path encoding, shared-directory protection, and failed-deletion retries.
- Kept relative JSONL storage roots stable across host working-directory changes and added warnings when directory ownership cannot be verified.

## 0.1.31 - 2026-09-07

- Added independent in-product update checks with automatic updates when a verified DSH update service is available and a profile-specific manual fallback otherwise.
- Removed the update-button dependency on `react-dom/client` so the client can load on Hosts that do not register that module id.

## 0.1.30 — 2026-09-04

- Kept failed archived-session deletions retryable until their transcript artifact is removed.
- Restricted transcript cleanup to the backend-owned artifact path and refreshed client session lists after deletion.

## 0.1.29 — 2026-09-03

- Added compatibility with DeepSeek Harness `0.1.2-rc.1`.

## 0.1.28 — 2026-09-03

- Enforced LF for JavaScript source, build scripts, and generated `lib` output, fixing Windows CI incorrectly reporting esbuild output as out of sync after a build.
- Added a cross-platform line-ending policy regression test so generated-output synchronization checks behave consistently on Windows and Linux.

## 0.1.27 — 2026-09-03

- Moved the sole maintained source into `src` and atomically generate the publishable `lib` directory with esbuild. A failed build preserves the previous output so local installation remains usable.
- Added generated-output synchronization checks and failed-build regression coverage, and unified CI and prepublish validation under `pnpm verify`.

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
