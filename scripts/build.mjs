// 统一从 src 生成可发布的 lib，避免运行产物成为手工维护入口。
// 先在同级暂存目录完成构建，成功后再替换，避免失败时破坏可安装产物。
import { randomUUID } from "node:crypto";
import { access, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = join(root, "src");
const outputDirectory = join(root, "lib");
const stagingDirectory = join(root, `.dsh-archive-manager-build-${randomUUID()}`);
const backupDirectory = join(root, `.dsh-archive-manager-build-backup-${randomUUID()}`);
let previousOutputMoved = false;
let published = false;

/**
 * 被 minify 抹掉的第三方版权声明按 esbuild metafile 逐个补回文件尾部。
 * 宿主在运行时提供的模块（@deepseek-ai/*、react/react-dom 别名到 shim）不进包，也就不列入。
 */
async function bundledLicenseNotice(metafile) {
	const directories = new Map();
	for (const input of Object.keys(metafile.inputs)) {
		const match = input.replaceAll("\\", "/").match(/^(.*node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+))\//);
		if (match === null || match[2].startsWith("@deepseek-ai/")) continue;
		if (!directories.has(match[2])) directories.set(match[2], match[1]);
	}
	const blocks = [];
	for (const [name, directory] of [...directories].sort(([left], [right]) => left < right ? -1 : 1)) {
		const file = (await readdir(directory)).find((entry) => /^licen[sc]e/i.test(entry));
		if (file === undefined) {
			const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
			blocks.push(`${name}\n\n${typeof manifest.license === "string" ? manifest.license : "see package.json"} (declared in package.json)`);
			continue;
		}
		blocks.push(`${name}\n\n${(await readFile(join(directory, file), "utf8")).trim()}`);
	}
	const lines = ["/*!", `Third-party notices for the ${blocks.length} packages bundled into this file.`, "", blocks.join("\n\n"), "*/"];
	return lines.join("\n");
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

try {
	await build({
		entryPoints: ["contracts.ts", "index.ts", "workspace.ts", "projcache.ts", "tombstone.ts", "plugin-updater.ts", "archive-experience.ts", "archive-organizer.ts", "archive-discovery.ts", "session-repair.ts"].map((file) => join(sourceDirectory, file)),
		outdir: stagingDirectory,
		outbase: sourceDirectory,
		bundle: false,
		format: "esm",
		platform: "node",
		target: "node20"
	});

	const clientBundle = await build({
		entryPoints: [join(sourceDirectory, "client.ts")],
		bundle: true,
		format: "cjs",
		platform: "browser",
		target: "es2022",
		write: false,
		minify: true,
		keepNames: true,
		legalComments: "none",
		metafile: true,
		define: { "process.env.NODE_ENV": "\"production\"" },
		alias: {
			react: join(sourceDirectory, "host-react-shim.ts"),
			"react/jsx-runtime": join(sourceDirectory, "host-jsx-shim.ts"),
			"react-dom": join(sourceDirectory, "host-react-dom-shim.ts"),
			"react-dom/client": join(sourceDirectory, "host-react-dom-shim.ts")
		}
	});
	const clientSource = clientBundle.outputFiles[0].text;
	const thirdPartyNotices = await bundledLicenseNotice(clientBundle.metafile);
	await writeFile(join(stagingDirectory, "client.js"), `window.__ModuleLoader__.load({
  id: "@michengai/dsh-archive-manager",
  factory: function(require) {
    globalThis.__dshArchiveReact = require("react");
    globalThis.__dshArchiveJsx = require("react/jsx-runtime");
    globalThis.__dshArchiveReactDOM = require("react-dom");
    globalThis.__dshArchiveReactDOMClient = require("react-dom/client");
    var module = { exports: {} };
    var exports = module.exports;
    ${clientSource}
    return module.exports.startArchiveClient(require);
  }
});
${thirdPartyNotices}
`);

	if (process.env.DSH_ARCHIVE_MANAGER_TEST_FAIL_BEFORE_PUBLISH === "1") {
		throw new Error("测试：在发布构建产物前中断");
	}

	if (await exists(outputDirectory)) {
		await rename(outputDirectory, backupDirectory);
		previousOutputMoved = true;
	}

	try {
		await rename(stagingDirectory, outputDirectory);
		published = true;
	} catch (error) {
		if (previousOutputMoved) await rename(backupDirectory, outputDirectory);
		throw error;
	}

	if (published && previousOutputMoved) await rm(backupDirectory, { recursive: true, force: true });
} finally {
	await rm(stagingDirectory, { recursive: true, force: true });
	if (published && previousOutputMoved && await exists(backupDirectory)) {
		await rm(backupDirectory, { recursive: true, force: true });
	}
}

console.log("[dsh-archive-manager] 已从 src 生成 Host 与客户端发布产物");
