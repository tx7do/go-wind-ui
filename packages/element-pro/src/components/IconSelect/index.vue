<template>
  <div :style="{ width: width }">
    <el-popover :visible="popoverVisible" :width="width" placement="bottom-end">
      <template #reference>
        <div @click="popoverVisible = !popoverVisible">
          <slot>
            <el-input
              v-model="selectedIcon"
              readonly
              :placeholder="$t('common.iconSelect.selectPlaceholder')"
              class="reference"
            >
              <template #prepend>
                <ProIcon v-if="selectedIcon" :icon="selectedIcon" />
              </template>
              <template #suffix>
                <el-icon v-if="selectedIcon" style="margin-right: 8px" @click.stop="clearSelectedIcon">
                  <CircleClose />
                </el-icon>
                <el-icon
                  :style="{
                    transform: popoverVisible ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform .5s',
                  }"
                >
                  <ArrowDown @click.stop="togglePopover" />
                </el-icon>
              </template>
            </el-input>
          </slot>
        </div>
      </template>

      <!-- 图标选择弹窗 -->
      <el-input
        v-model="filterText"
        :placeholder="$t('common.iconSelect.searchPlaceholder')"
        clearable
        @input="filterIcons"
      />
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane v-if="extraIcons.length" :label="$t('common.iconSelect.svgTab')" name="svg">
          <el-scrollbar height="300px">
            <ul class="icon-grid">
              <li
                v-for="icon in filteredExtraIcons"
                :key="'svg-' + icon"
                class="icon-grid-item"
                @click="selectIcon(icon)"
              >
                <el-tooltip :content="icon" placement="bottom" effect="light">
                  <ProIcon :icon="icon" />
                </el-tooltip>
              </li>
            </ul>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane :label="$t('common.iconSelect.elementTab')" name="element">
          <el-scrollbar height="300px">
            <ul class="icon-grid">
              <li
                v-for="icon in filteredElementIcons"
                :key="icon"
                class="icon-grid-item"
                @click="selectIcon(icon)"
              >
                <el-icon>
                  <component :is="icon" />
                </el-icon>
              </li>
            </ul>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ArrowDown, CircleClose } from "@element-plus/icons-vue";
import ProIcon from "../../icons/ProIcon.vue";
import { $t } from "../../locale";

defineOptions({ name: "ProIconSelect" });

const props = withDefaults(
  defineProps<{
    /** v-model：选中图标名（Element 图标为 el-icon-Name 形态，其余按 Iconify/内联名渲染） */
    modelValue?: string;
    /** 弹层宽度 */
    width?: string;
    /**
     * 追加的图标名列表（Iconify 名称或本库内联名），
     * 展示在第一个 Tab；不传则只有 Element 图标页。
     */
    icons?: string[];
  }>(),
  { modelValue: "", width: "500px", icons: () => [] }
);

const emit = defineEmits(["update:modelValue"]);

const selectedIcon = defineModel("modelValue", { type: String, required: true, default: "" });

const popoverVisible = ref(false);
const activeTab = ref(props.icons.length ? "svg" : "element");

const extraIcons = computed(() => props.icons ?? []);
const elementIcons = Object.keys(ElementPlusIconsVue);

const filterText = ref("");
const filteredExtraIcons = ref<string[]>([...extraIcons.value]);
const filteredElementIcons = ref<string[]>([...elementIcons]);

watch(
  () => props.icons,
  (icons) => {
    filteredExtraIcons.value = [...(icons ?? [])];
    activeTab.value = icons?.length ? "svg" : "element";
  }
);

function togglePopover() {
  popoverVisible.value = !popoverVisible.value;
}

function handleTabClick(tabPane: any) {
  activeTab.value = tabPane.props.name;
  filterIcons();
}

function filterIcons() {
  const kw = filterText.value.toLowerCase();
  if (activeTab.value === "svg") {
    filteredExtraIcons.value = kw
      ? extraIcons.value.filter((icon) => icon.toLowerCase().includes(kw))
      : [...extraIcons.value];
  } else {
    filteredElementIcons.value = kw
      ? elementIcons.filter((icon) => icon.toLowerCase().includes(kw))
      : [...elementIcons];
  }
}

function selectIcon(icon: string) {
  const iconName = activeTab.value === "element" ? `el-icon-${icon}` : icon;
  emit("update:modelValue", iconName);
  popoverVisible.value = false;
}

function clearSelectedIcon() {
  emit("update:modelValue", "");
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest(".el-popover") && !target.closest(".reference")) {
    popoverVisible.value = false;
  }
}

watch(popoverVisible, (visible) => {
  if (visible) {
    document.addEventListener("click", handleClickOutside);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }
});
</script>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 4px;
  margin: 8px 0;
  padding: 0;
  list-style: none;
}

.icon-grid-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.icon-grid-item:hover {
  background: var(--el-fill-color);
}
</style>
