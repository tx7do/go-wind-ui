<template>
  <div class="suite-demo">
    <!-- ===== 壳件：铃铛 / 命令面板触发 / 主题 / 语言 ===== -->
    <section class="suite-demo__block">
      <h3>widgets-vue</h3>
      <div class="suite-demo__toolbar">
        <NoticeDropdown
          :items="noticeItems"
          :unread-count="noticeItems.filter((n) => n.unread).length"
          @read-all="readAllNotices"
          @item-click="(item) => (item.unread = false)"
        />
        <button class="suite-demo__btn" @click="paletteVisible = true">命令面板 (Ctrl+K)</button>
        <ThemeSwitch v-model:dark="dark" @change="onThemeChange" />
        <LangSelect v-model:locale="lang" :options="langOptions" @change="(v) => setWidgetsLocale(v)" />
      </div>

      <CommandPalette
        v-model:visible="paletteVisible"
        :commands="paletteCommands"
        :group-labels="{ menu: '菜单', action: '动作' }"
        @select="(item) => (lastPicked = item.label)"
      />
      <p v-if="lastPicked" class="suite-demo__picked">选中：{{ lastPicked }}</p>
    </section>

    <!-- ===== ProDescriptions：配置驱动详情（审计抽屉定式） ===== -->
    <section class="suite-demo__block">
      <h3>ProDescriptions（element-pro）</h3>
      <ProDescriptions
        :data="detailRow"
        :sections="detailSections"
        :column="2"
      >
        <template #avatar-url="{ data }">
          <ElLink type="primary">{{ data?.avatarUrl }}</ElLink>
        </template>
      </ProDescriptions>
    </section>

    <!-- ===== chat-vue：流式对话 ===== -->
    <section class="suite-demo__block suite-demo__block--chat">
      <h3>chat-vue</h3>
      <div class="suite-demo__chat">
        <ChatMessages
          :messages="chat.messages.value"
          :streaming="chat.streaming.value"
          :streaming-text="chat.streamingText.value"
        />
        <ChatInput
          :streaming="chat.streaming.value"
          @send="(text) => chat.send(text)"
          @stop="chat.abort()"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElLink } from "element-plus";
import { ProDescriptions } from "@go-wind-ui/element-pro";
import type { ProDescriptionSection } from "@go-wind-ui/element-pro";
import {
  NoticeDropdown,
  CommandPalette,
  ThemeSwitch,
  LangSelect,
  setWidgetsLocale,
} from "@go-wind-ui/widgets-vue";
import { ChatMessages, ChatInput, useChat, setChatLocale } from "@go-wind-ui/chat-vue";

const props = defineProps<{ locale: "zh-CN" | "en-US"; dark: boolean }>();

// locale 联动
watch(
  () => props.locale,
  (v) => {
    setWidgetsLocale(v);
    setChatLocale(v);
  },
  { immediate: true }
);

// ===== widgets =====
const dark = ref(props.dark);
// 模板表达式访问不到 document（Vue 白名单），handler 落在 script
function onThemeChange(v: boolean) {
  document.documentElement.classList.toggle("dark", v);
}
const lang = ref<"zh-CN" | "en-US">(props.locale);
const langOptions = [
  { value: "zh-CN", label: "中文" },
  { value: "en-US", label: "English" },
];
const paletteVisible = ref(false);
const lastPicked = ref("");

const noticeItems = ref([
  { id: 1, title: "系统上线通知", content: "<p>v1.4.1 已发布，包含 <b>审计导出</b> 能力。</p>", unread: true },
  { id: 2, title: "安全提醒", content: "检测到新设备登录，请确认。", unread: true },
  { id: 3, title: "配额提醒", content: "本月 API 调用已用 80%。", unread: false },
]);

function readAllNotices() {
  noticeItems.value = noticeItems.value.map((n) => ({ ...n, unread: false }));
}

const paletteCommands = [
  { id: "m-user", label: "用户管理", group: "menu", keywords: "user admin" },
  { id: "m-tenant", label: "租户管理", group: "menu", keywords: "tenant" },
  { id: "m-dict", label: "字典管理", group: "menu", keywords: "dict" },
  { id: "a-profile", label: "个人资料", group: "action", hotkey: "Ctrl+I" },
  { id: "a-logout", label: "退出登录", group: "action" },
];

// ===== ProDescriptions（审计详情定式） =====
const detailRow = {
  username: "alice",
  status: 1,
  createdAt: "2026-10-28T10:30:00Z",
  riskScore: 12,
  ipAddress: "10.0.0.8",
  amount: 9800,
  avatarUrl: "https://example.com/avatar/alice.png",
  remark: "",
};

const detailSections: ProDescriptionSection<typeof detailRow>[] = [
  {
    title: "基本信息",
    fields: [
      { label: "用户名", prop: "username" },
      { label: "状态", prop: "status", cellType: "tag", labelMap: { 1: "正常", 0: "禁用" }, tagTypeMap: { 1: "success", 0: "danger" } },
      { label: "创建时间", prop: "createdAt", cellType: "date" },
      { label: "风险分", prop: "riskScore" },
      { label: "IP 地址", prop: "ipAddress" },
      { label: "消费金额", prop: "amount", cellType: "price", pricePrefix: "¥" },
      { label: "头像链接", prop: "avatarUrl", slotName: "avatar-url", span: 2 },
      { label: "备注（空值占位）", prop: "remark" },
    ],
  },
];

// ===== chat（模拟流式传输） =====
const chat = useChat({
  transport: async ({ messages, signal, onChunk }) => {
    const last = messages[messages.length - 1]?.content ?? "";
    const reply = `关于「${last}」：\n\n这是一段**模拟流式回复**，验证 markdown 渲染与打字动画。\n\n- 要点一\n- 要点二\n\n\`\`\`ts\nconst ok: boolean = true;\n\`\`\``;
    for (const chunk of reply.match(/.{1,6}/gs) ?? []) {
      if (signal.aborted) throw new DOMException("aborted", "AbortError");
      await new Promise((r) => setTimeout(r, 30));
      onChunk(chunk);
    }
    return reply;
  },
});
</script>

<style scoped>
.suite-demo {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suite-demo__block {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  padding: 14px 16px;
}

.suite-demo__block h3 {
  margin: 0 0 12px;
  font-size: 14px;
}

.suite-demo__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.suite-demo__btn {
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--el-text-color-regular, #4b5563);
  background: var(--el-button-bg-color, #fff);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
}

.suite-demo__picked {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-color-primary, #409eff);
}

.suite-demo__block--chat {
  flex: 1;
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.suite-demo__chat {
  flex: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
}

.suite-demo__chat > :first-child {
  flex: 1;
  min-height: 0;
}
</style>
