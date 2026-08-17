<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **在 DeepSeek Harness 中安全管理已归档会话**

  [English](README.md) · [Apache-2.0](LICENSE)

  [![许可证：Apache-2.0](https://img.shields.io/badge/许可证-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Archive Manager 是社区维护的 DeepSeek Harness（DSH）插件，并非 DeepSeek AI 官方产品。

## 功能概览

- 在侧栏会话菜单中选择「归档会话」。
- 在「设置 → 已归档」按工作区查看归档会话，并支持搜索和按项目筛选。
- 安全取消归档，将会话恢复到原工作区位置。
- 经确认后永久删除会话、工作区归属、归档标记和投影缓存。
- 经确认后删除全部已归档聊天，包含子代理。
- 已删除的未加载归档会话会立即从已连接客户端的侧栏移除。
- 可把一句话复制到 DSH、Codex 或 WorkBuddy，让对方代装到本机 DSH。

## 界面预览

在侧栏会话菜单中选择「归档会话」：

![从会话菜单归档会话](assets/screenshots/archive-session-menu.png)

在「设置 → 已归档」中搜索、按项目筛选、取消归档或永久删除：

![已归档聊天设置页面](assets/screenshots/archived-sessions.png)

## 前置条件

- 已可正常运行 DeepSeek Harness Web，且可在 PowerShell 中使用 `dsh`。
- 以下示例使用 `web` profile；请替换为实际目标 profile。
- 从源码安装或二次开发需要 Node.js 22+ 与 pnpm；仅从 npm 安装无需另外执行 `pnpm install`。

## 安装

`dsh plugin add` 会转发到 profile 目录里的 `pnpm add`。不写版本、不指定官方源时，本机镜像和最短发布间隔可能让你停在旧版。

### 交给其他 Agent 一句话安装

本插件运行在 DeepSeek Harness Web 里。把下面其中一句复制到 DSH、Codex 或 WorkBuddy，让它代你安装到本机 `web` profile。

从 npm 安装：

```text
请把 DSH 插件 @michengai/dsh-archive-manager 最新版装进本机 web profile，使用官方 npm 源执行：dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/。装完执行 dsh --profile web --dump-config，确认已挂载 archive-manager，并提醒我重启 DSH Web 后硬刷新浏览器。
```

从源码安装：

```text
请从源码安装 DSH 插件 https://github.com/MichengAI/dsh-archive-manager：克隆到本机后执行 pnpm install --frozen-lockfile 和 pnpm build，再用 dsh plugin --profile web add . 把当前目录装进 web profile。不要只复制 lib。装完执行 dsh --profile web --dump-config，确认已挂载 archive-manager，并提醒我重启 DSH Web 后硬刷新浏览器。
```

| 产品 | 怎么用 |
| --- | --- |
| DSH | 把上面其中一句发给当前会话。 |
| Codex | 把上面其中一句发给 Codex，让它在本机执行安装。 |
| WorkBuddy | 把上面其中一句发给 WorkBuddy；源码安装也可同时粘贴仓库地址 `https://github.com/MichengAI/dsh-archive-manager`。 |

Codex 和 WorkBuddy 只负责代装；装好后仍要打开 DSH Web 使用「设置 → 已归档」。

也可以自己执行同一条 npm 命令：

```powershell
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

未把 `dsh` 装进 PATH 时，把开头的 `dsh` 换成 `npx --yes @deepseek-ai/dsh`。

### 从官方 npm 安装最新版

在任意 PowerShell 目录执行：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

需要钉死某一版时，把 `@latest` 换成具体版本，例如 `@0.1.8`。

配置输出中应包含 `workspace-archive-manager` 与 `ui-workspace-archive-manager`。安装后重启 DSH Web 并在浏览器硬刷新；请勿手工复制客户端文件，否则设置页和归档菜单不会被挂载。

### 从源码安装

适用于调试或使用未发布改动。克隆后的目录会直接作为插件安装路径：

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

完成后重启 DSH Web 并硬刷新浏览器。`dsh plugin ... add .` 会读取当前目录的包信息和 `cordis.patch.yml`；不要改为直接复制 `lib` 目录。

## 使用

1. 在侧栏右键或打开会话菜单，选择「归档会话」。
2. 打开「设置 → 已归档」，按工作区查看归档会话。
3. 用搜索框或项目筛选收窄列表。
4. 点击「取消归档」恢复会话；点击删除图标永久移除会话。
5. 删除前确认提示。**删除无法撤销。**

安装或升级后找不到入口时，重启 DSH Web 并硬刷新浏览器；入口位于「设置」中，连接器之后。

## 数据处理边界

- 删除操作始终需要确认。
- 删除会移除会话目录、工作区记录、归档集合和投影缓存。
- 正在写入的会话会在完成写入后清理，避免截断数据。
- 本插件替换 DSH 默认的工作区和会话投影服务；请仅通过 DSH profile 安装，避免手工拼接补丁配置。

## 二次开发

当前仓库未提供 `src` 源目录，`lib` 是直接维护的运行源码；这是当前仓库的实现方式，不是新插件的推荐布局。新插件建议使用 `src` 开发并构建到 `lib`：

- [lib\index.js](lib/index.js)：客户端插件 Host 服务入口。
- [lib\workspace.js](lib/workspace.js)：归档会话和工作区服务实现。
- [lib\projcache.js](lib/projcache.js)：会话投影缓存实现。
- [lib\client.js](lib/client.js)：设置页和归档会话界面。
- `test\*.test.mjs`：Host、客户端、Remote 和样式边界测试。

修改后运行检查、测试并用本地目录重新安装：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm build
pnpm test
pnpm pack:check
dsh plugin --profile web add .
```

`pnpm build` 负责发布包完整性检查，不会将 `lib` 重新编译为其他目录。

## 验证

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm build
pnpm test
pnpm pack:check
```

`prepublishOnly` 会在发布前执行构建检查与测试。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)。
