<template>
  <div class="layout">
    <el-header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">餐饮管理系统</span>
        </div>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="userInfo.avatar">
              {{ userInfo.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <span class="username">{{ userInfo.username || '访客' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <el-aside class="sidebar" width="240px">
        <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            router
            unique-opened
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/canteens">
            <el-icon><Shop /></el-icon>
            <span>餐厅管理</span>
          </el-menu-item>
            <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/room">
                <el-icon><Menu /></el-icon>
                <span>房间管理</span>
            </el-menu-item>
          <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/dishes">
          <el-icon><Search /></el-icon>
          <span>菜品管理</span>
          </el-menu-item>
          <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/publish">
            <el-icon><Edit /></el-icon>
            <span>发布菜谱</span>
          </el-menu-item>
            <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/package">
                <el-icon><Search /></el-icon>
                <span>套餐管理</span>
            </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><Calendar /></el-icon>
            <span>预定餐品</span>
          </el-menu-item>
          <el-menu-item index="/order-management">
              <el-icon><ChatDotRound /></el-icon>
              <span>订单管理</span>
          </el-menu-item>
            <el-menu-item index="/banquet">
                <el-icon><Calendar /></el-icon>
                <span>宴会预约</span>
            </el-menu-item>
            <el-menu-item index="/banquet-management">
                <el-icon><ChatDotRound /></el-icon>
                <span>宴会管理</span>
            </el-menu-item>
          <el-menu-item index="/feedback">
            <el-icon><ChatDotRound /></el-icon>
            <span>评价与反馈</span>
          </el-menu-item>
          <el-menu-item index="/guidance">
            <el-icon><FirstAidKit /></el-icon>
            <span>健康饮食指导</span>
          </el-menu-item>
          <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/dietary-tags">
            <el-icon><User /></el-icon>
            <span>饮食标签</span>
          </el-menu-item>
          <el-menu-item v-if="userInfo.role === 'ADMIN' || userInfo.role === 'STAFF'" index="/allergens">
            <el-icon><User /></el-icon>
            <span>过敏原标签</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Odometer,
  Shop,
  Menu,
  Document,
  User,
  DataLine,
  // 新增的图标
  Edit, // 发布菜谱
  InfoFilled, // 食堂信息展示
  Search, // 查询食堂菜品
  Calendar, // 预定餐品
  Filter, // 筛选菜品
  ChatDotRound, // 评价与反馈
  FirstAidKit // 健康饮食指导
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 用户信息 - 现在初始化为空，将在onMounted中从JWT解析
const userInfo = reactive({
    username: '',
    avatar: '', // 可以在JWT中包含头像URL，或根据username生成
    role: '' // 用户角色，例如 'ADMIN', 'STAFF', 'DINER'
})

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 从 JWT Token 中获取用户角色、用户名。
const getUserInfoFromJwt = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('未检测到登录凭证。');
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
        // 'sub' 字段通常是用户ID或用户名
        const username = decodedPayload.sub || '未知用户';
        // 假设头像信息不在JWT中，可以根据username生成，或从其他地方获取
        const avatar = ''; // 这里留空，您可以根据需求从后端获取或生成
        return { username, role, avatar };
    } catch (error) {
        console.error('解析JWT Token失败:', error);
        ElMessage.error('JWT Token解析失败，请尝试重新登录。');
        return { username: '访客', role: 'ANONYMOUS' };
    }
};

// 下拉菜单命令处理
const handleCommand = (command) => {
    switch (command) {
        case 'logout':
            handleLogout()
            break
    }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

        // 清除本地存储
        localStorage.removeItem('token')
        // 移除userInfo和rememberLogin，因为它们不再直接用于初始化
        localStorage.removeItem('userInfo')
        localStorage.removeItem('rememberLogin')

    ElMessage.success('已成功退出登录')
    router.push('/login')

  } catch (error) {
    // 用户取消了操作
  }
}

// 页面加载时获取用户信息
onMounted(() => {
    const user = getUserInfoFromJwt();
    Object.assign(userInfo, user);
});
</script>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  color: #1f2937;
  font-weight: 500;
}

.main-container {
  flex: 1;
}

.sidebar {
  background: #fff;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.08);
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 12px;
  border-radius: 8px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #42b983, #2d8f5f);
  color: white;
}

.content {
  background: #f5f5f5;
  padding: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .header {
    padding: 0 16px;
  }

  .content {
    padding: 16px;
  }
}
</style>