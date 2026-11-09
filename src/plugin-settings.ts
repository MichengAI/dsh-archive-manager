import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type EntryLocation = "both" | "sidebar" | "settings";
export type FavoriteStarMode = "all" | "favorites" | "none";

export interface ArchiveManagerSettings {
  entryLocation?: EntryLocation;
  sidebarEntry?: boolean;
  onlineUpdate?: boolean;
  sidebarFavoriteStar?: boolean | FavoriteStarMode;
}

export function normalizeFavoriteStarMode(value: unknown): FavoriteStarMode {
  if (value === "all" || value === "favorites" || value === "none") return value;
  if (value === false) return "none";
  return "all";
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
  const defaultSettings: ArchiveManagerSettings = {
    entryLocation: "settings",
    sidebarEntry: false,
    onlineUpdate: true,
    sidebarFavoriteStar: "all",
  };
  if (!existsSync(path)) {
    return defaultSettings;
  }
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaultSettings;
    }
    const item = parsed as Record<string, unknown>;
    let entryLocation: EntryLocation;
    if (item.entryLocation === "both" || item.entryLocation === "sidebar" || item.entryLocation === "settings") {
      entryLocation = item.entryLocation;
    } else if (item.sidebarEntry === true) {
      entryLocation = "both";
    } else {
      entryLocation = "settings";
    }

    return {
      entryLocation,
      sidebarEntry: entryLocation !== "settings",
      onlineUpdate: typeof item.onlineUpdate === "boolean" ? item.onlineUpdate : true,
      sidebarFavoriteStar: normalizeFavoriteStarMode(item.sidebarFavoriteStar),
    };
  } catch {
    return defaultSettings;
  }
}

export async function writeSettings(next: ArchiveManagerSettings): Promise<void> {
  const path = managerSettingsPath();
  const location = next.entryLocation ?? (next.sidebarEntry ? "both" : "settings");
  const normalized: ArchiveManagerSettings = {
    entryLocation: location,
    sidebarEntry: location !== "settings",
    onlineUpdate: next.onlineUpdate !== false,
    sidebarFavoriteStar: normalizeFavoriteStarMode(next.sidebarFavoriteStar),
  };
  const serialized = `${JSON.stringify(normalized, null, 2)}\n`;
  await replaceTextFile(path, serialized);
}

export async function getEntryLocation(): Promise<EntryLocation> {
  const current = await readSettings();
  return current.entryLocation ?? "settings";
}

export async function setEntryLocation(location: EntryLocation): Promise<EntryLocation> {
  if (location !== "both" && location !== "sidebar" && location !== "settings") {
    throw new TypeError("entryLocation must be one of 'both', 'sidebar', or 'settings'");
  }
  return enqueueWrite(async () => {
    const current = await readSettings();
    current.entryLocation = location;
    current.sidebarEntry = location !== "settings";
    await writeSettings(current);
    return location;
  });
}

export async function getSidebarEntry(): Promise<boolean> {
  const current = await readSettings();
  return current.entryLocation !== "settings";
}

export async function setSidebarEntry(enabled: boolean): Promise<boolean> {
  if (typeof enabled !== "boolean") {
    throw new TypeError("sidebarEntry must be a boolean");
  }
  return enqueueWrite(async () => {
    const location: EntryLocation = enabled ? "both" : "settings";
    const current = await readSettings();
    current.entryLocation = location;
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

export async function getSidebarFavoriteStarMode(): Promise<FavoriteStarMode> {
  const current = await readSettings();
  return normalizeFavoriteStarMode(current.sidebarFavoriteStar);
}

export async function setSidebarFavoriteStarMode(mode: FavoriteStarMode): Promise<FavoriteStarMode> {
  if (mode !== "all" && mode !== "favorites" && mode !== "none") {
    throw new TypeError("sidebarFavoriteStar mode must be 'all', 'favorites', or 'none'");
  }
  return enqueueWrite(async () => {
    const current = await readSettings();
    current.sidebarFavoriteStar = mode;
    await writeSettings(current);
    return mode;
  });
}

export async function getSidebarFavoriteStar(): Promise<boolean> {
  const mode = await getSidebarFavoriteStarMode();
  return mode !== "none";
}

export async function setSidebarFavoriteStar(value: FavoriteStarMode | boolean): Promise<boolean | FavoriteStarMode> {
  if (typeof value !== "boolean" && value !== "all" && value !== "favorites" && value !== "none") {
    throw new TypeError("sidebarFavoriteStar must be 'all', 'favorites', 'none', or a boolean");
  }
  if (typeof value === "boolean") {
    const mode: FavoriteStarMode = value ? "all" : "none";
    await setSidebarFavoriteStarMode(mode);
    return value;
  }
  return setSidebarFavoriteStarMode(value);
}
