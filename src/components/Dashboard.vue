<template>
  <div class="dashboard-content">
    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <h1>欢迎回来，{{ userInfo.username }}！</h1>
      <p class="welcome-desc">今天是 {{ currentDate }}，祝您工作愉快</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card today-orders">
          <div class="stat-content">
            <div class="stat-info">
              <h3>今日订单</h3>
              <div class="stat-number">{{ stats.todayOrders }}</div>
              <div class="stat-change positive">
                <el-icon><TrendCharts /></el-icon>
                +12.5%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card revenue">
          <div class="stat-content">
            <div class="stat-info">
              <h3>今日营收</h3>
              <div class="stat-number">¥{{ stats.todayRevenue }}</div>
              <div class="stat-change positive">
                <el-icon><TrendCharts /></el-icon>
                +8.2%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card customers">
          <div class="stat-content">
            <div class="stat-info">
              <h3>活跃用户</h3>
              <div class="stat-number">{{ stats.activeUsers }}</div>
              <div class="stat-change positive">
                <el-icon><TrendCharts /></el-icon>
                +15.8%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card dishes">
          <div class="stat-content">
            <div class="stat-info">
              <h3>热门菜品</h3>
              <div class="stat-number">{{ stats.popularDishes }}</div>
              <div class="stat-change neutral">
                <el-icon><Minus /></el-icon>
                0%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><Food /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-card class="quick-actions" title="快捷操作">
      <template #header>
        <h3>快捷操作</h3>
      </template>
      <el-row :gutter="16">
        <el-col :span="4">
          <div class="action-item" @click="$router.push('/canteens')">
            <el-icon class="action-icon"><Shop /></el-icon>
            <span>餐厅管理</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="action-item" @click="$router.push('/dishes')">
            <el-icon class="action-icon"><Menu /></el-icon>
            <span>添加菜品</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="action-item" @click="$router.push('/orders')">
            <el-icon class="action-icon"><Document /></el-icon>
            <span>查看订单</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="action-item" @click="$router.push('/users')">
            <el-icon class="action-icon"><User /></el-icon>
            <span>用户管理</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="action-item" @click="$router.push('/reports')">
            <el-icon class="action-icon"><DataLine /></el-icon>
            <span>数据分析</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="action-item">
            <el-icon class="action-icon"><Setting /></el-icon>
            <span>系统设置</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  TrendCharts,
  Money,
  Food,
  Minus,
  Setting,
  Document,
  User,
  Shop,
  Menu,
  DataLine
} from '@element-plus/icons-vue'

const router = useRouter()

// 用户信息 - 从父组件或Pinia获取
const userInfo = reactive({
  username: '管理员'
})

// 统计数据
const stats = reactive({
  todayOrders: 1234,
  todayRevenue: '25,680',
  activeUsers: 856,
  popularDishes: 42
})

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 页面加载时获取数据
onMounted(() => {
  fetchDashboardStats()
})

// 获取仪表盘统计数据
const fetchDashboardStats = async () => {
  try {
    // 这里应该是实际的API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 更新统计数据
    stats.todayOrders = Math.floor(Math.random() * 2000) + 500
    stats.todayRevenue = (Math.random() * 50000 + 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    stats.activeUsers = Math.floor(Math.random() * 1000) + 200
    stats.popularDishes = Math.floor(Math.random() * 50) + 20
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}
</script>

<style scoped>
.dashboard-content {
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section h1 {
  font-size: 28px;
  color: #1f2937;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.welcome-desc {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.today-orders {
  border-left: 4px solid #42b983;
}

.stat-card.revenue {
  border-left: 4px solid #f59e0b;
}

.stat-card.customers {
  border-left: 4px solid #3b82f6;
}

.stat-card.dishes {
  border-left: 4px solid #8b5cf6;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
}

.stat-info h3 {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.stat-change.neutral {
  color: #6b7280;
}

.stat-icon {
  font-size: 32px;
  opacity: 0.6;
}

.today-orders .stat-icon {
  color: #42b983;
}

.revenue .stat-icon {
  color: #f59e0b;
}

.customers .stat-icon {
  color: #3b82f6;
}

.dishes .stat-icon {
  color: #8b5cf6;
}

.quick-actions {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.quick-actions :deep(.el-card__header) {
  padding: 20px 20px 0;
  border-bottom: none;
}

.quick-actions h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.action-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.action-icon {
  font-size: 24px;
  color: #42b983;
}

.action-item span {
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-cards .el-col {
    margin-bottom: 16px;
  }

  .quick-actions .el-col {
    margin-bottom: 12px;
  }

  .welcome-section h1 {
    font-size: 24px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-content > * {
  animation: fadeIn 0.6s ease-out;
}

.stats-cards .el-col:nth-child(1) { animation-delay: 0.1s; }
.stats-cards .el-col:nth-child(2) { animation-delay: 0.2s; }
.stats-cards .el-col:nth-child(3) { animation-delay: 0.3s; }
.stats-cards .el-col:nth-child(4) { animation-delay: 0.4s; }
</style>