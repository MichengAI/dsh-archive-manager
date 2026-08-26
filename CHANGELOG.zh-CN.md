# 更新日志

[English](CHANGELOG.md)

以下发布说明会持续保留；新增版本时不再删除较早记录。

## 0.1.15 — 2026-08-26

- 加固永久删除流程：转录已缺失时清理陈旧归档标记、工作区记账、spill 和投影缓存，物理删除失败时仍可重试。
- 会话 ID 被复用时同步撤销工作区与投影缓存墓碑，避免合法的新会话生命周期被阻断。
- 修正批量删除反馈和单条恢复重复提交，并使客户端批量计数与宿主权威归档集合保持一致。

发布包：[`@michengai/dsh-archive-manager@0.1.15`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.15)。

## 0.1.14 — 2026-08-24

- 新增项目级批量恢复和永久删除，并在页面顶部增加「全部恢复」。
- 新增按更新时间、创建时间或标题排序归档聊天；创建时间来自宿主权威元数据。
- 为批量归档操作新增确认、成功和部分失败反馈。

发布包：[`@michengai/dsh-archive-manager@0.1.14`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.14)。

## 0.1.13 — 2026-08-23

- 新增中英文更新日志，展示最近五个发布版本。
- 在中英文 README 中加入更新日志入口，并将日志纳入 npm 包。

发布包：[`@michengai/dsh-archive-manager@0.1.13`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.13)。

## 0.1.12 — 2026-08-18

- 将 DeepSeek 官方包声明为 peerDependencies。
- 使用产品横幅替换 README 顶部标识。
- 将仅供本地使用的文档移出仓库跟踪。

发布标签：[`v0.1.12`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.12)。

## 0.1.11 — 2026-08-17

- 修复设置页筛选、墓碑绕过和冷复用行为。
- 清理客户端级联死代码，并统一复用工作区路径结构。

发布标签：[`v0.1.11`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.11)。

## 0.1.10 — 2026-08-17

- 隔离归档确认弹窗的 Escape 键处理。
- 归档计数仅统计当前可见会话。

发布标签：[`v0.1.10`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.10)。

## 0.1.9 — 2026-08-17

- 移除客户端级联删除，并显示侧栏操作错误。
- 重做项目筛选样式并刷新插件文档。

发布标签：[`v0.1.9`](https://github.com/MichengAI/dsh-archive-manager/tree/v0.1.9)。
