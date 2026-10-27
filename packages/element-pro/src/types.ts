/**
 * 跨组件共享的通用类型。
 *
 * 本库不绑定任何请求客户端：列表/删除/提交都是应用注入的 action 函数，
 * 后端约定（分页参数名、响应包裹等）由 action 自己适配。
 */

/** 分页列表结果的标准形状（也直接兼容返回裸数组） */
export interface ProListResult<T = any> {
  items?: T[];
  total?: number;
}

/** 「导出全部」聚合拉取的查询形状：分页字段 + 当前搜索条件 */
export interface ProExportQuery {
  page: number;
  pageSize: number;
  formValues?: Record<string, any>;
}
