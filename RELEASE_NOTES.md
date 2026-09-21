## 中文说明

- 源码迁移为严格 TypeScript；生成的 `lib` 不再进入 Git，由 `prepack` 自动重建。npm 包的 JavaScript 入口和运行模块保持不变。
- 恢复宿主导航边界的快照可调用判断；轮次统计保留旧版畸形载荷语义，跳过非对象事件，避免整行详情读取失败。
- 裁掉两张截图底部的个人文件名条，发布体积更小的 WebP 图片和 DSH 支持徽章，移除未使用的菜单截图。
- 打包前检查全部 11 个运行模块，独立兼容测试先构建。GitHub 发行说明由双语更新日志生成；npm 包不再包含容易过期的独立发行说明文件。

---

## English

- Migrate source code to strict TypeScript. Generated `lib` files are no longer tracked by Git and are rebuilt by `prepack`; published JavaScript entry points and runtime modules remain unchanged.
- Restore callable snapshot guards at the host navigation boundary and preserve previous turn-count semantics for malformed log payloads, skipping non-object events.
- Crop the personal filename strip from both screenshots, ship smaller WebP assets and DSH support badges, and remove the unused menu screenshot.
- Check all 11 runtime modules before packaging and build before standalone compatibility tests. Release notes are generated from the bilingual changelogs for GitHub Releases; the stale standalone notes file is no longer included in npm packages.
