import { describe, expect, it } from 'vitest';
import { PaginationQuery } from '../transport/rest/pagination';
import { makeUpdateMask } from '../transport/rest/utils';

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
    const parsed = JSON.parse(q.queryString!);
    expect(parsed).toEqual({ userId: '3', tenant_id: '7', id: '1' });
  });

  it('已带操作符后缀的 key 原样保留（不叠加 __contains）', () => {
    const q = new PaginationQuery({ formValues: { created_at__gte: '2026-01-01', type__not: 'x' } });
    const parsed = JSON.parse(q.queryString!);
    expect(parsed).toEqual({ created_at__gte: '2026-01-01', type__not: 'x' });
  });

  it('租户清理：isTenantUser 时剔除 tenant_id/tenantId', () => {
    const q = new PaginationQuery({
      formValues: { name: 'a', tenantId: '5' },
      isTenantUser: true,
    });
    expect(q.queryString).toBe(JSON.stringify({ name__contains: 'a' }));
  });

  it('空值（null/undefined/空串）被剔除；全空则返回 undefined', () => {
    expect(new PaginationQuery({ formValues: { a: null, b: undefined, c: '' } }).queryString).toBeUndefined();
    expect(new PaginationQuery({ formValues: undefined }).queryString).toBeUndefined();
    const mixed = new PaginationQuery({ formValues: { a: null, name: 'k' } });
    expect(mixed.queryString).toBe(JSON.stringify({ name__contains: 'k' }));
  });
});

describe('PaginationQuery 其余参数', () => {
  it('fieldMask 数组转逗号分隔串，字符串仅去首尾空白（钉现有行为）', () => {
    expect(new PaginationQuery({ fieldMask: ['a', 'b'] }).toRawParams().fieldMask).toBe('a,b');
    expect(new PaginationQuery({ fieldMask: ' name , ' }).toRawParams().fieldMask).toBe('name ,');
    expect(new PaginationQuery({}).toRawParams().fieldMask).toBeUndefined();
  });

  it('orderBy 缺省回退 -created_at', () => {
    expect(new PaginationQuery({}).orderByString).toBe(JSON.stringify(['-created_at']));
    expect(new PaginationQuery({ orderBy: ['name'] }).orderByString).toBe(JSON.stringify(['name']));
  });

  it('noPaging：无分页参数时为 true', () => {
    expect(new PaginationQuery({}).noPaging).toBe(true);
    expect(new PaginationQuery({ paging: { page: 1, pageSize: 20 } }).noPaging).toBe(false);
  });

  it('toRawParams 汇总分页字段', () => {
    const raw = new PaginationQuery({ paging: { page: 2, pageSize: 20 }, fieldMask: ['a'] }).toRawParams();
    expect(raw.page).toBe(2);
    expect(raw.pageSize).toBe(20);
    expect(raw.noPaging).toBe(false);
    expect(raw.fieldMask).toBe('a');
  });
});

describe('makeUpdateMask（更新掩码自动补 id）', () => {
  it('keys 末尾追加 id 并以逗号连接', () => {
    expect(makeUpdateMask(['name', 'realname'])).toBe('name,realname,id');
    expect(makeUpdateMask([])).toBe('id');
  });
});
