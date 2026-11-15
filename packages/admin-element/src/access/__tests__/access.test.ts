import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { isFieldHidden, parseResourceHiddenFields } from '../field-permission';
import { useAccess } from '../use-access';
import { useAccessStore, useAppUserStore } from '../../stores';

describe('parseResourceHiddenFields', () => {
  it('按资源前缀过滤并收集字段名', () => {
    const hidden = parseResourceHiddenFields(
      ['User.email', 'User.phone', 'Order.amount', 'UserX.meta'],
      'User',
    );
    expect(hidden).toEqual(new Set(['email', 'phone']));
  });

  it('无点号/以点开头/空字段的条目安全跳过', () => {
    expect(parseResourceHiddenFields(['nodot', '.field', 'User.', 'User.ok'], 'User'))
      .toEqual(new Set(['ok']));
  });

  it('null/undefined 输入返回空集合', () => {
    expect(parseResourceHiddenFields(null, 'User').size).toBe(0);
    expect(parseResourceHiddenFields(undefined, 'User').size).toBe(0);
  });
});

describe('isFieldHidden', () => {
  it('命中与未命中', () => {
    const entries = ['User.email'];
    expect(isFieldHidden(entries, 'User', 'email')).toBe(true);
    expect(isFieldHidden(entries, 'User', 'phone')).toBe(false);
    expect(isFieldHidden(entries, 'Order', 'email')).toBe(false);
  });
});

describe('useAppUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const basicUser = {
    id: '1', username: 'a', nickname: 'n', avatar: '', realname: 'r', tenantId: '0',
  } as any;

  it('setUserInfo 同步填充 userRoles（取 info.roles）', () => {
    const userStore = useAppUserStore();
    userStore.setUserInfo({ ...basicUser, roles: ['tenant_admin', 'editor'] });
    expect(userStore.userRoles).toEqual(['tenant_admin', 'editor']);
    userStore.setUserInfo(basicUser);
    expect(userStore.userRoles).toEqual([]);
    userStore.setUserInfo(null);
    expect(userStore.isLoggedIn).toBe(false);
  });

  it('isTenantUser：tenantId 仅非空非 "0" 视为租户用户', () => {
    const userStore = useAppUserStore();
    userStore.setUserInfo({ ...basicUser, tenantId: '123' });
    expect(userStore.isTenantUser()).toBe(true);
    userStore.setUserInfo({ ...basicUser, tenantId: '0' });
    expect(userStore.isTenantUser()).toBe(false);
    userStore.setUserInfo({ ...basicUser, tenantId: '' });
    expect(userStore.isTenantUser()).toBe(false);
    userStore.setUserInfo(null);
    expect(userStore.isTenantUser()).toBe(false);
  });

  it('自定义 $reset 清空 userInfo/userRoles（resetAllStores 依赖它）', () => {
    const userStore = useAppUserStore();
    userStore.setUserInfo({ ...basicUser, roles: ['r1'] });
    expect(typeof userStore.$reset).toBe('function');
    userStore.$reset();
    expect(userStore.userInfo).toBeNull();
    expect(userStore.userRoles).toEqual([]);
  });
});

describe('useAccess 权限判定（读 store，锚定匹配方向）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('hasAccessByRoles：角色码精确交集，任一命中即 true', () => {
    const userStore = useAppUserStore();
    userStore.setUserRoles(['tenant_admin', 'editor']);
    const { hasAccessByRoles } = useAccess();
    expect(hasAccessByRoles(['tenant_admin'])).toBe(true);
    expect(hasAccessByRoles(['editor', 'viewer'])).toBe(true);
    expect(hasAccessByRoles(['super_admin'])).toBe(false);
    expect(hasAccessByRoles([])).toBe(false);
  });

  it('hasAccessByCodes：精确匹配；前缀匹配方向=所需码以用户码+":"开头', () => {
    const accessStore = useAccessStore();
    accessStore.setAccessCodes(['sys:manage_tenants', 'user:list']);
    const { hasAccessByCodes } = useAccess();
    // 精确
    expect(hasAccessByCodes(['user:list'])).toBe(true);
    // 前缀：所需码是用户码的子码
    expect(hasAccessByCodes(['sys:manage_tenants:add'])).toBe(true);
    // 反方向不成立：用户码 user:list 不作为"父码"参与更长码匹配
    expect(hasAccessByCodes(['user'])).toBe(false);
    expect(hasAccessByCodes(['nons:xxx'])).toBe(false);
    expect(hasAccessByCodes([])).toBe(false);
  });

  it('hasAccess：角色或权限任一命中即 true（并集语义）', () => {
    const accessStore = useAccessStore();
    accessStore.setAccessCodes(['user:list']);
    const { hasAccess } = useAccess();
    expect(hasAccess(['user:list'])).toBe(true);
    expect(hasAccess(['nons:xxx'])).toBe(false);
  });
});
