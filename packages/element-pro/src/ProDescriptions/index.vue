<template>
  <div class="pro-descriptions">
    <template v-for="(section, sIdx) in resolvedSections" :key="sIdx">
      <ElDivider v-if="section.title" content-position="left" class="pro-descriptions__divider">
        {{ section.title }}
      </ElDivider>
      <ElDescriptions :column="column" :border="border">
        <ElDescriptionsItem
          v-for="field in section.fields"
          :key="field.label + String(field.prop)"
          :label="field.label"
          :span="field.span ?? 1"
        >
          <!-- 自定义插槽 -->
          <slot
            v-if="field.slotName"
            :name="field.slotName"
            :data="data"
            :field="field"
          />
          <!-- formatter 优先 -->
          <template v-else-if="field.formatter">
            {{ safeFormat(field) }}
          </template>
          <!-- cellType 走 ProTable 渲染器注册表 -->
          <ProTableCellContent
            v-else-if="field.cellType"
            :col="pseudoColumn(field)"
            :row="rowProxy"
            :row-index="0"
          />
          <!-- 纯文本 -->
          <span v-else :class="{ 'pro-descriptions__empty': isEmpty(getValue(field)) }">
            {{ isEmpty(getValue(field)) ? placeholder : getValue(field) }}
          </span>
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * 配置驱动的详情描述：与 ProForm（表单）/ProTable（列表）并列的「查看」件。
 * fields 扁平或 sections 分节；cellType 复用 ProTable 渲染器注册表，
 * ProTable 里怎么渲染单元格，详情里就怎么渲染。
 *
 * 典型组合（admin 审计详情抽屉定式）：
 *   <ProModal :config="{ component: 'drawer', drawer: { size: '780px' } }">
 *     <ProDescriptions :sections="sections" :data="row" />
 *   </ProModal>
 */
import { computed } from "vue";
import { ElDivider, ElDescriptions, ElDescriptionsItem } from "element-plus";
import ProTableCellContent from "../ProTable/ProTableCellContent.vue";
import type { ProTableColumn } from "../ProTable/types";
import type { ProDescriptionField, ProDescriptionSection, ProDescriptionsProps } from "./types";

const props = withDefaults(defineProps<ProDescriptionsProps<T>>(), {
  data: null,
  fields: () => [],
  sections: () => [],
  column: 2,
  border: true,
  placeholder: "-",
});

const resolvedSections = computed<ProDescriptionSection<T>[]>(() => {
  if (props.sections?.length) return props.sections;
  return props.fields?.length ? [{ fields: props.fields }] : [];
});

const rowProxy = computed<Record<string, any>>(() => (props.data ?? {}) as Record<string, any>);

function getValue(field: ProDescriptionField<T>) {
  const row = rowProxy.value;
  if (!field.prop) return undefined;
  return (row as any)[field.prop];
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function safeFormat(field: ProDescriptionField<T>) {
  try {
    const out = field.formatter?.(props.data as T);
    return isEmpty(out) ? props.placeholder : out;
  } catch (err) {
    // 格式化函数是宿主代码：错误必须可见，不能吞成空白
    console.error("[ProDescriptions] formatter failed", err);
    return props.placeholder;
  }
}

/** 字段 → ProTable 列形状（复用单元格渲染器注册表的适配层） */
function pseudoColumn(field: ProDescriptionField<T>): ProTableColumn {
  return {
    label: field.label,
    prop: field.prop as string | undefined,
    cellType: field.cellType,
    labelMap: field.labelMap,
    tagType: field.tagType,
    tagTypeMap: field.tagTypeMap,
    dateFormat: field.dateFormat,
    pricePrefix: field.pricePrefix,
  } as ProTableColumn;
}
</script>

<style scoped lang="scss">
.pro-descriptions {
  &__divider {
    margin: 8px 0 12px;

    &:first-child {
      margin-top: 0;
    }
  }

  &__empty {
    color: var(--el-text-color-secondary);
  }
}

/* 详情场景窄容器下的标签不换行（ElDescriptions border 模式） */
:deep(.el-descriptions__label) {
  white-space: nowrap;
}
</style>
