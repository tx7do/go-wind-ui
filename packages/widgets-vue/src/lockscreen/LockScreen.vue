<template>
  <Teleport to="body">
    <div v-if="visible" class="widgets-lockscreen">
      <!-- 时钟视图：点击进入解锁表单 -->
      <div v-if="!showUnlockForm" class="widgets-lockscreen__clock-view">
        <div class="widgets-lockscreen__unlock-hint" @click="showUnlockForm = true">
          <span class="widgets-lockscreen__hint-icon" v-html="LOCK_SVG" />
          <span>{{ t("widgets.lockscreen.unlock") }}</span>
        </div>
        <div class="widgets-lockscreen__clock">
          {{ hour }}:{{ minute }}
          <span class="widgets-lockscreen__meridiem">{{ meridiem }}</span>
        </div>
      </div>

      <!-- 解锁表单视图 -->
      <div v-else class="widgets-lockscreen__form-view" @keydown.enter.prevent="handleSubmit">
        <div class="widgets-lockscreen__form-inner">
          <ElAvatar v-if="avatar" :size="80" :src="avatar" />
          <ElInput
            v-model="password"
            type="password"
            show-password
            autocomplete="off"
            size="large"
            class="widgets-lockscreen__input"
            :placeholder="t('widgets.lockscreen.placeholder')"
            @input="error = ''"
          />
          <p v-if="error" class="widgets-lockscreen__error">{{ error }}</p>
          <ElButton
            class="widgets-lockscreen__btn"
            type="primary"
            size="large"
            :loading="verifying"
            @click="handleSubmit"
          >
            {{ t("widgets.lockscreen.entry") }}
          </ElButton>
          <ElButton class="widgets-lockscreen__btn" size="large" @click="emit('toLogin')">
            {{ t("widgets.lockscreen.backToLogin") }}
          </ElButton>
          <ElButton class="widgets-lockscreen__btn" text size="large" @click="showUnlockForm = false">
            {{ t("widgets.lockscreen.back") }}
          </ElButton>
        </div>
      </div>

      <div class="widgets-lockscreen__date">{{ dateText }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 锁屏遮罩（纯展示）：可见性与校验全部宿主注入——
 * visible 由宿主状态控制，verify 注入密码校验（本地比对或后端接口均可）。
 * 锁屏只是界面遮罩不是认证边界：解锁成功仅撤遮罩，鉴权仍由后端令牌负责。
 */
import { computed, onUnmounted, ref, watch } from "vue";
import { ElAvatar, ElButton, ElInput } from "element-plus";
import { useWidgetsI18n } from "../locale";

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    /** 头像 URL（解锁表单展示） */
    avatar?: string;
    /**
     * 解锁校验：返回 true 撤掉锁屏；抛错或 false 显示错误。
     * 缺省：任意密码均可解锁（纯遮罩演示用）。
     */
    verify?: (password: string) => Promise<boolean> | boolean;
  }>(),
  { visible: false, avatar: "", verify: undefined }
);

const emit = defineEmits<{
  unlock: [];
  toLogin: [];
}>();

const { t } = useWidgetsI18n();

const showUnlockForm = ref(false);
const password = ref("");
const error = ref("");
const verifying = ref(false);

const LOCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

// ===== 时钟 =====
const hour = ref("00");
const minute = ref("00");
const meridiem = ref("");
const dateText = ref("");
let clockTimer: ReturnType<typeof setInterval> | null = null;

function tick() {
  const now = new Date();
  hour.value = String(now.getHours()).padStart(2, "0");
  minute.value = String(now.getMinutes()).padStart(2, "0");
  meridiem.value = now.getHours() < 12 ? "AM" : "PM";
  dateText.value = now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      tick();
      if (!clockTimer) clockTimer = setInterval(tick, 10_000);
    } else if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

// ===== 解锁 =====
async function handleSubmit() {
  if (verifying.value) return;
  verifying.value = true;
  error.value = "";
  try {
    const ok = props.verify ? await props.verify(password.value) : true;
    if (ok) {
      password.value = "";
      showUnlockForm.value = false;
      emit("unlock");
    } else {
      error.value = t("widgets.lockscreen.wrongPassword");
    }
  } catch (err) {
    console.error("[widgets] lock screen verify failed", err);
    error.value = err instanceof Error ? err.message : t("widgets.lockscreen.verifyFailed");
  } finally {
    verifying.value = false;
  }
}
</script>

<style scoped>
.widgets-lockscreen {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at center, rgb(0 0 0 / 0%) 0%, rgb(0 0 0 / 40%) 100%),
    var(--el-bg-color-page, #f2f3f5);
  color: var(--el-text-color-primary, #1f2937);
}

.widgets-lockscreen__clock-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.widgets-lockscreen__unlock-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  user-select: none;
}

.widgets-lockscreen__unlock-hint:hover {
  color: var(--el-color-primary, #409eff);
}

.widgets-lockscreen__hint-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
}

.widgets-lockscreen__hint-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.widgets-lockscreen__clock {
  margin-top: 16px;
  font-size: 88px;
  font-weight: 200;
  line-height: 1;
  letter-spacing: 4px;
}

.widgets-lockscreen__meridiem {
  margin-left: 8px;
  font-size: 20px;
  font-weight: 400;
  color: var(--el-text-color-secondary, #909399);
}

.widgets-lockscreen__date {
  position: absolute;
  bottom: 40px;
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}

.widgets-lockscreen__form-view {
  display: flex;
  align-items: center;
  justify-content: center;
}

.widgets-lockscreen__form-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.widgets-lockscreen__input {
  width: 260px;
}

.widgets-lockscreen__error {
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger, #f56c6c);
}

.widgets-lockscreen__btn {
  width: 260px;
}
</style>
