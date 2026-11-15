import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAccessStore } from '../modules/access.store';

describe('useAccessStore（gateway.test 覆盖外的行为锚定）', () => {
  beforeEach(() => {
    const pinia = createPinia();
    pinia.use(
      createPersistedState({ key: (k: any) => `test-${k}`, storage: localStorage }),
    );
    // pinia 3 的 use() 在 app.use(pinia) 前把插件暂存 toBeInstalled——
    // 不挂 app 的纯单测里 persist 会静默失效（生产由 initStores 的 app.use 激活）
    createApp({ render: () => null }).use(pinia);
    setActivePinia(pinia);
  });

  it('checkAccessTokenExpired：无过期时间视为过期；到期时间后过期；未到期不过期', () => {
    const store = useAccessStore();
    expect(store.checkAccessTokenExpired()).toBe(true);

    store.setAccessToken('tok');
    store.setAccessTokenExpireTime(Date.now() - 1);
    expect(store.checkAccessTokenExpired()).toBe(true);

    store.setAccessTokenExpireTime(Date.now() + 60_000);
    expect(store.checkAccessTokenExpired()).toBe(false);
  });

  it('$reset 清全部状态（含 mfaOperationId/expireTime）', () => {
    const store = useAccessStore();
    store.setAccessToken('tok');
    store.setAccessTokenExpireTime(Date.now() + 1000);
    store.setAccessCodes(['c']);
    store.setHiddenFields(['User.email']);
    store.setAccessMenus([{ name: 'm', path: '/m' } as any]);
    store.setAccessRoutes([{ name: 'r', path: '/r' } as any]);
    store.setIsAccessChecked(true);
    store.setLoginExpired(true);
    (store as any).mfaOperationId = 'op-1';

    store.$reset();
    expect(store.accessToken).toBeNull();
    expect(store.accessTokenExpireTime).toBeUndefined();
    expect(store.accessCodes).toEqual([]);
    expect(store.hiddenFields).toEqual([]);
    expect(store.accessMenus).toEqual([]);
    expect(store.accessRoutes).toEqual([]);
    expect(store.isAccessChecked).toBe(false);
    expect(store.loginExpired).toBe(false);
    expect(store.mfaOperationId).toBeNull();
  });

  it('persist.pick 只持久化权限码与隐藏字段；token/菜单/路由不落 localStorage', async () => {
    const store = useAccessStore();
    store.setAccessToken('secret-token');
    store.setAccessCodes(['user:list']);
    store.setHiddenFields(['User.email']);
    store.setAccessMenus([{ name: 'm', path: '/m' } as any]);

    // persist 经 $subscribe 落盘——$persist 强制立即写入
    (store as any).$persist?.();

    const keys = Object.keys(localStorage);
    const raw = keys.map((k) => localStorage.getItem(k) ?? '').join('\n');
    expect(raw).toContain('user:list');
    expect(raw).toContain('User.email');
    // token 仅内存：刷新页面丢 token → 守卫跳登录（设计注释钉死的行为）
    expect(raw).not.toContain('secret-token');
    expect(raw).not.toContain('accessMenus');
    expect(keys.join('\n')).toContain('core-access');
  });
});
