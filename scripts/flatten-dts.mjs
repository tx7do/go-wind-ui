/**
 * vue-tsc 声明输出平滩：declaration 输出保留了 workspace 相对路径
 * (dist/<pkg-name>/src/index.d.ts)，需要拷贝到 dist/index.d.ts 供
 * package.json types 字段消费。同时清理嵌套目录。
 *
 * 只找当前包名的目录（dist/<pkg-name>/src/），不会误拷 workspace 依赖的声明。
 */
import { cpSync, existsSync, readdirSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = dirname(fileURLToPath(import.meta.url));
const dist = join(pkgDir, "dist");
if (!existsSync(dist)) process.exit(0);

// 读包名（package.json 的 name 字段最后一段）
const pkgJson = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const pkgName = pkgJson.name.split("/").pop(); // e.g. "bi-vue"

// 自己包名的声明目录：dist/<pkgName>/src/
const ownDtsDir = join(dist, pkgName, "src");
if (existsSync(ownDtsDir)) {
  cpSync(ownDtsDir, dist, { recursive: true });
  console.log(`[flatten-dts] ${pkgName}: copied dist/${pkgName}/src/* -> dist/`);
} else if (existsSync(join(dist, "index.d.ts"))) {
  console.log(`[flatten-dts] ${pkgName}: already flat`);
  process.exit(0);
} else {
  console.log(`[flatten-dts] ${pkgName}: no nested dts found at dist/${pkgName}/src/`);
  process.exit(0);
}

// 清理所有嵌套包目录（不含点的目录名）
for (const f of readdirSync(dist)) {
  const p = join(dist, f);
  if (!f.includes(".")) {
    try {
      readdirSync(p); // if it errors, it's a file
      rmSync(p, { recursive: true, force: true });
    } catch {
      // not a directory, skip
    }
  }
}
console.log(`[flatten-dts] ${pkgName}: nested dirs cleaned`);
