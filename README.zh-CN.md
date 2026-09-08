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
  [![Node.js 22 or later](https://img.shields.io/badge/Node.js-22%20or%20later-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Archive Manager 是社区维护的 DeepSeek Harness（DSH）插件，并非 DeepSeek AI 官方产品。

## 功能概览

把暂时不用的会话收起来，需要时再找回。集中搜索、恢复和清理归档记录，让日常任务列表更清爽。

- **收起已完成的任务**：归档单条聊天，也可归档整个工作区的未归档聊天。
- **快速找回历史**：在「设置 → 归档会话」搜索标题、按项目筛选，或按时间和标题排序。
- **恢复继续工作**：恢复单条会话、整个项目或全部归档会话。
- **按需清理记录**：支持单条或批量永久删除，执行前会要求确认。**永久删除无法撤销。**

## 界面预览

在侧栏会话菜单中选择「归档会话」：

![从会话菜单归档会话](assets/screenshots/archive-session-menu.png)

在「设置 → 归档会话」中搜索、排序、按项目筛选、取消归档或永久删除：

![已归档聊天设置页面](assets/screenshots/archived-sessions.png)

## DSH 产品生态

想直接使用完整工作台，可下载 [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases)；已有 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 环境，可按需独立安装以下 8 个自研插件。桌面端已随附这些插件。

| 插件 | 你可以用它做什么 |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | 整理项目与会话、搜索任务、跳转对话轮次 |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | 从微信、飞书、钉钉等消息平台下任务、收回复 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 按计划执行任务，查看每次运行的结果 |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | 统一查找、启停、创建和导入本机技能 |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | 搜索、恢复或清理已归档会话 |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | 按任务选择并召唤专业角色 |
| [BTW](https://github.com/MichengAI/dsh-btw) | 在当前上下文中临时旁问，不打断主任务 |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | 用 /simplify 整理 Git 改动范围内的代码 |

## 前置条件

- 当前源码适配基线为 DeepSeek Harness `0.1.3-alpha.2`（官方 master `c389f96`）；这些改动尚未发布，npm `0.1.32` 尚未适配该新版宿主。后续 master 提交需另行验证。

- 已可正常运行 DeepSeek Harness Web，且可在 PowerShell 中使用 `dsh`。
- 以下示例使用 `web` profile；请替换为实际目标 profile。
- 从源码安装或二次开发需要 Node.js 22+ 与 pnpm；仅从 npm 安装无需另外执行 `pnpm install`。

## 安装

源码回归使用 `pnpm test:compat`，在隔离依赖环境中运行同一份插件产物，已验证以下组合（不代表覆盖所有中间版本）：

| DSH | Cordis | 自动回归 |
| --- | --- | --- |
| `0.1.1-rc.2` | `4.0.1` | 134 项通过，另含旧缓存迁移验证 |
| `0.1.2-rc.1` | `4.0.2` | 134 项通过 |
| `0.1.3-alpha.2` | `4.0.2` | 135 项通过 |

覆盖客户端 Remote、归档/恢复、真实 JSONL/Zstandard 删除与子会话级联、删除后重新查询及重新打开存储。验证环境为 Windows / Node.js 24；尚未执行完整 DSH Web 浏览器人工验收。新版存储夹具仅隔离上游无法在 Windows 加载的 POSIX `fs-ext` 导入，实际文件操作与 Windows 原生锁仍使用官方实现。

以下安装命令使用官方 npm 源。

### 让 Agent 帮你安装（推荐）

把下面这段话发给任意能够执行本机终端命令的 Agent。将 `web` 替换为实际使用的 profile；安装完成后，在 DSH 中使用本插件。

```text
请将 DSH 插件 @michengai/dsh-archive-manager 安装到本机 web profile，执行：dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/。安装后执行 dsh --profile web --dump-config，确认配置包含 workspace-archive-manager, ui-workspace-archive-manager，并告诉我如何重新加载 DSH 和开始使用。
```

### 从官方 npm 安装最新版

在任意 PowerShell 目录执行：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

需要钉死某一版时，把 `@latest` 换成具体版本，例如 `@x.y.z`。

配置输出中应包含 `workspace-archive-manager` 与 `ui-workspace-archive-manager`。安装后重启 DSH Web 并在浏览器硬刷新；请勿手工复制客户端文件，否则设置页和归档菜单不会被挂载。

## 在线更新

设置标题会显示当前版本和“检查更新”按钮。发现新版后，只有检测到 DSH CLI 或 Desktop 更新服务时才可使用“自动更新”；其他环境会在弹窗中提供可复制、与当前 Profile 对应的手工更新命令。

## 使用

1. 在侧栏右键或打开会话菜单，选择「归档会话」。
2. 打开「设置 → 归档会话」，按工作区查看归档会话。
3. 按标题搜索，按更新时间、创建时间或标题排序，或按项目筛选列表。
4. 点击「取消归档」恢复单个会话，或在顶部点击「全部恢复」。
5. 打开项目标题右侧菜单，可恢复或删除该项目的全部已归档聊天。
6. 点击删除图标永久移除单个会话；删除前确认提示。**删除无法撤销。**

安装或升级后找不到入口时，重启 DSH Web 并硬刷新浏览器；入口位于「设置」中，连接器之后。

## 数据处理边界

- 删除操作始终需要确认。
- 删除会移除工作区记录、归档标记和投影缓存。官方 JSONL 后端在目录布局校验通过后，会一并删除会话专属目录及其中的附件等内容；其他后端或未知布局仅删除定位到的转录工件，不删除其父目录。
- 不清理项目分组目录或存储根目录。官方布局的项目/会话目录若为符号链接或 Windows junction，会拒绝删除并保留可重试状态。
- 布局校验优先使用官方后端初始化时确定的绝对根路径，相对路径配置不再受宿主工作目录变化影响；若无法取得该字段，则只接受绝对路径配置。官方 JSONL 布局校验失败时，会记录包含会话 ID 和工件路径的警告，再降级为仅删除工件。
- 目录校验不是跨进程文件锁：删除期间不要由其他进程迁移、替换存储目录或改写目录链接。插件不将可被不可信进程改写的存储路径视为安全隔离边界。
- 正在写入的会话会在完成写入后清理，避免截断数据。
- 本插件替换 DSH 默认的工作区和会话投影服务；请仅通过 DSH profile 安装，避免手工拼接补丁配置。

## 二次开发

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

`src` 是唯一可维护源码目录，`pnpm build` 使用 esbuild 将其编译为可发布的 `lib`。请勿直接修改 `lib`，否则下次构建会覆盖改动：

- [src\index.js](src/index.js)：客户端插件 Host 服务入口。
- [src\workspace.js](src/workspace.js)：归档会话和工作区服务实现。
- [src\projcache.js](src/projcache.js)：会话投影缓存实现。
- [src\client.js](src/client.js)：设置页和归档会话界面。
- `test\*.test.mjs`：Host、客户端、Remote 和样式边界测试。

修改 `src` 后，执行测试并确认生成的 `lib` 与 `src` 一同提交，再用本地目录重新安装：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm pack:check
dsh plugin --profile web add .
```

`pnpm test` 会先执行 `pnpm build`。构建在临时目录中从 `src` 生成全部 `lib` 产物；仅在生成成功后才原子替换旧产物，构建失败时会保留旧的 `lib`。

## 验证

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm verify
```

`prepublishOnly` 会在发布前执行完整验证，并确认提交的 `lib` 与当前 `src` 构建结果一致。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)。
