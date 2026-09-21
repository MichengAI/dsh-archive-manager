import test from "node:test";
import assert from "node:assert/strict";
import { zstdCompressSync } from "node:zlib";
import { decodeRepairLog, normalizeAutomationSources, classifySessionError } from "../src/session-repair.ts";
test("连续压缩帧完整读取，残缺日志拒绝修复", () => {
  const bytes = Buffer.concat([zstdCompressSync(Buffer.from('{"type":"session","version":0}\n')), zstdCompressSync(Buffer.from('{"seq":0}\n'))]);
  assert.equal(decodeRepairLog(bytes, true).length, 2);
  assert.throws(() => decodeRepairLog(bytes.subarray(0, bytes.length - 2), true));
  assert.throws(() => decodeRepairLog(Buffer.from("{}"), false), /完整/);
});
test("仅转换已知自动化消息来源，保留正文和归属且不修改输入", () => {
  const source = { kind: "automation", automationId: "a", runId: "r", scheduledFor: "2026-09-01T00:00:00Z" };
  const rows = [{ type: "session", version: 0 }, { type: "user/message", data: { source, content: "正文" } }, { type: "assistant/message", data: { message: { source: { kind: "model" }, content: "回答" } } }];
  const result = normalizeAutomationSources(rows);
  assert.equal(result.count, 1);
  assert.equal(rows[1].data.source.kind, "automation");
  assert.equal(result.rows[1].data.source.plugin, "dsh-automation");
  assert.deepEqual(JSON.parse(result.rows[1].data.source.summary), source);
  assert.equal(result.rows[1].data.content, "正文");
  assert.throws(() => normalizeAutomationSources([{ type: "session", version: 0 }, { type: "user/message", data: { source: { kind: "automation" } } }]), /归属/);
  assert.equal(classifySessionError("cannot safely transform unclassified message source").code, "legacy-source");
  assert.equal(classifySessionError("ENOENT").code, "missing");
});
import { mkdtemp, writeFile, readFile, rm, mkdir, symlink, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, toNamespacedPath } from "node:path";
import { execFileSync } from "node:child_process";
import { prepareAutomationRepair } from "../src/session-repair.ts";
const fakeFormat = {
  currentVersion: 3,
  createRestore(header) {
    const events = [];
    return { decodeRow: (row) => events.push(row), finish: () => ({ header: { ...header, version: 3 }, events, inheritedEventCount: header.inheritedEventCount ?? 0 }) };
  },
  encodeHeader: (header, inheritedEventCount) => ({ ...header, inheritedEventCount }),
  encodeEvent: (event) => event
};

async function writeRepairSource(directory) {
  const rows = [
    { type: "session", version: 0, id: "a" },
    { type: "user/message", data: { source: { kind: "automation", automationId: "a", runId: "r", scheduledFor: "2026-09-01T00:00:00Z" } } }
  ];
  await writeFile(join(directory, "session.jsonl"), rows.map(JSON.stringify).join("\n") + "\n", "utf8");
}

