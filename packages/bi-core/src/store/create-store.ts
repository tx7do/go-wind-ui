/**
 * 微型框架无关 store：getState / subscribe / mutate。
 * React 用 useSyncExternalStore 订阅，Vue 用 subscribe → shallowRef。
 * 约定：mutate 内部必须整体替换状态对象（快照不可变），保证 React 快照语义。
 */

export interface TinyStore<T> {
  getState(): T;
  subscribe(listener: () => void): () => void;
  /** 整体替换状态（快照语义），触发通知 */
  set(next: T): void;
}

export function createTinyStore<T>(initial: T): TinyStore<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next) {
      state = next;
      listeners.forEach((l) => l());
    },
  };
}

/** 深拷贝：优先 structuredClone，失败回退 JSON（schema 是纯数据，两条路都安全） */
export function deepClone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
