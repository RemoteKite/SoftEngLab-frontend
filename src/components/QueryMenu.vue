<template>
  <div class="menu-query-content">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>食堂菜品查询</h1>
      <p class="page-desc">选择食堂，查看今日提供的美味菜品</p>
    </div>

    <!-- 食堂选择 -->
    <el-card class="canteen-selector">
      <template #header>
        <h3>选择食堂</h3>
      </template>
      <el-select
          v-model="selectedCanteenId"
          placeholder="请选择食堂"
          @change="handleCanteenChange"
          size="large"
          style="width: 300px;"
      >
        <el-option
            v-for="canteen in canteenList"
            :key="canteen.id"
            :label="canteen.name"
            :value="canteen.id"
        >
          <div class="canteen-option">
            <span>{{ canteen.name }}</span>
            <span class="canteen-location">{{ canteen.location }}</span>
          </div>
        </el-option>
      </el-select>
    </el-card>

    <!-- 菜品展示区域 -->
    <div v-if="selectedCanteenId" class="menu-display">
      <!-- 食堂信息 -->
      <el-card class="canteen-info">
        <div class="canteen-details">
          <div class="canteen-header">
            <h2>{{ selectedCanteen.name }}</h2>
            <div class="canteen-status">
              <el-tag :type="selectedCanteen.isOpen ? 'success' : 'danger'">
                {{ selectedCanteen.isOpen ? '营业中' : '已打烊' }}
              </el-tag>
            </div>
          </div>
          <div class="canteen-meta">
            <div class="meta-item">
              <el-icon><Location /></el-icon>
              <span>{{ selectedCanteen.location }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>营业时间：{{ selectedCanteen.businessHours }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Phone /></el-icon>
              <span>联系电话：{{ selectedCanteen.phone }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 菜品分类筛选 -->
      <el-card class="category-filter">
        <template #header>
          <h3>菜品分类</h3>
        </template>
        <div class="category-tabs">
          <el-button
              v-for="category in categories"
              :key="category.id"
              :type="selectedCategory === category.id ? 'primary' : ''"
              @click="handleCategoryChange(category.id)"
              class="category-btn"
          >
            {{ category.name }}
            <el-badge :value="category.count" type="info" />
          </el-button>
        </div>
      </el-card>

      <!-- 菜品列表容器 -->
      <div class="dishes-scroll-container">
        <el-card class="dishes-container">
          <template #header>
            <h3>菜品列表</h3>
          </template>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="6" animated />
          </div>

          <!-- 菜品网格视图 -->
          <div v-else class="dishes-grid">
            <div
                v-for="dish in filteredDishes"
                :key="dish.id"
                class="dish-card"
            >
              <div class="dish-image">
                <img :src="dish.image" :alt="dish.name" />
                <div class="dish-status" v-if="!dish.available">
                  <span>暂时售罄</span>
                </div>
              </div>
              <div class="dish-info">
                <h4 class="dish-name">{{ dish.name }}</h4>
                <p class="dish-description">{{ dish.description }}</p>
                <div class="dish-meta">
                  <div class="dish-price">
                    <span class="current-price">¥{{ dish.price }}</span>
                    <span v-if="dish.originalPrice" class="original-price">¥{{ dish.originalPrice }}</span>
                  </div>
                  <div class="dish-rating">
                    <el-rate v-model="dish.rating" disabled size="small" />
                    <span class="rating-text">({{ dish.reviewCount }})</span>
                  </div>
                </div>
                <div class="dish-tags">
                  <el-tag
                      v-for="tag in dish.tags"
                      :key="tag"
                      size="small"
                      type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 无数据提示 -->
          <el-empty v-if="!loading && filteredDishes.length === 0" description="暂无菜品数据" />
        </el-card>
      </div>
    </div>

    <!-- 未选择食堂时的提示 -->
    <el-empty v-else description="请先选择一个食堂查看菜品" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Location,
  Clock,
  Phone
} from '@element-plus/icons-vue'

// 响应式数据
const selectedCanteenId = ref('')
const selectedCategory = ref('all')
const loading = ref(false)

// 食堂列表
const canteenList = reactive([
  {
    id: '1',
    name: '第一食堂',
    location: '教学楼A栋1楼',
    businessHours: '07:00-21:00',
    phone: '0571-12345678',
    isOpen: true
  },
  {
    id: '2',
    name: '第二食堂',
    location: '学生公寓B区',
    businessHours: '07:30-20:30',
    phone: '0571-12345679',
    isOpen: true
  },
  {
    id: '3',
    name: '清真食堂',
    location: '综合楼2楼',
    businessHours: '11:00-14:00, 17:00-20:00',
    phone: '0571-12345680',
    isOpen: false
  }
])

// 菜品分类
const categories = reactive([
  { id: 'all', name: '全部', count: 0 },
  { id: 'main', name: '主食', count: 0 },
  { id: 'meat', name: '荤菜', count: 0 },
  { id: 'vegetable', name: '素菜', count: 0 },
  { id: 'soup', name: '汤品', count: 0 },
  { id: 'snack', name: '小食', count: 0 }
])

// 菜品列表
const dishes = reactive([])

// 计算属性
const selectedCanteen = computed(() => {
  return canteenList.find(c => c.id === selectedCanteenId.value) || {}
})

const filteredDishes = computed(() => {
  if (selectedCategory.value === 'all') {
    return dishes
  }
  return dishes.filter(dish => dish.category === selectedCategory.value)
})

// 方法
const handleCanteenChange = async (canteenId) => {
  if (canteenId) {
    await fetchDishes(canteenId)
    selectedCategory.value = 'all'
  }
}

const handleCategoryChange = (categoryId) => {
  selectedCategory.value = categoryId
}

const fetchDishes = async (canteenId) => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟不同食堂的菜品数据
    const mockDishes = generateMockDishes(canteenId)
    dishes.splice(0, dishes.length, ...mockDishes)

    // 更新分类计数
    updateCategoryCount()

  } catch (error) {
    console.error('获取菜品失败:', error)
    ElMessage.error('获取菜品失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const generateMockDishes = (canteenId) => {
  const baseDishes = [
    {
      id: '1',
      name: '红烧肉',
      description: '精选五花肉，红烧入味，肥而不腻',
      price: 15.8,
      originalPrice: 18.0,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
      category: 'meat',
      rating: 4.5,
      reviewCount: 128,
      available: true,
      tags: ['招牌菜', '下饭']
    },
    {
      id: '2',
      name: '宫保鸡丁',
      description: '嫩滑鸡丁搭配花生米，酸甜微辣',
      price: 12.5,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop',
      category: 'meat',
      rating: 4.2,
      reviewCount: 95,
      available: true,
      tags: ['经典川菜', '微辣']
    },
    {
      id: '3',
      name: '麻婆豆腐',
      description: '嫩滑豆腐配麻辣肉末，口感丰富',
      price: 8.5,
      image: 'https://images.unsplash.com/photo-1633504581786-316c8002b1b2?w=300&h=200&fit=crop',
      category: 'vegetable',
      rating: 4.3,
      reviewCount: 76,
      available: true,
      tags: ['川菜', '辣味']
    },
    {
      id: '4',
      name: '白米饭',
      description: '优质东北大米，粒粒饱满',
      price: 2.0,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
      category: 'main',
      rating: 4.0,
      reviewCount: 200,
      available: true,
      tags: ['主食', '必备']
    },
    {
      id: '5',
      name: '紫菜蛋花汤',
      description: '清淡营养，紫菜蛋花香味浓郁',
      price: 5.0,
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop',
      category: 'soup',
      rating: 4.1,
      reviewCount: 45,
      available: false,
      tags: ['汤品', '清淡']
    },
    {
      id: '6',
      name: '蒸蛋羹',
      description: '嫩滑如豆腐，营养丰富',
      price: 6.0,
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop',
      category: 'snack',
      rating: 4.4,
      reviewCount: 67,
      available: true,
      tags: ['营养', '嫩滑']
    },
    // 添加更多菜品来测试滚动效果
    {
      id: '7',
      name: '糖醋排骨',
      description: '酸甜可口，老少皆宜的经典菜品',
      price: 18.0,
      image: 'https://images.unsplash.com/photo-1574653762327-c801d5ad2d5c?w=300&h=200&fit=crop',
      category: 'meat',
      rating: 4.6,
      reviewCount: 156,
      available: true,
      tags: ['酸甜', '经典']
    },
    {
      id: '8',
      name: '清炒小白菜',
      description: '新鲜小白菜，清淡爽口',
      price: 6.5,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop',
      category: 'vegetable',
      rating: 4.0,
      reviewCount: 89,
      available: true,
      tags: ['清淡', '素食']
    },
    {
      id: '9',
      name: '土豆丝',
      description: '爽脆土豆丝，家常美味',
      price: 5.5,
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop',
      category: 'vegetable',
      rating: 3.9,
      reviewCount: 78,
      available: true,
      tags: ['家常菜', '爽脆']
    },
    {
      id: '10',
      name: '牛肉面',
      description: '劲道面条配香浓牛肉汤',
      price: 16.0,
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop',
      category: 'main',
      rating: 4.7,
      reviewCount: 203,
      available: true,
      tags: ['面食', '牛肉']
    },
    {
      id: '11',
      name: '冬瓜汤',
      description: '清香冬瓜汤，解腻消暑',
      price: 4.5,
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop',
      category: 'soup',
      rating: 4.2,
      reviewCount: 34,
      available: true,
      tags: ['清汤', '消暑']
    },
    {
      id: '12',
      name: '煎饺',
      description: '外酥内嫩的煎饺，香气扑鼻',
      price: 8.0,
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300&h=200&fit=crop',
      category: 'snack',
      rating: 4.5,
      reviewCount: 112,
      available: true,
      tags: ['小食', '香脆']
    }
  ]

  // 根据食堂ID调整菜品
  return baseDishes.map(dish => ({
    ...dish,
    id: `${canteenId}_${dish.id}`,
    available: canteenId === '3' ? Math.random() > 0.3 : Math.random() > 0.1
  }))
}

const updateCategoryCount = () => {
  categories.forEach(category => {
    if (category.id === 'all') {
      category.count = dishes.length
    } else {
      category.count = dishes.filter(dish => dish.category === category.id).length
    }
  })
}

// 页面加载时初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
})
</script>