for (const kind of ["扩展路径", "短路径"]) {
  test(`Windows ${kind}指向常规目录时允许修复`, { skip: process.platform !== "win32" }, async (t) => {
    const directory = await mkdtemp(join(await realpath(tmpdir()), "archive-repair-long-directory-"));
    try {
      await writeRepairSource(directory);
      const alias = kind === "扩展路径" ? toNamespacedPath(directory) : execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; $fsObject = New-Object -ComObject Scripting.FileSystemObject; $fsObject.GetFolder($env:REPAIR_TEST_DIRECTORY).ShortPath'
      ], { encoding: "utf8", env: { ...process.env, REPAIR_TEST_DIRECTORY: directory } }).trim();
      if (kind === "短路径" && alias.toLowerCase() === directory.toLowerCase()) {
        t.skip("当前卷未提供短路径别名");
        return;
      }
      const target = join(alias, "session.v3.jsonl");
      const plan = await prepareAutomationRepair({ directory: alias, target, sessionId: "a", format: fakeFormat });
      await plan.publish(plan.token, async () => {});
      assert.match(await readFile(target, "utf8"), /dsh-automation/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

test("会话目录及祖先目录的真实链接仍然拒绝修复", async () => {
  const root = await mkdtemp(join(await realpath(tmpdir()), "archive-repair-links-"));
  try {
    const directory = join(root, "real", "session");
    await mkdir(directory, { recursive: true });
    await writeRepairSource(directory);
    const direct = join(root, "direct"), parent = join(root, "parent");
    const type = process.platform === "win32" ? "junction" : "dir";
    await symlink(directory, direct, type);
    await symlink(join(root, "real"), parent, type);
    for (const alias of [direct, join(parent, "session")]) {
      await assert.rejects(prepareAutomationRepair({ directory: alias, target: join(alias, "session.v3.jsonl"), sessionId: "a", format: fakeFormat }), /链接重定向/);
    }
    assert.deepEqual(await (await import("node:fs/promises")).readdir(directory), ["session.jsonl"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("修复令牌绑定原文件，原文件保留且禁止覆盖已有代际", async () => {
  const directory = await mkdtemp(join(tmpdir(), "archive-repair-test-"));
  try {
    const source = join(directory, "session.jsonl"), target = join(directory, "session.v3.jsonl");
    const original = JSON.stringify({ type: "session", version: 0, id: "a" }) + "\n" + JSON.stringify({ type: "user/message", data: { source: { kind: "automation", automationId: "a", runId: "r", scheduledFor: "2026-09-01T00:00:00Z" }, content: "正文" } }) + "\n";
    await writeFile(source, original, "utf8");
    const plan = await prepareAutomationRepair({ directory, target, sessionId: "a", format: fakeFormat });
    await assert.rejects(plan.publish("0".repeat(64), async () => {
    }), /变化/);
    await writeFile(source, original + "\n", "utf8");
    await assert.rejects(plan.publish(plan.token, async () => {
    }), /变化/);
    await writeFile(source, original, "utf8");
    await assert.rejects(plan.publish(plan.token, async () => {
      throw new Error("会话已打开");
    }), /打开/);
    await plan.publish(plan.token, async () => {
    });
    assert.equal(await readFile(source, "utf8"), original);
    assert.match(await readFile(target, "utf8"), /dsh-automation/);
    await assert.rejects(plan.publish(plan.token, async () => {
    }), { code: "EEXIST" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
import { createSessionHealthPanel } from "../src/session-health-ui.ts";
test("异常默认折叠，先诊断再确认修复，修复后刷新详情", async () => {
  const slots = [];
  let cursor = 0, diagnoses = 0, repairs = 0, retries = 0;
  const React = { useState(value) {
    const i = cursor++;
    slots[i] ??= value;
    return [slots[i], (next) => slots[i] = typeof next === "function" ? next(slots[i]) : next];
  }, createElement: (type, props2, ...children) => ({ type, props: props2 ?? {}, children }) };
  const Panel = createSessionHealthPanel(React);
  const props = { items: [{ sessionId: "a", error: "cannot safely transform unclassified message source" }], sessions: [{ id: "a", title: "旧天气会话" }], diagnoseSession: async () => {
    diagnoses++;
    return { repairable: true, token: "a".repeat(64), reason: "可修复", advice: "保留旧日志" };
  }, repairSession: async (input) => {
    repairs++;
    assert.equal(input.token, "a".repeat(64));
    return { repaired: true };
  }, retry: () => retries++ };
  const render = () => {
    cursor = 0;
    return Panel(props);
  };
  const flat = (n) => !n || typeof n !== "object" ? [] : [n, ...(n.children ?? []).flat(Infinity).flatMap(flat)];
  let tree = render();
  assert.ok(flat(tree).filter((n) => n.type === "details").every((n) => !n.props.open));
  const button = (tree2, label) => flat(tree2).find((n) => n.type === "button" && n.children.includes(label));
  assert.equal(button(tree, "确认修复"), void 0);
  await button(tree, "诊断会话").props.onClick();
  tree = render();
  assert.equal(diagnoses, 1);
  assert.equal(repairs, 0);
  await button(tree, "确认修复").props.onClick();
  assert.equal(repairs, 1);
  assert.equal(retries, 1);
});
test("发布权限限制为私有，硬链接失败不替换目标并清理临时文件", async (t) => {
  const fs = (await import("node:fs/promises")).default;
  const { syncBuiltinESMExports } = await import("node:module");
  const directory = await mkdtemp(join(tmpdir(), "archive-publish-test-"));
  const source = join(directory, "session.jsonl");
  const target = join(directory, "session.v3.jsonl");
  const rows = [
    { type: "session", version: 0, id: "a", inheritedEventCount: 1 },
    { type: "user/message", data: { source: { kind: "automation", automationId: "a", runId: "r", scheduledFor: "2026-09-01T00:00:00Z" }, content: "正文" } }
  ];
  const original = rows.map(JSON.stringify).join("\n") + "\n";
  try {
    await writeFile(source, original, "utf8");
    const brokenFormat = { ...fakeFormat, encodeHeader: (header) => ({ ...header, inheritedEventCount: 0 }) };
    await assert.rejects(prepareAutomationRepair({ directory, target, sessionId: "a", format: brokenFormat }), /校验失败/);
    const plan = await prepareAutomationRepair({ directory, target, sessionId: "a", format: fakeFormat });
    const openFile = fs.open;
    const modes = [];
    t.mock.method(fs, "open", async (path, flags, mode) => {
      modes.push(mode);
      return openFile(path, flags, mode);
    });
    t.mock.method(fs, "link", async () => {
      throw Object.assign(new Error("安全软件拒绝链接"), { code: "EPERM" });
    });
    syncBuiltinESMExports();
    await assert.rejects(plan.publish(plan.token, async () => {
    }), { code: "EPERM" });
    assert.deepEqual(modes, [384]);
    assert.deepEqual(await fs.readdir(directory), ["session.jsonl"]);
    assert.equal(await readFile(source, "utf8"), original);
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
    await rm(directory, { recursive: true, force: true });
  }
});
test("压缩修复必须独立写入头帧，并可纠正此前生成的单帧工件", async () => {
  const directory = await mkdtemp(join(tmpdir(), "archive-frame-test-"));
  try {
    const source = join(directory, "session.jsonl"), target = join(directory, "session.v3.jsonl.zstd");
    const rows = [{ type: "session", version: 0, id: "a" }, { type: "user/message", data: { source: { kind: "automation", automationId: "a", runId: "r", scheduledFor: "2026-09-01T00:00:00Z" }, content: "正文" } }];
    await writeFile(source, rows.map(JSON.stringify).join("\n") + "\n", "utf8");
    const plan = await prepareAutomationRepair({ directory, target, sessionId: "a", format: fakeFormat });
    await plan.publish(plan.token, async () => {
    });
    const { zstdDecompressSync } = await import("node:zlib");
    const output = await readFile(target);
    assert.equal(zstdDecompressSync(output).toString("utf8").trim().split("\n").length, 1, "第一帧必须只有头部");
    const plain = decodeRepairLog(output, true).map(JSON.stringify).join("\n") + "\n";
    const altered = zstdCompressSync(Buffer.from(plain.replace("正文", "新的正文")));
    await writeFile(target, altered);
    await assert.rejects(prepareAutomationRepair({ directory, target, sessionId: "a", format: fakeFormat }), /不匹配/);
    assert.deepEqual(await readFile(target), altered);
    await writeFile(target, zstdCompressSync(Buffer.from(plain)));
    const correction = await prepareAutomationRepair({ directory, target, sessionId: "a", format: fakeFormat });
    await correction.publish(correction.token, async () => {
    });
    assert.equal(zstdDecompressSync(await readFile(target)).toString("utf8").trim().split("\n").length, 1);
    await assert.rejects(prepareAutomationRepair({ directory, target, sessionId: "a", format: fakeFormat }), /无需|匹配|已有/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
