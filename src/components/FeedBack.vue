<template>
  <div class="rating-system">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>菜品评价与反馈</h1>
      <p class="header-desc">您的意见是我们改进的动力，请为您品尝的菜品进行评价</p>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card">
      <el-row :gutter="16" class="filter-row">
        <el-col :span="6">
          <el-select v-model="filterCanteen" placeholder="选择餐厅" clearable>
            <el-option label="全部餐厅" value=""></el-option>
            <el-option label="第一餐厅" value="canteen1"></el-option>
            <el-option label="第二餐厅" value="canteen2"></el-option>
            <el-option label="第三餐厅" value="canteen3"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterCategory" placeholder="菜品分类" clearable>
            <el-option label="全部分类" value=""></el-option>
            <el-option label="主食类" value="staple"></el-option>
            <el-option label="荤菜类" value="meat"></el-option>
            <el-option label="素菜类" value="vegetable"></el-option>
            <el-option label="汤类" value="soup"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="ratingFilter" placeholder="评分筛选" clearable>
            <el-option label="全部评分" value=""></el-option>
            <el-option label="5星好评" value="5"></el-option>
            <el-option label="4星以上" value="4"></el-option>
            <el-option label="3星以上" value="3"></el-option>
            <el-option label="2星以下" value="2"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
              v-model="searchKeyword"
              placeholder="搜索菜品名称"
              clearable
              @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- 我的评价历史 -->
    <el-card class="my-reviews-card">
      <template #header>
        <div class="card-header">
          <h3>我的评价历史</h3>
          <el-button type="primary" @click="showAddReviewDialog = true">
            <el-icon><Plus /></el-icon>
            添加新评价
          </el-button>
        </div>
      </template>

      <div class="reviews-list">
        <div
            v-for="review in myReviews"
            :key="review.id"
            class="review-item"
        >
          <div class="review-header">
            <div class="dish-info">
              <img :src="review.dishImage" :alt="review.dishName" class="dish-image">
              <div class="dish-details">
                <h4>{{ review.dishName }}</h4>
                <p class="restaurant-name">{{ review.canteenName }}</p>
                <div class="rating-display">
                  <el-rate
                      v-model="review.rating"
                      disabled
                      show-score
                      text-color="#ff9900"
                  />
                </div>
              </div>
            </div>
            <div class="review-meta">
              <span class="review-date">{{ formatDate(review.createTime) }}</span>
              <div class="review-actions">
                <el-button
                    size="small"
                    type="text"
                    @click="editReview(review)"
                >
                  编辑
                </el-button>
                <el-button
                    size="small"
                    type="text"
                    @click="deleteReview(review.id)"
                    class="delete-btn"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>

          <div class="review-content">
            <p>{{ review.comment }}</p>
            <div v-if="review.images && review.images.length" class="review-images">
              <img
                  v-for="(image, index) in review.images"
                  :key="index"
                  :src="image"
                  :alt="`评价图片${index + 1}`"
                  class="review-image"
                  @click="previewImage(image)"
              >
            </div>
          </div>

          <div class="review-tags">
            <el-tag
                v-for="tag in review.tags"
                :key="tag"
                size="small"
                class="review-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <div v-if="!myReviews.length" class="empty-state">
        <el-empty description="暂无评价记录">
          <el-button type="primary" @click="showAddReviewDialog = true">
            立即评价
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 热门菜品评价 -->
    <el-card class="popular-dishes-card">
      <template #header>
        <h3>热门菜品评价</h3>
      </template>

      <el-row :gutter="16">
        <el-col
            v-for="dish in popularDishes"
            :key="dish.id"
            :span="8"
        >
          <el-card class="dish-card" shadow="hover">
            <img :src="dish.image" :alt="dish.name" class="dish-cover">
            <div class="dish-info-content">
              <h4>{{ dish.name }}</h4>
              <p class="dish-restaurant">{{ dish.canteenName }}</p>
              <div class="dish-rating">
                <el-rate
                    v-model="dish.averageRating"
                    disabled
                    show-score
                    text-color="#ff9900"
                />
                <span class="review-count">({{ dish.reviewCount }}人评价)</span>
              </div>
              <div class="dish-tags">
                <el-tag
                    v-for="tag in dish.popularTags"
                    :key="tag"
                    size="small"
                    type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <el-button
                  type="primary"
                  size="small"
                  @click="rateThisDish(dish)"
                  class="rate-btn"
              >
                我要评价
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 添加/编辑评价对话框 -->
    <el-dialog
        v-model="showAddReviewDialog"
        :title="editingReview ? '编辑评价' : '添加评价'"
        width="600px"
        class="review-dialog"
    >
      <el-form
          ref="reviewFormRef"
          :model="reviewForm"
          :rules="reviewRules"
          label-width="80px"
      >
        <el-form-item label="选择餐厅" prop="canteenId">
          <el-select
              v-model="reviewForm.canteenId"
              placeholder="请选择餐厅"
              @change="handleCanteenChange"
          >
            <el-option label="第一餐厅" value="canteen1"></el-option>
            <el-option label="第二餐厅" value="canteen2"></el-option>
            <el-option label="第三餐厅" value="canteen3"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="选择菜品" prop="dishId">
          <el-select
              v-model="reviewForm.dishId"
              placeholder="请选择菜品"
              filterable
          >
            <el-option
                v-for="dish in availableDishes"
                :key="dish.id"
                :label="dish.name"
                :value="dish.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="评分" prop="rating">
          <el-rate
              v-model="reviewForm.rating"
              show-text
              :texts="['很差', '较差', '一般', '推荐', '强推']"
          />
        </el-form-item>

        <el-form-item label="评价内容" prop="comment">
          <el-input
              v-model="reviewForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请分享您对这道菜的看法..."
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="标签">
          <div class="tag-selection">
            <el-checkbox-group v-model="reviewForm.tags">
              <el-checkbox label="味道好">味道好</el-checkbox>
              <el-checkbox label="分量足">分量足</el-checkbox>
              <el-checkbox label="价格实惠">价格实惠</el-checkbox>
              <el-checkbox label="新鲜">新鲜</el-checkbox>
              <el-checkbox label="口感佳">口感佳</el-checkbox>
              <el-checkbox label="营养丰富">营养丰富</el-checkbox>
              <el-checkbox label="偏咸">偏咸</el-checkbox>
              <el-checkbox label="偏淡">偏淡</el-checkbox>
              <el-checkbox label="偏辣">偏辣</el-checkbox>
              <el-checkbox label="温度适中">温度适中</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>

        <el-form-item label="上传图片">
          <el-upload
              v-model:file-list="reviewForm.imageList"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="3"
              accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">最多上传3张图片</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddReviewDialog = false">取消</el-button>
          <el-button type="primary" @click="submitReview">
            {{ editingReview ? '更新评价' : '提交评价' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="showImagePreview" title="图片预览" width="50%">
      <img :src="previewImageUrl" alt="预览图片" style="width: 100%;">
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Star,
  Picture
} from '@element-plus/icons-vue'

// 响应式数据
const filterCanteen = ref('')
const filterCategory = ref('')
const ratingFilter = ref('')
const searchKeyword = ref('')
const showAddReviewDialog = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const reviewFormRef = ref()
const editingReview = ref(null)

// 我的评价列表
const myReviews = ref([
  {
    id: 1,
    dishId: 'dish1',
    dishName: '红烧肉',
    dishImage: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop',
    canteenName: '第一餐厅',
    rating: 5,
    comment: '味道很棒，肉质鲜嫩，肥瘦相间，入口即化。调料搭配恰到好处，不会过于油腻。',
    tags: ['味道好', '分量足', '口感佳'],
    images: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
    ],
    createTime: new Date('2024-01-15T12:30:00')
  },
  {
    id: 2,
    dishId: 'dish2',
    dishName: '麻婆豆腐',
    dishImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
    canteenName: '第二餐厅',
    rating: 4,
    comment: '经典川菜，豆腐嫩滑，麻辣适中，很下饭。但是有点偏咸，建议减少一点盐分。',
    tags: ['味道好', '偏辣', '偏咸'],
    images: [],
    createTime: new Date('2024-01-14T18:45:00')
  }
])

