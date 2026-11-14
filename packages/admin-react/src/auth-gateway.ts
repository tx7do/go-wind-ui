import type { AdminUserInfo } from './types';

/**
 * AuthGateway：认证数据面与机制面的唯一边界。
 *
 * 本包只提供认证"机制"（token 内存态、刷新调度、MFA 挑战态、SSE 重连、登出清理），
 * 所有实际的后端调用（登录/登出/刷新/MFA 验证/SSO/拉取用户信息）与口令加密都由宿主
 * 应用启动时通过 setAuthGateway 注入。这样宿主可以自由再生成自己的 API 客户端
 * （如 go-wind-admin 的 `make ts` 产物）而不与包的发布版本漂移。
 */

/** 登录请求参数（最小结构；宿主可经 [key: string]: unknown 附加协议字段） */
export interface AdminLoginParams {
  username?: string;
  password?: string;
  [key: string]: unknown;
}

/** 登录/刷新/MFA 验证的统一结果（最小结构，字段名与后端 proto3 JSON 对齐） */
export interface AdminTokenResult {
  /** 访问令牌；为空且 mfa_operation_id 非空表示进入 MFA 挑战 */
  access_token?: string;
  /** 有效期（秒）；proto3 JSON 下 int64 可能是字符串，消费方需 Number() 转换 */
  expires_in?: number | string;
  /** MFA 挑战 operation_id；非空表示密码校验通过、需二次验证 */
  mfa_operation_id?: string;
  [key: string]: unknown;
}

export interface AuthGateway {
  /** 登录。password 必须已经 encryptPassword 加密为信封密文。 */
  login(params: AdminLoginParams): Promise<AdminTokenResult>;
  /** 完成 MFA 挑战（TOTP）。成功返回含真 token 的结果。 */
  verifyMfa(params: { operationId: string; totpCode: string }): Promise<AdminTokenResult>;
  /** 完成 OIDC SSO 登录：code+state 换令牌。 */
  ssoLogin(params: { code: string; state: string }): Promise<AdminTokenResult>;
  /** 服务端登出。失败由实现方决定是否吞错——机制层继续本地清理。 */
  logout(): Promise<unknown>;
  /** 刷新 access token（refresh token 走 HttpOnly Cookie，由实现方保证浏览器携带）。 */
  refresh(): Promise<AdminTokenResult>;
  /** 拉取当前登录用户信息（登录成功与 token 刷新后惰性补拉共用）。 */
  fetchProfile(): Promise<AdminUserInfo>;
  /**
   * 口令加密（AES 信封/混合信封，与后端 NeedDecrypt 同规）。
   * 密钥属宿主环境配置（如 VITE_AES_KEY / VITE_PASSWORD_RSA_PUB），由实现方持有。
   */
  encryptPassword(plain: string): Promise<string>;
}

let gateway: AuthGateway | null = null;

/** 宿主启动时（bootstrap）注入认证数据面实现。重复注入覆盖旧的。 */
export function setAuthGateway(g: AuthGateway): void {
  gateway = g;
}

/** 获取已注入的 gateway；未注入即抛错（fail-fast，不吞错）。 */
export function getAuthGateway(): AuthGateway {
  if (!gateway) {
    throw new Error(
      '[admin-react] AuthGateway 尚未注入：请在应用 bootstrap 阶段调用 setAuthGateway({...})',
    );
  }
  return gateway;
}
