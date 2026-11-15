import { createDefu } from "defu";

export { createDefu as createMerge, defu as merge } from "defu";

/**
 * 数组整体替换的深合并（修复性变更）：
 * 原实现（vue-element 同款）在 defu 自定义回调里变异 originObj[key] 后返回 true——
 * 实测 defu 6.x 中回调内变异不生效（返回 true 仅表示"沿用现值"），数组从未被真正替换。
 * 正确形态是回调直接返回 updates（defu 以返回值作为该 key 的结果，嵌套同样生效）。
 */
export const mergeWithArrayOverride = createDefu((originObj, key, updates) => {
  if (Array.isArray(originObj[key]) && Array.isArray(updates)) {
    return updates;
  }
});
