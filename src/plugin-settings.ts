import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface ArchiveManagerSettings {
  sidebarEntry?: boolean;
  onlineUpdate?: boolean;
  sidebarFavoriteStar?: boolean;
}

function resolveDshHome(): string {
  const custom = process.env.DSH_HOME;
  if (typeof custom === "string" && custom.trim() !== "") {
    return custom.trim();
  }
  return join(homedir(), ".dsh");
}

export function managerSettingsPath(): string {
  return join(resolveDshHome(), "archive-manager", "settings.json");
}

let writeQueue = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(() => {}, () => {});
  return next;
}

async function replaceTextFile(file: string, next: string): Promise<void> {
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
      await unlink(tmp).catch(() => {});
      throw error;
    }
  }
  await unlink(backup).catch(() => {});
  await rename(file, backup);
  try {
    await rename(tmp, file);
  } catch (error) {
    await rename(backup, file).catch(() => {});
    await unlink(tmp).catch(() => {});
    throw error;
  }
  await unlink(backup).catch(() => {});
}

export async function readSettings(): Promise<ArchiveManagerSettings> {
  const path = managerSettingsPath();
  if (!existsSync(path)) {
    return { sidebarEntry: false, onlineUpdate: true, sidebarFavoriteStar: true };
  }
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { sidebarEntry: false, onlineUpdate: true, sidebarFavoriteStar: true };
    }
    const item = parsed as Record<string, unknown>;
    return {
      sidebarEntry: typeof item.sidebarEntry === "boolean" ? item.sidebarEntry : false,
      onlineUpdate: typeof item.onlineUpdate === "boolean" ? item.onlineUpdate : true,
      sidebarFavoriteStar: typeof item.sidebarFavoriteStar === "boolean" ? item.sidebarFavoriteStar : true,
    };
  } catch {
    return { sidebarEntry: false, onlineUpdate: true, sidebarFavoriteStar: true };
  }
}

export async function writeSettings(next: ArchiveManagerSettings): Promise<void> {
  const path = managerSettingsPath();
  const serialized = `${JSON.stringify(next, null, 2)}\n`;
  await replaceTextFile(path, serialized);
}

export async function getSidebarEntry(): Promise<boolean> {
  const current = await readSettings();
  return current.sidebarEntry === true;
}

export async function setSidebarEntry(enabled: boolean): Promise<boolean> {
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

export async function getOnlineUpdate(): Promise<boolean> {
  const current = await readSettings();
  return current.onlineUpdate !== false;
}

export async function setOnlineUpdate(enabled: boolean): Promise<boolean> {
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

export async function getSidebarFavoriteStar(): Promise<boolean> {
  const current = await readSettings();
  return current.sidebarFavoriteStar !== false;
}

export async function setSidebarFavoriteStar(enabled: boolean): Promise<boolean> {
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
