/**
 * ElementAuthGateway：认证数据面与机制面的唯一边界（与 @go-wind/admin-react 同模式）。
 *
 * 本包提供认证"机制"（token 内存态、刷新调度、MFA 挑战态、SSE 重连、登出清理、
 * 路由跳转编排），实际的后端调用与口令加密由宿主启动时注入——宿主可自由再生成
 * 自己的 API 客户端（buf 产物）而不与包版本漂移。
 */

/** 登录/刷新/MFA 验证的统一结果（最小结构，字段名与后端 proto3 JSON 对齐） */
export interface ElementTokenResult {
  access_token?: string;
  /** 有效期（秒）；proto3 JSON 下 int64 可能是字符串 */
  expires_in?: number | string;
  /** MFA 挑战 operation_id；非空表示密码校验通过、需二次验证 */
  mfa_operation_id?: string;
  [key: string]: unknown;
}

/** 用户信息基础形状（原宿主全局 ElementUserBasic，包化后迁入） */
export interface ElementUserBasic {
  [key: string]: any;
  avatar: string;
  /** 用户id（后端 uint64，proto3 JSON 下为字符串） */
  id: string;
  nickname: string;
  realname?: string;
  roles?: string[];
  /** 租户id（后端 uint64，proto3 JSON 下为字符串） */
  tenantId: string;
  username: string;
}

/** 用户信息完整形状（与后端 identityservicev1_User 兼容；use-auth 编排消费） */
export interface ElementUserInfo extends ElementUserBasic {
  description?: string;
  homePath?: string;
}

export interface ElementAuthGateway {
  /** 登录。password 必须已经 encryptPassword 加密为信封密文。 */
  login(params: {
    username?: string;
    password?: string;
    tenant_code?: string;
    grant_type?: string;
    [key: string]: unknown;
  }): Promise<ElementTokenResult>;
  /** 完成 MFA 挑战（TOTP）。 */
  verifyMfa(params: { operationId: string; totpCode: string }): Promise<ElementTokenResult>;
  /** 完成 OIDC SSO 登录：code+state 换令牌。 */
  ssoLogin(params: { code: string; state: string }): Promise<ElementTokenResult>;
  /** 服务端登出。失败由实现方留痕，机制层继续本地清理。 */
  logout(): Promise<unknown>;
  /** 刷新 access token（refresh token 走 HttpOnly Cookie）。 */
  refresh(): Promise<ElementTokenResult>;
  /** 拉取当前登录用户信息。 */
  fetchUserInfo(): Promise<ElementUserInfo | null>;
  /** 拉取权限码与字段权限隐藏字段集。 */
  fetchAccessCodes(): Promise<{ codes?: string[]; hiddenFields?: string[] }>;
  /** 拉取图形验证码（登录页用）。 */
  generateCaptcha(): Promise<{ captchaId?: string; imageBase64?: string; [key: string]: unknown }>;
  /** 口令加密（密钥属宿主 env，由实现方持有）。 */
  encryptPassword(plain: string): Promise<string>;
}

let gateway: ElementAuthGateway | null = null;

/** 宿主启动时（bootstrap）注入认证数据面实现。重复注入覆盖旧的。 */
export function setAuthGateway(g: ElementAuthGateway): void {
  gateway = g;
}

/** 获取已注入的 gateway；未注入即抛错（fail-fast，不吞错）。 */
export function getAuthGateway(): ElementAuthGateway {
  if (!gateway) {
    throw new Error(
      "[admin-element] AuthGateway 尚未注入：请在应用 bootstrap 阶段调用 setAuthGateway({...})",
    );
  }
  return gateway;
}

// ==============================
// 应用 router 注入
// ==============================

/**
 * 宿主 router 的最小结构面（放宽类型：宿主可能用 vue-router 4/5，RouterClassic 等
 * 类型名跨版本不兼容；包只消费 push/replace/currentRoute 三个稳定成员）。
 */
interface AppRouterLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentRoute: { value: any };
  push(to: any): Promise<unknown>;
  replace(to: any): Promise<unknown>;
}

let appRouter: AppRouterLike | null = null;

/**
 * 注入宿主 vue-router 实例：登录成功跳转/MFA 挑战页/登出回登录页的编排需要它。
 * 包不创建 router（路由表属宿主），只持有宿主创建的实例。
 */
export function setAppRouter(router: AppRouterLike): void {
  appRouter = router;
}

export function getAppRouter(): AppRouterLike {
  if (!appRouter) {
    throw new Error("[admin-element] AppRouter 尚未注入：请在创建 router 后调用 setAppRouter(router)");
  }
  return appRouter;
}
