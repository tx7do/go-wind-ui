import { QueryClient } from "@tanstack/vue-query";

/**
 * vue-query 全局单例（自宿主 src/plugins/vue-query.ts 迁入）。
 * 管理后台不缓存查询响应：staleTime/gcTime 均为 0，每次挂载重新请求。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
