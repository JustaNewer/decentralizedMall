<template>
  <div class="notifications-view">
    <h2>我的通知</h2>
    
    <el-timeline v-loading="loading">
      <el-timeline-item
        v-for="notification in notifications"
        :key="notification.notification_id"
        :timestamp="formatTime(notification.created_at)"
        type="primary"
      >
        {{ notification.message }}
      </el-timeline-item>

      <el-empty
        v-if="notifications.length === 0"
        description="暂无通知"
      />
    </el-timeline>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const loading = ref(false);
const notifications = ref([]);

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/products/notifications');
    notifications.value = response.data || [];
  } catch (error) {
    console.error('获取通知失败:', error);
    ElMessage.error(error.response?.data?.message || '获取通知失败');
    notifications.value = [];
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('时间格式化错误:', error);
    return '时间格式错误';
  }
};

// 定期刷新通知
const startNotificationPolling = () => {
  fetchNotifications();
  const intervalId = setInterval(fetchNotifications, 30000); // 每30秒刷新一次

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(intervalId);
  });
};

onMounted(() => {
  startNotificationPolling();
});
</script>

<style scoped>
.notifications-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

:deep(.el-timeline-item__content) {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

:deep(.el-timeline-item__timestamp) {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

:deep(.dark-theme) .el-timeline-item__content {
  color: #ffffff;
}

:deep(.dark-theme) .el-timeline-item__timestamp {
  color: #909399;
}
</style> 