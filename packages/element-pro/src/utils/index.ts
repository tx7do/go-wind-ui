/**
 * 内部工具集：只收本包用到的最小实现，不对外承诺稳定性。
 */

export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === "function";
}

/** 类方法批量绑定 this（ProPageApi / ProModalApi 用） */
export function bindMethods<T extends object>(instance: T): void {
  const prototype = Object.getPrototypeOf(instance);
  const propertyNames = Object.getOwnPropertyNames(prototype);

  propertyNames.forEach((propertyName) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
    const propertyValue = instance[propertyName as keyof T];

    if (
      typeof propertyValue === "function" &&
      propertyName !== "constructor" &&
      descriptor &&
      !descriptor.get &&
      !descriptor.set
    ) {
      instance[propertyName as keyof T] = propertyValue.bind(instance);
    }
  });
}

/** 等待条件成立的极简原语（ProPageApi mount 同步用） */
export class StateHandler {
  private condition = false;
  private rejectCondition: (() => void) | null = null;
  private resolveCondition: (() => void) | null = null;

  private clearPromises() {
    this.resolveCondition = null;
    this.rejectCondition = null;
  }

  isConditionTrue(): boolean {
    return this.condition;
  }

  reset() {
    this.condition = false;
    this.clearPromises();
  }

  setConditionFalse() {
    this.condition = false;
    if (this.rejectCondition) {
      this.rejectCondition();
      this.clearPromises();
    }
  }

  setConditionTrue() {
    this.condition = true;
    if (this.resolveCondition) {
      this.resolveCondition();
      this.clearPromises();
    }
  }

  waitForCondition(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.condition) {
        resolve();
      } else {
        this.resolveCondition = resolve;
        this.rejectCondition = reject;
      }
    });
  }
}

/**
 * 深拷贝：优先 structuredClone，失败（响应式代理等）回退 JSON。
 * useDrawerForm 重置表单 defaults 用，defaults 是纯配置对象，两条路都安全。
 */
export function cloneDeep<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

import { createDefu, defu } from "defu";

export { createDefu, defu as merge };

/** 数组覆盖式深合并（后者数组整体替换前者），配置合并用 */
export const mergeWithArrayOverride = createDefu((originObj: any, key: any, updates: any) => {
  if (Array.isArray(originObj[key]) && Array.isArray(updates)) {
    originObj[key] = updates;
    return true;
  }
});
