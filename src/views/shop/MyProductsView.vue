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
        <el-button type="warning" @click="handleSearch" class="search-button">
          搜索
        </el-button>
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
      <el-table-column prop="status_text" label="状态" width="100">
        <template #default="scope">
          <el-tag
            :type="scope.row.purchase_status === 1 ? 'danger' : 'success'"
          >
            {{ scope.row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <div class="button-group">
            <el-button
              type="primary"
              size="small"
              :disabled="scope.row.purchase_status === 1"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="scope.row.purchase_status === 1"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '发布新商品'"
      width="500px"
    >
      <el-form
        :model="currentProduct"
        label-width="auto"
        style="max-width: 600px"
      >
        <el-form-item label="商品名称">
          <el-input v-model="currentProduct.name" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input
            v-model="currentProduct.price"
            style="width: 40%"
            type="number"
            min="0"
            step="0.01"
            @input="validatePrice"
            placeholder="请输入商品价格"
          />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            class="product-image-upload"
            action="http://localhost:3000/api/upload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            name="image"
            accept="image/*"
            :headers="uploadHeaders"
            :with-credentials="true"
          >
            <img
              v-if="currentProduct.image_url"
              :src="currentProduct.image_url"
              class="product-image"
            />
            <el-button v-else type="primary">点击上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input
            v-model="currentProduct.description"
            type="textarea"
            :rows="4"
            placeholder="输入商品描述"
            resize="both"
            style="width: 100%"
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
/* eslint-disable no-unused-vars */
import { ref, onMounted, computed, h } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Edit, Delete, Picture } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const products = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const searchQuery = ref("");

// 初始化当前商品对象
const currentProduct = ref({
  name: "",
  price: 0,
  description: "",
  image_url: "",
});

// 上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
}));

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
  loading.value = true;
  try {
    const response = await axios.get(
      `/api/products/my${
        searchQuery.value ? `/search?q=${searchQuery.value}` : ""
      }`
    );
    products.value = response.data;
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败");
    products.value = [];
  } finally {
    loading.value = false;
  }
};

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false;
  currentProduct.value = {
    name: "",
    price: 0,
    description: "",
    image_url: "",
  };
  dialogVisible.value = true;
};

// 显示编辑对话框
const handleEdit = (row) => {
  isEdit.value = true;
  currentProduct.value = { ...row };
  dialogVisible.value = true;
};

// 处理保存
const handleSave = async () => {
  try {
    if (isEdit.value) {
      const response = await axios.put(
        `/api/products/${currentProduct.value.product_id}`,
        currentProduct.value
      );
      ElMessage.success("更新成功");
    } else {
      const response = await axios.post("/api/products", currentProduct.value);
      ElMessage.success("添加成功");
    }
    dialogVisible.value = false;
    fetchProducts();
  } catch (error) {
    console.error("保存失败:", error);
    if (error.response?.data?.reason) {
      // 显示内容审核失败的具体原因
      ElMessage({
        message: h(
          "div",
          {
            style: {
              color: "#000000 !important", // 强制使用黑色文字
              backgroundColor: "#fef0f0",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #fde2e2",
            },
          },
          [
            h(
              "div",
              { style: { fontWeight: "bold", color: "#000000 !important" } },
              "内容审核未通过"
            ),
            h(
              "div",
              {
                style: {
                  marginTop: "5px",
                  fontSize: "14px",
                  color: "#000000 !important",
                },
              },
              `原因: ${error.response.data.reason}`
            ),
          ]
        ),
        type: "error",
        customClass: "moderation-error",
        duration: 5000,
        showClose: true,
      });
    } else {
      ElMessage.error(error.response?.data?.message || "保存失败");
    }
  }
};

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除这个商品吗？", "提示", {
      type: "warning",
      distinguishCancelAndClose: true,
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      cancelButtonClass: "el-button--danger",
    });

    await axios.delete(`/api/products/${row.product_id}`);
    ElMessage.success("删除成功");
    fetchProducts();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(error.response?.data?.message || "删除失败");
    }
  }
};