<style scoped>
/* 主容器样式 */
.menu-query-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h1 {
  font-size: 32px;
  color: #1f2937;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.page-desc {
  color: #6b7280;
  font-size: 18px;
  margin: 0;
}

.canteen-selector {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.canteen-selector :deep(.el-card__header) {
  padding: 20px 20px 0;
  border-bottom: none;
}

.canteen-selector h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.canteen-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canteen-location {
  color: #6b7280;
  font-size: 12px;
}

.menu-display {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.canteen-info {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.canteen-details {
  padding: 8px;
}

.canteen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.canteen-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
  font-weight: 700;
}

.canteen-meta {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.category-filter {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-filter :deep(.el-card__header) {
  padding: 20px 20px 0;
  border-bottom: none;
}

.category-filter h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.category-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 关键滚动容器样式 */
.dishes-scroll-container {
  /* 设置最大高度，超出部分可滚动 */
  max-height: calc(100vh - 600px);
  min-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  /* 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  /* 确保底部有足够的空间 */
  padding-bottom: 20px;
  margin-bottom: 20px;
  /* 滚动行为优化 */
  scroll-behavior: smooth;
}

/* Webkit浏览器滚动条样式 */
.dishes-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.dishes-scroll-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 4px;
}

.dishes-scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
  transition: background 0.3s;
}

.dishes-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dishes-container {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  /* 确保容器不会被截断 */
  margin-bottom: 0;
}

.dishes-container :deep(.el-card__header) {
  padding: 20px 20px 0;
  border-bottom: none;
}

.dishes-container h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.loading-container {
  padding: 20px;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
  /* 确保网格底部有足够空间 */
  padding-bottom: 40px;
}

.dish-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  /* 确保卡片不会被压缩 */
  min-height: 320px;
}

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dish-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.dish-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.dish-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
}

.dish-description {
  color: #6b7280;
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.dish-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.dish-price {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #dc2626;
}

.original-price {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: line-through;
}

.dish-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 11px;
  color: #6b7280;
}

.dish-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-query-content {
    padding: 16px 12px;
  }

  .dishes-scroll-container {
    max-height: calc(100vh - 500px);
    min-height: 300px;
  }

  .canteen-meta {
    flex-direction: column;
    gap: 12px;
  }

  .category-tabs {
    justify-content: center;
  }

  .dishes-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .dish-card {
    min-height: 280px;
  }

  .dish-image {
    height: 160px;
  }
}

@media (max-width: 480px) {
  .dishes-scroll-container {
    max-height: calc(100vh - 450px);
  }

  .dishes-grid {
    padding: 12px;
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

.menu-display > * {
  animation: fadeIn 0.6s ease-out;
}

/* 确保空状态组件也有合适的间距 */
.el-empty {
  padding: 40px 20px;
}
</style>