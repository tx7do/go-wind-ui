import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import {
  generateMenus,
  generateRoutesByBackend,
  generateRoutesByFrontend,
  hasAuthority,
} from '../generators';
import { generateAccessible } from '../accessible';

function route(
  name: string,
  path: string,
  meta?: Record<string, any>,
  children?: any[],
): any {
  return { name, path, meta, children };
}

// GenerateMenuAndRoutesOptions 的组件表值是异步 loader（glob 形态），测试用同款函数
function fakePage() {
  return async () => ({}) as any;
}

describe('hasAuthority', () => {
  it('meta.ignoreAccess 或无 authority 直接放行', () => {
    expect(hasAuthority(route('a', '/a', { ignoreAccess: true }), [], [])).toBe(true);
    expect(hasAuthority(route('b', '/b'), [], [])).toBe(true);
  });

  it('authority 命中角色码（精确）或权限码（精确/前缀）', () => {
    expect(hasAuthority(route('r', '/r', { authority: ['admin'] }), ['admin'], [])).toBe(true);
    // 权限码精确
    expect(hasAuthority(route('c', '/c', { authority: ['user:list'] }), [], ['user:list'])).toBe(true);
    // 权限码前缀：authority 以 code + ':' 开头（用户有 user → 命中 user:list）
    expect(hasAuthority(route('p', '/p', { authority: ['user:list'] }), [], ['user'])).toBe(true);
    // 全不命中
    expect(hasAuthority(route('x', '/x', { authority: ['admin'] }), ['guest'], ['other'])).toBe(false);
  });

  it('无权限但标记 menuVisibleWithForbidden 视为“可访问”（组件替换为 403 由 frontend 生成器处理）', () => {
    const r = route('v', '/v', { authority: ['admin'], menuVisibleWithForbidden: true });
    expect(hasAuthority(r, [], [])).toBe(true);
    expect(hasAuthority(route('h', '/h', { authority: ['admin'] }), [], [])).toBe(false);
  });
});

describe('generateRoutesByFrontend', () => {
  it('按角色过滤路由树；父节点被滤则整枝消失', async () => {
    const routes = [
      route('home', '/home'),
      route('admin', '/admin', { authority: ['admin'] }, [
        route('panel', '/admin/panel'),
        route('secret', '/admin/secret', { authority: ['super'] }),
      ]),
    ];
    const result = await generateRoutesByFrontend(routes, ['admin']);
    expect(result.map((r) => r.name)).toEqual(['home', 'admin']);
    // 子级里 super 才能看的被滤掉
    expect(result[1].children?.map((r: any) => r.name)).toEqual(['panel']);
  });

  it('menuVisibleWithForbidden 的路由保留且组件被替换为 forbiddenComponent', async () => {
    const Forbidden = { template: '<p>403</p>' };
    const routes = [
      route('visible403', '/v403', { authority: ['admin'], menuVisibleWithForbidden: true }),
      route('hidden403', '/h403', { authority: ['admin'] }),
    ];
    const result = await generateRoutesByFrontend(routes, [], Forbidden);
    expect(result.map((r) => r.name)).toEqual(['visible403']);
    expect(result[0].component).toBe(Forbidden);
  });

  it('不传 forbiddenComponent 时保留原组件引用', async () => {
    const routes = [route('v', '/v', { authority: ['admin'], menuVisibleWithForbidden: true })];
    const result = await generateRoutesByFrontend(routes, ['admin']);
    expect(result[0].component).toBeUndefined();
  });
});

describe('generateRoutesByBackend', () => {
  const minimalRouter = createRouter({ history: createMemoryHistory(), routes: [] });

  it('菜单为空返回 []；fetch 抛错吞掉并返回 []（console.error 带出）', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      await generateRoutesByBackend({ router: minimalRouter, routes: [], fetchMenuListAsync: async () => null as any }),
    ).toEqual([]);
    expect(
      await generateRoutesByBackend({
        router: minimalRouter,
        routes: [],
        fetchMenuListAsync: async () => { throw new Error('boom'); },
      }),
    ).toEqual([]);
    expect(err).toHaveBeenCalledWith(expect.any(Error));
    err.mockRestore();
  });

  it('layoutMap 命中 layout；pageMap 命中页面组件', async () => {
    const layout = fakePage();
    const page = fakePage();
    const menus = [
      { name: 'Root', path: '/', component: 'BasicLayout', children: [
        { name: 'Dash', path: '/dashboard', component: '/app/dashboard/index' },
      ] },
    ];
    const result = await generateRoutesByBackend({
      router: minimalRouter,
      routes: [],
      fetchMenuListAsync: async () => menus,
      layoutMap: { BasicLayout: layout },
      pageMap: { '/app/dashboard/index.vue': page },
    });
    const root = result[0];
    expect(root.component).toBe(layout);
    expect(root.children![0].component).toBe(page);
  });

  it('normalizeViewPath：剥 ./ /pages /app 前缀后统一补 /app；分隔符互换兜底', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dictPage = fakePage();
    const dashPage = fakePage();
    const cases: string[] = [
      '/pages/app/system/dict/index',
      'app/system/dict/index',
      '/system/dict/index',
      './dashboard/index',
    ];
    for (const component of cases) {
      const page = component.includes('dict') ? dictPage : dashPage;
      const result = await generateRoutesByBackend({
        router: minimalRouter,
        routes: [],
        fetchMenuListAsync: async () => [{ name: 'X', path: '/x', component }],
        layoutMap: {},
        pageMap: { '/app/system/dict/index.vue': dictPage, '/app/dashboard/index.vue': dashPage },
      });
      expect(result[0].component).toBe(page);
    }
    // pageMap 键是横线目录、后端给下划线路径（login_policy ↔ login-policy 互换兜底）
    const loginPage = fakePage();
    const flipped = await generateRoutesByBackend({
      router: minimalRouter,
      routes: [],
      fetchMenuListAsync: async () => [
        { name: 'L', path: '/l', component: '/app/log/login_policy/index' },
      ],
      layoutMap: {},
      pageMap: { '/app/log/login-policy/index.vue': loginPage },
    });
    expect(flipped[0].component).toBe(loginPage);
    err.mockRestore();
  });

  it('缺 name 的路由节点报错但树照常返回', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const page = fakePage();
    const result = await generateRoutesByBackend({
      router: minimalRouter,
      routes: [],
      fetchMenuListAsync: async () => [{ path: '/noname', component: '/app/dashboard/index' }],
      layoutMap: {},
      pageMap: { '/app/dashboard/index.vue': page },
    });
    expect(err).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    err.mockRestore();
  });
});

