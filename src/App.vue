<template>
  <el-config-provider
    :locale="zhCn"
    :size="size"
    :button-size="size"
    :z-index="3000"
  >
    <div class="app-container" :class="{ 'dark-theme': isDark }">
      <div class="header-buttons">
        <el-switch
          v-model="isDark"
          class="theme-switch"
          inline-prompt
          :active-icon="Moon"
          :inactive-icon="Sunny"
          @change="toggleTheme"
        />
        <el-badge :value="notificationCount" :hidden="notificationCount === 0">
          <el-button
            class="icon-button"
            :icon="Bell"
            circle
            @click="$router.push('/home/notifications')"
          />
        </el-badge>
        <el-button
          class="icon-button"
          :icon="ShoppingCart"
          circle
          @click="$router.push('/home/cart')"
        />
      </div>
      <router-view></router-view>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { Moon, Sunny, Bell, ShoppingCart } from "@element-plus/icons-vue";
import axios from 'axios';
import { useUserStore } from './stores/user';

const size = ref("default");
const isDark = ref(false);
const notificationCount = ref(0);
const userStore = useUserStore();

// 监听主题变化
watch(isDark, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add("dark-theme");
  } else {
    document.documentElement.classList.remove("dark-theme");
  }
});

// 获取未读通知数量
const fetchNotificationCount = async () => {
  if (userStore.isLoggedIn) {
    try {
      const response = await axios.get('/api/products/notifications');
      notificationCount.value = response.data.length;
    } catch (error) {
      console.error('获取通知数量失败:', error);
    }
  }
};

// 定期检查通知
const startNotificationPolling = () => {
  fetchNotificationCount();
  setInterval(fetchNotificationCount, 30000); // 每30秒检查一次
};

onMounted(() => {
  if (userStore.isLoggedIn) {
    startNotificationPolling();
  }
});

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (newVal) => {
  if (newVal) {
    startNotificationPolling();
  } else {
    notificationCount.value = 0;
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

.header-buttons {
  position: fixed;
  top: 15px;
  right: 235px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-button {
  background: transparent;
  border: none;
  color: var(--el-text-color-primary);
  font-size: 20px;
}

.dark-theme .icon-button {
  color: #ffffff;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
