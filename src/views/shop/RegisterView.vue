<template>
  <div class="register">
    <el-card class="register-card">
      <h2>用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
          >
            <template #append>
              <el-button @click="showPassword = !showPassword">
                <el-icon>
                  <component :is="showPassword ? 'View' : 'Hide'" />
                </el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
          >
            <template #append>
              <el-button @click="showConfirmPassword = !showConfirmPassword">
                <el-icon>
                  <component :is="showConfirmPassword ? 'View' : 'Hide'" />
                </el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <div class="button-group">
          <el-button type="primary" @click="handleRegister">注册</el-button>
          <el-button type="danger" @click="$router.push('/login')"
            >返回登录</el-button
          >
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";
// eslint-disable-next-line no-unused-vars
import { View, Hide } from "@element-plus/icons-vue";

const router = useRouter();
const formRef = ref(null);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const validatePass = (rule, value, callback) => {
  if (value === "") {
    callback(new Error("请输入密码"));
  } else {
    if (form.confirmPassword !== "") {
      formRef.value?.validateField("confirmPassword");
    }
    callback();
  }
};

const validatePass2 = (rule, value, callback) => {
  if (value === "") {
    callback(new Error("请再次输入密码"));
  } else if (value !== form.password) {
    callback(new Error("两次输入密码不一致!"));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, validator: validatePass, trigger: "blur" },
    { min: 6, message: "密码长度不能小于 6 个字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: "blur" },
  ],
};

const handleRegister = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await axios.post("/api/auth/register", {
          username: form.username,
          password: form.password,
        });

        if (response.data.success) {
          ElMessage.success("注册成功");
          router.push("/login");
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "注册失败");
      }
    }
  });
};
</script>

<style scoped>
.register {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.register-card {
  width: 400px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-input-group__append button) {
  border: none;
  height: 100%;
  padding: 0 10px;
}
</style> 