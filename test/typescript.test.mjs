// 确保迁移真正启用全量类型检查，避免只改扩展名而绕过工程门禁。
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

test("业务源码全部使用 TypeScript 严格检查，构建前执行类型门禁", async () => {
  const root = new URL("../", import.meta.url);
  const config = JSON.parse(await readFile(new URL("tsconfig.json", root), "utf8"));
  assert.equal(config.compilerOptions.strict, true);
  assert.equal(config.compilerOptions.noEmit, true);
  assert.equal(config.compilerOptions.useDefineForClassFields, true);
  for (const option of ["noImplicitAny", "strictNullChecks", "strictFunctionTypes", "strictBindCallApply", "strictPropertyInitialization", "noImplicitThis", "useUnknownInCatchVariables", "alwaysStrict"]) {
    assert.notEqual(config.compilerOptions[option], false, `${option} 不得单独关闭`);
  }
  const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.match(manifest.scripts.typecheck, /tsc/);
  assert.match(manifest.scripts.build, /^pnpm typecheck &&/);
  const files = await readdir(new URL("src/", root));
  assert.equal(files.filter(file => file.endsWith(".js")).length, 0);
  for (const file of files.filter(file => file.endsWith(".ts"))) {
    const source = await readFile(new URL(`src/${file}`, root), "utf8");
    assert.doesNotMatch(source, /@ts-(?:nocheck|ignore|expect-error)/, `${file} 不得跳过类型检查`);
    const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const check = node => {
      assert.notEqual(node.kind, ts.SyntaxKind.AnyKeyword, `${file} 不得显式使用 any`);
      ts.forEachChild(node, check);
    };
    check(syntax);
  }
});
