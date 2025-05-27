<template>
  <div class="filter-dishes-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>筛选菜品</span>
        </div>
      </template>
      <el-form label-position="top">
        <el-form-item label="按饮食习惯筛选:">
          <el-checkbox-group v-model="selectedDietaryHabits">
            <el-checkbox label="vegetarian">素食</el-checkbox>
            <el-checkbox label="halal">清真</el-checkbox>
            <el-checkbox label="kosher">犹太洁食</el-checkbox>
            <el-checkbox label="gluten-free">无麸质</el-checkbox>
            <el-checkbox label="vegan">严格素食</el-checkbox>
            <el-checkbox label="lactose-free">无乳糖</el-checkbox>
            <el-checkbox label="nut-free">无坚果</el-checkbox>
            <el-checkbox label="seafood-free">无海鲜</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="按菜品类型筛选:">
          <el-checkbox-group v-model="selectedDishTypes">
            <el-checkbox label="main-course">主菜</el-checkbox>
            <el-checkbox label="soup">汤</el-checkbox>
            <el-checkbox label="dessert">甜点</el-checkbox>
            <el-checkbox label="drink">饮品</el-checkbox>
            <el-checkbox label="snack">小吃</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="按价格范围筛选:">
          <el-slider
              v-model="priceRange"
              range
              :min="0"
              :max="100"
              :step="5"
              show-stops
              :format-tooltip="formatPriceTooltip"
          ></el-slider>
          <div class="price-display">
            <span>当前价格范围: ¥{{ priceRange[0] }} - ¥{{ priceRange[1] }}</span>
          </div>
        </el-form-item>

        <el-form-item>
          <el-space wrap>
            <el-button type="primary" :icon="Search" @click="applyFilters">应用筛选</el-button>
            <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <el-divider></el-divider>

      <div class="filtered-results">
        <h3>筛选结果</h3>
        <el-alert v-if="filteredDishes.length === 0" title="提示" type="info" show-icon :closable="false">
          <p>没有找到符合条件的菜品。</p>
        </el-alert>
        <el-row :gutter="20" v-else>
          <el-col :xs="24" :sm="12" :md="8" v-for="dish in filteredDishes" :key="dish.id" class="mb-4">
            <el-card shadow="hover" class="result-card">
              <template #header>
                <div class="clearfix">
                  <span style="font-weight: bold;">{{ dish.name }}</span>
                </div>
              </template>
              <p class="price-tag">价格: <el-tag type="danger" effect="light" round>¥{{ dish.price }}</el-tag></p>

              <div class="dish-details">
                <strong>饮食习惯:</strong>
                <el-space wrap class="ml-1" size="small">
                  <template v-if="dish.dietaryHabits.length === 0 || (dish.dietaryHabits.includes('none') && dish.dietaryHabits.length === 1)">
                    <el-tag type="info" effect="plain" round>无特殊</el-tag>
                  </template>
                  <template v-else>
                    <el-tag
                        v-for="habit in dish.dietaryHabits.filter(h => h !== 'none')"
                        :key="habit"
                        type="success"
                        effect="light"
                        round
                    >
                      {{ formatDietaryHabit(habit) }}
                    </el-tag>
                  </template>
                </el-space>
              </div>

              <div class="dish-details mt-2">
                <strong>类型:</strong>
                <el-tag type="primary" effect="plain" round class="ml-1">{{ formatDishType(dish.type) }}</el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue'; // Import icons

// Mock dish data (remains unchanged)
const allDishes = ref([
  { id: 1, name: '麻婆豆腐', price: 25, dietaryHabits: ['vegetarian'], type: 'main-course' },
  { id: 2, name: '宫保鸡丁', price: 35, dietaryHabits: ['none'], type: 'main-course' },
  { id: 3, name: '番茄鸡蛋汤', price: 15, dietaryHabits: ['vegetarian'], type: 'soup' },
  { id: 4, name: '牛肉拉面', price: 30, dietaryHabits: ['halal'], type: 'main-course' },
  { id: 5, name: '提拉米苏', price: 20, dietaryHabits: ['none'], type: 'dessert' },
  { id: 6, name: '无麸质面包', price: 10, dietaryHabits: ['gluten-free', 'vegan'], type: 'snack' },
  { id: 7, name: '素炒时蔬', price: 22, dietaryHabits: ['vegetarian', 'vegan'], type: 'main-course' },
  { id: 8, name: '清蒸鱼', price: 45, dietaryHabits: ['seafood-free'], type: 'main-course' }, // Assuming seafood-free means no seafood, not a general dietary habit for others
  { id: 9, name: '水果沙拉', price: 18, dietaryHabits: ['vegetarian', 'vegan', 'gluten-free'], type: 'dessert' },
  { id: 10, name: '无乳糖酸奶', price: 12, dietaryHabits: ['lactose-free'], type: 'drink' },
]);

