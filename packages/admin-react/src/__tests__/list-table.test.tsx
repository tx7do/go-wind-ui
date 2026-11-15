import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListTable } from '../components/ListTable';
import { TABLE } from '../constants';

/**
 * ListTable 冒烟：静态 dataSource 渲染表头与数据行（不触网络）。
 * ProTable 需要显式关掉搜索/选项工具栏以保持最小渲染面。
 */
describe('ListTable', () => {
  it('TABLE 默认配置随包提供', () => {
    expect(TABLE.DEFAULT_PAGE_SIZE).toBe(20);
    expect(TABLE.PAGE_SIZE_OPTIONS).toContain('20');
  });

  it('渲染列头与数据行', () => {
    render(
      <ListTable
        columns={[{ title: '名称', dataIndex: 'name' }]}
        dataSource={[{ name: '风行' }]}
        rowKey="name"
        search={false}
        options={false}
      />,
    );
    // ProTable 会把列头渲染多处（列设置等副本），用 getAllByText 断言存在即可
    expect(screen.getAllByText('名称').length).toBeGreaterThan(0);
    expect(screen.getByText('风行')).toBeTruthy();
  });
});
