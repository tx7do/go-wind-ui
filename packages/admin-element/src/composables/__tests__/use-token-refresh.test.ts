import { createApp } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { globalSSEClient } from '@go-wind/admin-core';

import { setAppRouter, setAuthGateway, type ElementAuthGateway } from '../../auth-gateway';
import { initStores } from '../../stores/setup';
import { useAccessStore, useAppUserStore } from '../../stores';
import {
  connectSSEServerIfNeeded,
  connectSSEServer,
  logoutToLoginPage,
  refreshToken,
  reauthenticate,
  startRefreshTimer,
  stopRefreshTimer,
} from '../use-token-refresh';

const LOGIN_PATH = '/login';

function makeGateway(overrides: Partial<ElementAuthGateway> = {}): ElementAuthGateway {
  return {
    login: vi.fn(async () => ({ access_token: 't' })),
    verifyMfa: vi.fn(async () => ({ access_token: 't' })),
    ssoLogin: vi.fn(async () => ({ access_token: 't' })),
    logout: vi.fn(async () => ({})),
    refresh: vi.fn(async () => ({ access_token: 'new-tok', expires_in: 3600 })),
    fetchUserInfo: vi.fn(async () => null),
    fetchAccessCodes: vi.fn(async () => ({ codes: [], hiddenFields: [] })),
    generateCaptcha: vi.fn(async () => ({})),
    encryptPassword: vi.fn(async (p) => p),
    ...overrides,
  } as ElementAuthGateway;
}

async function makeRouter(startAt?: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div/>' } },
      { path: LOGIN_PATH, name: 'login', component: { template: '<div/>' } },
    ],
  });
  setAppRouter(router);
  if (startAt) {
    await router.replace(startAt).catch(() => {});
  }
  await router.isReady().catch(() => {});
  return router;
}

beforeEach(async () => {
  // 经 initStores 装模块级 pinia（resetAllStores 依赖它）+ app.use 激活插件挂载
  await initStores(createApp({ render: () => null }), { namespace: 't' });
  setAuthGateway(makeGateway());
  document.cookie = 'refresh_exp=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

afterEach(() => {
  stopRefreshTimer();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('refreshToken', () => {
  it('成功：写回新 token 与过期时间，并重连 SSE（需 token+userId 齐备）', async () => {
    const access = useAccessStore();
    const user = useAppUserStore();
    access.setAccessToken('old-tok');
    user.setUserInfo({
      id: '9', username: 'a', nickname: 'n', avatar: '', realname: 'r', tenantId: '0',
    } as any);
    const reconnect = vi.spyOn(globalSSEClient, 'reconnect').mockImplementation(() => {});

    const token = await refreshToken();

    expect(token).toBe('new-tok');
    expect(access.accessToken).toBe('new-tok');
    // expires_in=3600 → 过期时间≈now+3600s（容差 10 分钟）
    expect(access.accessTokenExpireTime).toBeGreaterThan(Date.now() + 50 * 60 * 1000);
    expect(reconnect).toHaveBeenCalled();
  });

  it('expires_in 非法时回退 90 分钟', async () => {
    setAuthGateway(makeGateway({ refresh: vi.fn(async () => ({ access_token: 'x', expires_in: 'bad' })) }));
    const access = useAccessStore();
    await refreshToken();
    const delta = (access.accessTokenExpireTime ?? 0) - Date.now();
    expect(delta).toBeGreaterThan(80 * 60 * 1000);
    expect(delta).toBeLessThanOrEqual(91 * 60 * 1000);
  });

  it('refresh 失败：console.error 带出原始错误并触发 reauthenticate 清凭证跳登录', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(globalSSEClient, 'close').mockImplementation(() => {});
    const router = await makeRouter('/some-page');
    setAuthGateway(makeGateway({ refresh: vi.fn(async () => { throw new Error('rotated away'); }) }));
    const access = useAccessStore();
    access.setAccessToken('stale');

    const token = await refreshToken();

    expect(token).toBe('');
    expect(access.accessToken).toBeNull();
    expect(access.accessCodes).toEqual([]);
    expect(access.isAccessChecked).toBe(false);
    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
    err.mockRestore(); warn.mockRestore(); log.mockRestore();
  });
});

describe('reauthenticate', () => {
  it('loginExpiredMode=modal 且做过权限检查 → 置 loginExpired 弹窗，不跳转、凭证清空', async () => {
    const { updatePreferences } = await import('../../preferences');
    updatePreferences({ app: { loginExpiredMode: 'modal' } });
    const access = useAccessStore();
    access.setIsAccessChecked(true);
    access.setAccessToken('tok');
    const router = await makeRouter('/keep-here');

    await reauthenticate();

    expect(access.loginExpired).toBe(true);
    expect(router.currentRoute.value.path).toBe('/keep-here');
    expect(access.accessToken).toBeNull();
  });

  it('modal 模式但未做过权限检查（wasAccessChecked=false）→ 照常跳登录页', async () => {
    const { updatePreferences } = await import('../../preferences');
    updatePreferences({ app: { loginExpiredMode: 'modal' } });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(globalSSEClient, 'close').mockImplementation(() => {});
    const access = useAccessStore();
    access.setIsAccessChecked(false);
    const router = await makeRouter('/keep-here');

    await reauthenticate();

    expect(access.loginExpired).toBe(false);
    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
    log.mockRestore();
  });

  it('并发重入：第一个挂起期间第二个直接返回（isReauthenticating 保护）', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(globalSSEClient, 'close').mockImplementation(() => {});
    const router = await makeRouter('/x');
    // 默认非 modal（或未过 access check）→ 第一次走含 await 的 logout 分支
    const [a, b] = await Promise.all([reauthenticate(), reauthenticate()]);
    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
    warn.mockRestore(); log.mockRestore();
  });
});

describe('logoutToLoginPage', () => {
  it('清 store/query 缓存/SSE 后跳登录页并携带 redirect', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const router = await makeRouter('/target/page?a=1');
    const access = useAccessStore();
    access.setAccessToken('tok');
    access.setAccessCodes(['c']);
    const close = vi.spyOn(globalSSEClient, 'close').mockImplementation(() => {});

    await logoutToLoginPage();

    expect(access.accessToken).toBeNull();
    expect(access.accessCodes).toEqual([]);
    expect(close).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
    expect(router.currentRoute.value.query.redirect).toBe(encodeURIComponent('/target/page?a=1'));
    log.mockRestore();
  });

  it('已在登录页时不重复跳转', async () => {
    const router = await makeRouter(LOGIN_PATH);
    await logoutToLoginPage();
    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
  });

  it('redirect=false 时不携带回跳参数', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const router = await makeRouter('/x');
    await logoutToLoginPage(false);
    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
    expect(router.currentRoute.value.query.redirect).toBeUndefined();
    log.mockRestore();
  });
});

