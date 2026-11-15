import { describe, expect, it, vi } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';

import {
  mergeHiddenRoutes,
  mergeRouteModules,
  resetStaticRoutes,
  sortRoutes,
} from '../utils';

function route(
  name: string,
  path: string,
  meta?: Record<string, any>,
  children?: RouteRecordRaw[],
): RouteRecordRaw {
  return { name, path, meta, children } as RouteRecordRaw;
}

describe('sortRoutes', () => {
  it('按 meta.order 升序排序', () => {
    const sorted = sortRoutes([
      route('c', '/c', { order: 3 }),
      route('a', '/a', { order: 1 }),
      route('b', '/b', { order: 2 }),
    ]);
    expect(sorted.map((r) => r.name)).toEqual(['a', 'b', 'c']);
  });

  it('无 order 的路由沉底（MAX_SAFE_INTEGER）', () => {
    const sorted = sortRoutes([
      route('plain', '/plain'),
      route('ordered', '/ordered', { order: 5 }),
    ]);
    expect(sorted.map((r) => r.name)).toEqual(['ordered', 'plain']);
  });

  it('递归排序子级；不改动入参数组顺序', () => {
    const input = [
      route('parent', '/p', { order: 2 }, [
        route('z', '/p/z', { order: 9 }),
        route('y', '/p/y', { order: 1 }),
      ]),
      route('first', '/f', { order: 1 }),
    ];
    const sorted = sortRoutes(input);
    // 入参保持原序（sort 不作用在原数组、children 生成新数组）
    expect(input.map((r) => r.name)).toEqual(['parent', 'first']);
    expect(input[0].children?.map((r) => r.name)).toEqual(['z', 'y']);
    // 出参两级都有序
    expect(sorted.map((r) => r.name)).toEqual(['first', 'parent']);
    expect(sorted[1].children?.map((r) => r.name)).toEqual(['y', 'z']);
  });
});

describe('mergeRouteModules', () => {
  it('合并各模块 default 导出；空/非模块值安全跳过', () => {
    const a = route('a', '/a');
    const b = route('b', '/b');
    const merged = mergeRouteModules({
      './app.ts': { default: [a] },
      './user.ts': { default: [b] },
      './empty.ts': { default: [] },
      './broken.ts': {},
      './null.ts': null,
    });
    expect(merged).toEqual([a, b]);
  });
});

describe('mergeHiddenRoutes', () => {
  it('把静态路由中 hideInMenu 的子路由按父 name 合并进后端路由树', () => {
    const detail = route('user-detail', '/users/detail/:id', { hideInMenu: true });
    const backend = [route('user', '/users', {}, [route('user-list', '/users/list')])];
    const staticRoutes = [route('user', '/users', {}, [route('user-list', '/users/list'), detail])];

    const merged = mergeHiddenRoutes(backend, staticRoutes);
    const userNode = merged.find((r) => r.name === 'user')!;
    expect(userNode.children?.map((r) => r.name)).toEqual(['user-list', 'user-detail']);
  });

  it('静态路由无隐藏子路由时原样返回后端路由', () => {
    const backend = [route('a', '/a')];
    const staticRoutes = [route('a', '/a', {}, [route('visible', '/a/v')])];
    expect(mergeHiddenRoutes(backend, staticRoutes)).toBe(backend);
  });

  it('父 name 不匹配的隐藏路由不合并', () => {
    const hidden = route('orphan', '/orphan', { hideInMenu: true });
    const backend = [route('user', '/users')];
    const merged = mergeHiddenRoutes(backend, [route('other', '/other', {}, [hidden])]);
    expect(merged[0].children).toBeUndefined();
  });

  it('合并的是 cloneDeep 副本：改合并结果不影响静态路由源对象', () => {
    const hidden = route('detail', '/d', { hideInMenu: true });
    const staticRoutes = [route('user', '/users', {}, [hidden])];
    const backend = [route('user', '/users')];
    const merged = mergeHiddenRoutes(backend, staticRoutes);
    (merged[0].children![0] as any).meta.hideInMenu = false;
    expect(hidden.meta?.hideInMenu).toBe(true);
  });
});

describe('resetStaticRoutes', () => {
  function makeRouter(registered: string[]) {
    const removed: string[] = [];
    return {
      removed,
      getRoutes: () => registered.map((name) => ({ name })),
      hasRoute: (name: string) => registered.includes(name),
      removeRoute: (name: string) => {
        removed.push(name);
      },
    } as any;
  }

  it('删除动态路由，保留白名单（静态路由树内）路由', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const whitelist = [route('login', '/login'), route('user', '/user')];
    const router = makeRouter(['login', 'user', 'backend-page', 'backend-other']);
    resetStaticRoutes(router, whitelist);
    expect(router.removed).toEqual(['backend-page', 'backend-other']);
    warn.mockRestore();
  });

  it('白名单中缺 name 的路由给出警告且不参与白名单匹配', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const router = makeRouter(['anon']);
    resetStaticRoutes(router, [{ path: '/anon' } as RouteRecordRaw]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/anon needs to have the field name'));
    // 无 name → 不在白名单集合 → 已注册同名路由被删（文档行为：reset 要求静态路由必须带 name）
    expect(router.removed).toEqual(['anon']);
    warn.mockRestore();
  });
});
