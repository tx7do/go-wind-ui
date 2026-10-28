/**
 * Playwright 冒烟：起两端 playground dev server，
 * 断言核心 UI 挂载（ProTable 页面 / 编辑器工具栏 / BI 渲染器 canvas）。
 * CI 用；本地 `node scripts/smoke.mjs` 亦可跑。
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";

const VITE = process.platform === "win32" ? "npx.cmd vite" : "npx vite";
const jobs = [
  { name: "vue playground", cwd: "playground", port: 15898, url: "http://localhost:15898/", probes: ["ProTable 页面", "BI 仪表盘"] },
  { name: "react playground", cwd: "playground-react", port: 15897, url: "http://localhost:15897/", probes: ["编辑器套件", "BI 仪表盘"] },
];

function startServer(cwd, port) {
  const child = spawn(VITE, ["--port", String(port), "--strictPort"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  return child;
}

async function waitFor(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server not up: ${url}`);
}

let failures = 0;
const children = [];
const browser = await chromium.launch();
console.log("smoke: browser launched");

try {
  for (const job of jobs) {
    console.log(`smoke: starting ${job.name} on :${job.port}`);
    const child = startServer(job.cwd, job.port);
    children.push(child);
    await waitFor(job.url);
    console.log(`smoke: ${job.name} server up`);

    const page = await browser.newPage();
    const errors = [];
    const consoleErrors = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto(job.url, { waitUntil: "networkidle", timeout: 60_000 });
    // vite 冷转换在 CI 慢机上可能晚于 networkidle；给首屏渲染留缓冲
    await page.waitForTimeout(3000);

    for (const probe of job.probes) {
      const found = (await page.getByText(probe).count()) > 0;
      console.log(`${found ? "PASS" : "FAIL"} ${job.name}: text "${probe}"`);
      if (!found) failures += 1;
    }
    const bodySnippet = (await page.evaluate(() => document.body.innerText.slice(0, 200))).replace(/\n/g, " | ");
    const overlay = await page.evaluate(() => !!document.querySelector("vite-error-overlay"));
    console.log(`INFO ${job.name}: vite overlay = ${overlay}; body = ${bodySnippet}`);
    if (consoleErrors.length) {
      console.log(`FAIL ${job.name}: ${consoleErrors.length} console error(s)`);
      console.log(consoleErrors.slice(0, 5).join("\n"));
      failures += 1;
    }
    if (errors.length) {
      console.log(`FAIL ${job.name}: ${errors.length} pageerror(s)`);
      console.log(errors.slice(0, 3).join("\n"));
      failures += 1;
    }
    if (!consoleErrors.length && !errors.length) {
      console.log(`PASS ${job.name}: no pageerror`);
    }
    await page.close();

    child.kill();
    await new Promise((r) => setTimeout(r, 1500));
  }
} finally {
  await browser.close();
  for (const child of children) {
    try {
      child.kill();
    } catch {
      /* already dead */
    }
  }
}

if (failures > 0) {
  console.error(`\nsmoke FAILED with ${failures} failure(s)`);
  // 显式退出：被 shell 包裹的 vite 子进程会挂住事件循环（Windows 尤甚），
  // 不主动 exit 会让 CI 超时误报
  process.exit(1);
}
console.log("\nsmoke PASS");
process.exit(0);
