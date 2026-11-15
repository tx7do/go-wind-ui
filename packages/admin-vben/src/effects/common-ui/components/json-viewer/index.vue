<script lang="ts" setup>
import type { Recordable } from '../../../../types';

import type {
  JsonViewerAction,
  JsonViewerProps,
  JsonViewerToggle,
  JsonViewerValue,
} from './types';

import type { SetupContext } from 'vue';
import { computed, useAttrs } from 'vue';
// @ts-ignore
import VueJsonViewer from 'vue-json-viewer';

import { $t } from '../../../../locales';
import { isBoolean } from '../../../../base/shared/utils';

/**
 * 大数安全解析：把 JSON 里 16 位以上的裸数字加引号后交给 JSON.parse
 * 后其 import 无法被预构建重写，浏览器直取 raw 会因缺 default 导出而崩。
 * 预处理只匹配「: 或 , 或 [ 之后紧跟的裸数字字面量」，不会误伤字符串内容
 * 中带引号的同名片段（那些片段前一个字符是引号，不满足负向断言会被跳过）。
 */
function parseWithBigintAsString(text: string): Record<string, any> {
  const safe = text.replace(/([{,]\s*)"?(true|false)"?/g, '$1$2').replace(
    /(:\s*|\[\s*)(-?\d{15,}(?:\.\d+)?)(\s*[,\]}])/g,
    '$1"$2"$3',
  );
  return JSON.parse(safe);
}

defineOptions({ name: 'JsonViewer' });

const props = withDefaults(defineProps<JsonViewerProps>(), {
  expandDepth: 1,
  copyable: false,
  sort: false,
  boxed: false,
  theme: 'default-json-theme',
  expanded: false,
  previewMode: false,
  showArrayIndex: true,
  showDoubleQuotes: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
  copied: [event: JsonViewerAction];
  keyClick: [key: string];
  toggle: [param: JsonViewerToggle];
  valueClick: [value: JsonViewerValue];
}>();

const attrs: SetupContext['attrs'] = useAttrs();

function handleClick(event: MouseEvent) {
  if (
    event.target instanceof HTMLElement &&
    event.target.classList.contains('jv-item')
  ) {
    const pathNode = event.target.closest('.jv-push');
    if (!pathNode || !pathNode.hasAttribute('path')) {
      return;
    }
    const param: JsonViewerValue = {
      path: '',
      value: '',
      depth: 0,
      el: event.target,
    };

    param.path = pathNode.getAttribute('path') || '';
    param.depth = Number(pathNode.getAttribute('depth')) || 0;

    param.value = event.target.textContent || undefined;
    param.value = JSON.parse(param.value);
    emit('valueClick', param);
  }
  emit('click', event);
}

// 支持显示 bigint 数据，如较长的订单号
const jsonData = computed<Record<string, any>>(() => {
  if (typeof props.value !== 'string') {
    return props.value || {};
  }

  try {
    return parseWithBigintAsString(props.value);
  } catch (error) {
    console.error('JSON parse error:', error);
    return {};
  }
});

const bindProps = computed<Recordable<any>>(() => {
  const copyable = {
    copyText: $t('ui.jsonViewer.copy'),
    copiedText: $t('ui.jsonViewer.copied'),
    timeout: 2000,
    ...(isBoolean(props.copyable) ? {} : props.copyable),
  };

  return {
    ...props,
    ...attrs,
    value: jsonData.value,
    onCopied: (event: JsonViewerAction) => emit('copied', event),
    onKeyclick: (key: string) => emit('keyClick', key),
    onClick: (event: MouseEvent) => handleClick(event),
    copyable: props.copyable ? copyable : false,
  };
});
</script>
<template>
  <VueJsonViewer v-bind="bindProps">
    <template #copy="slotProps">
      <slot name="copy" v-bind="slotProps"></slot>
    </template>
  </VueJsonViewer>
</template>
<style lang="scss">
@use './style.scss';
</style>
