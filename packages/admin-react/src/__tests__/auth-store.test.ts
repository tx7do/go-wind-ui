import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthGateway, setAuthGateway, type AuthGateway } from '../auth-gateway';
import { stopRefreshTimer } from '../hooks/useTokenRefresh';
import { useAuthStore } from '../stores/auth';

/**
 * 认证机制全流程测试：数据面完全由 mock AuthGateway 提供——
 * 这正是 AuthGateway 边界设计的可测试性收益（不启网络、不依赖 generated 客户端）。
 */

function makeGateway(overrides: Partial<AuthGateway> = {}): AuthGateway {
  return {
    login: vi.fn(async () => ({ access_token: 'at-123', expires_in: '7200' })),
    verifyMfa: vi.fn(async () => ({ access_token: 'at-mfa', expires_in: 3600 })),
    ssoLogin: vi.fn(async () => ({ access_token: 'at-sso' })),
    logout: vi.fn(async () => ({})),
    refresh: vi.fn(async () => ({ access_token: 'at-refresh', expires_in: 7200 })),
    fetchProfile: vi.fn(async () => ({
      id: '42',
      username: 'admin',
      nickname: 'Admin',
      realname: '',
      avatar: '',
      tenantId: '0',
      homePath: '/home',
    })),
    encryptPassword: vi.fn(async (plain: string) => `enc(${plain})`),
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  setAuthGateway(makeGateway());
});

afterEach(() => {
  stopRefreshTimer();
  vi.useRealTimers();
  useAuthStore.getState().$reset();
  vi.restoreAllMocks();
});

describe('auth store：登录成功流程', () => {
  it('login 经 gateway 加密口令并落 token/用户信息，回调触发', async () => {
    const g = getGateway();
    const onSuccess = vi.fn();
    await useAuthStore.getState().login({ username: 'admin', password: 'secret' }, onSuccess);

    expect(g.encryptPassword).toHaveBeenCalledWith('secret');
    expect(g.login).toHaveBeenCalledWith(expect.objectContaining({ username: 'admin', password: 'enc(secret)' }));
    expect(g.fetchProfile).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe('at-123');
    expect(useAuthStore.getState().userInfo?.id).toBe('42');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    // expires_in '7200'（proto3 字符串）应转回毫秒时间戳
    expect(useAuthStore.getState().accessTokenExpireAt).toBeGreaterThan(Date.now());
  });

  it('携带验证码时走 setCaptchaHeaders 路径不炸（header 单例消费）', async () => {
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn(), { id: 'cid', value: '9999' });
    expect(useAuthStore.getState().accessToken).toBe('at-123');
  });
});

describe('auth store：MFA 闸门', () => {
  it('后端返回 mfa_operation_id 时不写任何 token，进入挑战态', async () => {
    const g = makeGateway({
      login: vi.fn(async () => ({ mfa_operation_id: 'op-1' })),
    });
    setAuthGateway(g);
    const onSuccess = vi.fn();
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, onSuccess);

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().mfaOperationId).toBe('op-1');
    expect(useAuthStore.getState().userInfo).toBeNull();
    expect(g.fetchProfile).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('completeMfaChallenge 校验通过后清挑战态并复用登录成功流程', async () => {
    setAuthGateway(makeGateway({ login: vi.fn(async () => ({ mfa_operation_id: 'op-1' })) }));
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn());

    await useAuthStore.getState().completeMfaChallenge('654321', vi.fn());
    const g = getGateway();
    expect(g.verifyMfa).toHaveBeenCalledWith({ operationId: 'op-1', totpCode: '654321' });
    expect(useAuthStore.getState().mfaOperationId).toBeNull();
    expect(useAuthStore.getState().accessToken).toBe('at-mfa');
    expect(useAuthStore.getState().userInfo?.id).toBe('42');
  });

  it('无挑战态时 completeMfaChallenge 抛错', async () => {
    await expect(useAuthStore.getState().completeMfaChallenge('000000', vi.fn())).rejects.toThrow();
  });
});

describe('auth store：登出与强制登出', () => {
  it('logout 调 gateway.logout 并清理全部本地状态', async () => {
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn());
    const g = getGateway();
    await useAuthStore.getState().logout();

    expect(g.logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().userInfo).toBeNull();
  });

  it('gateway.logout 抛错不阻断本地清理（留痕不吞错）', async () => {
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn());
    setAuthGateway(makeGateway({ logout: vi.fn(async () => { throw new Error('network'); }) }));

    await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('forceLogout 纯前端清理，不调 gateway', async () => {
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn());
    const g = getGateway();
    useAuthStore.getState().forceLogout();

    expect(g.logout).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().mfaOperationId).toBeNull();
  });
});

describe('auth store：刷新与失败收敛', () => {
  it('refreshToken 成功更新 token 并返回新值', async () => {
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn());
    const token = await useAuthStore.getState().refreshToken();
    expect(token).toBe('at-refresh');
    expect(useAuthStore.getState().accessToken).toBe('at-refresh');
  });

  it('refreshToken 失败收敛到 forceLogout（不向上抛）', async () => {
    await useAuthStore.getState().login({ username: 'a', password: 'b' }, vi.fn());
    setAuthGateway(makeGateway({ refresh: vi.fn(async () => { throw new Error('expired'); }) }));

    const token = await useAuthStore.getState().refreshToken();
    expect(token).toBe('');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});

// ---- helpers ----
/** 取当前注入的 gateway（各用例 beforeEach 刚 setAuthGateway 过），仅为断言便捷 */
function getGateway(): AuthGateway & Record<string, ReturnType<typeof vi.fn>> {
  return getAuthGateway() as AuthGateway & Record<string, ReturnType<typeof vi.fn>>;
}
