/**
 * @go-wind/admin-react — 管理端壳层"机制"包（React 19）
 *
 * 自 go-wind-admin 的 src/core 及关联基础设施抽取。边界约定：
 * - 机制进包：transport（token 轮换/验证码 header/SSE）、auth store（经 AuthGateway 注入数据面）、
 *   路由工厂（frontend/backend 双模式，pageMap 由宿主 import.meta.glob 注入）、权限检查、
 *   i18n 引擎、主题/偏好、query client、通用 hooks 与 utils。
 * - 数据留宿主：generated API 客户端、api hooks、路由表、权限码、业务文案命名空间、
 *   登录页/布局/业务页面。
 * - 包内零 import.meta.env 直读（lib 构建会静态替换）：env 相关全部经
 *   configureAdminRuntime / configureQueryClient / initI18n / connectSSEServer 运行时注入。
 */

// 运行时配置（dev 标志）
export * from './env';

// 基础类型与认证数据面边界
export * from './types';
export * from './auth-gateway';

// 文案：包内置框架命名空间 + 语言机制
export * from './locales';

// React Query 单例与重试策略配置
export * from './query-client';

// 本地存储抽象
export * from './storage';

// 传输层：REST（token 轮换/验证码 header/分页工具）+ SSE
export * from './transport/rest';
export * from './transport/sse';

// i18n 引擎（initI18n 资源由宿主注入）与 hooks、LocaleSwitcher
export * from './i18n';
export * from './i18n/components';

// 主题/偏好：ThemeProvider、PreferencesPanel、偏好 store 与 hooks、主题过渡动效
export * from './preferences';
export * from './preferences/theme-transition';

// 权限：useAccess / AccessControl / 字段级权限
export * from './access';

// 路由工厂与生成器（frontend/backend 双模式）
export * from './router';

// 认证/用户 store（AuthGateway 驱动）
export * from './stores/auth';
export * from './stores/user';

// 认证周边 hooks：token 定时刷新 + SSE 重连
export * from './hooks/useTokenRefresh';

// 通用 hooks
export * from './hooks/useTitle';
export * from './hooks/useTime';
export * from './hooks/useProTableScrollY';
export * from './hooks/useClipboard';
export * from './hooks/useKeyStroke';
export * from './hooks/usePageFullscreen';
export * from './hooks/useEcharts';
export * from './hooks/useWatermark';

// 通用工具（tree 操作/merge/color/url/date/diff/nprogress）与表格默认配置
export * from './utils';
export * from './constants';

// 列表页基座组件（ProTable 封装：列宽拖拽/骨架屏/滚动撑满）及其骨架屏
export * from './components/ListTable';

// 列表导出：客户端聚合（CSV/XLSX）+ 服务端全量锚点 + 导出按钮
export * from './utils/export-table';
export * from './transport/rest/server-export';
export { default as TableExportButton } from './components/TableExportButton';

// 主题化全屏加载器（原 components/common/Loading 的 default 导出，收编为命名导出）
export { default as ThemeLoading } from './components/Loading';
