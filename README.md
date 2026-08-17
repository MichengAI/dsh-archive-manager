<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Safely manage archived sessions in DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [Apache-2.0](LICENSE)

  [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Archive Manager is a community-maintained DeepSeek Harness (DSH) plugin, not an official DeepSeek AI product.

## Features

- Archive a session from the sidebar session menu.
- Search archived chats and filter them by workspace in **Settings → Archived**.
- Restore a session to its original workspace with **Unarchive**.
- Permanently delete a confirmed session, its workspace association, archive marker, and projection cache.
- Delete all archived chats after confirmation, including child agents.
- Remove unloaded deleted sessions from connected sidebars immediately.
- Paste one sentence into DSH, Codex, or WorkBuddy and let that agent install the plugin locally.

## Screenshots

Open the sidebar session menu and choose **Archive session**:

![Archive a session from the session menu](assets/screenshots/archive-session-menu.png)

Search, filter by project, unarchive, or permanently delete chats in **Settings → Archived**:

![Archived chats settings page](assets/screenshots/archived-sessions.png)

## Prerequisites

- A working DeepSeek Harness Web installation with `dsh` available in PowerShell.
- Examples use the `web` profile; replace it with the target profile.
- Source installation and development require Node.js 22+ and pnpm. npm installation does not require running `pnpm install` separately.

## Installation

`dsh plugin add` forwards to `pnpm add` in the profile directory. Without a version and official registry, a local mirror or minimum-release-age policy can leave you on an older build.

### Ask another agent to install it

This plugin runs inside DeepSeek Harness Web. Copy one of the sentences below into DSH, Codex, or WorkBuddy and let that agent install it into your local `web` profile.

From npm:

```text
Install the latest DSH plugin @michengai/dsh-archive-manager into my local web profile using the official npm registry: dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/. Then run dsh --profile web --dump-config, confirm archive-manager is mounted, and remind me to restart DSH Web and hard-refresh the browser.
```

From source:

```text
Install the DSH plugin from source at https://github.com/MichengAI/dsh-archive-manager: clone it, run pnpm install --frozen-lockfile and pnpm build, then run dsh plugin --profile web add . from that directory. Do not copy lib by itself. Then run dsh --profile web --dump-config, confirm archive-manager is mounted, and remind me to restart DSH Web and hard-refresh the browser.
```

| Product | How to use it |
| --- | --- |
| DSH | Send one of the sentences above to the current session. |
| Codex | Send one of the sentences above to Codex and let it install locally. |
| WorkBuddy | Send one of the sentences above to WorkBuddy; for a source install you can also paste `https://github.com/MichengAI/dsh-archive-manager`. |

Codex and WorkBuddy only install the plugin. After that, open DSH Web and use **Settings → Archived**.

You can also run the same npm command yourself:

```powershell
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

If `dsh` is not on PATH, replace the leading `dsh` with `npx --yes @deepseek-ai/dsh`.

### Install the latest package from the official npm registry

Run this from any PowerShell directory:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

To pin a release, replace `@latest` with a version such as `@0.1.8`.

The configuration output should contain `workspace-archive-manager` and `ui-workspace-archive-manager`. Restart DSH Web and hard-refresh the browser. Do not copy client files manually: the Settings page and archive menu need the mounted plugin.

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

## Usage

1. Open the sidebar session menu and choose **Archive session**.
2. Open **Settings → Archived** to inspect sessions by workspace.
3. Use the search box or project filter to narrow the list.
4. Select **Unarchive** to restore a session, or use the delete icon to remove it permanently.
5. Confirm deletion. **It cannot be undone.**

If the entry is missing after installation or upgrade, restart DSH Web and hard-refresh the browser. It is located directly after **Connectors** in Settings.

## Data handling limits

- Deletion always requires confirmation.
- It removes the session directory, workspace records, archive set, and projection cache.
- A live session finishes writing before cleanup to prevent data truncation.
- The plugin replaces DSH’s default workspace and projection services. Install through the DSH profile instead of manually composing the patch.

## Secondary development

This repository has no `src` directory. `lib` is directly maintained runtime source, which is its current layout rather than the recommended layout for new plugins. New plugins should prefer `src` built to `lib`.

- [lib\index.js](lib/index.js): host service entry point.
- [lib\workspace.js](lib/workspace.js): archived-session and workspace service.
- [lib\projcache.js](lib/projcache.js): session projection cache.
- [lib\client.js](lib/client.js): Settings page and archive UI.
- `test\*.test.mjs`: host, client, Remote, and styling coverage.

After changing the runtime source, validate, test, and install from the local directory:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm build
pnpm test
pnpm pack:check
dsh plugin --profile web add .
```

`pnpm build` validates package integrity; it does not compile `lib` into another directory.

## Validation

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm build
pnpm test
pnpm pack:check
```

`prepublishOnly` runs the build check and tests before publishing.

## License

Licensed under [Apache License 2.0](LICENSE).
