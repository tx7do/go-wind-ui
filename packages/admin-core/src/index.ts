/**
 * @go-wind/admin-core — 管理端框架无关机制包（TS）
 *
 * 自 go-wind-admin 的 vue-element 端 src/core 抽取（transport/storage 为三端同源镜像的真相版，
 * vben-local 变体经语义审计后收敛于此）。框架无关：不依赖任何 UI 库与 Vue——
 * React 宿主未来亦可以此为 transport 统一真源。
 *
 * 环境约定：包内零 import.meta.env 直读（lib 构建会静态替换）——
 * crypto 密钥等宿主环境值一律运行时传参。
 */

// 传输层：REST（RequestClient 回调注入/token 轮换 401 队列/验证码 header/分页工具）+ SSE
export * from './transport/rest';
export * from './transport/sse';

// 本地存储抽象（StorageManager，namespace 前缀）
export * from './storage';

// 框架无关工具（tree/merge/color/date/crypto 参数化/download/state-handler 等）
export * from './utils';
