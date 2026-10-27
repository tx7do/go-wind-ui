<template>
  <slot />
</template>

<script setup lang="ts">
import { toRaw } from "vue";
import { provideProConfig } from "./context";
import type { ProConfig } from "./context";
import { setProLocale, setProMessages } from "../locale";
import { watchEffect } from "vue";

const props = defineProps<{ config: ProConfig }>();

// locale/messages 同时落到全局状态：Provider 树外的命令式 API（$t）也跟随
watchEffect(() => {
  if (props.config.locale) setProLocale(props.config.locale);
  if (props.config.messages) setProMessages(toRaw(props.config.messages));
});

provideProConfig(props.config);
</script>
