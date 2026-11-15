import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { StorageManager } from '@go-wind/admin-core';

import { defaultPreferences } from '../config/default';
import { PreferenceManager } from '../preferences';
import { preferences } from '../../preferences';

// 保存防抖 150ms——真实时钟等 260ms 确保落盘（vueuse debounce 走 setTimeout）
const flushSave = () => new Promise((r) => setTimeout(r, 260));

// setupWatcher 依赖 matchMedia（jsdom 未实现）——stub 成恒 light
beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    });
  }
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

function makeManager() {
  return new PreferenceManager();
}

describe('PreferenceManager.initPreferences', () => {
  it('overrides 深合并进默认偏好（只给 colorPrimary，其余保留默认值）', async () => {
    const mgr = makeManager();
    await mgr.initPreferences({
      namespace: 'ns-a',
      overrides: { theme: { colorPrimary: 'hsl(111 90% 40%)' } },
    });
    const prefs = mgr.getPreferences();
    expect(prefs.theme.colorPrimary).toBe('hsl(111 90% 40%)');
    // 未覆盖字段仍是默认值
    expect(prefs.theme.mode).toBe(defaultPreferences.theme.mode);
    expect(prefs.app.locale).toBe(defaultPreferences.app.locale);
  });

  it('重复 init 幂等（isInitialized 后直接返回，overrides 不再生效）', async () => {
    const mgr = makeManager();
    await mgr.initPreferences({ namespace: 'ns-idem', overrides: {} });
    await mgr.initPreferences({
      namespace: 'ns-idem',
      overrides: { app: { locale: 'en-US' } },
    });
    expect(mgr.getPreferences().app.locale).toBe(defaultPreferences.app.locale);
  });

  it('缓存加载：localStorage 已有偏好时优先于默认值（merge=defu 先到先得）', async () => {
    const cached = JSON.parse(JSON.stringify(defaultPreferences));
    cached.theme.mode = 'dark';
    new StorageManager({ prefix: 'ns-cache' }).setItem('preferences', cached);

    const mgr = makeManager();
    await mgr.initPreferences({ namespace: 'ns-cache', overrides: {} });
    expect(mgr.getPreferences().theme.mode).toBe('dark');
  });

  it('旧版默认色迁移：缓存仍是迁移前默认色时改写为现行默认；自选色不受影响', async () => {
    const legacy = JSON.parse(JSON.stringify(defaultPreferences));
    legacy.theme.colorPrimary = 'hsl(220 100% 55%)'; // 迁移前默认主色
    new StorageManager({ prefix: 'ns-legacy' }).setItem('preferences', legacy);

    const mgr = makeManager();
    await mgr.initPreferences({ namespace: 'ns-legacy', overrides: {} });
    expect(mgr.getPreferences().theme.colorPrimary).toBe(defaultPreferences.theme.colorPrimary);

    const custom = JSON.parse(JSON.stringify(defaultPreferences));
    custom.theme.colorPrimary = 'hsl(1 2% 3%)'; // 用户自选色
    new StorageManager({ prefix: 'ns-custom' }).setItem('preferences', custom);
    const mgr2 = makeManager();
    await mgr2.initPreferences({ namespace: 'ns-custom', overrides: {} });
    expect(mgr2.getPreferences().theme.colorPrimary).toBe('hsl(1 2% 3%)');
  });
});

describe('PreferenceManager.updatePreferences', () => {
  it('深合并：patch 单字段不丢同组其它字段', async () => {
    const mgr = makeManager();
    await mgr.initPreferences({
      namespace: 'ns-patch',
      overrides: { app: { locale: 'zh-CN' } },
    });
    mgr.updatePreferences({ theme: { mode: 'dark' } });
    const prefs = mgr.getPreferences();
    expect(prefs.theme.mode).toBe('dark');
    expect(prefs.app.locale).toBe('zh-CN');
  });

  it('更新经防抖后写入缓存（主 key + 独立 locale/theme key）', async () => {
    const mgr = makeManager();
    await mgr.initPreferences({ namespace: 'ns-save', overrides: {} });
    mgr.updatePreferences({ theme: { mode: 'dark' }, app: { locale: 'en-US' } });
    await flushSave();

    const sm = new StorageManager({ prefix: 'ns-save' });
    expect(sm.getItem<any>('preferences')?.theme.mode).toBe('dark');
    expect(sm.getItem<string>('preferences-locale')).toBe('en-US');
    expect(sm.getItem<string>('preferences-theme')).toBe('dark');
  });
});

describe('PreferenceManager.resetPreferences / clearCache', () => {
  it('resetPreferences 值回 initial（overrides 保留），缓存随后被防抖重写为重置值', async () => {
    const mgr = makeManager();
    await mgr.initPreferences({
      namespace: 'ns-reset',
      overrides: { app: { locale: 'en-US' } },
    });
    mgr.updatePreferences({ theme: { mode: 'dark' } });
    await flushSave();

    mgr.resetPreferences();
    expect(mgr.getPreferences().theme.mode).toBe(defaultPreferences.theme.mode);
    expect(mgr.getPreferences().app.locale).toBe('en-US'); // initialPreferences 含 overrides

    // reset 末尾的 updatePreferences 会再触发防抖保存 → 最终缓存=重置后的值
    await flushSave();
    const sm = new StorageManager({ prefix: 'ns-reset' });
    expect(sm.getItem<any>('preferences')?.theme.mode).toBe(defaultPreferences.theme.mode);
  });

  it('clearCache 移除全部偏好缓存（此后防抖重写前读取为空）', async () => {
    const mgr = makeManager();
    await mgr.initPreferences({ namespace: 'ns-clear', overrides: {} });
    mgr.updatePreferences({ theme: { mode: 'dark' } });
    await flushSave();

    mgr.clearCache();
    const sm = new StorageManager({ prefix: 'ns-clear' });
    expect(sm.getItem('preferences')).toBeNull();
    expect(sm.getItem('preferences-theme')).toBeNull();
  });
});

describe('包级单例 preferences', () => {
  it('可读默认偏好且定义完整', () => {
    expect(preferences.app.accessMode).toBeDefined();
    expect(preferences.theme.mode).toBeDefined();
  });
});