describe('generateAccessible（frontend 集成）', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    router = createRouter({ history: createMemoryHistory(), routes: [] });
  });

  it('路由注册进 router、父级自动补 redirect 到首个绝对路径子路由、菜单按 order 排序并滤 hideInMenu', async () => {
    const routes = [
      route('sys', '/system', { title: '系统', order: 2 }, [
        route('dict', '/system/dict', { title: '字典' }),
        route('task', '/system/task', { title: '任务', order: 1 }),
      ]),
      route('dash', '/dashboard', { title: '仪表', order: 1 }, [
        route('d-main', '/dashboard/main', { title: '总览' }),
      ]),
      route('hidden', '/hidden', { title: '隐藏', hideInMenu: true }),
    ];

    const { accessibleRoutes, accessibleMenus } = await generateAccessible('frontend', {
      router,
      routes,
      roles: [],
      accessCodes: [],
    });

    // 全部注册进 router（含隐藏路由——菜单隐藏但路由可达）
    expect(router.hasRoute('sys')).toBe(true);
    expect(router.hasRoute('hidden')).toBe(true);

    // 自动 redirect：父无 redirect 且首子为绝对路径 → redirect=首子 path
    // 注意 redirect 补齐发生在排序前，取的是 children[0] 原序
    const sys = accessibleRoutes.find((r) => r.name === 'sys')!;
    expect(sys.redirect).toBe('/system/dict');
    const dash = accessibleRoutes.find((r) => r.name === 'dash')!;
    expect(dash.redirect).toBe('/dashboard/main');

    // 菜单：order 排序 + hideInMenu 过滤 + 子级排序
    expect(accessibleMenus.map((m) => m.name)).toEqual(['仪表', '系统']);
    const sysMenu = accessibleMenus.find((m) => m.path === '/system')!;
    expect(sysMenu.children?.map((c) => c.name)).toEqual(['任务', '字典']);
    expect(accessibleMenus.find((m) => m.path === '/hidden')).toBeUndefined();
  });

  it('backend 模式：菜单数据生成路由并合并静态隐藏子路由', async () => {
    const staticRoutes = [
      route('user', '/user', { title: '用户' }, [
        route('user-detail', '/user/detail/:id', { hideInMenu: true }),
      ]),
    ];
    const { accessibleMenus } = await generateAccessible('backend', {
      router,
      routes: staticRoutes,
      roles: [],
      fetchMenuListAsync: async () => [
        { name: 'user', path: '/user', component: '/app/user/index', meta: { title: '用户' } },
      ],
      layoutMap: {},
      pageMap: { '/app/user/index.vue': fakePage() },
    });

    expect(router.hasRoute('user')).toBe(true);
    // 菜单里含隐藏子路由的父节点，但隐藏子路由本身不进菜单
    const userMenu = accessibleMenus.find((m) => m.path === '/user');
    expect(userMenu).toBeDefined();
  });
});

describe('generateMenus', () => {
  it('从 router 取最终 path；meta.title 作为菜单名；hideChildrenInMenu 折叠子级（path 取顶层 redirect）', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { name: 'p', path: '/parent', redirect: '/parent/child', children: [
          { name: 'c', path: '/parent/child', component: { template: '<div/>' } },
        ] },
      ],
    });
    const menus = await generateMenus(
      [{
        ...route('p', '/parent', { title: '父级', hideChildrenInMenu: true }, [
          route('c', 'child', { title: '子级' }),
        ]),
        redirect: '/other',
      }],
      router,
    );
    // hideChildrenInMenu：path 取顶层 redirect、children 折叠为空
    expect(menus).toHaveLength(1);
    expect(menus[0].name).toBe('父级');
    expect(menus[0].path).toBe('/other');
    expect(menus[0].children).toEqual([]);
  });

  it('无 title 时回退路由 name；hideInMenu 的菜单项被过滤', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] });
    const menus = await generateMenus([
      route('fallback-name', '/fb', {}),
      route('gone', '/gone', { hideInMenu: true }),
    ], router);
    expect(menus.map((m) => m.name)).toEqual(['fallback-name']);
  });
});
