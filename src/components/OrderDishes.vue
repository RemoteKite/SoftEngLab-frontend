<template>
  <div class="reservation-content">
    <div class="page-header">
      <h1>预定餐品</h1>
      <p class="page-desc">提前预定，节约排队时间，享受便捷就餐体验</p>
    </div>

    <el-card class="filter-section">
      <el-row :gutter="20" class="filters">
        <el-col :span="6">
          <div class="filter-item">
            <label>选择餐厅</label>
            <el-select v-model="filters.canteenId" placeholder="请选择餐厅" @change="fetchMenuData">
              <el-option
                  v-for="canteen in canteens"
                  :key="canteen.id"
                  :label="canteen.name"
                  :value="canteen.id"
              />
            </el-select>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="filter-item">
            <label>预定时间</label>
            <el-date-picker
                v-model="filters.reservationDate"
                type="datetime"
                placeholder="选择预定时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                :disabled-date="disabledDate"
                :disabled-hours="disabledHours"
            />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="filter-item">
            <label>菜品分类</label>
            <el-select v-model="filters.category" placeholder="选择分类">
              <el-option label="全部" value="" />
              <el-option label="主食" value="main" />
              <el-option label="汤品" value="soup" />
              <el-option label="小菜" value="side" />
              <el-option label="饮品" value="drink" />
            </el-select>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="filter-item">
            <label>价格范围</label>
            <el-select v-model="filters.priceRange" placeholder="选择价格">
              <el-option label="全部" value="" />
              <el-option label="10元以下" value="0-10" />
              <el-option label="10-20元" value="10-20" />
              <el-option label="20-30元" value="20-30" />
              <el-option label="30元以上" value="30+" />
            </el-select>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="menu-section">
      <template #header>
        <div class="section-header">
          <h3>可预定菜品</h3>
          <div class="cart-summary" v-if="cartItems.length > 0">
            <el-badge :value="totalQuantity" class="cart-badge">
              <el-icon class="cart-icon"><ShoppingCart /></el-icon>
            </el-badge>
            <span class="cart-total">¥{{ totalAmount }}</span>
          </div>
        </div>
      </template>

      <div class="menu-grid" v-loading="loading.value">
        <div
            v-for="dish in filteredDishes"
            :key="dish.id"
            class="dish-card"
            :class="{ 'out-of-stock': !dish.available }"
        >
          <div class="dish-image">
            <img :src="dish.image" :alt="dish.name" />
            <div class="dish-tag" v-if="dish.isRecommended">
              <el-tag type="success" size="small">推荐</el-tag>
            </div>
            <div class="dish-tag hot-tag" v-if="dish.isHot">
              <el-tag type="danger" size="small">热销</el-tag>
            </div>
          </div>

          <div class="dish-info">
            <h4 class="dish-name">{{ dish.name }}</h4>
            <p class="dish-description">{{ dish.description }}</p>

            <div class="dish-meta">
              <div class="rating">
                <el-rate
                    v-model="dish.rating"
                    disabled
                    size="small"
                    show-score
                    text-color="#ff9900"
                />
              </div>
              <div class="sales">已售 {{ dish.sales }}</div>
            </div>

            <div class="dish-footer">
              <div class="price-section">
                <span class="current-price">¥{{ dish.price }}</span>
                <span v-if="dish.originalPrice" class="original-price">¥{{ dish.originalPrice }}</span>
              </div>

              <div class="quantity-control" v-if="dish.available">
                <el-button
                    size="small"
                    circle
                    :disabled="!getCartQuantity(dish.id)"
                    @click="removeFromCart(dish.id)"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
                <span class="quantity">{{ getCartQuantity(dish.id) || 0 }}</span>
                <el-button
                    size="small"
                    circle
                    type="primary"
                    @click="addToCart(dish)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>

              <div v-else class="out-of-stock-text">暂时售罄</div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading.value && filteredDishes.length === 0" description="暂无可预定的菜品" />
    </el-card>

    <div class="cart-footer" v-if="cartItems.length > 0">
      <div class="cart-info">
        <div class="cart-summary-detail">
          <span class="item-count">已选 {{ totalQuantity }} 样</span>
          <span class="total-price">¥{{ totalAmount }}</span>
        </div>
        <div class="delivery-info">
          <el-icon><Clock /></el-icon>
          <span>预计 {{ estimatedTime }} 分钟后可取餐</span>
        </div>
      </div>

      <el-button
          type="primary"
          size="large"
          class="checkout-btn"
          :disabled="!filters.canteenId || !filters.reservationDate"
          @click="proceedToCheckout"
      >
        立即预定
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ShoppingCart,
  Plus,
  Minus,
  Clock
} from '@element-plus/icons-vue'

