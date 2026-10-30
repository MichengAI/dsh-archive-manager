import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("移动工作区列表的每一行在名称前使用宿主文件夹图标", async () => {
	const source = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
	const start = source.indexOf(": workspaces.map((ws) => {");
	const end = source.indexOf("}, ws.workspaceId);", start);
	assert.ok(start >= 0 && end > start, "未找到工作区菜单行");
	const row = source.slice(start, end);
	assert.match(row, /IconFolderCloseMedium/);
	assert.ok(row.indexOf("IconFolderCloseMedium") < row.lastIndexOf("children: wsTitle"), "文件夹图标应位于名称之前");
	assert.match(row, /aria-hidden/);
	assert.match(row, /textOverflow: "ellipsis"/);
});
