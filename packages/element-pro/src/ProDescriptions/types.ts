import type { ProTableColumn } from "../ProTable/types";

/**
 * 详情描述字段配置：标签 + 取值 + 渲染方式。
 * cellType 渲染器复用 ProTable 的 cellRendererRegistry——
 * ProTable 里怎么渲染单元格，详情里就怎么渲染。
 */
export interface ProDescriptionField<T = any> {
  /** 标签文本 */
  label: string;
  /** 数据字段名 */
  prop?: keyof T & string;
  /** 栅格占位（ElDescriptionsItem span，默认 1） */
  span?: number;
  /** 复用 ProTable 的单元格渲染类型（tag/date/price/link/image/switch…） */
  cellType?: ProTableColumn["cellType"];
  /** 渲染参数：与 ProTableColumn 同名透传（labelMap/tagType/dateFormat/pricePrefix…） */
  labelMap?: ProTableColumn["labelMap"];
  tagType?: ProTableColumn["tagType"];
  tagTypeMap?: ProTableColumn["tagTypeMap"];
  dateFormat?: string;
  pricePrefix?: string;
  /** 自定义格式化（优先于 cellType） */
  formatter?: (row: T) => any;
  /** 自定义插槽名 */
  slotName?: string;
}

/** 分节：审计详情那种「基本信息 / 设备信息」divider 分块 */
export interface ProDescriptionSection<T = any> {
  /** 分节标题（渲染为分割线文案；缺省无分割线） */
  title?: string;
  fields: ProDescriptionField<T>[];
}

export interface ProDescriptionsProps<T = any> {
  /** 数据行 */
  data?: T | null;
  /** 扁平字段（与 sections 二选一） */
  fields?: ProDescriptionField<T>[];
  /** 分节字段（优先于 fields） */
  sections?: ProDescriptionSection<T>[];
  /** 每行列数（ElDescriptions column，默认 2） */
  column?: number;
  /** 边框（默认 true，对齐 admin 详情抽屉） */
  border?: boolean;
  /** 空值占位 */
  placeholder?: string;
}