const router = useRouter()

// 筛选条件
const filters = reactive({
  canteenId: '',
  reservationDate: '',
  category: '',
  priceRange: ''
})

// 餐厅列表
const canteens = reactive([
  { id: 1, name: '第一食堂', address: '教学楼A座', openTime: '07:00-21:00' },
  { id: 2, name: '第二食堂', address: '宿舍区B座', openTime: '07:00-21:00' },
  { id: 3, name: '风味餐厅', address: '学生活动中心', openTime: '10:00-22:00' },
  { id: 4, name: '清真餐厅', address: '教学楼C座', openTime: '07:00-20:00' }
])

// 菜品数据
const dishes = reactive([
  {
    id: 1,
    name: '红烧肉',
    description: '精选五花肉，口感软糯，肥而不腻',
    price: 18,
    originalPrice: 22,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
    category: 'main',
    rating: 4.8,
    sales: 1250,
    available: true,
    isRecommended: true,
    isHot: true
  },
  {
    id: 2,
    name: '宫保鸡丁',
    description: '经典川菜，鸡肉嫩滑，花生酥脆',
    price: 15,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
    category: 'main',
    rating: 4.5,
    sales: 980,
    available: true,
    isRecommended: false,
    isHot: true
  },
  {
    id: 3,
    name: '西红柿鸡蛋汤',
    description: '清淡爽口，营养丰富的家常汤品',
    price: 8,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop',
    category: 'soup',
    rating: 4.3,
    sales: 650,
    available: true,
    isRecommended: false,
    isHot: false
  },
  {
    id: 4,
    name: '青椒土豆丝',
    description: '清脆爽口，下饭神器',
    price: 10,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop',
    category: 'side',
    rating: 4.2,
    sales: 420,
    available: true,
    isRecommended: false,
    isHot: false
  },
  {
    id: 5,
    name: '可乐',
    description: '冰镇可口可乐，清爽解腻',
    price: 5,
    image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=300&h=200&fit=crop',
    category: 'drink',
    rating: 4.0,
    sales: 800,
    available: false,
    isRecommended: false,
    isHot: false
  },
  {
    id: 6,
    name: '麻婆豆腐',
    description: '经典川菜，麻辣鲜香，豆腐嫩滑',
    price: 12,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop',
    category: 'main',
    rating: 4.6,
    sales: 720,
    available: true,
    isRecommended: true,
    isHot: false
  }
])

// 购物车
const cartItems = reactive([])
const loading = reactive({ value: false }) // loading 状态

// 计算属性
const filteredDishes = computed(() => {
  return dishes.filter(dish => {
    if (filters.category && dish.category !== filters.category) return false
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''))
      if (max) {
        if (dish.price < parseInt(min) || dish.price > parseInt(max)) return false
      } else {
        if (dish.price < parseInt(min)) return false
      }
    }
    return true
  })
})

const totalQuantity = computed(() => {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0)
})

const totalAmount = computed(() => {
  return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
})

const estimatedTime = computed(() => {
  return Math.max(15, totalQuantity.value * 3)
})

// 方法
const fetchMenuData = async () => {
  if (!filters.canteenId) return

  loading.value = true // 设置加载状态为 true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    ElMessage.success('菜品数据加载完成')
  } catch (error) {
    ElMessage.error('加载菜品失败')
  } finally {
    loading.value = false // 无论成功或失败，都将加载状态设置为 false
  }
}

const getCartQuantity = (dishId) => {
  const item = cartItems.find(item => item.id === dishId)
  return item ? item.quantity : 0
}

