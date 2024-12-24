<template>
  <div class="buy-products">
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索商品名称或描述"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="products"
      border
      style="width: 100%"
      class="mt-4"
    >
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="price" label="价格" width="120">
        <template #default="scope"> ¥{{ scope.row.price }} </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="seller" label="卖家" width="120" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="handleAddToCart(scope.row)"
            :disabled="scope.row.created_by === userStore.user.user_id"
          >
            <el-icon><ShoppingCart /></el-icon>
            加入购物车
          </el-button>
          <el-button
            type="success"
            size="small"
            @click="handleBuy(scope.row)"
            :disabled="scope.row.created_by === userStore.user.user_id"
          >
            <el-icon><Sell /></el-icon>
            购买
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";
import { Search, ShoppingCart, Sell } from "@element-plus/icons-vue";
import { useUserStore } from "../../stores/user";

const searchQuery = ref("");
const products = ref([]);
const loading = ref(false);
const userStore = useUserStore();
const router = useRouter();

const handleSearch = async () => {
  loading.value = true;
  try {
    // 获取商品列表，排除自己的商品
    const response = await axios.get(
      `/api/products/all${
        searchQuery.value ? `/search?q=${searchQuery.value}` : ""
      }`
    );
    // 过滤掉自己发布的商品
    products.value = response.data.filter(
      product => product.created_by !== userStore.user.user_id
    );
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error("搜索失败");
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAddToCart = async (product) => {
  try {
    // 检查是否是自己的商品
    if (product.created_by === userStore.user.user_id) {
      ElMessage.warning('不能购买自己的商品');
      return;
    }

    // 发送请求添加到购物车
    await axios.post('/api/products/cart/add', {
      product_id: product.product_id,
      quantity: 1
    });

    ElMessage.success(`已将 ${product.name} 加入购物车`);
  } catch (error) {
    console.error('添加到购物车失败:', error);
    ElMessage.error(error.response?.data?.message || '添加到购物车失败');
  }
};

const handleBuy = async (product) => {
  try {
    // 检查是否是自己的商品
    if (product.created_by === userStore.user.user_id) {
      ElMessage.warning('不能购买自己的商品');
      return;
    }

    // 先加入购物车
    await handleAddToCart(product);
    // 直接跳转到购物车页面
    router.push('/home/cart');
  } catch (error) {
    console.error('购买失败:', error);
    ElMessage.error('购买失败');
  }
};

// 初始加载所有商品
onMounted(() => {
  handleSearch();
});
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.mt-4 {
  margin-top: 20px;
}
</style> 