/**
 * 表格通用默认配置（自 go-wind-admin 的 config/constants.TABLE 迁入——
 * ListTable 的默认分页/高度/滚动参数，宿主可在组件 props 层覆盖具体值）。
 */
export const TABLE = {
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 20,
  /** 每页条数选项 */
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  /** 最大每页条数 */
  MAX_PAGE_SIZE: 100,
  /** 表格组件内部高度 */
  COMPONENT_HEIGHTS: {
    /** 工具栏高度 */
    TOOLBAR: 50,
    /** 分页器高度 */
    PAGINATION: 50,
    /** 表头高度 */
    HEADER: 50,
    /** 搜索表单高度（展开时） */
    SEARCH_FORM: 80,
  },
  /** 表格滚动配置 */
  SCROLL_CONFIG: {
    /** 默认最小高度 */
    MIN_HEIGHT: 300,
    /** 额外边距 */
    OFFSET: 16,
  },
} as const;
