<template>
  <div class="orders-view">
    <h2>我的订单</h2>
    <el-table
      v-loading="loading"
      :data="orders"
      border
      style="width: 100%"
    >
      <el-table-column prop="order_id" label="订单编号" width="100" />
      <el-table-column label="商品信息" min-width="400">
        <template #default="scope">
          <div v-for="product in scope.row.products" :key="product.id" class="product-item">
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
                <span>卖家: {{ product.seller_name }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="total_price" label="订单总额" width="120">
        <template #default="scope">
          <span class="total-price">¥{{ scope.row.total_price }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="order_status" label="订单状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.order_status)">
            {{ scope.row.order_status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

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

const getStatusType = (status) => {
  switch (status) {
    case '已支付':
      return 'success';
    case '未支付':
      return 'warning';
    case '已发货':
      return 'primary';
    case '已完成':
      return 'success';
    case '已取消':
      return 'info';
    default:
      return 'info';
  }
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.orders-view {
  padding: 20px;
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
  color: var(--el-text-color-primary);
}

.product-details {
  display: flex;
  gap: 20px;
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
}

.total-price {
  color: var(--el-color-danger);
  font-weight: bold;
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

/* 自定义状态标签颜色 */
:deep(.el-tag--success) {
  background-color: #006400;
  border-color: #006400;
  color: white;
}

:deep(.el-tag--warning) {
  background-color: #8B4000;
  border-color: #8B4000;
  color: white;
}

:deep(.el-tag--primary) {
  background-color: #000080;
  border-color: #000080;
  color: white;
}

:deep(.el-tag--info) {
  background-color: #4A4A4A;
  border-color: #4A4A4A;
  color: white;
}
</style> 