// 热门菜品
const popularDishes = ref([
  {
    id: 'dish1',
    name: '红烧肉',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop',
    canteenName: '第一餐厅',
    averageRating: 4.5,
    reviewCount: 128,
    popularTags: ['味道好', '分量足', '口感佳']
  },
  {
    id: 'dish2',
    name: '麻婆豆腐',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
    canteenName: '第二餐厅',
    averageRating: 4.2,
    reviewCount: 96,
    popularTags: ['味道好', '偏辣', '下饭']
  },
  {
    id: 'dish3',
    name: '糖醋里脊',
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop',
    canteenName: '第三餐厅',
    averageRating: 4.7,
    reviewCount: 156,
    popularTags: ['酸甜', '外酥内嫩', '色泽诱人']
  }
])

// 可选菜品列表
const availableDishes = ref([
  { id: 'dish1', name: '红烧肉', canteenId: 'canteen1' },
  { id: 'dish2', name: '麻婆豆腐', canteenId: 'canteen2' },
  { id: 'dish3', name: '糖醋里脊', canteenId: 'canteen3' },
  { id: 'dish4', name: '宫保鸡丁', canteenId: 'canteen1' },
  { id: 'dish5', name: '西红柿鸡蛋', canteenId: 'canteen2' }
])

// 评价表单
const reviewForm = reactive({
  canteenId: '',
  dishId: '',
  rating: 0,
  comment: '',
  tags: [],
  imageList: []
})

