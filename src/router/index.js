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
import DietaryTag   from "@/components/DietaryTag.vue";
import AllergenTag from "@/components/AllergenTag.vue";

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            requiresAuth: false, // 登录页不需要认证
            title: '登录',
            hideLayout: true
        }
    },
    {
        path: '/',
        redirect: '/dashboard',
        meta: { requiresAuth: true } // 默认重定向到仪表盘，需要认证
    },
    {
        path: '/',
        component: Layout, // 使用布局组件作为父路由
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: '仪表盘', requiresAuth: true } // 需要认证
            },
            {
                path: 'canteens',
                name: 'Canteens',
                component: Canteens,
                meta: { title: '餐厅管理', requiresAuth: true } // 需要认证
            },
            {
                path: 'dishes',
                name: 'Dishes',
                component: DishManagement,
                meta: {title: '菜品管理', requiresAuth: true} // 需要认证
            },
            {
                path: 'publish',
                name: 'Publish',
                component: MenuManagement,
                meta: { title: '菜单管理', requiresAuth: true } // 需要认证
            },
            {
                path: 'feedback',
                name: 'Feedback',
                component: Feedback,
                meta: { title: '菜品评价与反馈系统', requiresAuth: true } // 需要认证
            },
            {
                path: 'guidance',
                name: 'Guidance',
                component: Guidance,
                meta: { title: '健康饮食指导', requiresAuth: true } // 需要认证
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('@/components/OrderDishes.vue'),
                meta: { title: '预定餐品', requiresAuth: true } // 需要认证
            },
            {
                path: 'order-management',
                name: 'OrderManagement',
                component: () => import('@/components/OrderManagement.vue'),
                meta: { title: '订单管理', requiresAuth: true } // 需要认证
            },
            {
                path: 'dietary-tags',
                name: 'DietaryTags',
                component: DietaryTag,
                meta: { title: '创建标签', requiresAuth: true } // 需要认证
            },
            {
                path: 'allergens',
                name: 'Allergens',
                component: AllergenTag,
                meta: { title: '创建标签', requiresAuth: true } // 需要认证
            },
            {
                path: 'package',
                name: 'Package',
                component: () => import('@/components/PackageManagement.vue'),
                meta: { title: '套餐管理', requiresAuth: true } // 需要认证
            },
            {
                path: 'room',
                name: 'Room',
                component: () => import('@/components/RoomManagement.vue'),
                meta: { title: '房间管理', requiresAuth: true } // 需要认证
            },
            {
                path: 'banquet',
                name: 'Banquet',
                component: () => import('@/components/BanquetOrder.vue'),
                meta: { title: '宴会预定', requiresAuth: true } // 需要认证
            },
            {
                path: 'banquet-management',
                name: 'BanquetManagement',
                component: () => import('@/components/BanquetManagement.vue'),
                meta: { title: '宴会管理', requiresAuth: true } // 需要认证
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('@/components/UserManagement.vue'),
                meta: { title: '用户管理', requiresAuth: true } // 需要认证
            }
        ]
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: {
            requiresAuth: false, // 注册页不需要认证
            title: '注册',
            hideLayout: true
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 检查用户是否已登录且 Token 是否有效
function isAuthenticated() {
    const token = localStorage.getItem('token')
    if (!token) {
        return false // 没有 Token 直接认为未认证
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000

        // 如果 token 已过期，移除并返回 false
        if (payload.exp && payload.exp < currentTime) {
            console.warn('JWT Token has expired. Removing from localStorage.');
            localStorage.removeItem('token')
            return false
        }

        return true // Token 有效
    } catch (error) {
        // Token 格式错误或其他解析错误，移除并返回 false
        console.error('Error parsing JWT Token:', error);
        localStorage.removeItem('token')
        return false
    }
}

// 路由守卫
router.beforeEach((to, from, next) => {
    const authenticated = isAuthenticated() // 获取当前的认证状态

    // 如果目标路由需要认证 (requiresAuth: true)
    if (to.meta.requiresAuth) {
        if (!authenticated) {
            // 如果用户未认证 (Token 过期或不存在)，重定向到登录页
            // 并带上 redirect 参数，以便登录后可以跳回原页面
            console.log(`Route ${to.name} requires authentication. Redirecting to login.`);
            next({ name: 'Login', query: { redirect: to.fullPath } })
        } else {
            // 如果已认证，继续导航
            next()
        }
    } else {
        // 如果目标路由不需要认证 (requiresAuth: false, 例如登录或注册页)
        if (authenticated && (to.name === 'Login' || to.name === 'Register')) {
            // 如果用户已经认证，但尝试访问登录或注册页，则重定向到仪表盘
            console.log(`Already authenticated. Redirecting from ${to.name} to dashboard.`);
            next({ name: 'Dashboard' })
        } else {
            // 其他情况，继续导航 (例如，未认证用户访问登录/注册页)
            next()
        }
    }
})

export default router
