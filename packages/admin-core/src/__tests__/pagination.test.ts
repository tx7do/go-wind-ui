import { describe, expect, it } from 'vitest';
import { PaginationQuery } from '../transport/rest/pagination';
import { getDefaultErrorMsg, makeUpdateMask } from '../transport/rest/utils';

describe('PaginationQuery.queryString（搜索条件转 go-crud query）', () => {
  it('字符串值统一转 __contains 模糊匹配', () => {
    const q = new PaginationQuery({ formValues: { name: 'abc' } });
    expect(q.queryString).toBe(JSON.stringify({ name__contains: 'abc' }));
  });

  it('非字符串值保持 EQ 精确语义', () => {
    const q = new PaginationQuery({ formValues: { age: 5, enabled: true } });
    expect(q.queryString).toBe(JSON.stringify({ age: 5, enabled: true }));
  });

  it('ID 类字段即使为字符串也保持 EQ（不追加 __contains）', () => {
    const q = new PaginationQuery({ formValues: { userId: '3', tenant_id: '7', id: '1' } });
    expect(q.queryString).toBe(JSON.stringify({ userId: '3', tenant_id: '7', id: '1' }));
  });

  it('已带操作符后缀的 key 原样保留（不叠加 __contains）', () => {
    const q = new PaginationQuery({ formValues: { created_at__gte: '2026-01-01', type__not: 'x' } });
    expect(q.queryString).toBe(JSON.stringify({ created_at__gte: '2026-01-01', type__not: 'x' }));
  });

  it('租户清理：isTenantUser 时剔除 tenant_id/tenantId', () => {
    const q = new PaginationQuery({ formValues: { name: 'a', tenantId: '5' }, isTenantUser: true });
    expect(q.queryString).toBe(JSON.stringify({ name__contains: 'a' }));
  });

  it('空值剔除；全空返回 undefined', () => {
    expect(new PaginationQuery({ formValues: { a: null, b: undefined, c: '' } }).queryString).toBeUndefined();
    expect(new PaginationQuery({}).queryString).toBeUndefined();
  });

  it('orderBy 缺省回退 -created_at；noPaging 无分页参数为 true', () => {
    expect(new PaginationQuery({}).orderByString).toBe(JSON.stringify(['-created_at']));
    expect(new PaginationQuery({}).noPaging).toBe(true);
    expect(new PaginationQuery({ paging: { page: 1, pageSize: 20 } }).noPaging).toBe(false);
  });
});

describe('transport/rest/utils', () => {
  it('makeUpdateMask 末尾追加 id', () => {
    expect(makeUpdateMask(['name'])).toBe('name,id');
    expect(makeUpdateMask([])).toBe('id');
  });

  it('getDefaultErrorMsg：网络错误/超时/reason 透传/兜底', () => {
    expect(getDefaultErrorMsg(new Error('Network Error'))).toBe('Network Error');
    const timeoutErr = Object.assign(new Error('timeout of 10000ms exceeded'), {});
    expect(getDefaultErrorMsg(timeoutErr)).toBe('Request Timeout');
    expect(getDefaultErrorMsg({ response: { data: { reason: 'TENANT_FORBIDDEN' } } })).toBe('TENANT_FORBIDDEN');
    expect(getDefaultErrorMsg(null)).toBe('Unknown Error');
  });
});
