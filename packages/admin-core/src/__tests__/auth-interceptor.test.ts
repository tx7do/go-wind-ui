import { describe, expect, it, vi } from 'vitest';
import {
  authenticateResponseInterceptor,
  errorMessageResponseInterceptor,
} from '../transport/rest/preset-interceptors';

/**
 * 401 刷新队列（防挂死兜底）回归护栏——直接驱动拦截器 rejected 回调：
 * 1. 非 401 直接抛出不触发刷新；
 * 2. refresh 请求自身 401 → 直接 reauthenticate 不入队（防死锁）；
 * 3. 排队条目 30s 超时摘除快速失败；
 * 4. 刷新失败 → 队列空串唤醒 → 排队请求拒绝不重发；
 * 5. __handledByAuthInterceptor 错误不再弹错误提示。
 */

function makeClient() {
  return { isRefreshing: false, refreshTokenQueue: [] as Array<(t: string) => void> } as any;
}

describe('authenticateResponseInterceptor（401 刷新队列）', () => {
  it('非 401 错误直接抛出，不触发刷新', async () => {
    const doRefreshToken = vi.fn(async () => 'x');
    const cfg = authenticateResponseInterceptor({
      client: makeClient(),
      doReAuthenticate: vi.fn(),
      doRefreshToken,
      enableRefreshToken: true,
      formatToken: (t) => t,
    });
    const err403 = { response: { status: 403 }, config: { url: '/x' } };
    await expect(cfg.rejected!(err403 as any)).rejects.toBe(err403);
    expect(doRefreshToken).not.toHaveBeenCalled();
  });

  it('refresh 请求自身 401 → 直接 reauthenticate，不入刷新队列（防死锁）', async () => {
    const doReAuthenticate = vi.fn(async () => {});
    const cfg = authenticateResponseInterceptor({
      client: makeClient(),
      doReAuthenticate,
      doRefreshToken: vi.fn(async () => 'x'),
      enableRefreshToken: true,
      formatToken: (t) => t,
    });
    const err = { response: { status: 401 }, config: { url: '/auth/refresh-token' } };
    await expect(cfg.rejected!(err as any)).rejects.toMatchObject({ __handledByAuthInterceptor: true });
    expect(doReAuthenticate).toHaveBeenCalledTimes(1);
  });

  it('排队条目 30s 超时摘除并快速失败（防挂死）', async () => {
    vi.useFakeTimers();
    const client = makeClient();
    client.isRefreshing = true;
    const cfg = authenticateResponseInterceptor({
      client,
      doReAuthenticate: vi.fn(),
      doRefreshToken: vi.fn(),
      enableRefreshToken: true,
      formatToken: (t) => t,
    });
    const err = { response: { status: 401 }, config: { url: '/list', headers: {} } };
    const p = cfg.rejected!(err as any) as Promise<unknown>;
    vi.advanceTimersByTime(31_000);
    await expect(p).rejects.toMatchObject({ __handledByAuthInterceptor: true });
    expect(client.refreshTokenQueue).toHaveLength(0);
    vi.useRealTimers();
  });

  it('刷新失败 → 队列空串唤醒 → 排队请求拒绝且不重发', async () => {
    const client = makeClient();
    client.isRefreshing = true;
    const cfg = authenticateResponseInterceptor({
      client,
      doReAuthenticate: vi.fn(),
      doRefreshToken: vi.fn(),
      enableRefreshToken: true,
      formatToken: (t) => t,
    });
    const err = { response: { status: 401 }, config: { url: '/list', headers: {} } };
    const p = cfg.rejected!(err as any) as Promise<unknown>;
    expect(client.refreshTokenQueue).toHaveLength(1);
    client.refreshTokenQueue[0](''); // 模拟刷新失败以空串唤醒
    await expect(p).rejects.toMatchObject({ __handledByAuthInterceptor: true });
  });

  it('errorMessage 拦截器跳过 __handledByAuthInterceptor 错误（不弹窗）', async () => {
    const makeErrorMessage = vi.fn();
    const cfg = errorMessageResponseInterceptor(makeErrorMessage, (e) => String(e));
    const handled = Object.assign(new Error('Authentication required'), {
      __handledByAuthInterceptor: true,
    });
    await expect(cfg.rejected!(handled)).rejects.toBe(handled);
    expect(makeErrorMessage).not.toHaveBeenCalled();
  });
});