const addToCart = (dish) => {
  const existingItem = cartItems.find(item => item.id === dish.id)
  if (existingItem) {
    existingItem.quantity++
  } else {
    cartItems.push({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1,
      image: dish.image
    })
  }
  ElMessage.success(`${dish.name} 已加入购物车`)
}

const removeFromCart = (dishId) => {
  const itemIndex = cartItems.findIndex(item => item.id === dishId)
  if (itemIndex > -1) {
    const item = cartItems[itemIndex]
    if (item.quantity > 1) {
      item.quantity--
    } else {
      cartItems.splice(itemIndex, 1)
    }
  }
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

const disabledHours = () => {
  const hours = []
  const currentHour = new Date().getHours()
  for (let i = 0; i < currentHour; i++) {
    hours.push(i)
  }
  for (let i = 22; i < 24; i++) {
    hours.push(i)
  }
  return hours
}

const proceedToCheckout = async () => {
  try {
    await ElMessageBox.confirm(
        `确认预定 ${totalQuantity.value} 样菜品，总金额 ¥${totalAmount.value} 吗？`,
        '确认预定',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'info'
        }
    )

    // 模拟提交预定
    const orderData = {
      canteenId: filters.canteenId,
      reservationDate: filters.reservationDate,
      items: cartItems.map(item => ({
        dishId: item.id,
        quantity: item.quantity
      })),
      totalAmount: totalAmount.value
    }

    ElMessage.success('预定成功！请按时到餐厅取餐')

    // 清空购物车
    cartItems.splice(0)

    // 跳转到订单页面
    // router.push('/orders') // 如果没有实际的 /orders 路由，这行会报错，可以暂时注释掉或指向一个存在的路由

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('预定失败，请重试')
    }
  }
}

// 页面加载
onMounted(() => {
  // 设置默认预定时间为1小时后
  const defaultTime = new Date()
  defaultTime.setHours(defaultTime.getHours() + 1)
  filters.reservationDate = defaultTime.toISOString().slice(0, 16).replace('T', ' ')
})
</script>

<style scoped>
.reservation-content {
  margin: 0 auto;
  padding-bottom: 100px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  color: #1f2937;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.page-desc {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.filter-section {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filters {
  padding: 8px 0;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.filter-item .el-select,
.filter-item .el-date-editor {
  width: 100%;
}

.menu-section {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.cart-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-badge {
  cursor: pointer;
}

.cart-icon {
  font-size: 24px;
  color: #42b983;
}

.cart-total {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.dish-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dish-card.out-of-stock {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.dish-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.dish-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-tag {
  position: absolute;
  top: 8px;
  left: 8px;
}

.hot-tag {
  top: 8px;
  right: 8px;
  left: auto;
}

.dish-info {
  padding: 16px;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.dish-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.dish-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.rating {
  display: flex;
  align-items: center;
}

.sales {
  font-size: 12px;
  color: #9ca3af;
}

.dish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.original-price {
  font-size: 14px;
  color: #9ca3af;
  text-decoration: line-through;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  min-width: 20px;
  text-align: center;
}

.out-of-stock-text {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

.cart-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
}

.cart-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-summary-detail {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-count {
  font-size: 14px;
  color: #6b7280;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.delivery-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.checkout-btn {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  height: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters .el-col {
    margin-bottom: 16px;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }

  .cart-footer {
    flex-direction: column;
    gap: 16px;
    padding: 20px 16px;
  }

  .cart-info {
    width: 100%;
    text-align: center;
  }

  .checkout-btn {
    width: 100%;
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

.reservation-content > * {
  animation: fadeIn 0.6s ease-out;
}

.dish-card {
  animation: fadeIn 0.6s ease-out;
}

.dish-card:nth-child(1) { animation-delay: 0.1s; }
.dish-card:nth-child(2) { animation-delay: 0.2s; }
.dish-card:nth-child(3) { animation-delay: 0.3s; }
.dish-card:nth-child(4) { animation-delay: 0.4s; }
.dish-card:nth-child(5) { animation-delay: 0.5s; }
.dish-card:nth-child(6) { animation-delay: 0.6s; }
</style>
