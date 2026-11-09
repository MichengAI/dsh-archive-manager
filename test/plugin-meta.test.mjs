import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("插件列表元信息与 Codex UI 一样从 locale 导出", async () => {
	const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
	assert.equal(manifest.exports["./locale/*.json"], "./locale/*.json");
	assert.ok(manifest.files.includes("locale"));
	assert.equal(manifest.icon, "assets/icon.svg");

	const expectedReadme = {
		"zh.json": "README.zh-CN.md",
		"en.json": "README.en.md",
		"ja.json": "README.ja.md",
		"es.json": "README.es.md",
		"fr.json": "README.fr.md",
		"de.json": "README.de.md",
		"ru.json": "README.ru.md",
		"pt.json": "README.pt.md"
	};

	for (const file of ["zh.json", "en.json", "ja.json", "es.json", "fr.json", "de.json", "ru.json", "pt.json"]) {
		const title = "Archive Manager";
		const locale = JSON.parse(await readFile(new URL(`../locale/${file}`, import.meta.url), "utf8"));
		assert.equal(locale.meta.title, title);
		assert.equal(typeof locale.meta.description, "string");
		assert.ok(locale.meta.description.length > 0);
		assert.equal(locale.meta.detail, expectedReadme[file], `${file} 必须精确指向对应语言的本地化 README`);
		assert.ok(existsSync(new URL(`../${locale.meta.detail}`, import.meta.url)), `${locale.meta.detail} 文件必须在磁盘中物理存在`);
	}
});
