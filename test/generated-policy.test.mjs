import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const checker = fileURLToPath(new URL("../scripts/check-generated.mjs", import.meta.url));

test("生成物门禁要求 GitHub 安装包含 lib，且不依赖被拦截的构建脚本", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "dsh-generated-policy-"));
  try {
    await run("git", ["init"], { cwd });
    await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { build: "node scripts/build.mjs" } }), "utf8");
    await writeFile(join(cwd, ".gitignore"), "node_modules/\n", "utf8");
    await mkdir(join(cwd, "lib"));
    await writeFile(join(cwd, "lib", "index.js"), "export {};\n", "utf8");

    await assert.rejects(run(process.execPath, [checker], { cwd }), /必须纳入 Git/);

    await run("git", ["add", "lib/index.js"], { cwd });
    await writeFile(join(cwd, ".gitignore"), "node_modules/\n/lib/\n", "utf8");
    await assert.rejects(run(process.execPath, [checker], { cwd }), /不得忽略编译目录 lib/);

    await writeFile(join(cwd, ".gitignore"), "node_modules/\n", "utf8");
    await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { prepare: "pnpm build" } }), "utf8");
    await assert.rejects(run(process.execPath, [checker], { cwd }), /不能依赖被拦截的构建脚本/);

    await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { build: "node scripts/build.mjs" } }), "utf8");
    await run(process.execPath, [checker], { cwd });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
