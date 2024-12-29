<template>
  <div class="orders-view">
    <h2>我的订单</h2>
    <el-card v-for="order in orders" :key="order.order_id" class="order-card">
      <template #header>
        <div class="order-header">
          <div class="order-info">
            <span>订单号: {{ order.order_id }}</span>
            <span>状态: {{ order.order_status }}</span>
            <span>创建时间: {{ formatDate(order.created_at) }}</span>
          </div>
          <div class="order-total">
            总金额: ¥{{ order.total_price }}
          </div>
        </div>
      </template>
      
      <div class="order-products">
        <div v-for="product in order.products" :key="product.id" class="product-item">
          <el-image
            :src="product.image_url"
            fit="cover"
            class="product-image"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="product-info">
            <h4>{{ product.name }}</h4>
            <div class="product-details">
              <span>数量: {{ product.quantity }}</span>
              <span>单价: ¥{{ product.price }}</span>
              <span>小计: ¥{{ (product.quantity * product.price).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-empty v-if="orders.length === 0" description="暂无订单" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import axios from 'axios';

const orders = ref([]);
const loading = ref(false);

const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/orders');
    orders.value = response.data;
  } catch (error) {
    console.error('获取订单列表失败:', error);
    ElMessage.error(error.response?.data?.message || '获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.orders-view {
  padding: 20px;
}

.order-card {
  margin-bottom: 20px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  display: flex;
  gap: 20px;
}

.order-total {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-danger);
}

.order-products {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: flex;
  gap: 15px;
  padding: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.product-info {
  flex: 1;
}

.product-info h4 {
  margin: 0 0 10px 0;
}

.product-details {
  display: flex;
  gap: 20px;
  color: var(--el-text-color-secondary);
}

.image-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
}
</style> 