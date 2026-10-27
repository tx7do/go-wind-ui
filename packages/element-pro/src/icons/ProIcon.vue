<template>
  <!-- 组件形态：直接渲染 -->
  <component :is="icon" v-if="isComponent" />
  <!-- 内联 SVG：库自带图形，currentColor/1em 继承 -->
  <!-- eslint-disable-next-line vue/no-v-html -- 静态注册表内的字面 SVG，非用户输入 -->
  <span
    v-else-if="svgContent"
    class="pro-icon__svg"
    :style="svgStyle"
    v-html="svgContent"
  />
  <!-- Iconify 名称：lucide:xxx / ep:xxx 等 -->
  <Icon v-else-if="resolvedIconify" :icon="resolvedIconify" :width="size || undefined" :height="size || undefined" />
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { Component } from "vue";
import { Icon } from "@iconify/vue";
import { INTERNAL_SVGS } from "./svgs";

defineOptions({ name: "ProIcon", inheritAttrs: false });

const props = defineProps<{
  /** Iconify 名称（lucide:edit）、内联注册表名（fullscreen / svg:fullscreen）或组件 */
  icon?: string | Component;
  /** 像素尺寸；不传时 1em 继承字体大小 */
  size?: number | string;
}>();

const attrs = useAttrs();

const isComponent = computed(() => typeof props.icon !== "string" && !!props.icon);

const resolvedIconify = computed(() => {
  const icon = props.icon;
  if (typeof icon !== "string" || !icon) return "";
  // 旧格式兼容：el-icon-Setting → ep:setting
  if (icon.startsWith("el-icon-")) {
    const name = icon.replace("el-icon-", "");
    return `ep:${name.charAt(0).toLowerCase() + name.slice(1)}`;
  }
  if (icon.includes(":")) return icon;
  return "";
});

const internalName = computed(() => {
  const icon = props.icon;
  if (typeof icon !== "string" || !icon) return "";
  if (icon.startsWith("svg:")) return icon.slice(4);
  if (!icon.includes(":") && !icon.startsWith("el-icon-")) return icon;
  return "";
});

const svgContent = computed(() => {
  const raw = INTERNAL_SVGS[internalName.value];
  if (!raw) return "";
  return raw.replace(/<svg\b/, '<svg width="1em" height="1em"');
});

const svgStyle = computed(() => {
  const base: Record<string, string> = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
  };
  if (props.size) {
    base.width = `${props.size}px`;
    base.height = `${props.size}px`;
    base.fontSize = `${props.size}px`;
  }
  void attrs;
  return base;
});
</script>

<style scoped>
.pro-icon__svg > svg {
  display: block;
}
</style>