// 处理图片上传成功
const handleUploadSuccess = (response) => {
  console.log("上传成功:", response);
  if (response && response.url) {
    // 确保 URL 格式正确
    const imageUrl = response.url.replace(/https:\/\/https:\/\//, "https://");
    currentProduct.value.image_url = imageUrl;
    ElMessage.success("图片上传成功");
  } else {
    ElMessage.error("获取图片 URL 失败");
  }
};

// 处理图片上传失败
const handleUploadError = (error) => {
  console.error("上传失败:", error);
  let errorMessage = "图片上传失败";

  if (error.response) {
    const response = error.response.data;
    console.error("错误响应:", response);

    switch (response.type) {
      case "MULTER_ERROR":
        errorMessage = "文件上传错误: " + response.message;
        break;
      case "NO_FILE_ERROR":
        errorMessage = "请选择要上传的图片";
        break;
      default:
        errorMessage = response.message || "上传失败，请重试";
    }
  }

  ElMessage.error(errorMessage);
};

// 上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error("只能上传图片文件!");
    return false;
  }
  if (!isLt5M) {
    ElMessage.error("图片大小不能超过 5MB!");
    return false;
  }
  return true;
};

// 价格验证
const validatePrice = (value) => {
  if (value < 0) {
    currentProduct.value.price = 0;
    ElMessage.warning("价格不能为负数");
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

.product-image-upload {
  text-align: center;
}

.product-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
}

/* 暗色主题输入框样式 */
:deep(.dark-theme) .el-input__wrapper,
:deep(.dark-theme) .el-textarea__wrapper {
  background-color: #141414 !important;
  border-color: #363637 !important;
  box-shadow: 0 0 0 1px #363637 inset !important;
}

/* 黑色主题的商品描述输入框样式 */
:deep(.dark-theme) .el-input__inner,
:deep(.dark-theme) .el-textarea__inner {
  background-color: #141414 !important;
  color: #ffffff !important;
}

/* 白色主题的商品描述输入框样式 */
:deep(.el-textarea__inner) {
  background-color: #ffffff !important;
  color: #000000 !important;
}

/* 数字输入框按钮样式 */
:deep(.dark-theme) .el-input-number__decrease,
:deep(.dark-theme) .el-input-number__increase {
  background-color: #141414 !important;
  border-color: #363637 !important;
  color: #ffffff !important;
}

:deep(.dark-theme) .el-input-number__decrease:hover,
:deep(.dark-theme) .el-input-number__increase:hover {
  background-color: #1a1a1a !important;
  border-color: #363637 !important;
}

/* 对话框样式 */
:deep(.el-dialog) {
  background-color: var(--el-bg-color-overlay);
}

:deep(.el-dialog) .el-dialog__body {
  padding-top: 20px;
}

:deep(.el-dialog) .dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 自定义状态标签颜色 */
:deep(.el-tag--success) {
  background-color: #006400;
  border-color: #006400;
  color: white;
}

:deep(.el-tag--danger) {
  background-color: #8b0000;
  border-color: #8b0000;
  color: white;
}

/* 鼠标悬停效果 */
:deep(.el-tag--success:hover) {
  background-color: #008000;
  border-color: #008000;
}

:deep(.el-tag--danger:hover) {
  background-color: #a00000;
  border-color: #a00000;
}

/* 暗色主题对话框样式 */
:deep(.dark-theme) .el-dialog {
  background-color: #141414;
  border: 1px solid #363637;
}

:deep(.dark-theme) .el-dialog__header {
  border-bottom: 1px solid #363637;
}

:deep(.dark-theme) .el-dialog__title {
  color: #ffffff;
}

:deep(.dark-theme) .el-form-item__label {
  color: #ffffff;
}

:deep(.dark-theme) .el-dialog__footer {
  border-top: 1px solid #363637;
}

/* 添加审核错误消息的样式 */
:deep(.moderation-error) {
  background-color: #fef0f0 !important;
  border-color: #fde2e2 !important;
}

:deep(.moderation-error .el-message__content) {
  color: #000000 !important;
}

:deep(.moderation-error .el-message__closeBtn) {
  color: #000000 !important;
}

:deep(.dark-theme .moderation-error),
:deep(.moderation-error) {
  --el-message-text-color: #000000 !important;
  --el-message-bg-color: #fef0f0 !important;
  --el-message-border-color: #fde2e2 !important;
}

:deep(.dark-theme .moderation-error .el-message__content *),
:deep(.moderation-error .el-message__content *) {
  color: #000000 !important;
}
</style> 