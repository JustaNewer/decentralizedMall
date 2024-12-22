<template>
  <div class="my-products">
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
        <el-button type="warning" @click="handleSearch" class="search-button"
          >搜索</el-button
        >
      </div>
      <el-button type="primary" @click="showAddDialog">+ 发布新商品</el-button>
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
      <el-table-column prop="price" label="价格" width="120">
        <template #default="scope"> ¥{{ scope.row.price }} </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)"
            >编辑</el-button
          >
          <el-button type="danger" size="small" @click="handleDelete(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        :model="currentProduct"
        label-width="auto"
        style="max-width: 600px"
      >
        <el-form-item label="商品名称">
          <el-input v-model="currentProduct.name" class="custom-input" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input
            v-model="currentProduct.price"
            class="custom-input-number"
            style="width: 100%"
            type="number"
            min="0"
            step="0.01"
          />
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input
            v-model="currentProduct.description"
            type="textarea"
            class="custom-textarea"
            :rows="4"
            placeholder="请输入商品描述"
            style="background-color: #141414"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="danger" @click="dialogVisible = false"
            >取消</el-button
          >
          <el-button type="primary" @click="handleSave">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";

const products = ref([]);
const searchQuery = ref("");
const dialogVisible = ref(false);
const dialogTitle = ref("");
const loading = ref(false);
const currentProduct = ref({
  name: "",
  price: 0,
  description: "",
});

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/api/products");
    products.value = response.data;
  } catch (error) {
    console.error("获取商品列表失败:", error);
    ElMessage.error(error.response?.data?.message || "获取商品列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索商品
const handleSearch = async () => {
  try {
    const response = await axios.get(
      `/api/products/search?q=${searchQuery.value}`
    );
    products.value = response.data;
  } catch (error) {
    ElMessage.error("搜索失败");
  }
};

// 显示添加对话框
const showAddDialog = () => {
  dialogTitle.value = "添加商品";
  currentProduct.value = {
    name: "",
    price: 0,
    description: "",
  };
  dialogVisible.value = true;
};

// 显示编辑对话框
const handleEdit = (row) => {
  dialogTitle.value = "编辑商品";
  currentProduct.value = { ...row };
  dialogVisible.value = true;
};

// 保存商品
const handleSave = async () => {
  try {
    if (currentProduct.value.product_id) {
      // 更新商品
      await axios.put(
        `/api/products/${currentProduct.value.product_id}`,
        currentProduct.value
      );
    } else {
      // 添加商品
      await axios.post("/api/products", currentProduct.value);
    }
    dialogVisible.value = false;
    fetchProducts();
    ElMessage.success(
      currentProduct.value.product_id ? "更新成功" : "添加成功"
    );
  } catch (error) {
    ElMessage.error(currentProduct.value.product_id ? "更新失败" : "添加失败");
  }
};

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除这个商品吗？", "提示", {
      type: "warning",
      distinguishCancelAndClose: true,
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      customClass: "custom-message-box",
    });

    await axios.delete(`/api/products/${row.product_id}`);

    fetchProducts();
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.my-products {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-section {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.search-button {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #ffffff;
}

.search-button:hover {
  background-color: #ebb563;
  border-color: #ebb563;
}

.mt-4 {
  margin-top: 20px;
}

/* 确保按钮颜色在暗色模式下也正确显示 */
:deep(.dark-theme) .el-button--primary {
  --el-button-bg-color: var(--el-color-primary);
  --el-button-border-color: var(--el-color-primary);
  --el-button-hover-bg-color: var(--el-color-primary-light-3);
  --el-button-hover-border-color: var(--el-color-primary-light-3);
  color: #1d1e1f;
}

/* 自定义输入数字控件样式 */
.custom-input-number {
  /* 加减号按钮的样式 */
  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase) {
    background-color: #141414;    /* 深色主题背景色 */
    border-color: #363637;        /* 深色主题边框色 */
    color: #ffffff;               /* 加减号的颜色 */
  }

  /* 鼠标悬停时的样式 */
  :deep(.el-input-number__decrease:hover),
  :deep(.el-input-number__increase:hover) {
    background-color: #1a1a1a;    /* 悬停时稍微亮一点 */
    border-color: #363637;
  }

  /* 输入框本身的样式 */
  :deep(.el-input__wrapper) {
    background-color: #141414;
    box-shadow: 0 0 0 1px #363637 inset;
  }

  :deep(.el-input__inner) {
    color: #ffffff;
  }
}

/* 自定义文本域样式 */
.custom-textarea {
  :deep(.el-textarea__inner) {
    background-color: #141414;
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
  }
}

/* 暗色主题下的特殊样式 */
:deep(.dark-theme) {
  .custom-textarea .el-textarea__inner {
    background-color: #141414;
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    background-color: #141414;
    border-color: #363637;
    color: #ffffff;
  }

  .el-input__inner,
  .el-textarea__inner {
    background-color: #141414;
    border-color: var(--el-border-color);
    color: #ffffff;
  }

  /* 商品名称输入框样式 */
  .el-input__wrapper {
    background-color: #141414;
    box-shadow: 0 0 0 1px #363637 inset;
  }

  .el-input__wrapper:hover {
    box-shadow: 0 0 0 1px #363637 inset;
  }
}

/* 对话框样式 */
:deep(.el-dialog) {
  .el-dialog__body {
    padding-top: 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    .el-button--danger {
      background-color: #f56c6c;
      border-color: #f56c6c;
      color: #ffffff;
    }

    .el-button--danger:hover {
      background-color: #f78989;
      border-color: #f78989;
    }
  }
}

/* 自定义基础输入框样式 */
.custom-input {
  :deep(.el-input__wrapper) {
    background-color: #ffffff;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    transition: all 0.3s;
  }

  :deep(.el-input__inner) {
    height: 32px;
    line-height: 32px;
    padding: 0 12px;
    color: #606266;
  }
}

/* 暗色主题下��输入框样式 */
:deep(.dark-theme) {
  .custom-input {
    .el-input__wrapper {
      background-color: #141414;
      border-color: #363637;
    }

    .el-input__inner {
      color: #ffffff;
    }

    .el-input__wrapper:hover {
      border-color: #409eff;
    }
  }

  /* 数字输入框样式 */
  .custom-input-number {
    .el-input-number__decrease,
    .el-input-number__increase {
      background-color: #141414;
      border: 1px solid #363637;
      color: #ffffff;
      height: 32px;
      width: 32px;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
    }

    .el-input-number__decrease:hover,
    .el-input-number__increase:hover {
      background-color: #1a1a1a;
      border-color: #409eff;
    }

    .el-input__wrapper {
      background-color: #141414;
      border: 1px solid #363637;
    }

    .el-input__inner {
      background-color: #141414;
      color: #ffffff;
      height: 32px;
      line-height: 32px;
      text-align: center;
    }
  }

  /* 文本域样式 */
  .custom-textarea {
    .el-textarea__inner {
      background-color: #141414;
      border: 1px solid #363637;
      color: #141414;
      padding: 12px;
      line-height: 1.5;
      min-height: 80px;
      transition: all 0.3s;
    }

    .el-textarea__inner:hover {
      border-color: #409eff;
    }

    .el-textarea__inner:focus {
      border-color: #409eff;
      outline: none;
    }
  }
}

/* 确认框样式 */
:deep(.custom-message-box) {
  .el-message-box__btns {
    .el-button--default {
      background-color: #f56c6c;
      border-color: #f56c6c;
      color: #ffffff;
    }

    .el-button--default:hover {
      background-color: #f78989;
      border-color: #f78989;
    }
  }
}
</style> 