describe('定时刷新管理', () => {
  it('无 refresh_exp cookie 时首个调度触发 reauthenticate（跳登录）', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalSSEClient, 'close').mockImplementation(() => {});
    const router = await makeRouter('/protected');
    useAccessStore().setAccessToken('tok');

    startRefreshTimer();
    // 无 refresh_exp → 首个调度按 MIN_INTERVAL_MS(3s) 排程；推进 5s 确保触发
    await vi.advanceTimersByTimeAsync(5000);

    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
    stopRefreshTimer();
    warn.mockRestore(); log.mockRestore(); err.mockRestore();
  });

  it('stopRefreshTimer 后调度链终止：advance 不再产生任何副作用', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const router = await makeRouter('/protected');
    document.cookie = `refresh_exp=${Math.floor((Date.now() + 3600_000) / 1000)}; path=/`;
    const refresh = vi.fn(async () => ({ access_token: 'x' }));
    setAuthGateway({ ...makeGateway(), refresh } as ElementAuthGateway);

    startRefreshTimer();
    stopRefreshTimer();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

    expect(router.currentRoute.value.path).toBe('/protected');
    expect(refresh).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('SSE 连接', () => {
  it('缺 token 或 userId 时跳过连接', () => {
    const connect = vi.spyOn(globalSSEClient, 'connect').mockImplementation(() => null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    connectSSEServerIfNeeded();
    expect(connect).not.toHaveBeenCalled();
    useAccessStore().setAccessToken('tok');
    connectSSEServerIfNeeded();
    expect(connect).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('connectSSEServer：注入 base url 并以 ?stream=<userId> 连接，Authorization 头携 token', () => {
    const connect = vi.spyOn(globalSSEClient, 'connect').mockImplementation(() => null);
    const setHeaders = vi.spyOn(globalSSEClient, 'setHeaders').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAccessStore().setAccessToken('tok-1');
    useAppUserStore().setUserInfo({
      id: '42', username: 'a', nickname: 'n', avatar: '', realname: 'r', tenantId: '0',
    } as any);

    connectSSEServer('https://sse.example.com/events');

    expect(setHeaders).toHaveBeenCalledWith({ Authorization: 'Bearer tok-1' });
    expect(connect).toHaveBeenCalledWith('https://sse.example.com/events?stream=42');
    warn.mockRestore();
  });

  it('connectSSEServerIfNeeded 复用已注入的 base url（不覆盖宿主注入）', () => {
    const connect = vi.spyOn(globalSSEClient, 'connect').mockImplementation(() => null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAccessStore().setAccessToken('tok-2');
    useAppUserStore().setUserInfo({
      id: '7', username: 'a', nickname: 'n', avatar: '', realname: 'r', tenantId: '0',
    } as any);

    connectSSEServerIfNeeded();
    // 模块级 base url 已被上一用例注入为 sse.example.com——ifNeeded 只复用不覆盖
    expect(connect).toHaveBeenCalledWith(expect.stringContaining('?stream=7'));
    expect(connect).toHaveBeenCalledWith(expect.stringContaining('sse.example.com'));
    warn.mockRestore();
  });
});
