<p align="center">
  <img src="assets/icon.png" alt="DSH Archive Manager" width="96">
</p>

<h1 align="center">DSH Archive Manager</h1>

<p align="center">
  <strong>通过 npm 安装的 DeepSeek Harness Web 插件，用于管理已归档会话。</strong>
</p>

<p align="center">
  <a href="https://github.com/MichengAI/dsh-archive-manager/issues">反馈问题</a>
  · <a href="https://www.npmjs.com/package/@michengai/dsh-archive-manager">在 npm 查看</a>
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Apache License 2.0"></a>
  <a href="https://www.npmjs.com/package/@michengai/dsh-archive-manager"><img src="https://img.shields.io/npm/v/%40michengai/dsh-archive-manager?label=npm" alt="npm 包"></a>
  <img src="https://img.shields.io/badge/DSH-Web%20Plugin-10b981" alt="DSH Web Plugin">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22 或更高版本">
</p>

<p align="center">
  <img src="assets/screenshots/archived-sessions.png" alt="已归档会话设置页面" width="1200">
</p>

> DSH Archive Manager 是社区维护的插件，并非 DeepSeek AI 官方产品。

## 核心能力

- **已归档设置页**：紧随「连接器」设置区块，按工作区分组展示。
- **深色会话卡片**：展示会话标题与更新时间，并提供明确的恢复和删除操作。
- **安全取消归档**：将会话恢复到原工作区位置。
- **永久删除**：确认后移除会话记录、工作区归属、归档标记和投影缓存。
- **立即清理侧栏**：删除未加载的归档会话时也会发送标准移除事件，不会重新出现在「最近」。

## 快速开始

环境要求：可正常运行的 DeepSeek Harness Web 环境。不要在任意目录执行 `npm install`；应将已发布的包安装到 DSH Web profile。

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager
```

安装或升级后请重启 DSH Web，并在浏览器执行硬刷新；无需下载源码。

若软件源镜像尚未同步最新版本，可在安装命令末尾添加 `--registry=https://registry.npmjs.org/`。

## 使用已归档会话

1. 打开「设置 → 已归档」。
2. 展开工作区分组，查看其中的归档会话。
3. 点击「取消归档」恢复会话，或点击「删除」永久移除会话。
4. 确认删除；该操作无法撤销。

## 删除前请注意

- 删除操作始终要求确认。
- 删除会同步移除会话目录、工作区记录、归档集合和投影缓存。
- 运行中的会话会在完成写入后再清理；未加载的归档会话也会从已连接客户端的侧栏移除。

## 找不到「已归档」入口？

安装或升级插件后，请重启 DSH Web 并在浏览器执行硬刷新。入口位于「设置」中，紧随「连接器」之后。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)。
