<template>
  <div class="buy-products">
    <div class="header-actions">
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="搜索商品"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="products"
      border
      style="width: 100%"
      class="mt-4"
    >
      <el-table-column prop="product_id" label="商品ID" width="100" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column label="商品图片" width="120">
        <template #default="scope">
          <el-image
            style="width: 80px; height: 80px"
            :src="scope.row.image_url"
            fit="cover"
            :preview-src-list="[scope.row.image_url]"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="120">
        <template #default="scope"> ¥{{ scope.row.price }} </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <div class="button-group">
            <el-button
              type="primary"
              size="small"
              @click="handleAddToCart(scope.row)"
            >
              <el-icon><ShoppingCart /></el-icon>
              加入购物车
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleBuy(scope.row)"
            >
              <el-icon><ShoppingBag /></el-icon>
              立即购买
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  Picture,
} from "@element-plus/icons-vue";
import { useUserStore } from "../../stores/user";

const searchQuery = ref("");
const products = ref([]);
const loading = ref(false);
const userStore = useUserStore();

const handleSearch = async () => {
  loading.value = true;
  try {
    const response = await axios.get(
      `/api/products/all${
        searchQuery.value ? `/search?q=${searchQuery.value}` : ""
      }`
    );
    products.value = response.data.filter(
      (product) => product.created_by !== userStore.user.user_id
    );
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败");
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAddToCart = async (product) => {
  try {
    if (product.created_by === userStore.user.user_id) {
      ElMessage.warning("不能购买自己的商品");
      return;
    }

    await axios.post("/api/products/cart/add", {
      product_id: product.product_id,
      quantity: 1,
    });
    ElMessage.success(`已将 ${product.name} 加入购物车`);
  } catch (error) {
    console.error("添加到购物车失败:", error);
    ElMessage.error(error.response?.data?.message || "添加到购物车失败");
  }
};

const handleBuy = async (product) => {
  try {
    await axios.post("/api/products/purchase", {
      items: [
        {
          product_id: product.product_id,
          quantity: 1,
        },
      ],
    });

    ElMessage.success("购买成功");
  } catch (error) {
    console.error("购买失败:", error);
    ElMessage.error(error.response?.data?.message || "购买失败");
  }
};

onMounted(() => {
  handleSearch();
});
</script>

<style scoped>
.buy-products {
  padding: 20px;
}

.header-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.button-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.image-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
}
</style> 