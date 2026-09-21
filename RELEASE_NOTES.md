## 中文说明

从 0.1.44 升级到首个 1.0 正式版本，集中完善会话整理、检索、预览与异常修复。沿用原有安装包名和数据，不要求迁移会话；现有归档、恢复、永久删除及原生会话导航继续保留。

### 会话列表与统一筛选

- 已归档、未归档两页统一支持标题／正文搜索、项目、收藏和更新时间范围筛选；默认只搜索标题，搜索框左侧切换范围，右侧打开日期选择器。结束日期包含本地当天，支持独立清除日期及点击外部关闭。
- 使用紧凑项目分组列表，项目可折叠；标题点击打开原生会话，星标、恢复／归档使用右侧图标，更多菜单提供恢复打开、预览、复制与删除等适用操作。
- 支持更新时间、创建时间、标题和轮次升降序排序；分组计数跟随筛选，空态区分当前页签。
- 全选只覆盖当前筛选结果，包含折叠组中的匹配项；切页签清空选择，改变筛选保留选择并提示隐藏选中项。项目菜单仍操作整个项目，不受筛选影响。
- 移除重复的页面级「全部恢复／全部删除」按钮；保留勾选批量操作及项目菜单，操作结果按页签隔离。

### 收藏、闲置整理与批量操作

- 两页均可收藏／取消收藏，通过下拉菜单只看收藏；收藏保存于宿主，归档、恢复和更换浏览器后保留。索引暂时未知或读取失败不会清除收藏，只有确证工件缺失时才清理。
- 未归档页支持设置 1～36500 个整数闲置天数，结合当前筛选预览候选；确认清单可逐条取消。排除收藏、当前打开、正在执行及等待交互的会话，并考虑子代理活动；无有效活动时间不参与。
- 归档前再次检查收藏和活动状态。批量归档、恢复、删除显示进度及成功／跳过／失败／未处理明细；遇到首个失败停止，允许只重试剩余项，删除重试仍需确认。
- 支持「撤回本次归档」，恢复最近一批实际成功归档及重试成功的会话；仅当前管理页打开期间有效，不撤回永久删除。

### 正文检索与快速预览

- 在用户与助手的持久化正文中查找关键词，显示命中片段和高亮；读取失败显示明细并支持重试，更改筛选后旧响应不会覆盖新结果。
- 已归档会话可不恢复直接预览，展示首个命中附近上下文或最近八条消息；未归档命中片段打开完整会话。
- 预览支持 Markdown 表格、引用、代码块和角色区分，可切换原文高亮；加宽弹窗并补齐操作图标。
- 修复大小写折叠引起的 Unicode 偏移错误、截断切开代理对、Esc 连带关闭设置，以及切换页签后预览自行重开。

### 轮次统计与会话定位

- 两页显示用户提交轮次，包括图片消息及分支继承的用户消息，不把助手回复、工具调用或插件注入算作轮次。
- 提供轮次最多／最少排序，未知轮次始终置后；详情读取失败可查看并重试。
- 更多菜单支持分别复制会话 ID 和路径。官方 JSONL 后端复制会话目录，其他后端使用宿主返回的有效路径；路径缺失和剪贴板失败均明确提示。

### 异常诊断与定向修复

- 已归档页汇总异常会话，包括缺少摘要的归档 ID；诊断区使用可折叠状态卡片，提供分类建议及技术详情。
- 缺文件、权限、损坏等分类优先使用稳定错误码、兼容文案兜底；诊断发现不能自动修复时仍保留原分类，追加受限原因。
- 对支持的旧自动化消息来源提供「诊断 → 确认修复」流程。以实际工件、宿主格式校验和写锁判断资格，不仅依赖错误措辞；要求已归档且未被任何 DSH 进程打开。
- 保留原始日志、正文、任务归属和继承信息，经宿主重新编码与校验后发布新代际；修复文件使用私有权限。发布采用禁止覆盖策略，硬链接不可用时安全失败，不覆盖现有日志。

