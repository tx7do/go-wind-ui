import { describe, expect, it } from 'vitest';
import { configureAdminRuntime, isDevMode } from '../env';
import { configureQueryClient, queryClient } from '../query-client';

describe('运行时 dev 标志（包内零 import.meta.env 直读）', () => {
  it('默认关闭，configureAdminRuntime 可开关', () => {
    configureAdminRuntime({ isDev: false });
    expect(isDevMode()).toBe(false);
    configureAdminRuntime({ isDev: true });
    expect(isDevMode()).toBe(true);
    configureAdminRuntime();
    expect(isDevMode()).toBe(false);
  });
});

describe('configureQueryClient 重试策略切换', () => {
  it('默认为生产姿态：仅网络错误重试 1 次', () => {
    configureQueryClient();
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: Error,
    ) => boolean;
    expect(retry(0, new Error('Network Error'))).toBe(true);
    expect(retry(1, new Error('Network Error'))).toBe(false);
    expect(retry(0, new Error('boom'))).toBe(false);
  });

  it('isDev 姿态：任何错误重试 3 次', () => {
    configureQueryClient({ isDev: true });
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: Error,
    ) => boolean;
    expect(retry(0, new Error('boom'))).toBe(true);
    expect(retry(2, new Error('boom'))).toBe(true);
    expect(retry(3, new Error('boom'))).toBe(false);
    configureQueryClient();
  });
});
