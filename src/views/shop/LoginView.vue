<template>
  <div class="login">
    <el-card class="login-card">
      <h2>用户登录</h2>
      <el-form>
        <el-form-item label="用户名">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" />
        </el-form-item>
        <el-button type="primary" @click="handleLogin">登录</el-button>
        <el-button class="register-button" @click="$router.push('/register')"
          >注册新用户</el-button
        >
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../../stores/user";
import axios from "axios";
import { ElMessage } from "element-plus";

const router = useRouter();
const userStore = useUserStore();
const username = ref("");
const password = ref("");

const handleLogin = async () => {
  try {
    if (!username.value || !password.value) {
      ElMessage.warning("请输入用户名和密码");
      return;
    }

    const response = await axios.post("/api/auth/login", {
      username: username.value,
      password: password.value,
    });

    console.log("登录响应:", response.data);

    if (response.data.token) {
      userStore.setUser({
        username: username.value,
        token: response.data.token,
      });
      ElMessage.success("登录成功");
      router.push("/home");
    }
  } catch (error) {
    console.error("登录错误:", error);
    ElMessage.error(error.response?.data?.message || "登录失败");
  }
};
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-card {
  width: 400px;
}

.register-button {
  background-color: #f56c6c !important; /* Element Plus 的红色 */
  border-color: #f56c6c !important;
  color: #ffffff !important;
}

.register-button:hover {
  background-color: #f78989 !important; /* 稍微亮一点的红色用于悬停效果 */
  border-color: #f78989 !important;
}
</style> 