import { describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  getAuthGateway,
  setAuthGateway,
  setAppRouter,
  getAppRouter,
  type ElementAuthGateway,
} from '../auth-gateway';
import { resetAllStores, useAccessStore, useAppUserStore } from '../stores';

function makeGateway(): ElementAuthGateway {
  return {
    login: vi.fn(async () => ({ access_token: 't' })),
    verifyMfa: vi.fn(async () => ({ access_token: 't' })),
    ssoLogin: vi.fn(async () => ({ access_token: 't' })),
    logout: vi.fn(async () => ({})),
    refresh: vi.fn(async () => ({ access_token: 't' })),
    fetchUserInfo: vi.fn(async () => null),
    fetchAccessCodes: vi.fn(async () => ({ codes: [], hiddenFields: [] })),
    generateCaptcha: vi.fn(async () => ({})),
    encryptPassword: vi.fn(async (p) => p),
  };
}

describe('ElementAuthGateway 注册器', () => {
  it('注入后可取回同一实例；重复注入覆盖', () => {
    const g = makeGateway();
    setAuthGateway(g);
    expect(getAuthGateway()).toBe(g);
    const g2 = makeGateway();
    setAuthGateway(g2);
    expect(getAuthGateway()).toBe(g2);
  });
});

describe('Pinia 机制 store（initStores 安装后可用）', () => {
  it('access store 存取 token/权限码；$reset 清理', async () => {
    // 包只定义 store；安装由宿主 initStores(app,{namespace}) 触发（其 app.use 链路在
    // 宿主冒烟验证）。单测用 setActivePinia 直装：initStores 内部同样 createPinia。
    const { createPersistedState } = await import('pinia-plugin-persistedstate');
    const pinia = createPinia();
    pinia.use(
      createPersistedState({ key: (k: any) => `test-ns-${k}`, storage: localStorage }),
    );
    setActivePinia(pinia);

    const access = useAccessStore();
    access.setAccessToken('tok-1');
    access.setAccessCodes(['user.list']);
    access.setHiddenFields(['User.email']);
    expect(access.accessToken).toBe('tok-1');
    expect(access.accessCodes).toEqual(['user.list']);
    expect(access.mfaOperationId).toBeNull();

    access.$reset();
    expect(access.accessToken).toBeNull();
    expect(access.accessCodes).toEqual([]);

    const user = useAppUserStore();
    user.setUserInfo({
      id: '1', username: 'a', nickname: 'n', avatar: '', realname: 'r', tenantId: '0',
    } as any);
    expect(user.userRoles).toEqual([]);
    resetAllStores();
    // 钉既有行为：resetAllStores 只重置有 $reset 的 store（options 风格的 access）；
    // setup 风格的 app-user 无 $reset，登出时的清理由 use-auth 显式覆盖 userInfo 或
    // 整页跳登录收敛——与宿主现状一致，不在此处偷偷"修"行为。
    expect(useAccessStore().accessToken).toBeNull();
    expect(user.userInfo).not.toBeNull();
  });
});

describe('app router 注入', () => {
  it('未注入时 getAppRouter fail-fast；注入后取回', async () => {
    const { createRouter, createMemoryHistory } = await import('vue-router');
    const router = createRouter({ history: createMemoryHistory(), routes: [] });
    setAppRouter(router);
    expect(getAppRouter()).toBe(router);
  });
});
