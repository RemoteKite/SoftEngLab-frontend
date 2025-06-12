// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Canteens from '@/components/CanteenManagement.vue'
import Dashboard from '@/components/Dashboard.vue'
import Layout from '@/components/Layout.vue'
import Feedback from "@/components/Feedback.vue";
import Guidance from "@/components/Guidance.vue";
import DishManagement from "@/components/DishManagement.vue";
import MenuManagement from "@/components/MenuManagement.vue";
import Register from "@/components/Register.vue";
import CreateTag   from "@/components/CreateTag.vue";
import AllergenTag from "@/components/AllergenTag.vue";

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            requiresAuth: false,
            title: '登录',
            hideLayout: true
        }
    },
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/',
        component: Layout, // 使用布局组件作为父路由
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: '仪表盘' }
            },
            {
                path: 'canteens',
                name: 'Canteens',
                component: Canteens,
                meta: { title: '餐厅管理' }
            },
            {
                path: 'dishes',
                name: 'Dishes',
                component: DishManagement,
                meta: {title: '菜品管理'}
            },
            {
                path: 'publish',
                name: 'Publish',
                component: MenuManagement,
                meta: { title: '菜单管理' }
            },
            {
                path: 'feedback',
                name: 'Feedback',
                component: Feedback,
                meta: { title: '菜品评价与反馈系统' }
            },
            {
                path: 'guidance',
                name: 'Guidance',
                component: Guidance,
                meta: { title: '健康饮食指导' }
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('@/components/OrderDishes.vue'),
                meta: { title: '预定餐品' }
            },
            {
                path: 'order-management',
                name: 'OrderManagement',
                component: () => import('@/components/OrderManagement.vue'), // 假设组件放在components目录
                meta: { title: '订单管理' }
            },
            {
                path: 'dietary-tags',
                name: 'DietaryTags',
                component: CreateTag,
                meta: { title: '创建标签' }
            },
            {
                path: 'allergens',
                name: 'Allergens',
                component: AllergenTag,
                meta: { title: '创建标签' }
            },
            {
                path: 'package',
                name: 'Package',
                component: () => import('@/components/PackageManagement.vue'),
                meta: { title: '套餐管理' }
            },
            {
                path: 'room',
                name: 'Room',
                component: () => import('@/components/RoomManagement.vue'),
                meta: { title: '房间管理' }
            },
            {
                path: 'banquet',
                name: 'Banquet',
                component: () => import('@/components/BanquetOrder.vue'),
                meta: { title: '宴会预定' }
            },
            {
                path: 'banquet-management',
                name:     'BanquetManagement',
                component: () => import('@/components/BanquetManagement.vue'),
                meta: { title: '宴会管理' }
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('@/components/UserManagement.vue'),
                meta: { title: '用户管理' }
            }
        ]
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: {
            requiresAuth: false,
            title: '注册',
            hideLayout: true
        }
    }

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 检查用户是否已登录
function isAuthenticated() {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
        // 可以在这里添加 token 有效性检查
        // 比如检查过期时间或向服务器验证
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000

        // 如果 token 已过期
        if (payload.exp && payload.exp < currentTime) {
            localStorage.removeItem('token')
            return false
        }

        return true
    } catch (error) {
        // token 格式错误
        localStorage.removeItem('token')
        return false
    }
}

// 路由守卫
router.beforeEach((to, from, next) => {
    // 检查是否需要登录
    const token = localStorage.getItem('token')

    if ((to.path !== '/login')&&(to.path!=='/register') && !token) {
        next('/login')
    } else if ((to.path === '/login'||to.path==='/register') && token) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router