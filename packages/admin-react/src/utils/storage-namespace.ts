/**
 * 持久化存储键命名空间。
 *
 * 历史上各 store 的 persist 键（app-preferences / user-storage / auth-storage
 * 等）是全局裸键——同一 origin:port 上先后跑两个基于本包的应用会互相覆盖
 * 偏好/用户态（跨项目污染）。本助手读取宿主在 index.html 里于模块脚本执行前
 * 设置的 `document.documentElement.dataset.gowindStorageNs`（vite 的 %ENV%
 * 替换即可注入），为键加上 `<ns>:` 前缀；未设置时回退裸键（存量部署兼容）。
 *
 * 迁移：带上命名空间后若新键尚无值而旧裸键存在，做一次性搬运并删除旧键。
 * 宿主自己的 store（如 app-tabs）请复用本助手保持同一前缀。
 */

/** 读宿主注入的存储命名空间（index.html 内联脚本写入 data-gowind-storage-ns）。 */
export function getStorageNamespace(): string {
  if (typeof document === 'undefined') return '';
  return document.documentElement.dataset.gowindStorageNs ?? '';
}

/** 为 persist store 生成带命名空间的 localStorage 键（含旧裸键一次性迁移）。 */
export function persistKey(name: string): string {
  const ns = getStorageNamespace();
  if (!ns) return name;

  const key = `${ns}:${name}`;
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem(key) === null && localStorage.getItem(name) !== null) {
      localStorage.setItem(key, localStorage.getItem(name)!);
      localStorage.removeItem(name);
    }
  }
  return key;
}
