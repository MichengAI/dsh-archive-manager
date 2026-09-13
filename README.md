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
</div>

> DSH Archive Manager is a community-maintained DeepSeek Harness (DSH) plugin, not an official DeepSeek AI product.

## What you can do

Put inactive conversations away and find them again when needed, keeping everyday task lists tidy.

- **Archive conversations**: put away one chat or all unarchived chats in a workspace.
- **Find past work**: search titles, filter by project, and sort by time or title.
- **Restore tasks**: restore one chat, selected chats, a project group, or all archives.
- **Clean up records**: permanently delete unwanted archived conversations after confirmation.

## Screenshots

Archive a chat from the sidebar session menu:

![Archive a session from the session menu](assets/screenshots/archive-session-menu.png)

Find, restore, and clean up chats in **Settings → Archived sessions**:

![Archived sessions settings page](assets/screenshots/archived-sessions.png)

## Prerequisites

- A working [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web installation with `dsh` available in your terminal.
- Supported DSH versions: `0.1.0-rc.8`, `0.1.1-rc.2`, `0.1.2-rc.1`, `0.1.5-rc.1`, and `0.1.5-rc.2`. Other versions are not currently supported.
- Node.js matching `^22.19.0 || >=24.0.0`. Source installation also requires pnpm.

## Installation

Examples use the `web` profile. Replace it with the profile you actually use.

### Ask an agent to install it

Send this prompt to an agent that can run terminal commands on your computer:

```text
Install the latest @michengai/dsh-archive-manager into my local DSH web profile using the official npm registry. Check the plugin configuration afterward, then explain how to reload DSH and open archived session management.
```

### Install manually

Run in PowerShell:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Restart DSH Web, then hard-refresh your browser with `Ctrl+Shift+R`. Open **Settings → Archived sessions** to get started.

## Usage

| Goal | Action |
| --- | --- |
| Archive one chat | Open its sidebar menu and choose **Archive session** |
| Archive a workspace | Open the workspace menu and choose the option to archive its chats |
| Find an archive | Open **Settings → Archived sessions**, then search titles or filter by project |
| Change the order | Sort by update time, creation time, or title |
| Restore one chat | Click **Unarchive** beside the session |
| Restore or delete in bulk | Select chats and use the bulk actions, or use the project menu or page-wide actions |

Selections persist when filters change. Check the hidden selection count before applying bulk actions, or clear your selection first.

### View and continue archived conversations

Available starting with `0.1.40`:

- **View conversation**: open the native DSH session to view messages, attachments, and tool details. Continue chatting while keeping the session archived.
- **Restore and open**: unarchive the session and open it to resume work.

## Updates

Click **Check for updates** in the archive management page header. DSH CLI or Desktop environments with automatic update support can update directly; other environments provide a manual command for the current profile. You can also rerun the installation command above.

## FAQ

### Why is the entry missing after installation?

Restart DSH Web and hard-refresh your browser. Make sure you installed into the profile you are using. If the entry is still missing, run:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh --profile web --dump-config
```

The configuration should include `workspace-archive-manager` and `ui-workspace-archive-manager`. If you previously set the official `ui-workspace` to `disabled: true` in your profile's `cordis.patch.yml`, remove that disabling override and restart.

### How is archiving different from deletion?

Archiving puts a conversation away so you can restore it later. **Permanent deletion cannot be undone** and may also remove that session's attachments. It does not delete your project working directory. Deletion requires confirmation.

### Can I use it with Codex UI?

Yes. [Codex UI](https://github.com/MichengAI/dsh-codex-ui) keeps its sidebar appearance and interactions. Archive management remains available in **Settings → Archived sessions**.

For other problems, open an [issue](https://github.com/MichengAI/dsh-archive-manager/issues) with your DSH and plugin versions, reproduction steps, and error details.

## Install from source

<details>
<summary>Expand for development or testing unreleased changes</summary>

Run these commands in a directory of your choice. For local changes that have not been pushed, use the existing working copy.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

Restart DSH Web and hard-refresh your browser afterward. Edit [src](src), not the generated `lib` directory. Run `pnpm test` to validate changes or `pnpm verify` for the full checks.

</details>

## Related projects

[DSH Codex UI](https://github.com/MichengAI/dsh-codex-ui) provides project and conversation management. For a desktop workbench, see [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop).

## License

Licensed under [Apache License 2.0](LICENSE).
