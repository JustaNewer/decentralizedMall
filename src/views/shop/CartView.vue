<template>
  <div class="cart-view">
    <h2>购物车</h2>
    <el-table
      v-loading="loading"
      :data="cartItems"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="price" label="单价" width="120">
        <template #default="scope">
          ¥{{ scope.row.price }}
        </template>
      </el-table-column>
      <el-table-column label="数量" width="150">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.quantity"
            :min="1"
            :max="99"
            @change="(value) => handleQuantityChange(scope.row, value)"
          />
        </template>
      </el-table-column>
      <el-table-column label="小计" width="120">
        <template #default="scope">
          ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="seller" label="卖家" width="120" />
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="cart-footer" v-if="cartItems.length > 0">
      <div class="total-price">
        总计: ¥{{ totalPrice.toFixed(2) }}
      </div>
      <el-button
        type="primary"
        :disabled="selectedItems.length === 0"
        @click="handlePurchase"
      >
        结算 ({{ selectedItems.length }} 件商品)
      </el-button>
    </div>

    <el-empty
      v-else
      description="购物车是空的"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const loading = ref(false);
const cartItems = ref([]);
const selectedItems = ref([]);

// 计算选中商品的总价
const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
});

// 获取购物车列表
const fetchCartItems = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/products/cart');
    cartItems.value = response.data || [];
  } catch (error) {
    console.error('获取购物车失败:', error);
    ElMessage.error(error.response?.data?.message || '获取购物车失败');
    cartItems.value = [];
  } finally {
    loading.value = false;
  }
};

// 更新商品数量
const handleQuantityChange = async (item, value) => {
  try {
    await axios.put(`/api/products/cart/${item.cart_id}`, {
      quantity: value
    });
  } catch (error) {
    console.error('更新数量失败:', error);
    ElMessage.error(error.response?.data?.message || '更新数量失败');
    // 恢复原来的数量
    await fetchCartItems();
  }
};

// 删除商品
const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm('确定要从购物车中删除这个商品吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      cancelButtonClass: "el-button--danger"
    });
    
    await axios.delete(`/api/products/cart/${item.cart_id}`);
    ElMessage.success('删除成功');
    await fetchCartItems();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

// 选择商品变化
const handleSelectionChange = (items) => {
  selectedItems.value = items;
};

// 购买商品
const handlePurchase = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要购买的商品');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要购买选中的 ${selectedItems.value.length} 件商品吗？总计: ¥${totalPrice.value.toFixed(2)}`,
      '确认购买',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const cart_ids = selectedItems.value.map(item => item.cart_id);
    await axios.post('/api/products/purchase', { cart_ids });
    
    ElMessage.success('购买成功');
    await fetchCartItems();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('购买失败:', error);
      ElMessage.error(error.response?.data?.message || '购买失败');
    }
  }
};

onMounted(() => {
  fetchCartItems();
});
</script>

<style scoped>
.cart-view {
  padding: 20px;
}

.cart-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.total-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-danger);
}

:deep(.el-input-number) {
  width: 120px;
}

/* 数字输入框样式 */
:deep(.el-input-number .el-input__wrapper) {
  background-color: #ffffff !important;
}

/* 数字输入框按钮样式 */
:deep(.dark-theme) .el-input-number__decrease,
:deep(.dark-theme) .el-input-number__increase {
  background-color: #141414 !important;
  color: #ffffff !important;
  border-color: #363637 !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background-color: #ffffff !important;
  color: #141414 !important;
  border-color: #363637 !important;
}

:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  background-color: #1a1a1a !important;
  color: #ffffff !important;
}

:deep(.dark-theme) .el-input-number__decrease:hover,
:deep(.dark-theme) .el-input-number__increase:hover {
  background-color: #1a1a1a !important;
}

:deep() .el-input__inner {
  color: #141414 !important;
}

:deep() .el-input-number {
  color: #141414 !important;
}

:deep(.dark-theme) .el-input__inner {
  color: #ffffff !important;
}

:deep(.dark-theme) .el-input-number {
  color: #ffffff !important;
}
</style> 