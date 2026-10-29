---
"@go-wind/bi-vue": minor
"@go-wind/bi-react": minor
---

渲染器新增 `fit: "contain"` 大屏视图模式：按容器宽高双向取小值等比缩放并居中，内容整体撑满容器且不滚动（root 高度取 100%，由宿主给足高度）。`width`（只按容器宽缩放、高度随内容）与 `none`（1:1）语义不变；React 端 `useContainerWidth` 同时回报容器高度，签名扩展为 `[ref, width, height]`。
