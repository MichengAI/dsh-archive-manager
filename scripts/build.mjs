// 统一从 src 生成可发布的 lib，避免运行产物成为手工维护入口。
// 先在同级暂存目录完成构建，成功后再替换，避免失败时破坏可安装产物。
import { randomUUID } from "node:crypto";
import { access, rename, rm, writeFile } from "node:fs/promises";
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
		define: { "process.env.NODE_ENV": "\"production\"" },
		alias: {
			react: join(sourceDirectory, "host-react-shim.ts"),
			"react/jsx-runtime": join(sourceDirectory, "host-jsx-shim.ts"),
			"react-dom": join(sourceDirectory, "host-react-dom-shim.ts"),
			"react-dom/client": join(sourceDirectory, "host-react-dom-shim.ts")
		}
	});
	const clientSource = clientBundle.outputFiles[0].text;
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