### 界面、国际化与兼容性

- 对齐官方主题的选中、复选框、焦点、警告、更新按钮及高亮配色；完善日期下拉、诊断卡片、星标和操作图标。
- 补齐诊断、预览、更新入口和错误提示的中英文；切换语言不再额外触发详情读取，修复复制错误和空态文案。
- 更新已归档／未归档截图及双语 README，完整说明筛选、撤回、修复与检索边界。
- 保持既有 DSH 支持范围：0.1.0-rc.8、0.1.1-rc.2、0.1.2-rc.1、0.1.5-rc.1、0.1.5-rc.2、0.1.6-alpha.1、0.1.6-alpha.2；与 Codex UI 共存，不新增侧栏置顶或收藏功能。
- 正式检索接口为 searchSessionContent，支持两种归档状态；searchArchivedContent 保留为旧宿主／客户端的归档专用兼容入口，不重复调用。

### 使用边界与验证

- 正文检索和轮次没有持久化索引；每批最多 20 条会话、批内逐条读取。大量或超长日志建议先缩小范围，尚无规模或时延承诺；在途批次不能中止，取消只阻止后续批次及旧结果回写。
- 检索关键词最多 200 字符；不搜索工具输出、附件、推理、系统和插件注入。预览每条最多 2000 个 UTF-16 码元，保留完整 Unicode 字符；完整内容通过原生会话查看。
- 没有后台定时归档；收藏保护仅适用于闲置整理。其他页面的收藏变更需重开管理页读取；撤回记录在关闭或刷新后消失。
- 自动修复不是通用日志恢复工具：缺失、权限及不支持的损坏只提供建议，不删除或截断消息。永久删除不可撤销；本轮不新增任务摘要和 Markdown 导出。
- 功能候选已通过本地回归、支持宿主隔离矩阵及真实 DSH 0.1.6-alpha.2 浏览器冒烟，覆盖检索、预览、收藏、批量操作、诊断与修复。真实模型发送、流式回复、工具审批和未知宿主版本不在本次验收承诺内。
- 宿主设置窗口在极窄屏下的遮挡仍需宿主侧修复；未承诺所有移动端布局均可用。

---

## English

The first 1.0 release expands session organization, search, previews, and targeted repair since 0.1.44. The package name and existing data remain unchanged; no session migration is required. Existing archive, restore, permanent deletion, and native conversation navigation remain available.

### Lists and shared filters

- Archived and Unarchived share title/content search, project, favorites, and updated-date filters. Titles-only remains the default; switch scope on the left of the search box and open dates on the right. The end date includes the entire local day; dates can be cleared independently and the popover closes on outside clicks.
- Compact collapsible project groups provide clickable titles, right-side stars and archive/restore icons, and applicable More actions for restore-and-open, preview, copying, and deletion.
- Sort by update time, creation time, title, or most/fewest turns. Group counts follow filters and empty states match the active tab.
- Select all covers filtered results, including collapsed groups. Switching tabs clears selection; filtering preserves it and reports hidden selections. Project-wide actions remain independent of filters.
- Remove redundant page-wide Restore all / Delete all buttons while retaining selection-based and project actions. Operation results remain scoped to their tab.

### Favorites, idle cleanup, and batch actions

- Star or unstar on either tab and filter to favorites. Host-persisted favorites survive archive, restore, and browser changes. Unknown indexes and read failures do not remove favorites; cleanup requires confirmed artifact absence.
- On Unarchived, preview idle candidates using 1–36,500 whole days and the current filters; deselect individual candidates before confirmation. Exclude favorites, the current conversation, running sessions, pending interactions, and sessions with active subagents or no valid activity time.
- Recheck favorites and activity before archiving. Batch archive, restore, and delete show progress and successful/skipped/failed/remaining results. Stop at the first failure and retry only remaining items; delete retries still require confirmation.
- Undo the most recent successful archive batch, including successful retries, while the management page remains open. Permanent deletion cannot be undone.

