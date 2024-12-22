<template>
  <el-config-provider
    :locale="zhCn"
    :size="size"
    :button-size="size"
    :z-index="3000"
  >
    <div class="app-container" :class="{ 'dark-theme': isDark }">
      <el-switch
        v-model="isDark"
        class="theme-switch"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        @change="toggleTheme"
      />
      <router-view></router-view>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { Moon, Sunny } from "@element-plus/icons-vue";

const size = ref("default");
const isDark = ref(false);

// 监听主题变化
watch(isDark, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add("dark-theme");
  } else {
    document.documentElement.classList.remove("dark-theme");
  }
});
</script>

<style>
/* 基础样式 */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  color: #303133;
}

/* 暗色主题 */
.dark-theme {
  --el-bg-color: #1a1a1a !important;
  --el-bg-color-page: #141414 !important;
  --el-bg-color-overlay: #1d1e1f !important;
  --el-text-color-primary: #ffffff !important;
  --el-text-color-regular: #ffffff !important;
  --el-border-color: #363637 !important;
  background-color: var(--el-bg-color-page) !important;
  color: var(--el-text-color-primary) !important;
}

/* 菜单样式 */
.dark-theme .el-menu {
  background-color: var(--el-bg-color-overlay) !important;
  border-right-color: var(--el-border-color) !important;
}

.dark-theme .el-menu-item {
  color: var(--el-text-color-primary) !important;
}

/* 表格样式 */
.dark-theme .el-table {
  background-color: var(--el-bg-color-overlay) !important;
  color: var(--el-text-color-primary) !important;
}

.dark-theme .el-table th,
.dark-theme .el-table td {
  background-color: var(--el-bg-color-overlay) !important;
  border-color: var(--el-border-color) !important;
}

.dark-theme .el-table--border::after,
.dark-theme .el-table--group::after,
.dark-theme .el-table::before {
  background-color: var(--el-border-color) !important;
}

/* 卡片样式 */
.dark-theme .el-card {
  background-color: var(--el-bg-color-overlay) !important;
  border-color: var(--el-border-color) !important;
  color: var(--el-text-color-primary) !important;
}

/* 输入框样式 */
.dark-theme .el-input__wrapper {
  background-color: var(--el-bg-color-overlay) !important;
}

.dark-theme .el-input__inner {
  color: var(--el-text-color-primary) !important;
}

/* 对话框样式 */
.dark-theme .el-dialog {
  background-color: var(--el-bg-color-overlay) !important;
}

.dark-theme .el-dialog__title {
  color: var(--el-text-color-primary) !important;
}

/* 容器样式 */
.dark-theme .el-container {
  background-color: var(--el-bg-color-page) !important;
}

.dark-theme .el-aside {
  background-color: var(--el-bg-color-overlay) !important;
  border-right-color: var(--el-border-color) !important;
}

.dark-theme .el-main {
  background-color: var(--el-bg-color-page) !important;
}

.dark-theme .el-header {
  background-color: var(--el-bg-color-overlay) !important;
  border-bottom-color: var(--el-border-color) !important;
}

/* 确保所有文字颜色 */
.dark-theme h1,
.dark-theme h2,
.dark-theme h3,
.dark-theme h4,
.dark-theme h5,
.dark-theme h6,
.dark-theme p,
.dark-theme span,
.dark-theme div {
  color: var(--el-text-color-primary) !important;
}

.theme-switch {
  position: fixed;
  top: 15px;
  right: 35px;
  z-index: 1000;
}
</style>
