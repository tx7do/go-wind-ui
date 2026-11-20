import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, isDayjsObject } from '../utils/date';

// 断言全部使用"带偏移串 / epoch / Date"类输入：这类输入的解析与进程时区无关，
// 输出又统一归一到上海挂钟，因此测试在任意 TZ 的机器上结果一致。
// （naive 裸串的解析语义 = 浏览器本地时区，结果随运行环境变化，不在此断言。）

describe('utils/date formatDate', () => {
  it('ISO-Z 串按偏移解析后换算上海挂钟（回归：tz() 曾丢弃 Z 偏移整体早 8 小时）', () => {
    // 2026-11-20T04:00:00Z = 上海 12:00；旧实现错误输出 '2026-11-20 04:00:00'
    expect(formatDateTime('2026-11-20T04:00:00Z')).toBe('2026-11-20 12:00:00');
    expect(formatDateTime('2026-08-06T12:00:00Z')).toBe('2026-08-06 20:00:00');
  });

  it('ISO 带偏移串与等价 Z 串归一到同一上海挂钟', () => {
    expect(formatDateTime('2026-11-20T12:00:00+08:00')).toBe('2026-11-20 12:00:00');
    expect(formatDateTime('2026-11-19T23:00:00-08:00')).toBe('2026-11-20 15:00:00');
  });

  it('epoch 数字与 Date 对象保持绝对时刻', () => {
    // 1795147200000 = 2026-11-20T04:00:00Z
    expect(formatDateTime(1795147200000)).toBe('2026-11-20 12:00:00');
    expect(formatDateTime(new Date(1795147200000))).toBe('2026-11-20 12:00:00');
  });

  it('formatDate 默认到日粒度', () => {
    expect(formatDate('2026-11-20T04:00:00Z')).toBe('2026-11-20');
  });

  it('空值返回空串、非法值返回空串', () => {
    expect(formatDateTime('')).toBe('');
    expect(formatDateTime(null as any)).toBe('');
    expect(formatDateTime(undefined as any)).toBe('');
    expect(formatDateTime('not-a-date')).toBe('');
  });

  it('dateUtil 导出仍可用且识别 dayjs 对象', () => {
    expect(isDayjsObject('2026-11-20')).toBe(false);
  });
});
