<p align="center">
  <img src="assets/icon.png" alt="DSH Archive Manager" width="96">
</p>

<h1 align="center">DSH Archive Manager</h1>

<p align="center">
  <strong>An npm-installable DeepSeek Harness Web plugin for managing archived sessions.</strong>
</p>

<p align="center">
  <a href="https://github.com/MichengAI/dsh-archive-manager/issues">Report an issue</a>
  · <a href="https://www.npmjs.com/package/@michengai/dsh-archive-manager">View on npm</a>
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Apache License 2.0"></a>
  <a href="https://www.npmjs.com/package/@michengai/dsh-archive-manager"><img src="https://img.shields.io/npm/v/%40michengai/dsh-archive-manager?label=npm" alt="npm package"></a>
  <img src="https://img.shields.io/badge/DSH-Web%20Plugin-10b981" alt="DSH Web Plugin">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22 or later">
</p>

<p align="center">
  <img src="assets/screenshots/archived-sessions.png" alt="Archived Sessions settings page" width="1200">
</p>

> DSH Archive Manager is a community-maintained plugin. It is not an official DeepSeek AI product.

## What it provides

- **Archived Sessions settings page** — placed directly after Connectors and grouped by workspace.
- **Dark session cards** — show the session title and update time with explicit restore and delete actions.
- **Safe unarchive** — restores a session to its original workspace position.
- **Permanent deletion** — removes the transcript, workspace accounting, archive marker, and projection-cache record after confirmation.
- **Immediate sidebar cleanup** — deleted cold sessions emit the standard removal event, so they do not reappear under Recent.

## Quick start

You need a working DeepSeek Harness Web installation. Do not run `npm install` in an arbitrary directory: install the published package into the DSH Web profile instead.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager
```

Restart DSH Web and hard-refresh the browser after installing or upgrading. No source checkout is required.

If a package mirror has not synchronized the latest version yet, append `--registry=https://registry.npmjs.org/` to the install command.

## Use Archived Sessions

1. Open **Settings → Archived Sessions**.
2. Select a workspace group to review its archived sessions.
3. Choose **Unarchive** to restore a session, or **Delete** to permanently remove it.
4. Confirm deletion. This action cannot be undone.

## Before you delete

- Deletion always requires confirmation.
- A deleted session is removed from its transcript directory, workspace records, archived-session set, and projection cache.
- Live sessions finish writing before cleanup; unloaded archived sessions are also removed from connected sidebars.

## Can't find Archived Sessions?

Restart DSH Web and hard-refresh the browser after installing or upgrading the plugin. The entry is located in **Settings**, directly after **Connectors**.

## License

Licensed under the [Apache License 2.0](LICENSE).
