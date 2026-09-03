// 发布产物由 esbuild 固定写为 LF；Windows 检出也必须保持 LF，避免生成物同步误报。
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("JavaScript 源码和发布产物在所有平台固定使用 LF", async () => {
	const attributes = await readFile(new URL("../.gitattributes", import.meta.url), "utf8");
	assert.match(attributes, /^\*\.js text eol=lf$/m);
	assert.match(attributes, /^\*\.mjs text eol=lf$/m);
});
