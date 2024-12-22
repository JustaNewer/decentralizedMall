import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        component: () => import('../views/shop/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        component: () => import('../views/shop/RegisterView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/home',
        component: () => import('../views/shop/HomeView.vue'),
        meta: { requiresAuth: true },
        redirect: '/home/my-products',
        children: [
            {
                path: 'profile',
                component: () => import('../views/shop/ProfileView.vue')
            },
            {
                path: 'my-products',
                component: () => import('../views/shop/MyProductsView.vue')
            },
            {
                path: 'buy-products',
                component: () => import('../views/shop/BuyProductsView.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const store = useUserStore()

    if (to.meta.requiresAuth && !store.isLoggedIn) {
        next('/login')
    } else {
        next()
    }
})

export default router 