<script setup lang="ts">
import { FormLabel, VbenHelpTooltip } from '../../shadcn-ui';
import { cn } from '../../../base/shared/utils';

interface Props {
  class?: string;
  help?: string;
  required?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <FormLabel :class="cn('flex items-center', props.class)">
    <span v-if="required" class="text-destructive mr-[2px]">*</span>
    <slot></slot>
    <VbenHelpTooltip v-if="help" trigger-class="size-3.5 ml-1">
      {{ help }}
    </VbenHelpTooltip>
  </FormLabel>
</template>
