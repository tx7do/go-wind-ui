import { describe, expect, it } from 'vitest';
import { filterTree, mapTree, traverseTreeValues } from '../utils/tree';
import { mergeWithArrayOverride } from '../utils/merge';
import { StateHandler } from '../utils/state-handler';

// filterTree/mapTree 原地修改入参（node[childProps] 重新赋值）——每例新建树
function makeTree() {
  return [
    { id: 1, children: [{ id: 11, children: [] }, { id: 12, children: [] }] },
    { id: 2, children: [] },
  ] as any[];
}

describe('utils/tree', () => {
  it('traverseTreeValues 深度优先收集', () => {
    expect(traverseTreeValues(makeTree(), (n) => n.id)).toEqual([1, 11, 12, 2]);
  });

  it('filterTree 过滤节点', () => {
    const filtered = filterTree(makeTree(), (n) => n.id !== 11);
    expect(traverseTreeValues(filtered, (n) => n.id)).toEqual([1, 12, 2]);
  });

  it('mapTree 深度映射', () => {
    const mapped = mapTree(makeTree(), (n) => ({ ...n, tag: 'x' }));
    expect(traverseTreeValues(mapped, (n) => n.tag)).toEqual(['x', 'x', 'x', 'x']);
  });
});

describe('utils/merge', () => {
  it('mergeWithArrayOverride 数组整体替换（修复性变更：defu 回调返回 updates 才生效）', () => {
    expect(mergeWithArrayOverride({ list: [1, 2] }, { list: [7] }).list).toEqual([7]);
  });

  it('mergeWithArrayOverride 嵌套对象的数组替换同样生效', () => {
    const r = mergeWithArrayOverride({ a: { list: [1, 2] } } as any, { a: { list: [7] }, b: 1 });
    expect(r.a.list).toEqual([7]);
    expect(r.b).toBe(1);
  });
});

describe('utils/state-handler', () => {
  it('waitForCondition 在 setConditionTrue 后 resolve', async () => {
    const h = new StateHandler();
    const p = h.waitForCondition();
    h.setConditionTrue();
    await expect(p).resolves.toBeUndefined();
  });

  it('waitForCondition 在 setConditionFalse 后 reject', async () => {
    const h = new StateHandler();
    const p = h.waitForCondition();
    h.setConditionFalse();
    await expect(p).rejects.toBeUndefined();
  });

  it('已为 true 时 waitForCondition 立即 resolve', async () => {
    const h = new StateHandler();
    h.setConditionTrue();
    await expect(h.waitForCondition()).resolves.toBeUndefined();
  });
});
