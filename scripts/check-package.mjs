// 轻量发布预检：校验 DSH 加载器与 npm 包依赖的单包结构。
// 该纯 ESM 插件无需额外构建，此脚本同时作为 `pnpm build` 的校验入口。
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const required = [
  "package.json",
  "lib/index.js",
  "cordis.patch.yml",
  "lib/workspace.js",
  "lib/projcache.js",
  "lib/client.js",
  "LICENSE",
  "README.md"
];

let failed = false;
for (const rel of required) {
  try {
    await access(resolve(root, rel));
    console.log(`ok: ${rel}`);
  } catch {
    console.error(`missing: ${rel}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("package structure OK");
