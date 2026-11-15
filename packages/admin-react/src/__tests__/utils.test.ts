import { describe, expect, it } from 'vitest';
import { filterTree, mapTree, traverseTreeValues } from '../utils/tree';
import { merge, mergeWithArrayOverride } from '../utils/merge';
import { formatDate, formatDateTime } from '../utils/date';

// 每个用例独立建树：filterTree/mapTree 对入参做原地修改（node[childProps] 重新赋值），
// 共享常量树会跨用例污染
function makeTree() {
  return [
    {
      id: 1,
      children: [
        { id: 11, children: [] },
        { id: 12, children: [] },
      ],
    },
    { id: 2, children: [] },
  ] as any[];
}

describe('utils/tree', () => {
  it('traverseTreeValues 深度优先收集全部节点（falsy 返回值被过滤）', () => {
    const ids = traverseTreeValues(makeTree(), (node) => node.id);
    expect(ids).toEqual([1, 11, 12, 2]);
  });

  it('filterTree 按谓词过滤节点（原地修改入参）', () => {
    const filtered = filterTree(makeTree(), (node) => node.id !== 11);
    const ids = traverseTreeValues(filtered, (node) => node.id);
    expect(ids).not.toContain(11);
    expect(ids).toContain(12);
  });

  it('mapTree 深度映射每个节点（子节点用同一 mapper 递归映射）', () => {
    const mapped = mapTree(makeTree(), (node) => ({ ...node, tag: 'x' }));
    expect(traverseTreeValues(mapped, (node) => node.tag)).toEqual(['x', 'x', 'x', 'x']);
  });
});

describe('utils/merge', () => {
  it('深合并：source 覆盖 target 的嵌套叶子', () => {
    const result = merge({ a: { b: 1, c: 2 } }, { a: { b: 9 } });
    expect(result.a).toEqual({ b: 9, c: 2 });
  });

  it('mergeWithArrayOverride：数组整体替换而非合并', () => {
    const result = mergeWithArrayOverride({ list: [1, 2, 3] }, { list: [7] });
    expect(result.list).toEqual([7]);
  });
});

describe('utils/date', () => {
  it('formatDate 空值返回空串', () => {
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('formatDate 对合法日期返回非空串', () => {
    expect(typeof formatDate('2026-01-02T03:04:05Z')).toBe('string');
    expect(formatDate('2026-01-02T03:04:05Z').length).toBeGreaterThan(0);
  });

  it('formatDateTime 无值返回占位符', () => {
    expect(formatDateTime()).toBe('-');
    expect(formatDateTime(null)).toBe('-');
  });

  it('formatDateTime 支持 proto3 Timestamp（seconds）与字符串', () => {
    expect(typeof formatDateTime({ seconds: 1768000000 })).toBe('string');
    expect(formatDateTime({ seconds: 1768000000 })).not.toBe('-');
    expect(typeof formatDateTime('2026-01-02T03:04:05Z')).toBe('string');
  });
});
