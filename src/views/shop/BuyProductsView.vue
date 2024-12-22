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
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";

const searchQuery = ref("");
const products = ref([]);
const loading = ref(false);

const handleSearch = async () => {
  loading.value = true;
  try {
    const response = await axios.get(
      `/api/products/all${
        searchQuery.value ? `/search?q=${searchQuery.value}` : ""
      }`
    );
    products.value = response.data;
  } catch (error) {
    ElMessage.error("搜索失败");
  } finally {
    loading.value = false;
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