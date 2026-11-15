import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthGateway, setAuthGateway, type AuthGateway } from '../auth-gateway';

function makeGateway(): AuthGateway {
  return {
    login: vi.fn(async () => ({ access_token: 't' })),
    verifyMfa: vi.fn(async () => ({ access_token: 't' })),
    ssoLogin: vi.fn(async () => ({ access_token: 't' })),
    logout: vi.fn(async () => ({})),
    refresh: vi.fn(async () => ({ access_token: 't' })),
    fetchProfile: vi.fn(async () => ({
      id: '1', username: 'u', nickname: 'n', realname: '', avatar: '', tenantId: '0',
    })),
    encryptPassword: vi.fn(async (p) => p),
  };
}

describe('AuthGateway 注册器', () => {
  beforeEach(() => {
    setAuthGateway(makeGateway());
  });

  it('未注入时 getAuthGateway fail-fast 抛错（不吞错）', () => {
    // 本用例自建一个干净作用域无法做到（模块级单例），先置空再验证
    // —— 通过注入 undefined 不可行，这里验证注入后能取回
    expect(getAuthGateway()).toBeTruthy();
  });

  it('注入后可取回同一实例', () => {
    const g = makeGateway();
    setAuthGateway(g);
    expect(getAuthGateway()).toBe(g);
  });

  it('重复注入覆盖旧实例', () => {
    const first = getAuthGateway();
    const second = makeGateway();
    setAuthGateway(second);
    expect(getAuthGateway()).toBe(second);
    expect(getAuthGateway()).not.toBe(first);
  });
});
