<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

# DSH Archive Manager

  **在 DeepSeek Harness 中安全管理已归档会话**

  [English](README.md) · [更新日志](CHANGELOG.zh-CN.md) · [Apache-2.0](LICENSE)

  [![许可证：Apache-2.0](https://img.shields.io/badge/许可证-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![npm 下载量](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20%E4%B8%8B%E8%BD%BD%E9%87%8F)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
</div>

> DSH Archive Manager 是社区维护的 DeepSeek Harness（DSH）插件，并非 DeepSeek AI 官方产品。

## 你可以用它做什么

把暂时不用的会话收起来，需要时再找回，让日常任务列表更清爽。

- **归档会话**：收起单条聊天，或整个工作区的未归档聊天。
- **找回历史**：搜索会话标题，按项目筛选，按时间或标题排序。
- **恢复任务**：恢复单条、选中的会话、整个项目或全部归档会话。
- **清理记录**：确认后永久删除不再需要的归档会话。

## 界面预览

从侧栏会话菜单归档聊天：

![从会话菜单归档会话](assets/screenshots/archive-session-menu.png)

在「设置 → 归档会话」集中查找、恢复和清理：

![归档会话管理页](assets/screenshots/archived-sessions.png)

## 前置条件

- 已能正常使用 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web，并可在终端运行 `dsh`。
- 当前支持 DSH `0.1.0-rc.8`、`0.1.1-rc.2`、`0.1.2-rc.1`、`0.1.5-rc.1`、`0.1.5-rc.2`；其他版本暂未纳入支持范围。
- Node.js 版本需满足 `^22.19.0 || >=24.0.0`；从源码安装还需要 pnpm。

## 安装

以下示例使用 `web` profile，请替换为你实际使用的 profile。

### 让 Agent 帮你安装

把下面这段话发给能执行本机终端命令的 Agent：

```text
请将 @michengai/dsh-archive-manager 最新版安装到本机 DSH 的 web profile，使用官方 npm 源。安装后检查插件配置，并告诉我如何重新加载 DSH、进入归档会话管理页。
```

### 手动安装

在 PowerShell 中执行：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

安装后重启 DSH Web，并按 `Ctrl+Shift+R` 硬刷新浏览器。打开「设置 → 归档会话」即可使用。

## 使用

| 你想做什么 | 操作 |
| --- | --- |
| 归档一条会话 | 打开侧栏会话菜单，选择「归档会话」 |
| 归档整个工作区 | 打开工作区菜单，选择归档该工作区的会话 |
| 查找归档 | 打开「设置 → 归档会话」，搜索标题或按项目筛选 |
| 调整排列顺序 | 按更新时间、创建时间或标题排序 |
| 恢复一条会话 | 点击会话右侧的「取消归档」 |
| 批量恢复或删除 | 勾选会话后使用批量操作；也可使用项目菜单或页面顶部的全部操作 |

切换筛选条件会保留已选会话。批量操作前留意隐藏的已选数量，或先清空选择。

### 查看并继续归档对话（尚未发布）

当前源码新增以下操作，npm 发布版暂不包含：

- **查看对话**：打开 DSH 原生会话页，查看消息、附件和工具详情；可直接继续聊天，保持归档状态。
- **恢复并打开**：取消归档后进入原会话，继续工作。

## 更新

在归档管理页标题处点击「检查更新」。支持自动更新的 DSH CLI 或 Desktop 环境可直接更新；其他环境会提供适用于当前 profile 的手动命令。也可重新执行上面的安装命令。

## 常见问题

### 安装后找不到入口？

先重启 DSH Web 并硬刷新浏览器，确认安装到了当前使用的 profile。仍未显示时，执行：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh --profile web --dump-config
```

配置中应包含 `workspace-archive-manager` 和 `ui-workspace-archive-manager`。若曾在 profile 的 `cordis.patch.yml` 中手动将官方 `ui-workspace` 设为 `disabled: true`，请移除该禁用覆盖，再重启。

### 归档和删除有什么区别？

归档只是收起会话，可以恢复。**永久删除无法撤销**，并可能一并清理该会话的附件；不会删除你的项目工作目录。删除前会要求确认。

### 可以和 Codex UI 一起使用吗？

可以。保留 [Codex UI](https://github.com/MichengAI/dsh-codex-ui) 的侧栏样式和交互，归档管理仍在「设置 → 归档会话」中。

遇到其他问题，请提交 [Issue](https://github.com/MichengAI/dsh-archive-manager/issues)，附上 DSH 与插件版本、复现步骤和错误信息。

## 从源码安装

<details>
<summary>开发或测试未发布改动时展开</summary>

在你选择的源码目录中执行以下命令。未推送的本地改动需使用已有工作副本。

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

完成后重启 DSH Web 并硬刷新浏览器。修改 [src](src) 中的源码，不直接编辑生成目录 `lib`；使用 `pnpm test` 验证修改，使用 `pnpm verify` 执行完整检查。

</details>

## 相关项目

[DSH Codex UI](https://github.com/MichengAI/dsh-codex-ui) 提供项目与会话管理界面；想使用桌面工作台，可查看 [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop)。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)。