// Filter conditions
const selectedDietaryHabits = ref([]);
const selectedDishTypes = ref([]);
const priceRange = ref([0, 100]);

// Filtered dish data
const filteredDishes = ref([...allDishes.value]);

// Format price slider tooltip
const formatPriceTooltip = (val) => {
  return `¥${val}`;
};

// --- New formatting functions ---
const dietaryHabitMap = {
  'vegetarian': '素食',
  'halal': '清真',
  'kosher': '犹太洁食',
  'gluten-free': '无麸质',
  'vegan': '严格素食',
  'lactose-free': '无乳糖',
  'nut-free': '无坚果',
  'seafood-free': '无海鲜',
  'none': '无特殊要求' // Though 'none' itself won't be shown if other habits are present
};

const dishTypeMap = {
  'main-course': '主菜',
  'soup': '汤',
  'dessert': '甜点',
  'drink': '饮品',
  'snack': '小吃'
};

const formatDietaryHabit = (habitKey) => {
  return dietaryHabitMap[habitKey] || habitKey;
};

const formatDishType = (typeKey) => {
  return dishTypeMap[typeKey] || typeKey;
};
// --- End new formatting functions ---

// Apply filters
const applyFilters = () => {
  let tempDishes = [...allDishes.value];

  // 1. Filter by dietary habits
  if (selectedDietaryHabits.value.length > 0) {
    tempDishes = tempDishes.filter(dish =>
        selectedDietaryHabits.value.every(habit => dish.dietaryHabits.includes(habit))
    );
  }

  // 2. Filter by dish type
  if (selectedDishTypes.value.length > 0) {
    tempDishes = tempDishes.filter(dish =>
        selectedDishTypes.value.includes(dish.type)
    );
  }

  // 3. Filter by price range
  tempDishes = tempDishes.filter(dish =>
      dish.price >= priceRange.value[0] && dish.price <= priceRange.value[1]
  );

  filteredDishes.value = tempDishes;
  if (tempDishes.length > 0) {
    ElMessage.success('筛选已应用！');
  } else {
    ElMessage.warning('没有找到符合条件的菜品。');
  }
};

// Reset filters
const resetFilters = () => {
  selectedDietaryHabits.value = [];
  selectedDishTypes.value = [];
  priceRange.value = [0, 100];
  filteredDishes.value = [...allDishes.value];
  ElMessage.info('筛选条件已重置。');
};
</script>

<style scoped>
.filter-dishes-container {
  padding: 20px;
  margin: 0;
  background-color: #f9fafb;
  border-radius: 0;
  box-sizing: border-box;
}

.box-card {
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  max-height: calc(100vh - 40px); /* Adjust based on padding of parent container (20px top + 20px bottom) */
  overflow-y: auto; /* Make the card content scrollable */
}

.card-header {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}


.el-form-item label {
  font-weight: 500;
  color: #374151;
}


.price-display {
  margin-top: 10px;
  font-size: 14px;
  color: #4b5563;
  text-align: center;
  width: 100%;
}

.filtered-results h3 {
  margin-bottom: 20px;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.result-card {
  height: 100%;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.price-tag {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.dish-details {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
}

.dish-details strong {
  color: #1f2937;
  margin-right: 6px;
}

.ml-1 {
  margin-left: 0.25rem; /* 4px */
}
.mt-2 {
  margin-top: 0.5rem; /* 8px */
}
.mb-4 {
  margin-bottom: 1rem; /* 16px */
}

</style>
