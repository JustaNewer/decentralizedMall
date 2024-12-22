<template>
  <div class="home">
    <el-container>
      <el-aside width="200px">
        <el-menu
          :router="true"
          :default-active="$route.path"
          class="el-menu-vertical"
          :background-color="isDark ? '#1d1e1f' : '#fff'"
          :text-color="isDark ? '#fff' : '#303133'"
          :active-text-color="isDark ? '#409EFF' : '#409EFF'"
        >
          <el-menu-item index="/home/profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
          <el-menu-item index="/home/my-products">
            <el-icon><Goods /></el-icon>
            <span>我发布的商品</span>
          </el-menu-item>
          <el-menu-item index="/home/buy-products">
            <el-icon><ShoppingCart /></el-icon>
            <span>购买商品</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header>
          <div class="header-content">
            <h2>{{ pageTitle }}</h2>
          </div>
        </el-header>

        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { User, Goods, ShoppingCart } from "@element-plus/icons-vue";

const route = useRoute();

const pageTitle = computed(() => {
  switch (route.path) {
    case "/home/profile":
      return "个人信息";
    case "/home/my-products":
      return "我发布的商品";
    case "/home/buy-products":
      return "购买商品";
    default:
      return "";
  }
});
</script>

<style scoped>
.home {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
}

.el-container {
  height: 100%;
  width: 100%;
}

.el-aside {
  height: 100%;
  border-right: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.el-header {
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay);
}

.el-main {
  padding: 20px;
  height: calc(100vh - 60px); /* 减去header高度 */
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

/* 确保文字颜色 */
:deep(.el-menu-item) {
  color: var(--el-text-color-primary);
}

:deep(.el-menu) {
  background-color: var(--el-bg-color-overlay);
}

.header-content h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}
</style> 