// 表单验证规则
const reviewRules = {
  canteenId: [
    { required: true, message: '请选择餐厅', trigger: 'change' }
  ],
  dishId: [
    { required: true, message: '请选择菜品', trigger: 'change' }
  ],
  rating: [
    { required: true, message: '请给出评分', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === 0) {
          callback(new Error('请给出评分'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  comment: [
    { required: true, message: '请填写评价内容', trigger: 'blur' },
    { min: 5, message: '评价内容至少5个字符', trigger: 'blur' }
  ]
}

// 方法定义
const handleSearch = () => {
  // 搜索逻辑
  console.log('搜索关键词:', searchKeyword.value)
}

const handleCanteenChange = () => {
  // 重置菜品选择
  reviewForm.dishId = ''
}

const formatDate = (date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const editReview = (review) => {
  editingReview.value = review
  Object.assign(reviewForm, {
    canteenId: review.canteenId,
    dishId: review.dishId,
    rating: review.rating,
    comment: review.comment,
    tags: [...review.tags],
    imageList: []
  })
  showAddReviewDialog.value = true
}

const deleteReview = async (reviewId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const index = myReviews.value.findIndex(r => r.id === reviewId)
    if (index > -1) {
      myReviews.value.splice(index, 1)
      ElMessage.success('评价删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const rateThisDish = (dish) => {
  reviewForm.dishId = dish.id
  reviewForm.canteenId = dish.canteenId || 'canteen1'
  showAddReviewDialog.value = true
}

const submitReview = async () => {
  try {
    await reviewFormRef.value.validate()

    // 模拟提交评价
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingReview.value) {
      // 更新现有评价
      const index = myReviews.value.findIndex(r => r.id === editingReview.value.id)
      if (index > -1) {
        Object.assign(myReviews.value[index], {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          tags: [...reviewForm.tags],
          updateTime: new Date()
        })
      }
      ElMessage.success('评价更新成功')
    } else {
      // 添加新评价
      const dishInfo = availableDishes.value.find(d => d.id === reviewForm.dishId)
      const newReview = {
        id: Date.now(),
        dishId: reviewForm.dishId,
        dishName: dishInfo?.name || '未知菜品',
        dishImage: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop',
        canteenName: getCanteenName(reviewForm.canteenId),
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        tags: [...reviewForm.tags],
        images: [],
        createTime: new Date()
      }
      myReviews.value.unshift(newReview)
      ElMessage.success('评价提交成功')
    }

    // 重置表单
    resetForm()
    showAddReviewDialog.value = false
    editingReview.value = null
  } catch (error) {
    console.error('提交评价失败:', error)
  }
}

const getCanteenName = (canteenId) => {
  const names = {
    'canteen1': '第一餐厅',
    'canteen2': '第二餐厅',
    'canteen3': '第三餐厅'
  }
  return names[canteenId] || '未知餐厅'
}

const resetForm = () => {
  Object.assign(reviewForm, {
    canteenId: '',
    dishId: '',
    rating: 0,
    comment: '',
    tags: [],
    imageList: []
  })
}

// 生命周期钩子
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
/* 全局滚动条样式 */
html {
  scroll-behavior: smooth;
}

body {
  overflow-x: hidden;
  padding-bottom: 40px; /* 确保底部有足够空间 */
}

/* 自定义滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb #f9fafb;
}

*::-webkit-scrollbar {
  width: 8px;
}

*::-webkit-scrollbar-track {
  background: #f9fafb;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
  transition: background 0.3s ease;
}

*::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

.rating-system {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 60px; /* 增加底部内边距 */
  min-height: 100vh; /* 确保有足够的高度 */
  box-sizing: border-box;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  color: #1f2937;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.header-desc {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-row {
  align-items: center;
}

.my-reviews-card,
.popular-dishes-card {
  margin-bottom: 40px; /* 增加卡片间距 */
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 确保最后一个卡片有足够的底部空间 */
.popular-dishes-card {
  margin-bottom: 80px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.review-item {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.review-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dish-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.dish-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.dish-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
}

.restaurant-name {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.rating-display {
  margin-bottom: 8px;
}

.review-meta {
  text-align: right;
}

.review-date {
  color: #9ca3af;
  font-size: 12px;
  display: block;
  margin-bottom: 8px;
}

.review-actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  color: #dc2626;
}

.review-content {
  margin-bottom: 16px;
}

.review-content p {
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.review-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-image {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.review-image:hover {
  transform: scale(1.05);
}

.review-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-tag {
  background: #f3f4f6;
  color: #374151;
  border: none;
}

.dish-card {
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  margin-bottom: 20px; /* 为每个菜品卡片添加底部边距 */
}

.dish-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.dish-info-content {
  padding: 16px;
}

.dish-info-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
}

.dish-restaurant {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.dish-rating {
  margin-bottom: 12px;
}

.review-count {
  color: #9ca3af;
  font-size: 12px;
  margin-left: 8px;
}

.dish-tags {
  margin-bottom: 16px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.rate-btn {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.review-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.tag-selection {
  line-height: 2;
}

.tag-selection .el-checkbox {
  margin-right: 16px;
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rating-system {
    padding: 16px;
    padding-bottom: 80px; /* 移动端增加更多底部空间 */
  }

  .filter-row .el-col {
    margin-bottom: 12px;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .review-meta {
    text-align: left;
    width: 100%;
  }

  .dish-info {
    flex-direction: column;
  }

  .popular-dishes-card .el-col {
    margin-bottom: 20px; /* 移动端增加卡片间距 */
  }

  .popular-dishes-card {
    margin-bottom: 100px; /* 移动端最后卡片更多底部空间 */
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.review-item {
  animation: fadeInUp 0.5s ease-out;
}

.dish-card {
  transition: all 0.3s ease;
}

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 平滑滚动和页面底部空间确保 */
.rating-system::after {
  content: '';
  display: block;
  height: 40px; /* 确保页面底部有额外空间 */
}

/* 优化滚动体验 */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

/* 确保所有内容都能完整显示 */
.popular-dishes-card .el-row {
  margin-bottom: 20px;
}

.popular-dishes-card .el-row .el-col:last-child .dish-card {
  margin-bottom: 40px; /* 最后一行菜品卡片的额外底部空间 */
}
</style>