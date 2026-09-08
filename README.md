<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Safely manage archived sessions in DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [Changelog](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![npm downloads](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Archive Manager is a community-maintained DeepSeek Harness (DSH) plugin, not an official DeepSeek AI product.

## Features

Put inactive conversations away and find them again when needed. Search, restore, and clean up archives in one place while keeping everyday task lists tidy.

- **Put finished tasks away**: archive one conversation or all active chats in a workspace.
- **Find past work**: search titles, filter by project, and sort by time or title in **Settings → Archived sessions**.
- **Resume your work**: restore one conversation, a project group, or all archived chats.
- **Clean up records**: permanently delete individual chats or batches after confirmation. **Permanent deletion cannot be undone.**

## Screenshots

Open the sidebar session menu and choose **Archive session**:

![Archive a session from the session menu](assets/screenshots/archive-session-menu.png)

Search, sort, filter by project, unarchive, or permanently delete chats in **Settings → Archived sessions**:

![Archived sessions settings page](assets/screenshots/archived-sessions.png)

## DSH product ecosystem

For a ready-to-use workbench, download [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). If you already use [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), install any of these eight plugins individually. The desktop app includes all eight.

| Plugin | What you can do |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organize projects and conversations, search tasks, and navigate chat turns |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Send tasks and receive replies through your usual messenger |
| [Automation](https://github.com/MichengAI/dsh-automation) | Schedule tasks and review each run |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Find, enable, create, and import local skills |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Search, restore, or clean up archived conversations |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Choose and summon specialists for your task |
| [BTW](https://github.com/MichengAI/dsh-btw) | Ask side questions without interrupting the main task |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Use /simplify to improve code within your Git changes |

The desktop introduction and download site is maintained in the [website repository](https://github.com/MichengAI/dsh-codex-desktop-website).

## Prerequisites

- A working DeepSeek Harness Web installation with `dsh` available in PowerShell.
- Examples use the `web` profile; replace it with the target profile.
- Source installation and development require Node.js 22+ and pnpm. npm installation does not require running `pnpm install` separately.

## Installation

The installation commands below use the official npm registry.

### Ask an agent to install it (recommended)

Send the prompt below to any agent that can run terminal commands on your computer. Replace `web` with your actual profile. Once installed, use the plugin in DSH.

```text
Install the DSH plugin @michengai/dsh-archive-manager into my local web profile by running: dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/. Then run dsh --profile web --dump-config, confirm the configuration includes workspace-archive-manager, ui-workspace-archive-manager, and explain how to reload DSH and start using the plugin.
```

### Install the latest package from the official npm registry

Run this from any PowerShell directory:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

To pin a release, replace `@latest` with a specific version such as `@x.y.z`.

The configuration output should contain `workspace-archive-manager` and `ui-workspace-archive-manager`. Restart DSH Web and hard-refresh the browser. Do not copy client files manually: the Settings page and archive menu need the mounted plugin.

## Updates

The settings title shows the installed version and a **Check for updates** button. When a newer release is available, **Update automatically** runs only when the DSH CLI or Desktop update service is available; otherwise, the dialog provides a profile-specific manual command to copy and run.

## Usage

1. Open the sidebar session menu and choose **Archive session**.
2. Open **Settings → Archived sessions** to inspect sessions by workspace.
3. Search by title, sort by update time, creation time, or title, or filter the list by project.
4. Select **Unarchive** to restore one session, or select **Restore all** in the page header.
5. Open a project heading's action menu to restore or delete all of that project's archived chats.
6. Use the delete icon to remove one session permanently, then confirm the deletion. **It cannot be undone.**

If the entry is missing after installation or upgrade, restart DSH Web and hard-refresh the browser. It is located directly after **Connectors** in Settings.

## Data handling limits

- Deletion always requires confirmation.
- It removes workspace records, archive markers, and the projection cache. For the official JSONL backend, a validated layout also allows removal of the session-owned directory and its contents, including attachments. Other backends or unknown layouts only lose the located transcript artifact, never its parent directory.
- Project containers and storage roots are retained. Deletion refuses symbolic links or Windows junctions at the official layout's project/session directory levels and keeps the operation retryable.
- Layout validation uses the official backend's initialized absolute root, so a relative root remains stable across host working-directory changes. If that field is unavailable, only an absolute configured root is accepted. An unverified official JSONL layout emits a warning with the session ID and artifact path before falling back to artifact-only deletion.
- Directory validation is not a cross-process filesystem lock: do not concurrently move or replace storage directories or change directory links during deletion. Storage paths writable by untrusted processes are not a security isolation boundary.
- A live session finishes writing before cleanup to prevent data truncation.
- The plugin replaces DSH’s default workspace and projection services. Install through the DSH profile instead of manually composing the patch.

## Secondary development

### Install from source

Use this for debugging or unpublished changes. The cloned directory becomes the plugin source path:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location D:\Repository\deepseek-harness-plugin
git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

Restart DSH Web and hard-refresh the browser. `dsh plugin ... add .` reads the package metadata and `cordis.patch.yml`; do not install by copying `lib` directly.

`src` is the sole maintained source directory. `pnpm build` uses esbuild to compile it into publishable `lib` output. Do not edit `lib` directly because the next build overwrites it.

- [src\index.js](src/index.js): host service entry point.
- [src\workspace.js](src/workspace.js): archived-session and workspace service.
- [src\projcache.js](src/projcache.js): session projection cache.
- [src\client.js](src/client.js): Settings page and archive UI.
- `test\*.test.mjs`: host, client, Remote, and styling coverage.

After changing `src`, run the tests, confirm that generated `lib` output is committed with the source, then install from the local directory:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm pack:check
dsh plugin --profile web add .
```

`pnpm test` runs `pnpm build` first. The build generates all `lib` output from `src` in a temporary directory, then atomically replaces the previous output only after a successful build. A failed build preserves the existing `lib`.

## Validation

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm verify
```

`prepublishOnly` runs the full verification suite before publishing and verifies that committed `lib` output matches the current `src` build.

## License

Licensed under [Apache License 2.0](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for retained release notes.
