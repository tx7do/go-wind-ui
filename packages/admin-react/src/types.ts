/**
 * 包内基础类型（自 go-wind-admin 的 src/types/global.d.ts 迁入）。
 *
 * 宿主应用保留自己的全局 `UserInfo`/`BasicUserInfo` 声明即可——它们与本包的
 * AdminUserInfo 结构兼容（宿主接口字段为必填，赋给本包可选字段类型天然可赋值），
 * 无需 declaration merging。
 */

/** 用户信息基础形状（与宿主 BasicUserInfo 对齐） */
export interface AdminUserBasic {
  [key: string]: any;

  /** 头像 */
  avatar: string;
  /** 用户id（后端 uint64，proto3 JSON 下为字符串） */
  id: string;
  /** 用户昵称 */
  nickname: string;
  /** 用户实名 */
  realname: string;
  /** 用户角色 */
  roles?: string[];
  /** 租户id（后端 uint64，proto3 JSON 下为字符串） */
  tenantId: string;
  /** 用户名 */
  username: string;
}

/** 包内认证/用户 store 消费的用户信息形状 */
export interface AdminUserInfo extends AdminUserBasic {
  /** 用户描述 */
  description?: string;
  /** 首页地址 */
  homePath?: string;
  /** accessToken */
  token?: string;
}

/**
 * React Router 路由 handle 元数据类型。
 * 用于 useMatches() 获取路由附加信息（自宿主全局声明迁入）。
 */
export interface RouteHandle {
  title?: string;
  icon?: string;
  authority?: string[];
  [key: string]: any;
}
