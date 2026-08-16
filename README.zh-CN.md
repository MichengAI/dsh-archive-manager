<h1 align="center">DSH Archive Manager</h1>

<p align="center">
  <strong>通过 npm 安装的 DeepSeek Harness Web 插件，用于管理已归档会话。</strong>
</p>

<p align="center">
  <a href="https://github.com/MichengAI/dsh-archive-manager/issues">反馈问题</a>
  · <a href="https://github.com/MichengAI/dsh-archive-manager">在 GitHub 查看</a>
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Apache License 2.0"></a>
  <img src="https://img.shields.io/badge/DSH-Web%20Plugin-10b981" alt="DSH Web Plugin">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22 或更高版本">
</p>

> DSH Archive Manager 是社区维护的插件，并非 DeepSeek AI 官方产品。

## 核心能力

- **已归档设置页**：紧随「连接器」设置区块，按工作区分组展示。
- **深色会话卡片**：展示会话标题与更新时间，并提供明确的恢复和删除操作。
- **安全取消归档**：将会话恢复到原工作区位置。
- **永久删除**：确认后移除会话记录、工作区归属、归档标记和投影缓存。
- **立即清理侧栏**：删除未加载的归档会话时也会发送标准移除事件，不会重新出现在「最近」。

## 快速开始

环境要求：可正常运行的 DeepSeek Harness Web 环境。将已发布的包安装到 DSH Web profile：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager
```

本地开发时，可将包名替换为仓库绝对路径。安装或升级后请重启 DSH Web，并在浏览器执行硬刷新。

## 使用已归档会话

1. 打开「设置 → 已归档」。
2. 展开工作区分组，查看其中的归档会话。
3. 点击「取消归档」恢复会话，或点击「删除」永久移除会话。
4. 确认删除；该操作无法撤销。

## 安全行为

- 删除操作始终要求确认。
- 删除会同步移除会话目录、工作区记录、归档集合和投影缓存。
- 运行中的会话会在清理前完成写入并释放；未加载的归档会话也会向已连接客户端广播移除通知。

## 开发与验证

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
pnpm run pack:check
```

## 项目结构

- `lib\client.js`：浏览器设置页、会话卡片与交互。
- `lib\workspace.js`：归档、取消归档和永久删除服务。
- `lib\projcache.js`：投影缓存清理扩展。
- `cordis.patch.yml`：DSH 服务替换配置。
- `test\`：Node.js 自动化测试。

## 维护者发布

发布前更新版本并检查包内容：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm version patch
pnpm run pack:check
npm publish
```

发布前会由 `prepublishOnly` 自动运行构建和测试。包发布到官方 npm registry。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)。
