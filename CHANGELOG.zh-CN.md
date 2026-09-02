# 更新日志

[English](CHANGELOG.md)

以下发布说明会持续保留；新增版本时不再删除较早记录。

## 0.1.24 — 2026-09-02

- 将开发测试依赖升级至 DSH `0.1.2-alpha.5` 与 `@deepseek-ai/cordis` `4.0.2`，运行时支持 DSH `0.1.1-rc.2` 至 `0.1.x`。
- 客户端集成测试以当前 `dsh-client-store` 为主路径，并保留经过测试的可选 `dsh-client-runtime` 回退，兼容旧版宿主。
- 新增可复现的 pnpm alpha 解析策略：关闭自动安装 peer，并记录已批准的刚发布依赖。

## 0.1.23 — 2026-09-01

- 修复 DSH `v0.1.2-alpha.2` 后会话侧栏“等待回答 / 等待审批”状态点不显示的问题：侧栏行现在从 `ui-session` 的 `pendingInteractions` Map 读取待处理交互状态。
- 对 `question`、`approval`、`plan-review` 三种官方可见状态做白名单透传，未知状态会被忽略，避免触发行渲染断言。
- 保留旧版 `SessionSummary.pendingInteraction` 兜底，并补充分组、扁平列表和搜索结果三条路径的回归测试。

已发布包：[`@michengai/dsh-archive-manager@0.1.23`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.23)。

## 0.1.22 — 2026-09-01

- 在「设置 → 已归档」新增任意多选：每行复选框、全选当前筛选结果、跨项目保留选择、批量恢复和确认后的批量永久删除。
- 所选操作复用宿主权威批量路径，陈旧记录清理、部分删除失败和重试行为与项目级及全部操作保持一致。
- 恢复聊天后刷新客户端会话投影，使其立刻重新出现在原工作区。

已发布包：[`@michengai/dsh-archive-manager@0.1.22`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.22)。

## 0.1.21 — 2026-08-31

- 墓碑拦截已删除会话的投影缓存写入时仍保持 `put()` 的 Promise 契约，使 DSH `v0.1.2-alpha.2` 冷读写回继续按 fail-soft 方式处理，而不会同步抛出 `TypeError`。
- 补充 alpha.2 直接调用 `put(...).catch(...)` 的回归测试，同时保留 DSH `v0.1.1-rc.2` 使用的 `putSoft` 路径覆盖，并澄清独立安全缓存域与迁移行为。

已发布包：[`@michengai/dsh-archive-manager@0.1.21`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.21)。

## 0.1.20 — 2026-08-31

- 保持 IM 等不适合作文件名的会话 ID 不变，将投影检查点改用固定长度安全键落盘，避免 DSH `v0.1.2-alpha.2` 在 Windows 上把冒号直接用作文件名。
- 支持从 DSH `v0.1.1-rc.2` 单文件缓存和干净的 alpha 分记录缓存断点续迁、只补缺失项，老用户沿任一升级路径都能保留已有投影缓存。
- 归档标记仍在但旧缓存行缺失时，按需从保留的会话原文重建投影并刷新客户端列表；无论老归档是否带缓存，都能完整显示。

已发布包：[`@michengai/dsh-archive-manager@0.1.20`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.20)。

## 0.1.19 — 2026-08-30

- 修复 DSH `v0.1.2-alpha.1` 中工作区行 **+** 操作：在操作执行时再获取 `uiWorkspace` 服务，避免受插件加载顺序影响，也不再落入已移除的旧版 `startSession` API。

发布包：[`@michengai/dsh-archive-manager@0.1.19`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.19)。

## 0.1.18 — 2026-08-28

- 兼容 DSH `v0.1.2-alpha.1` 拆分后的客户端 Store 布局，同时保留 `v0.1.1-rc.2` 使用的旧版 Runtime 回退路径。
- 在归档管理器替换官方工作区 UI 后补齐 alpha 版侧栏、会话视图和目录选择器依赖的工作区导航服务。
- 在设置页注入边界绑定可观察 Store，并将子代理谱系索引保留在插件内部，避免 alpha 版启动和归档页渲染失败。

发布包：[`@michengai/dsh-archive-manager@0.1.18`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.18)。

## 0.1.17 — 2026-08-28

- 启用仓库 GitHub Actions 发布工作流的 npm Trusted Publishing。

发布包：[`@michengai/dsh-archive-manager@0.1.17`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.17)。

## 0.1.16 — 2026-08-27

- 为归档分组的批量操作菜单补充恢复图标，使操作入口的视觉提示保持一致。
- 将未分组批量操作文案缩短为「全部恢复」和「全部删除」，避免重复上下文并减小菜单宽度。

发布包：[`@michengai/dsh-archive-manager@0.1.16`](https://www.npmjs.com/package/@michengai/dsh-archive-manager/v/0.1.16)。

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
