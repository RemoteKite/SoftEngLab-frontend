<template>
  <div class="menu-publish-content">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>菜谱发布管理</h1>
      <p class="page-desc">发布每日各餐菜谱，让学生及时了解菜品变化</p>
    </div>

    <!-- 快速发布卡片 -->
    <el-card class="quick-publish-card">
      <template #header>
        <div class="card-header">
          <h3>快速发布今日菜谱</h3>
          <el-button type="primary" @click="showPublishDialog = true">
            <el-icon><Plus /></el-icon>
            新增菜谱
          </el-button>
        </div>
      </template>

      <!-- 今日菜谱概览 -->
      <div class="today-menu-overview">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="meal-card breakfast" @click="editMeal('breakfast')">
              <div class="meal-header">
                <el-icon class="meal-icon"><Sunrise /></el-icon>
                <h4>早餐</h4>
                <span class="dish-count">{{ todayMenu.breakfast.length }}道菜</span>
              </div>
              <div class="meal-status" :class="todayMenu.breakfast.length > 0 ? 'published' : 'unpublished'">
                {{ todayMenu.breakfast.length > 0 ? '已发布' : '未发布' }}
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="meal-card lunch" @click="editMeal('lunch')">
              <div class="meal-header">
                <el-icon class="meal-icon"><Sunny /></el-icon>
                <h4>午餐</h4>
                <span class="dish-count">{{ todayMenu.lunch.length }}道菜</span>
              </div>
              <div class="meal-status" :class="todayMenu.lunch.length > 0 ? 'published' : 'unpublished'">
                {{ todayMenu.lunch.length > 0 ? '已发布' : '未发布' }}
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="meal-card dinner" @click="editMeal('dinner')">
              <div class="meal-header">
                <el-icon class="meal-icon"><Moon /></el-icon>
                <h4>晚餐</h4>
                <span class="dish-count">{{ todayMenu.dinner.length }}道菜</span>
              </div>
              <div class="meal-status" :class="todayMenu.dinner.length > 0 ? 'published' : 'unpublished'">
                {{ todayMenu.dinner.length > 0 ? '已发布' : '未发布' }}
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 菜谱管理表格 -->
    <el-card class="menu-table-card">
      <template #header>
        <div class="card-header">
          <h3>菜谱管理</h3>
          <div class="header-controls">
            <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择日期"
                @change="fetchMenuByDate"
                style="margin-right: 12px;"
            />
            <el-select
                v-model="selectedMealFilter"
                placeholder="筛选餐次"
                style="width: 120px; margin-right: 12px;"
                @change="filterMenus"
            >
              <el-option label="全部" value="all" />
              <el-option label="早餐" value="breakfast" />
              <el-option label="午餐" value="lunch" />
              <el-option label="晚餐" value="dinner" />
            </el-select>
            <el-button @click="refreshMenuList">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredMenuList" style="width: 100%" v-loading="loading">
        <el-table-column prop="date" label="日期" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="mealType" label="餐次" width="80">
          <template #default="scope">
            <el-tag :type="getMealTagType(scope.row.mealType)">
              {{ getMealName(scope.row.mealType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dishes" label="菜品列表" min-width="300">
          <template #default="scope">
            <div class="dishes-list">
              <el-tag
                  v-for="dish in scope.row.dishes"
                  :key="dish.id"
                  class="dish-tag"
                  :type="getDishTagType(dish.category)"
                  size="small"
              >
                {{ dish.name }} ¥{{ dish.price }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'published' ? 'success' : 'warning'">
              {{ scope.row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editMenu(scope.row)">编辑</el-button>
            <el-button
                size="small"
                :type="scope.row.status === 'published' ? 'warning' : 'success'"
                @click="toggleMenuStatus(scope.row)"
            >
              {{ scope.row.status === 'published' ? '下架' : '发布' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteMenu(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 菜谱发布/编辑对话框 -->
    <el-dialog
        v-model="showPublishDialog"
        :title="editingMenu ? '编辑菜谱' : '发布菜谱'"
        width="800px"
        @close="resetForm"
    >
      <el-form :model="menuForm" :rules="menuRules" ref="menuFormRef" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期" prop="date">
              <el-date-picker
                  v-model="menuForm.date"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="餐次" prop="mealType">
              <el-select v-model="menuForm.mealType" placeholder="选择餐次" style="width: 100%;">
                <el-option label="早餐" value="breakfast" />
                <el-option label="午餐" value="lunch" />
                <el-option label="晚餐" value="dinner" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="菜品列表" prop="dishes">
          <div class="dishes-manager">
            <div class="selected-dishes">
              <el-tag
                  v-for="dish in menuForm.dishes"
                  :key="dish.id"
                  closable
                  @close="removeDish(dish)"
                  class="selected-dish-tag"
                  :type="getDishTagType(dish.category)"
              >
                {{ dish.name }} ¥{{ dish.price }}
              </el-tag>
            </div>
            <el-button @click="showDishSelector = true" class="add-dish-btn">
              <el-icon><Plus /></el-icon>
              添加菜品
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
              v-model="menuForm.remark"
              type="textarea"
              :rows="3"
              placeholder="可添加特殊说明或推荐信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button @click="saveAsDraft" :loading="saving">保存草稿</el-button>
          <el-button type="primary" @click="publishMenu" :loading="publishing">
            {{ editingMenu ? '更新发布' : '立即发布' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 菜品选择对话框 -->
    <el-dialog v-model="showDishSelector" title="选择菜品" width="600px">
      <div class="dish-selector">
        <el-input
            v-model="dishSearchKeyword"
            placeholder="搜索菜品名称"
            prefix-icon="Search"
            style="margin-bottom: 16px;"
        />
        <el-tabs v-model="activeDishCategory">
          <el-tab-pane v-for="category in dishCategories" :key="category.value"
                       :label="category.label" :name="category.value">
            <div class="dish-grid">
              <div
                  v-for="dish in getFilteredDishes(category.value)"
                  :key="dish.id"
                  class="dish-item"
                  :class="{ selected: isDishSelected(dish) }"
                  @click="toggleDish(dish)"
              >
                <div class="dish-info">
                  <h4>{{ dish.name }}</h4>
                  <p class="dish-price">¥{{ dish.price }}</p>
                  <p class="dish-desc">{{ dish.description }}</p>
                </div>
                <el-icon v-if="isDishSelected(dish)" class="selected-icon">
                  <Check />
                </el-icon>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="showDishSelector = false">完成选择</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Sunrise,
  Sunny,
  Moon,
  Refresh,
  Check
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const showPublishDialog = ref(false)
const showDishSelector = ref(false)
const editingMenu = ref(null)
const selectedDate = ref(new Date())
const selectedMealFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dishSearchKeyword = ref('')
const activeDishCategory = ref('main')

// 表单相关
const menuFormRef = ref(null)
const menuForm = reactive({
  date: new Date(),
  mealType: '',
  dishes: [],
  remark: ''
})

const menuRules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  mealType: [{ required: true, message: '请选择餐次', trigger: 'change' }],
  dishes: [{ required: true, message: '请至少添加一道菜品', trigger: 'change' }]
}

// 今日菜谱数据
const todayMenu = reactive({
  breakfast: [
    { id: 1, name: '小笼包', price: 6, category: 'main' },
    { id: 2, name: '豆浆', price: 2, category: 'drink' }
  ],
  lunch: [
    { id: 3, name: '红烧肉', price: 12, category: 'main' },
    { id: 4, name: '青椒土豆丝', price: 8, category: 'vegetable' },
    { id: 5, name: '米饭', price: 2, category: 'staple' }
  ],
  dinner: [
    { id: 6, name: '糖醋排骨', price: 15, category: 'main' },
    { id: 7, name: '蒸蛋', price: 6, category: 'main' }
  ]
})

// 菜谱列表数据
const menuList = ref([
  {
    id: 1,
    date: new Date(),
    mealType: 'breakfast',
    dishes: [
      { id: 1, name: '小笼包', price: 6, category: 'main' },
      { id: 2, name: '豆浆', price: 2, category: 'drink' }
    ],
    status: 'published',
    updateTime: new Date(),
    remark: '今日特色早餐'
  }
])

// 可选菜品数据
const availableDishes = ref([
  { id: 1, name: '小笼包', price: 6, category: 'main', description: '传统小笼包，皮薄馅大' },
  { id: 2, name: '豆浆', price: 2, category: 'drink', description: '新鲜豆浆，营养丰富' },
  { id: 3, name: '红烧肉', price: 12, category: 'main', description: '经典红烧肉，肥瘦相间' },
  { id: 4, name: '青椒土豆丝', price: 8, category: 'vegetable', description: '清爽下饭菜' },
  { id: 5, name: '米饭', price: 2, category: 'staple', description: '优质大米蒸制' },
  { id: 6, name: '糖醋排骨', price: 15, category: 'main', description: '酸甜可口的糖醋排骨' },
  { id: 7, name: '蒸蛋', price: 6, category: 'main', description: '嫩滑蒸蛋' },
  { id: 8, name: '青菜', price: 5, category: 'vegetable', description: '时令青菜' },
  { id: 9, name: '番茄鸡蛋', price: 10, category: 'main', description: '家常番茄鸡蛋' },
  { id: 10, name: '紫菜蛋花汤', price: 4, category: 'soup', description: '清淡汤品' }
])

// 菜品分类
const dishCategories = [
  { label: '主菜', value: 'main' },
  { label: '素菜', value: 'vegetable' },
  { label: '主食', value: 'staple' },
  { label: '汤品', value: 'soup' },
  { label: '饮品', value: 'drink' }
]

// 计算属性
const filteredMenuList = computed(() => {
  if (selectedMealFilter.value === 'all') {
    return menuList.value
  }
  return menuList.value.filter(menu => menu.mealType === selectedMealFilter.value)
})

// 方法
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getMealName = (mealType) => {
  const names = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  }
  return names[mealType] || mealType
}

const getMealTagType = (mealType) => {
  const types = {
    breakfast: 'warning',
    lunch: 'success',
    dinner: 'info'
  }
  return types[mealType] || ''
}

const getDishTagType = (category) => {
  const types = {
    main: 'success',
    vegetable: 'info',
    staple: 'warning',
    soup: '',
    drink: 'info'
  }
  return types[category] || ''
}

const editMeal = (mealType) => {
  menuForm.date = new Date()
  menuForm.mealType = mealType
  menuForm.dishes = [...todayMenu[mealType]]
  menuForm.remark = ''
  editingMenu.value = null
  showPublishDialog.value = true
}

const editMenu = (menu) => {
  editingMenu.value = menu
  menuForm.date = new Date(menu.date)
  menuForm.mealType = menu.mealType
  menuForm.dishes = [...menu.dishes]
  menuForm.remark = menu.remark || ''
  showPublishDialog.value = true
}

const resetForm = () => {
  menuFormRef.value?.resetFields()
  menuForm.dishes = []
  menuForm.remark = ''
  editingMenu.value = null
}

const fetchMenuByDate = () => {
  // 根据日期获取菜谱数据
  console.log('获取日期菜谱:', selectedDate.value)
}

const filterMenus = () => {
  // 筛选菜谱
  console.log('筛选餐次:', selectedMealFilter.value)
}

const refreshMenuList = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 1000)
}

const handlePageChange = (page) => {
  currentPage.value = page
  // 加载对应页面数据
}

const getFilteredDishes = (category) => {
  let dishes = availableDishes.value.filter(dish => dish.category === category)
  if (dishSearchKeyword.value) {
    dishes = dishes.filter(dish =>
        dish.name.includes(dishSearchKeyword.value) ||
        dish.description.includes(dishSearchKeyword.value)
    )
  }
  return dishes
}

const isDishSelected = (dish) => {
  return menuForm.dishes.some(selected => selected.id === dish.id)
}

const toggleDish = (dish) => {
  const index = menuForm.dishes.findIndex(selected => selected.id === dish.id)
  if (index > -1) {
    menuForm.dishes.splice(index, 1)
  } else {
    menuForm.dishes.push({ ...dish })
  }
}

const removeDish = (dish) => {
  const index = menuForm.dishes.findIndex(selected => selected.id === dish.id)
  if (index > -1) {
    menuForm.dishes.splice(index, 1)
  }
}

const saveAsDraft = async () => {
  if (!menuFormRef.value) return

  try {
    await menuFormRef.value.validate()
    saving.value = true

    // 模拟保存草稿
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('草稿保存成功')
    showPublishDialog.value = false
    saving.value = false
  } catch (error) {
    saving.value = false
  }
}

const publishMenu = async () => {
  if (!menuFormRef.value) return

  try {
    await menuFormRef.value.validate()
    publishing.value = true

    // 模拟发布菜谱
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (editingMenu.value) {
      // 更新现有菜谱
      const index = menuList.value.findIndex(menu => menu.id === editingMenu.value.id)
      if (index > -1) {
        menuList.value[index] = {
          ...editingMenu.value,
          ...menuForm,
          status: 'published',
          updateTime: new Date()
        }
      }
      ElMessage.success('菜谱更新成功')
    } else {
      // 新增菜谱
      const newMenu = {
        id: Date.now(),
        ...menuForm,
        status: 'published',
        updateTime: new Date()
      }
      menuList.value.unshift(newMenu)

      // 更新今日菜谱
      if (menuForm.date.toDateString() === new Date().toDateString()) {
        todayMenu[menuForm.mealType] = [...menuForm.dishes]
      }

      ElMessage.success('菜谱发布成功')
    }

    showPublishDialog.value = false
    publishing.value = false
  } catch (error) {
    publishing.value = false
  }
}

const toggleMenuStatus = async (menu) => {
  try {
    await ElMessageBox.confirm(
        `确定要${menu.status === 'published' ? '下架' : '发布'}这个菜谱吗？`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    menu.status = menu.status === 'published' ? 'draft' : 'published'
    menu.updateTime = new Date()

    ElMessage.success(`菜谱${menu.status === 'published' ? '发布' : '下架'}成功`)
  } catch {
    // 用户取消操作
  }
}

const deleteMenu = async (menu) => {
  try {
    await ElMessageBox.confirm(
        '确定要删除这个菜谱吗？删除后无法恢复。',
        '确认删除',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    const index = menuList.value.findIndex(item => item.id === menu.id)
    if (index > -1) {
      menuList.value.splice(index, 1)
      ElMessage.success('菜谱删除成功')
    }
  } catch {
    // 用户取消操作
  }
}

// 页面加载时初始化数据
onMounted(() => {
  total.value = menuList.value.length
})
</script>

<style scoped>
.menu-publish-content {
  margin: 0 auto;
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

.quick-publish-card,
.menu-table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
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

.header-controls {
  display: flex;
  align-items: center;
}

.today-menu-overview {
  padding: 16px 0;
}

.meal-card {
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
}

.meal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.meal-card.breakfast {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
}

.meal-card.lunch {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
}

.meal-card.dinner {
  background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
  border-color: #8b5cf6;
}

.meal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.meal-icon {
  font-size: 20px;
}

.meal-card.breakfast .meal-icon { color: #f59e0b; }
.meal-card.lunch .meal-icon { color: #10b981; }
.meal-card.dinner .meal-icon { color: #8b5cf6; }

.meal-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.dish-count {
  font-size: 12px;
  color: #6b7280;
  margin-left: auto;
}

.meal-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.meal-status.published {
  background: #dcfce7;
  color: #166534;
}

.meal-status.unpublished {
  background: #fef3c7;
  color: #92400e;
}

.dishes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dish-tag {
  margin: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.dishes-manager {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 12px;
  min-height: 60px;
}

.selected-dishes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.selected-dish-tag {
  margin: 0;
}

.add-dish-btn {
  width: 100%;
  border-style: dashed;
}

.dish-selector {
  max-height: 400px;
  overflow-y: auto;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.dish-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.dish-item:hover {
  border-color: #42b983;
  background: #f9fafb;
}

.dish-item.selected {
  border-color: #42b983;
  background: #f0f9f4;
}

.dish-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #1f2937;
}

.dish-price {
  color: #f59e0b;
  font-weight: 600;
  margin: 0 0 4px 0;
  font-size: 12px;
}

.dish-desc {
  color: #6b7280;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.selected-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #42b983;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .today-menu-overview .el-col {
    margin-bottom: 16px;
  }

  .header-controls {
    flex-direction: column;
    gap: 8px;
  }

  .dish-grid {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
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

.menu-publish-content > * {
  animation: fadeIn 0.6s ease-out;
}

.today-menu-overview .el-col:nth-child(1) { animation-delay: 0.1s; }
.today-menu-overview .el-col:nth-child(2) { animation-delay: 0.2s; }
.today-menu-overview .el-col:nth-child(3) { animation-delay: 0.3s; }

/* 自定义滚动条 */
.dish-selector::-webkit-scrollbar {
  width: 6px;
}

.dish-selector::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dish-selector::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dish-selector::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>