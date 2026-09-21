import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const checker = fileURLToPath(new URL("../scripts/check-generated.mjs", import.meta.url));

test("生成物门禁拒绝跟踪 lib，取消跟踪后允许保留本地构建产物", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "dsh-generated-policy-"));
  try {
    await run("git", ["init"], { cwd });
    await mkdir(join(cwd, "lib"));
    await writeFile(join(cwd, "lib", "index.js"), "export {};\n", "utf8");
    await run("git", ["add", "lib"], { cwd });
    await assert.rejects(run(process.execPath, [checker], { cwd }), /不应纳入 Git/);
    await run("git", ["rm", "--cached", "lib/index.js"], { cwd });
    await access(join(cwd, "lib", "index.js"));
    await run(process.execPath, [checker], { cwd });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
