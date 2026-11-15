import { describe, expect, it } from 'vitest';
import i18n from 'i18next';
import { CORE_NAMESPACES, coreResources } from '../locales';
import { initI18n } from '../i18n';

describe('initI18n（宿主合并资源注入）', () => {
  it('用包内置框架命名空间完成初始化，返回 i18n 实例', async () => {
    const instance = await initI18n('zh-CN', {
      resources: {
        'zh-CN': { ...coreResources['zh-CN'] },
        'en-US': { ...coreResources['en-US'] },
      },
      namespaces: CORE_NAMESPACES,
      missingKeyWarn: false,
    });
    expect(instance).toBe(i18n);
    expect(i18n.language).toBe('zh-CN');
    expect(CORE_NAMESPACES).toContain('common');
    expect(CORE_NAMESPACES).toContain('auth');
    expect(CORE_NAMESPACES).toContain('preferences');
  });

  it('宿主命名空间可被解析（合并后注册进引擎）', async () => {
    await initI18n('zh-CN', {
      resources: {
        'zh-CN': { ...coreResources['zh-CN'], biz: { hello: '世界' } },
        'en-US': { ...coreResources['en-US'], biz: { hello: 'world' } },
      },
      namespaces: [...CORE_NAMESPACES, 'biz'],
    });
    expect(i18n.t('biz:hello', { ns: 'biz' })).toBe('世界');
    await i18n.changeLanguage('en-US');
    expect(i18n.t('biz:hello', { ns: 'biz' })).toBe('world');
    await i18n.changeLanguage('zh-CN');
  });

  it('changeLanguage 切换语言', async () => {
    await initI18n('zh-CN', {
      resources: { 'zh-CN': { ...coreResources['zh-CN'] }, 'en-US': { ...coreResources['en-US'] } },
      namespaces: CORE_NAMESPACES,
    });
    await i18n.changeLanguage('en-US');
    expect(i18n.language).toBe('en-US');
    await i18n.changeLanguage('zh-CN');
    expect(i18n.language).toBe('zh-CN');
  });
});
