import test from "node:test";
import assert from "node:assert/strict";
import { openArchivedConversation, allowArchivedNavigation, ArchiveNavigationError, formatArchiveNavigationError } from "../src/archive-experience.js";

test("继续对话不恢复；恢复并打开必须等持久化成功，失败不导航", async () => {
  const calls = [];
  const actions = {
    prepare: id => calls.push(["prepare", id]),
    open: id => calls.push(["open", id]),
    restore: async id => calls.push(["restore", id])
  };
  await openArchivedConversation(actions, "a", false);
  assert.deepEqual(calls, [["open", "a"]]);
  calls.length = 0;
  await openArchivedConversation(actions, "a", true);
  assert.deepEqual(calls, [["prepare", "a"], ["restore", "a"], ["open", "a"]]);
  calls.length = 0;
  await assert.rejects(openArchivedConversation({ ...actions, restore: async () => { throw new Error("磁盘失败"); } }, "a", true), /磁盘失败/);
  assert.deepEqual(calls, [["prepare", "a"]]);
});

test("离开页面后恢复完成不产生迟到导航", async () => {
  let active = true;
  let opened = false;
  await openArchivedConversation({ restore: async () => { active = false; }, open: () => { opened = true; } }, "a", true, () => active);
  assert.equal(opened, false);
});

function navigationFixture() {
  let current;
  let panel = "settings";
  let fail = false;
  const sessions = {
    list: { getSnapshot: () => ({ current }) },
    open(id) { current = id; navigation.clearArchivedCurrent(); if (fail) throw new Error("open failed"); }
  };
  const workspaces = { list: { getSnapshot: () => ({ archivedSessionIds: ["old"] }) } };
  const navigation = {
    clearArchivedCurrent() { if (current === "old") current = undefined; },
    openSession(id) { sessions.open(id); panel = null; }
  };
  const warnings = [];
  const options = { onOpened() { panel = null; }, warn: (...args) => warnings.push(args) };
  return { sessions, workspaces, navigation, options, warnings,
    get panel() { return panel; }, set fail(value) { fail = value; } };
}

test("归档打开验证成功后才退出设置；失败清除放行状态并保留设置", () => {
  const env = navigationFixture();
  const guard = allowArchivedNavigation(env.navigation, env.sessions, env.workspaces, env.options);
  env.fail = true;
  assert.throws(() => guard.open("old"), /open failed/);
  assert.equal(env.panel, "settings");
  env.navigation.clearArchivedCurrent();
  assert.equal(env.sessions.list.getSnapshot().current, undefined);
  env.fail = false;
  guard.open("old");
  assert.equal(env.panel, null);
  assert.equal(env.sessions.list.getSnapshot().current, "old");
  guard.dispose();
});

test("不可写导航方法不使插件挂载失败，归档打开报错且记录诊断", () => {
  const env = navigationFixture();
  Object.freeze(env.navigation);
  const guard = allowArchivedNavigation(env.navigation, env.sessions, env.workspaces, env.options);
  assert.throws(() => guard.open("old"), { code: "navigationUnavailable" });
  assert.equal(env.panel, "settings");
  assert.ok(env.warnings.length > 0);
  guard.dispose();
});

test("他人覆盖导航后拒绝不可靠的归档打开，卸载不覆盖他人方法", () => {
  const env = navigationFixture();
  const guard = allowArchivedNavigation(env.navigation, env.sessions, env.workspaces, env.options);
  const replacement = () => {};
  env.navigation.clearArchivedCurrent = replacement;
  assert.throws(() => guard.open("old"), { code: "navigationUnavailable" });
  guard.dispose();
  assert.equal(env.navigation.clearArchivedCurrent, replacement);
  assert.equal(env.panel, "settings");
});

test("旧宿主无清理方法时诊断并使用会话接口，未保留目标时不退出设置", () => {
  const env = navigationFixture();
  const sessions = { ...env.sessions, open() {} };
  const guard = allowArchivedNavigation(undefined, sessions, env.workspaces, env.options);
  assert.equal(env.warnings.length, 0, "挂载不警告");
  assert.throws(() => guard.open("old"), { code: "sessionNotRetained" });
  assert.equal(env.panel, "settings");
  assert.ok(env.warnings.length > 0);
  guard.dispose();
});

test("目标会话未保留时不调用会提前关闭设置的官方 openSession", () => {
  const env = navigationFixture();
  env.sessions.open = () => {};
  const guard = allowArchivedNavigation(env.navigation, env.sessions, env.workspaces, env.options);
  assert.equal(env.warnings.length, 0, "挂载不警告");
  assert.throws(() => guard.open("old"), { code: "sessionNotRetained" });
  assert.equal(env.panel, "settings");
  guard.dispose();
});

test("打开前中止进行中的工作区导航，避免其他工作区抢走会话", () => {
  const env = navigationFixture();
  const navigations = [];
  const guard = allowArchivedNavigation(env.navigation, env.sessions, env.workspaces, {
    ...env.options,
    beginNavigation: () => { navigations.push("begin"); }
  });
  guard.open("old");
  assert.deepEqual(navigations, ["begin"]);
  assert.equal(env.sessions.list.getSnapshot().current, "old");
  assert.equal(env.panel, null);
  guard.dispose();
});

test("旧宿主正常打开归档不警告", () => {
  let current;
  const warnings = [];
  const sessions = { list: { getSnapshot: () => ({ current }) }, open(id) { current = id; } };
  const workspaces = { list: { getSnapshot: () => ({ archivedSessionIds: ["old"] }) } };
  const guard = allowArchivedNavigation(undefined, sessions, workspaces, { warn: (...args) => warnings.push(args) });
  assert.equal(warnings.length, 0);
  guard.open("old");
  assert.equal(current, "old");
  assert.equal(warnings.length, 0);
  guard.dispose();
});

test("导航错误按界面语言翻译，宿主错误保留原始消息", () => {
  const dictionaries = {
    zh: { "archives.navigationUnavailable": "请恢复后打开", "archives.sessionNotRetained": "会话未保留" },
    en: { "archives.navigationUnavailable": "Restore and open", "archives.sessionNotRetained": "Session was not retained" }
  };
  for (const dictionary of Object.values(dictionaries)) {
    const t = key => { assert.ok(Object.hasOwn(dictionary, key)); return dictionary[key]; };
    for (const code of ["navigationUnavailable", "sessionNotRetained"]) {
      assert.equal(formatArchiveNavigationError(new ArchiveNavigationError(code), t), dictionary[`archives.${code}`]);
    }
    assert.equal(formatArchiveNavigationError(new Error("remote disconnected"), t), "remote disconnected");
    assert.equal(formatArchiveNavigationError("connection lost", t), "connection lost");
    assert.equal(formatArchiveNavigationError(null, t), "null");
  }
});
