import { describe, expect, it } from 'vitest';

import { loadLocalesMap, loadLocalesMapFromDir } from '../utils';

describe('loadLocalesMap', () => {
  it('按文件名提取 key（扁平模块：文件名即命名空间，不含语言段）', () => {
    const fn = async () => ({}) as any;
    const map = loadLocalesMap({
      'zh-CN/core.json': fn,
      'en-US/pages.json': async () => ({}) as any,
    });
    expect(Object.keys(map).sort()).toEqual(['core', 'pages']);
    expect(map['core']).toBe(fn);
  });

  it('不匹配 json 后缀的路径被跳过', () => {
    const map = loadLocalesMap({ 'zh-CN/core.ts': async () => ({}) as any });
    expect(map).toEqual({});
  });
});

describe('loadLocalesMapFromDir', () => {
  const regexp = /([^/]+)\/([^/]+)\.json$/;

  it('按正则拆语言与文件名，语言聚合为单次加载函数', async () => {
    const core = async () => ({ default: { hello: 'hi' } });
    const pages = async () => ({ default: { table: 'grid' } });
    const map = loadLocalesMapFromDir(regexp, {
      'zh-CN/core.json': core,
      'zh-CN/pages.json': pages,
    });
    expect(Object.keys(map)).toEqual(['zh-CN']);
    const loaded = await map['zh-CN']();
    expect(loaded.default).toEqual({ core: { hello: 'hi' }, pages: { table: 'grid' } });
  });

  it('多语言各自成键', async () => {
    const map = loadLocalesMapFromDir(regexp, {
      'zh-CN/core.json': async () => ({ default: { a: 1 } }),
      'en-US/core.json': async () => ({ default: { a: 2 } }),
    });
    expect(Object.keys(map).sort()).toEqual(['en-US', 'zh-CN']);
    expect((await map['en-US']()).default).toEqual({ core: { a: 2 } });
  });

  it('文件名里的 / 转为嵌套命名空间（pages/dashboard → pages.dashboard）', async () => {
    const map = loadLocalesMapFromDir(/([^/]+)\/(.+)\.json$/, {
      'zh-CN/pages/dashboard.json': async () => ({ default: { title: 'T' } }),
    });
    const loaded = await map['zh-CN']();
    expect(loaded.default).toEqual({ pages: { dashboard: { title: 'T' } } });
  });

  it('不匹配正则的路径被跳过', () => {
    const map = loadLocalesMapFromDir(regexp, { 'rootless.json': async () => ({}) as any });
    expect(map).toEqual({});
  });
});
