import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
function resolveDshHome() {
  const custom = process.env.DSH_HOME;
  if (typeof custom === "string" && custom.trim() !== "") {
    return custom.trim();
  }
  return join(homedir(), ".dsh");
}
function managerSettingsPath() {
  return join(resolveDshHome(), "archive-manager", "settings.json");
}
let writeQueue = Promise.resolve();
function enqueueWrite(task) {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(() => {
  }, () => {
  });
  return next;
}
async function replaceTextFile(file, next) {
  const dir = dirname(file);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const nonce = randomUUID();
  const tmp = `${file}.${process.pid}.${nonce}.tmp`;
  const backup = `${file}.${process.pid}.${nonce}.bak`;
  await writeFile(tmp, next, "utf8");
  try {
    await rename(tmp, file);
    return;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code !== "EEXIST" && code !== "EPERM" && code !== "EACCES") {
      await unlink(tmp).catch(() => {
      });
      throw error;
    }
  }
  await unlink(backup).catch(() => {
  });
  await rename(file, backup);
  try {
    await rename(tmp, file);
  } catch (error) {
    await rename(backup, file).catch(() => {
    });
    await unlink(tmp).catch(() => {
    });
    throw error;
  }
  await unlink(backup).catch(() => {
  });
}
async function readSettings() {
  const path = managerSettingsPath();
  if (!existsSync(path)) {
    return { sidebarEntry: false, onlineUpdate: true, sidebarFavoriteStar: true };
  }
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { sidebarEntry: false, onlineUpdate: true, sidebarFavoriteStar: true };
    }
    const item = parsed;
    return {
      sidebarEntry: typeof item.sidebarEntry === "boolean" ? item.sidebarEntry : false,
      onlineUpdate: typeof item.onlineUpdate === "boolean" ? item.onlineUpdate : true,
      sidebarFavoriteStar: typeof item.sidebarFavoriteStar === "boolean" ? item.sidebarFavoriteStar : true
    };
  } catch {
    return { sidebarEntry: false, onlineUpdate: true, sidebarFavoriteStar: true };
  }
}
async function writeSettings(next) {
  const path = managerSettingsPath();
  const serialized = `${JSON.stringify(next, null, 2)}
`;
  await replaceTextFile(path, serialized);
}
async function getSidebarEntry() {
  const current = await readSettings();
  return current.sidebarEntry === true;
}
async function setSidebarEntry(enabled) {
  if (typeof enabled !== "boolean") {
    throw new TypeError("sidebarEntry must be a boolean");
  }
  return enqueueWrite(async () => {
    const current = await readSettings();
    current.sidebarEntry = enabled;
    await writeSettings(current);
    return enabled;
  });
}
async function getOnlineUpdate() {
  const current = await readSettings();
  return current.onlineUpdate !== false;
}
async function setOnlineUpdate(enabled) {
  if (typeof enabled !== "boolean") {
    throw new TypeError("onlineUpdate must be a boolean");
  }
  return enqueueWrite(async () => {
    const current = await readSettings();
    current.onlineUpdate = enabled;
    await writeSettings(current);
    return enabled;
  });
}
async function getSidebarFavoriteStar() {
  const current = await readSettings();
  return current.sidebarFavoriteStar !== false;
}
async function setSidebarFavoriteStar(enabled) {
  if (typeof enabled !== "boolean") {
    throw new TypeError("sidebarFavoriteStar must be a boolean");
  }
  return enqueueWrite(async () => {
    const current = await readSettings();
    current.sidebarFavoriteStar = enabled;
    await writeSettings(current);
    return enabled;
  });
}
export {
  getOnlineUpdate,
  getSidebarEntry,
  getSidebarFavoriteStar,
  managerSettingsPath,
  readSettings,
  setOnlineUpdate,
  setSidebarEntry,
  setSidebarFavoriteStar,
  writeSettings
};
