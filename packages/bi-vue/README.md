# @go-wind-ui/bi-vue

Vue 3 BI 仪表盘：`<BiDashboard>` 只读渲染器 + `<BiDesigner>` 画布设计器，构建在 `@go-wind-ui/bi-core` 的 schema 与状态机之上。设计文档：`docs/bi-designer.md`。

## 快速开始

```bash
pnpm add @go-wind-ui/bi-vue
```

```ts
// main.ts：vxe/EP 按你的应用惯例；BI 卡片颜色走 EP 变量 + 裸应用回退
import "@go-wind-ui/bi-vue/style.css";
```

### 渲染器（只读）

```vue
<script setup lang="ts">
import { BiDashboard, provideBiEnv } from "@go-wind-ui/bi-vue";
import type { BiDashboardSchema } from "@go-wind-ui/bi-core";

const schema: Partial<BiDashboardSchema> = { /* datasets + charts，见 bi-core README */ };

// api 型数据集的取数注入（零后端耦合：请求包裹/鉴权都是你的事）
provideBiEnv({
  resolvers: {
    ds_api: async (dataset, params) => (await fetchList(params)).items,
  },
});
</script>

<template>
  <BiDashboard :schema="schema" @chart-click="onChartClick" />
</template>
```

### 设计器（MVP）

```vue
<BiDesigner :initial-schema="saved" @change="onSave" />
```

内置：数据集面板（static JSON / api 声明）、指针拖拽移动 + 右下角缩放（栅格吸附）、属性面板（标题/图型/数据集/视觉映射/位置尺寸）、撤销重做、整理布局、schema 导入导出、预览态。`demo` 属性给 true 时自带演示 schema。

## 主题

暗色判定缺省自动跟随 `html.dark` + 系统偏好（与 editor 系同机制）；宿主可经 `provideBiEnv({ themeMode: () => mode })` 接入自己的偏好系统。图表主题在编译期注入 option，卡片外观走 `--bi-card-*` / EP 变量回退链。
