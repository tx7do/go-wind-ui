import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureAdminRuntime } from '../env';
import { exportAuditLogs, type ExportAuditOptions } from '../utils/export-table';
import { serverExportFile } from '../transport/rest/server-export';
import { useAuthStore } from '../stores/auth';
import { PaginationQuery } from '../transport/rest/pagination';

/**
 * 导出链路：客户端聚合（CSV/XLSX）与服务端全量锚点。
 * 下载走 URL.createObjectURL + <a download> 同插同拔（append→click→remove），
 * jsdom 缺 createObjectURL 且锚点事后不在 DOM——用桩捕获 Blob 与锚点。
 */

let capturedBlobs: Blob[] = [];
let clickedAnchors: HTMLAnchorElement[] = [];

beforeEach(() => {
  capturedBlobs = [];
  clickedAnchors = [];
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn((blob: Blob) => {
      capturedBlobs.push(blob);
      return `blob:mock-${capturedBlobs.length}`;
    }),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clickedAnchors.push(this);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useAuthStore.getState().$reset();
  document.body.innerHTML = '';
});

describe('exportAuditLogs（客户端分页聚合导出）', () => {
  it('CSV：真实多页聚合（total 跨 PAGE_SIZE 边界），含 BOM/表头/数据行，返回行数', async () => {
    // PAGE_SIZE 固定 1000：total=2500 → 1000+1000+500 三页（真实分页形态）
    const page = (n: number, from: number) =>
      Array.from({ length: n }, (_, i) => ({ name: `行${from + i}` }));
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ items: page(1000, 0), total: 2500 })
      .mockResolvedValueOnce({ items: page(1000, 1000), total: 2500 })
      .mockResolvedValueOnce({ items: page(500, 2000), total: 2500 });
    const count = await exportAuditLogs(
      { fetcher, filename: 'logs.csv', columns: [{ key: 'name', title: '名称' }] },
      'csv',
    );

    expect(count).toBe(2500);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect((fetcher.mock.calls[1][0] as PaginationQuery).paging).toEqual({ page: 2, pageSize: 1000 });
    expect(clickedAnchors).toHaveLength(1);
    expect(clickedAnchors[0].download).toBe('logs.csv');
    const buf = new Uint8Array(await capturedBlobs[0].arrayBuffer());
    expect([buf[0], buf[1], buf[2]]).toEqual([239, 187, 191]); // UTF-8 BOM：Excel 中文不乱码
    // Blob.text() 走 TextDecoder 会剥掉首部 BOM，正文断言从首字开始
    const text = await capturedBlobs[0].text();
    expect(text.replace(/^\uFEFF/, '')).toContain('名称');
    expect(text).toContain('行0');
    expect(text).toContain('行2499');
  });

  it('CSV 单元格含逗号时按 RFC 4180 包引号', async () => {
    await exportAuditLogs(
      {
        fetcher: vi.fn().mockResolvedValue({ items: [{ name: 'a,b' }], total: 1 }),
        filename: 'x',
        columns: [{ key: 'name', title: '名,称' }],
      },
      'csv',
    );
    expect(capturedBlobs).toHaveLength(1);
    const text = await capturedBlobs[0].text();
    expect(text).toContain('"名,称"');
    expect(text).toContain('"a,b"');
  });

  it('ProTable 分页字段（current/pageSize）不进查询条件', async () => {
    const fetcher = vi.fn().mockResolvedValue({ items: [], total: 0 });
    await exportAuditLogs(
      { fetcher, filename: 'x', columns: [{ key: 'a', title: 'A' }], params: { current: 1, pageSize: 20, name: 'k' } },
      'csv',
    );
    const query = fetcher.mock.calls[0][0] as PaginationQuery;
    expect(query.queryString).toBe(JSON.stringify({ name__contains: 'k' }));
  });

  it('maxRows 截断聚合行数', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      items: Array.from({ length: 5 }, (_, i) => ({ name: `n${i}` })),
      total: 5,
    });
    const count = await exportAuditLogs(
      { fetcher, filename: 'x', columns: [{ key: 'name', title: 'N' }], maxRows: 3 },
      'csv',
    );
    expect(count).toBe(3);
  });
});

describe('serverExportFile（服务端全量锚点）', () => {
  it('拼 apiBase + :export 锚点 + format/query 参数，带 Bearer 头', async () => {
    configureAdminRuntime({ apiBaseUrl: 'https://api.example.com' });
    useAuthStore.setState({ accessToken: 'tok-1' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x']),
      headers: { get: () => 'filename="out.xlsx"' },
    });
    vi.stubGlobal('fetch', fetchMock);

    await serverExportFile('admin/v1/ai/usage-logs:export', new PaginationQuery({ formValues: { name: 'k' } }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.com/admin/v1/ai/usage-logs:export?format=xlsx&query=' + encodeURIComponent(JSON.stringify({ name__contains: 'k' })));
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok-1');
    configureAdminRuntime({ apiBaseUrl: '' });
  });

  it('非 2xx 抛错（带状态码，不吞错）', async () => {
    configureAdminRuntime({ apiBaseUrl: '' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(
      serverExportFile('admin/v1/x:export', new PaginationQuery()),
    ).rejects.toThrow('export failed (403)');
  });
});
