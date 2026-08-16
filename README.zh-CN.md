<p align="center">
  <img src="assets/icon.png" alt="DSH Archive Manager" width="96">
</p>

<h1 align="center">DSH Archive Manager</h1>

<p align="center">
  <strong>安全管理已归档会话的 DeepSeek Harness Web 插件。</strong>
</p>

<p align="center">
  <a href="https://github.com/MichengAI/dsh-archive-manager/issues">反馈问题</a>
  · <a href="https://www.npmjs.com/package/@michengai/dsh-archive-manager">在 npm 查看</a>
  · <a href="README.md">English</a>
</p>

> DSH Archive Manager 是社区维护的插件，并非 DeepSeek AI 官方产品。

## 功能概览

- 在「设置 → 已归档」按工作区展示归档会话。
- 安全取消归档，将会话恢复到原工作区位置。
- 经确认后永久删除会话、工作区归属、归档标记和投影缓存。
- 已删除的未加载归档会话会立即从已连接客户端的侧栏移除。

![已归档会话设置页面](assets/screenshots/archived-sessions.png)

## 前置条件

- 已可正常运行 DeepSeek Harness Web，且可在 PowerShell 中使用 `dsh`。
- 以下示例使用 `web` profile；请替换为实际目标 profile。
- 从源码安装或二次开发需要 Node.js 22+ 与 pnpm；仅从 npm 安装无需在任意目录执行 `npm install`。

## 安装

### 从 npm 安装

在任意 PowerShell 目录执行。请通过 `dsh plugin` 安装到 DSH profile，而不是在普通项目中安装该 npm 包：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager
dsh --profile web --dump-config
```

安装或升级后重启 DSH Web，并在浏览器硬刷新。若镜像未同步最新版本，可在安装命令末尾追加 `--registry=https://registry.npmjs.org/`。

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

完成后重启 DSH Web 并硬刷新浏览器。`dsh plugin ... add .` 会自动应用 `cordis.patch.yml`；不要手工复制 `lib` 或客户端文件。

## 使用

1. 打开「设置 → 已归档」。
2. 展开工作区分组，查看其中的归档会话。
3. 点击「取消归档」恢复会话；点击「删除」永久移除会话。
4. 删除前确认提示。**删除无法撤销。**

安装或升级后找不到入口时，重启 DSH Web 并硬刷新浏览器；入口位于「设置」中，紧随「连接器」之后。

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
