import {QueryClient, defaultShouldDehydrateQuery} from '@tanstack/react-query'

/**
 * 默认重试策略：生产姿态——仅网络错误重试 1 次。
 * 宿主开发环境可用 configureQueryClient({ isDev: true }) 切换为"任何错误重试 3 次"。
 * （包内不读 import.meta.env——lib 构建会把它静态替换成包构建时的值。）
 */
function defaultRetry(failureCount: number, error: Error) {
    return failureCount < 1 && Boolean(error.message?.includes('Network'));
}

// 单独导出，方便测试 & 维护
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 管理后台不缓存查询响应：每次组件挂载都向后端重新请求
            staleTime: 0,

            // 查询在无观察者（组件卸载）后立即回收，跨挂载不残留缓存
            gcTime: 0,

            // 窗口聚焦时自动重新验证
            refetchOnWindowFocus: false,

            // 重试策略：见 defaultRetry / configureQueryClient
            retry: defaultRetry,

            // 重试延迟：指数退避
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
            // 突变失败后自动失效相关查询，触发重新获取
            onError: (error) => {
                console.error('Mutation error:', error);
            },
        },
        dehydrate: {
            // SSR 时只反序列化成功的数据
            shouldDehydrateQuery: (query) =>
                defaultShouldDehydrateQuery(query) ||
                query.state.status === 'pending',
        },
    },
})

/**
 * 宿主在 bootstrap 阶段调整 query 行为。
 * @param options.isDev 开发环境姿态：任何查询错误重试 3 次（默认仅网络错误重试 1 次）
 */
export function configureQueryClient(options: { isDev?: boolean } = {}): void {
    const queries = queryClient.getDefaultOptions().queries;
    if (!queries) return;
    queries.retry = options.isDev
        ? (failureCount: number, _error: Error) => failureCount < 3
        : defaultRetry;
}
