# @go-wind/admin-react

React 19 管理端壳层**机制**包，自 [go-wind-admin](https://github.com/tx7do/go-wind-admin) 的 `src/core` 及关联基础设施抽取。

**边界约定：机制进包，数据留宿主。**

| 进包（机制） | 留宿主（数据/视图） |
|---|---|
| axios transport（token 轮换、验证码 header、分页工具）+ SSE 客户端 | generated API 客户端（`make ts` 产物）与 api hooks |
| auth store（内存态 token、MFA 挑战、登出清理），数据面经 `AuthGateway` 注入 | 登录/刷新/登出等后端端点实现（宿主用自己再生成的 mutation 组装 gateway） |
| 路由工厂（frontend/backend 双权限模式）与菜单生成器 | `import.meta.glob` 扫出的 pageMap、路由表、权限码 |
| i18n 引擎（资源经 `initI18n` 注入，内置 common/auth/editor/preferences 框架命名空间） | 业务文案命名空间、`routes` 命名空间（业务路由标题） |
| 主题/偏好（ThemeProvider、PreferencesPanel、偏好 store） | 设计 token 覆盖、布局壳、登录页、业务页面 |
| 权限检查（useAccess / AccessControl / 字段级权限）、query client、通用 hooks/utils | —— |

## Install

```bash
pnpm add @go-wind/admin-react
```

**单例关键库全部走 peerDependencies**（react / react-dom / antd / @ant-design/icons / @ant-design/pro-components / react-router-dom / react-i18next / i18next / @tanstack/react-query / zustand）——宿主必须提供同一实例，禁止包内自带副本（i18n 上下文、QueryClientProvider、zustand store 都要求单例）。

## Quick start（宿主 bootstrap 接线示例）

```ts
import {
  setAuthGateway, configureAdminRuntime, configureQueryClient,
  initI18n, coreResources, connectSSEServer,
  createAccessibleRouter, loginMutation, /* 宿主自己的 generated mutations */
} from '@go-wind/admin-react';
import { apiClient, fetchUserProfile } from '@/api'; // 宿主 generated 层

// 1. 认证数据面注入（密钥属宿主 env，包内零 import.meta.env 直读）
setAuthGateway({
  login: (p) => loginMutation.execute(p),
  verifyMfa: (p) => verifyMfaMutation.execute(p),
  ssoLogin: (p) => apiClient.authenticationService.SsoLogin(p),
  logout: () => logoutMutation.execute({}),
  refresh: () => refreshTokenMutation.execute(undefined),
  fetchProfile: async () => (await fetchUserProfile()) as AdminUserInfo,
  encryptPassword: (plain) => encryptPasswordEnvelope(plain, import.meta.env.VITE_PASSWORD_RSA_PUB),
});

// 2. 运行时开关（lib 构建会把 import.meta.env 静态替换成包构建时的值，故走运行时注入）
configureAdminRuntime({ isDev: import.meta.env.DEV });
configureQueryClient({ isDev: import.meta.env.DEV });

// 3. i18n：包框架命名空间 + 宿主业务命名空间合并（同名宿主覆盖）
const resources = { 'zh-CN': { ...coreResources['zh-CN'], ...appZhCN }, 'en-US': { ...coreResources['en-US'], ...appEnUS } };
await initI18n(initialLang, { resources, namespaces: Object.keys(resources['zh-CN']), missingKeyWarn: import.meta.env.DEV });

// 4. SSE 地址由宿主解析后传入（后续刷新重连复用）
connectSSEServer(import.meta.env.VITE_SSE_URL ?? '/api/sse');

// 5. 路由工厂（pageMap 由宿主 glob 注入）
const { router } = await createAccessibleRouter(accessMode, {
  routes, layoutMap, pageMap, fetchMenuListAsync,
  defaultHomePath: ROUTES.DEFAULT_HOME,
});
```

样式（PreferencesPanel 的 less 产物）：

```ts
import '@go-wind/admin-react/style.css';
```

## Host integration notes (Vite)

无 Monaco worker / CJS 兼容坑，无需 `optimizeDeps.exclude`，正常消费即可（同 `@go-wind/bi-*`）。链接本地开发用 `pnpm add @go-wind/admin-react@link:../相对路径`（先 `pnpm build` 出 dist）。

## 内部结构

`access/`（权限）· `auth-gateway.ts`（认证数据面边界）· `env.ts`（运行时 dev 标志）· `i18n/`（引擎+hooks+LocaleSwitcher）· `locales/`（框架文案）· `preferences/`（主题偏好）· `query-client.ts` · `router/`（工厂/生成器）· `storage/` · `stores/`（auth/user）· `transport/`（rest+sse）· `hooks/`（useTokenRefresh 等）· `utils/` · `components/Loading`（`ThemeLoading`）