### Content search and quick preview

- Search persisted user and assistant text with snippets and highlights. Read failures remain visible and retryable; obsolete responses cannot replace results after filters change.
- Preview archived sessions without restoring them, showing context around the first match or up to eight recent messages. Unarchived snippets open the full conversation.
- Render Markdown tables, quotes, code blocks, and role labels, with a source/highlight mode, a wider dialog, and action icons.
- Fix Unicode offsets after case folding, split surrogate pairs on truncation, Escape closing Settings as well as preview, and previews reopening after tab switches.

### Turn counts and session location

- Show user submission counts on both tabs, including image submissions and inherited branch messages; exclude assistant replies, tool calls, and injected messages.
- Sort by most/fewest turns with unknown counts always last; inspect and retry detail failures.
- Copy session IDs and paths separately from More. Official JSONL storage exposes the session directory; other backends use a valid host-provided path. Missing paths and clipboard failures are reported explicitly.

### Diagnosis and targeted repair

- Collect archived read failures, including IDs without summaries, in collapsible diagnostic cards with classified advice and technical details.
- Prefer stable error codes for missing files, permissions, and corruption, with message-based compatibility fallbacks. Unavailable repair preserves the original classification and appends its limitation.
- Diagnose and explicitly confirm repair for supported legacy automation message sources. Eligibility depends on artifacts, host format validation, and a write lease, not just error wording. Sessions must be archived and closed in every DSH process.
- Retain original logs, text, automation attribution, and inheritance data. Publish a new generation only after host re-encoding and validation; create private repair files. Publication never overwrites existing logs and fails safely if hard links are unavailable.

### UI, localization, and compatibility

- Align selection, checkboxes, focus, warnings, updates, and highlights with official theme tokens; refine date controls, diagnostic cards, stars, and action icons.
- Complete Chinese/English diagnosis, preview, update, and error messages. Language changes no longer cause extra detail reads; fix copy-error and empty-state text.
- Refresh Archived/Unarchived screenshots and both READMEs, including filter, undo, repair, and search boundaries.
- Retain support for DSH 0.1.0-rc.8, 0.1.1-rc.2, 0.1.2-rc.1, 0.1.5-rc.1, 0.1.5-rc.2, 0.1.6-alpha.1, and 0.1.6-alpha.2. Coexist with Codex UI; no new sidebar pinning or favorites features are introduced.
- searchSessionContent is the canonical API for both archive states. Keep searchArchivedContent as the archived-only compatibility entry for older hosts/clients; do not dispatch duplicate searches.

### Limits and validation

- Content search and turn counts have no persistent index. Read at most 20 sessions per batch, sequentially. Narrow filters for large or long logs; no scale or latency guarantee is established. In-flight batches cannot be interrupted; cancellation prevents subsequent batches and stale results.
- Queries accept up to 200 characters. Search excludes tools, attachments, reasoning, system messages, and plugin injections. Preview limits each message to 2,000 UTF-16 code units without splitting Unicode characters; open the native conversation for full content.
- No scheduled background archiving. Favorite protection applies only to idle cleanup. Reopen management to see favorites changed elsewhere; closing or refreshing clears undo history.
- Repair is not a general recovery tool: missing files, permissions, and unsupported corruption receive advice, never forced deletion or truncation. Permanent deletion is irreversible. Task summaries and Markdown export are not added.
- The functional candidate passed local regressions, isolated supported-host matrices, and real DSH 0.1.6-alpha.2 browser smoke tests covering search, preview, favorites, batches, diagnosis, and repair. Real model submission, streaming, tool approvals, and unknown host versions are outside this validation claim.
- The host Settings shell still has an extremely narrow-screen obstruction; full mobile layout support is not claimed.
