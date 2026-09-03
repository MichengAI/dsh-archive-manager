// 源码与发布产物边界测试：防止实现重新直接维护在 lib 目录。
import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import test from "node:test";
import assert from "node:assert/strict";

const run = promisify(execFile);
const root = new URL("../", import.meta.url);
const modules = ["index", "workspace", "projcache", "tombstone", "client"];

test("src 是唯一维护源码，lib 是完整发布产物", async () => {
	for (const module of modules) {
		await access(new URL(`../src/${module}.js`, import.meta.url), constants.R_OK);
		await access(new URL(`../lib/${module}.js`, import.meta.url), constants.R_OK);
	}

	const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
	assert.match(manifest.scripts?.build ?? "", /scripts[\\/]build\.mjs/);
	assert.match(manifest.scripts?.test ?? "", /node --test test[\\/][*]\.test\.mjs/);
});

test("构建失败时保留已有 lib 并清理临时目录", async () => {
	await access(new URL("../scripts/build.mjs", import.meta.url), constants.R_OK);
	const output = new URL("../lib/workspace.js", import.meta.url);
	const before = createHash("sha256").update(await readFile(output)).digest("hex");

	await assert.rejects(() => run(process.execPath, ["scripts/build.mjs"], {
		cwd: root,
		env: { ...process.env, DSH_ARCHIVE_MANAGER_TEST_FAIL_BEFORE_PUBLISH: "1" }
	}));

	const after = createHash("sha256").update(await readFile(output)).digest("hex");
	assert.equal(after, before);
	const temporaryDirectories = (await readdir(root)).filter((name) => name.startsWith(".dsh-archive-manager-build-"));
	assert.deepEqual(temporaryDirectories, []);
});
