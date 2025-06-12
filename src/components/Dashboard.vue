<template>
    <div class="dashboard-container">
        <h1 class="dashboard-title">欢迎回来，{{ userInfo.username }}！</h1>


        <h2 class="section-title">快速通道</h2>

        <div class="quick-links-grid">
            <el-card class="quick-link-card" shadow="hover" @click="goTo('/orders')">
                <el-icon class="link-icon"><Calendar /></el-icon>
                <span class="link-text">预定餐品</span>
            </el-card>

            <el-card v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" class="quick-link-card" shadow="hover" @click="goTo('/canteens')">
                <el-icon class="link-icon"><Shop /></el-icon>
                <span class="link-text">餐厅管理</span>
            </el-card>

            <el-card v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" class="quick-link-card" shadow="hover" @click="goTo('/dishes')">
                <el-icon class="link-icon"><Food /></el-icon>
                <span class="link-text">菜品管理</span>
            </el-card>

            <el-card class="quick-link-card" shadow="hover" @click="goTo('/feedback')">
                <el-icon class="link-icon"><ChatDotRound /></el-icon>
                <span class="link-text">评价与反馈</span>
            </el-card>

            <el-card v-if="userInfo.role === 'ADMIN'" class="quick-link-card" shadow="hover" @click="goTo('/users')">
                <el-icon class="link-icon"><User /></el-icon>
                <span class="link-text">用户管理</span>
            </el-card>

            <el-card class="quick-link-card" shadow="hover" @click="goTo('/guidance')">
                <el-icon class="link-icon"><FirstAidKit /></el-icon>
                <span class="link-text">健康饮食指导</span>
            </el-card>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
    Tickets,
    Money,
    UserFilled,
    StarFilled,
    Calendar,
    Shop,
    Food, // Assuming Food icon exists or similar, otherwise use another general icon like Dish
    ChatDotRound,
    User,
    FirstAidKit,
} from '@element-plus/icons-vue';

const router = useRouter();

// 用户信息 - 从 localStorage 获取或默认访客
const userInfo = reactive({
    username: '访客',
    role: 'ANONYMOUS', // 默认访客角色
});


// 从 JWT Token 中获取用户角色、用户名。
const getUserInfoFromJwt = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        return { username: '访客', role: 'ANONYMOUS' };
    }

    try {
        const payloadBase64 = token.split('.')[1]; // JWT 的第二部分是 Payload
        const decodedPayload = JSON.parse(atob(payloadBase64));

        let role = 'DINER'; // 默认角色
        if (decodedPayload.roles && Array.isArray(decodedPayload.roles)) {
            if (decodedPayload.roles.includes('ROLE_ADMIN')) {
                role = 'ADMIN';
            } else if (decodedPayload.roles.includes('ROLE_STAFF')) {
                role = 'STAFF';
            }
        }
        const username = decodedPayload.sub || '未知用户';
        return { username, role };
    } catch (error) {
        console.error('解析JWT Token失败:', error);
        ElMessage.error('JWT Token解析失败，请尝试重新登录。');
        return { username: '访客', role: 'ANONYMOUS' };
    }
};

// 导航到指定路由
const goTo = (path) => {
    router.push(path);
};

onMounted(() => {
    const user = getUserInfoFromJwt();
    Object.assign(userInfo, user);

    // 可以在这里根据实际后端API获取真实统计数据
    // 例如: fetchDashboardStats().then(data => Object.assign(dailyStats, data));
});
</script>

<style scoped>
.dashboard-container {
    padding: 24px;
    background-color: #f5f5f5;
    min-height: calc(100vh - 64px - 48px); /* Adjust for header/footer if any */
}

.dashboard-title {
    font-size: 32px;
    color: #1f2937;
    margin-bottom: 30px;
    text-align: center;
    font-weight: 700;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.stat-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #ffffff, #f0f8ff); /* Light gradient */
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.card-content {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px;
}

.stat-icon {
    font-size: 40px;
    color: #409EFF; /* El-button primary color */
    min-width: 40px; /* Ensure consistent icon size */
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
}

/* Specific color for each stat icon for better visual distinction */
.stat-card:nth-child(1) .stat-icon { color: #67C23A; } /* Green for orders */
.stat-card:nth-child(2) .stat-icon { color: #E6A23C; } /* Orange for revenue */
.stat-card:nth-child(3) .stat-icon { color: #409EFF; } /* Blue for users */
.stat-card:nth-child(4) .stat-icon { color: #F56C6C; } /* Red for rating */


.section-title {
    font-size: 24px;
    color: #1f2937;
    margin-bottom: 25px;
    text-align: center;
    font-weight: 600;
}

.quick-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
}

.quick-link-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: white;
}

.quick-link-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    border-color: #409EFF;
}

.link-icon {
    font-size: 48px;
    color: #409EFF; /* Default link icon color */
    margin-bottom: 10px;
}

.link-text {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

/* Specific colors for quick link icons */
.quick-link-card:nth-child(1) .link-icon { color: #F56C6C; } /* Red for orders */
.quick-link-card:nth-child(2) .link-icon { color: #E6A23C; } /* Orange for canteen */
.quick-link-card:nth-child(3) .link-icon { color: #67C23A; } /* Green for dishes */
.quick-link-card:nth-child(4) .link-icon { color: #909399; } /* Gray for feedback */
.quick-link-card:nth-child(5) .link-icon { color: #409EFF; } /* Blue for users */
.quick-link-card:nth-child(6) .link-icon { color: #606266; } /* Darker gray for guidance */

/* Responsive adjustments */
@media (max-width: 768px) {
    .dashboard-title {
        font-size: 28px;
    }
    .stats-grid, .quick-links-grid {
        grid-template-columns: 1fr;
    }
    .stat-card, .quick-link-card {
        padding: 15px;
    }
    .stat-icon {
        font-size: 36px;
    }
    .stat-value {
        font-size: 24px;
    }
    .link-icon {
        font-size: 40px;
    }
    .link-text {
        font-size: 15px;
    }
}
</style>
