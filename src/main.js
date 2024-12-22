import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 配置 axios 默认值
axios.defaults.baseURL = 'http://localhost:3000'

// 添加请求拦截器
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 添加响应拦截器
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // token 过期或无效，清除本地存储并跳转到登录页
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            router.push('/login')
        }
        return Promise.reject(error)
    }
)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
