<template>
  <el-container class="h-screen font-sans">
    <el-header class="flex items-center justify-center bg-green-500 text-white shadow-md">
      <h1 class="text-2xl font-semibold">健康饮食指导</h1>
    </el-header>

    <el-main class="p-4 md:p-8 bg-gray-50">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="7" class="mb-6 md:mb-0">
          <el-card class="rounded-lg shadow-lg">
            <template #header>
              <div class="text-xl font-medium text-green-600">个性化信息</div>
            </template>
            <el-form :model="formData" ref="formRef" label-position="top" :rules="formRules" @submit.prevent="getAdvice">
              <el-form-item label="年龄 (岁)" prop="age">
                <el-input-number v-model="formData.age" :min="1" :max="120" placeholder="请输入年龄" class="w-full" />
              </el-form-item>

              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="formData.gender">
                  <el-radio-button label="male">男</el-radio-button>
                  <el-radio-button label="female">女</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="身高 (cm)" prop="height">
                <el-input-number v-model="formData.height" :min="50" :max="250" placeholder="请输入身高" class="w-full" />
              </el-form-item>

              <el-form-item label="体重 (kg)" prop="weight">
                <el-input-number v-model="formData.weight" :min="10" :max="300" :precision="1" :step="0.1" placeholder="请输入体重" class="w-full" />
              </el-form-item>

              <el-form-item label="活动水平" prop="activityLevel">
                <el-select v-model="formData.activityLevel" placeholder="请选择活动水平" class="w-full">
                  <el-option label="久坐（基本不运动）" value="sedentary"></el-option>
                  <el-option label="轻度（少量运动/每周1-3天）" value="light"></el-option>
                  <el-option label="中度（中等强度运动/每周3-5天）" value="moderate"></el-option>
                  <el-option label="高度（高强度运动/每周6-7天）" value="active"></el-option>
                  <el-option label="极高（专业运动员水平）" value="very_active"></el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="饮食目标" prop="dietaryGoal">
                <el-select v-model="formData.dietaryGoal" placeholder="请选择饮食目标" class="w-full">
                  <el-option label="保持健康" value="maintain"></el-option>
                  <el-option label="减轻体重" value="lose_weight"></el-option>
                  <el-option label="增加肌肉" value="gain_muscle"></el-option>
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" native-type="submit" class="w-full md:w-auto bg-green-500 hover:bg-green-600 border-green-500">获取建议</el-button>
                <el-button @click="resetForm" class="w-full md:w-auto mt-2 md:mt-0 md:ml-2">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="17">
          <el-card v-if="recommendationsVisible" class="rounded-lg shadow-lg">
            <template #header>
              <div class="text-xl font-medium text-green-600">饮食建议</div>
            </template>
            <el-tabs v-model="activeTab" type="border-card" class="rounded-md">
              <el-tab-pane label="每日宏量" name="macros">
                <div v-if="recommendations.macros">
                  <el-descriptions :column="1" border class="mb-4 rounded">
                    <el-descriptions-item label-class-name="w-1/3 bg-green-50" label="推荐总卡路里">
                      <el-tag type="success" size="large" class="text-lg">{{ recommendations.macros.calories.toFixed(0) }} 千卡</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 class="font-semibold mb-1">蛋白质</h4>
                      <el-progress :percentage="recommendations.macros.proteinPercentage" status="success" :stroke-width="10" class="mb-1"/>
                      <p class="text-sm text-gray-600">{{ recommendations.macros.proteinGrams.toFixed(0) }} 克 ({{ recommendations.macros.proteinPercentage.toFixed(0) }}%)</p>
                    </div>
                    <div>
                      <h4 class="font-semibold mb-1">碳水化合物</h4>
                      <el-progress :percentage="recommendations.macros.carbsPercentage" status="warning" :stroke-width="10" class="mb-1"/>
                      <p class="text-sm text-gray-600">{{ recommendations.macros.carbsGrams.toFixed(0) }} 克 ({{ recommendations.macros.carbsPercentage.toFixed(0) }}%)</p>
                    </div>
                    <div>
                      <h4 class="font-semibold mb-1">脂肪</h4>
                      <el-progress :percentage="recommendations.macros.fatPercentage" status="danger" :stroke-width="10" class="mb-1"/>
                      <p class="text-sm text-gray-600">{{ recommendations.macros.fatGrams.toFixed(0) }} 克 ({{ recommendations.macros.fatPercentage.toFixed(0) }}%)</p>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无宏量营养素建议"></el-empty>
              </el-tab-pane>

              <el-tab-pane label="膳食建议" name="meals">
                <div v-if="recommendations.mealSuggestions" class="space-y-4">
                  <div>
                    <h4 class="font-semibold text-lg mb-1 text-green-700">早餐建议：</h4>
                    <p class="text-gray-700 bg-green-50 p-3 rounded-md">{{ recommendations.mealSuggestions.breakfast }}</p>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1 text-green-700">午餐建议：</h4>
                    <p class="text-gray-700 bg-green-50 p-3 rounded-md">{{ recommendations.mealSuggestions.lunch }}</p>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1 text-green-700">晚餐建议：</h4>
                    <p class="text-gray-700 bg-green-50 p-3 rounded-md">{{ recommendations.mealSuggestions.dinner }}</p>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1 text-green-700">加餐建议：</h4>
                    <p class="text-gray-700 bg-green-50 p-3 rounded-md">{{ recommendations.mealSuggestions.snacks }}</p>
                  </div>
                </div>
                <el-empty v-else description="暂无膳食建议"></el-empty>
              </el-tab-pane>

              <el-tab-pane label="健康贴士" name="tips">
                <div v-if="recommendations.healthyTips" class="space-y-3">
                  <ul class="list-disc list-inside text-gray-700 space-y-2">
                    <li v-for="(tip, index) in recommendations.healthyTips" :key="index" class="bg-blue-50 p-2 rounded-md">{{ tip }}</li>
                  </ul>
                </div>
                <el-empty v-else description="暂无健康贴士"></el-empty>
              </el-tab-pane>
            </el-tabs>
          </el-card>
          <el-card v-else class="rounded-lg shadow-lg flex items-center justify-center h-96">
            <el-empty description="请输入您的信息以获取健康饮食建议" :image-size="150"></el-empty>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <el-footer class="flex items-center justify-center text-sm text-gray-500 bg-gray-100 h-12">
      © {{ new Date().getFullYear() }} 健康饮食指导平台
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

// Form data
const formData = reactive({
  age: null,
  gender: 'male',
  height: null,
  weight: null,
  activityLevel: '',
  dietaryGoal: '',
});

// Form validation rules
const formRules = {
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  height: [{ required: true, message: '请输入身高', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入体重', trigger: 'blur' }],
  activityLevel: [{ required: true, message: '请选择活动水平', trigger: 'change' }],
  dietaryGoal: [{ required: true, message: '请选择饮食目标', trigger: 'change' }],
};

const formRef = ref(null); // Reference to the form component

// Recommendations data
const recommendations = reactive({
  macros: null,
  mealSuggestions: null,
  healthyTips: null,
});
const recommendationsVisible = ref(false); // Controls visibility of recommendations card
const activeTab = ref('macros'); // Active tab in recommendations

// Activity level multipliers for TDEE calculation
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Function to calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
const calculateBMR = (weight, height, age, gender) => {
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

// Function to get advice
const getAdvice = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate(); // Validate the form

    // Calculate BMR
    const bmr = calculateBMR(formData.weight, formData.height, formData.age, formData.gender);

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultipliers[formData.activityLevel];

    // Adjust calories based on dietary goal
    let targetCalories = tdee;
    if (formData.dietaryGoal === 'lose_weight') {
      targetCalories -= 500; // Deficit for weight loss
    } else if (formData.dietaryGoal === 'gain_muscle') {
      targetCalories += 300; // Surplus for muscle gain
    }
    // Ensure calories are not too low
    targetCalories = Math.max(targetCalories, formData.gender === 'male' ? 1500 : 1200);


    // Macronutrient Ratios (example, can be more dynamic)
    let proteinRatio, carbsRatio, fatRatio;
    if (formData.dietaryGoal === 'lose_weight') {
      proteinRatio = 0.30; // 30%
      carbsRatio = 0.40;   // 40%
      fatRatio = 0.30;     // 30%
    } else if (formData.dietaryGoal === 'gain_muscle') {
      proteinRatio = 0.30; // 30%
      carbsRatio = 0.45;   // 45%
      fatRatio = 0.25;     // 25%
    } else { // maintain
      proteinRatio = 0.25; // 25%
      carbsRatio = 0.50;   // 50%
      fatRatio = 0.25;     // 25%
    }

    // Calculate grams
    const proteinGrams = (targetCalories * proteinRatio) / 4; // 4 kcal per gram
    const carbsGrams = (targetCalories * carbsRatio) / 4;   // 4 kcal per gram
    const fatGrams = (targetCalories * fatRatio) / 9;       // 9 kcal per gram

    recommendations.macros = {
      calories: targetCalories,
      proteinGrams: proteinGrams,
      carbsGrams: carbsGrams,
      fatGrams: fatGrams,
      proteinPercentage: proteinRatio * 100,
      carbsPercentage: carbsRatio * 100,
      fatPercentage: fatRatio * 100,
    };

    // Static meal suggestions and tips (can be made dynamic)
    recommendations.mealSuggestions = {
      breakfast: '燕麦粥（加入水果和坚果）、全麦面包配鸡蛋和一杯牛奶或豆浆。',
      lunch: '烤鸡胸肉/鱼肉/豆腐，搭配大量蔬菜（如西兰花、菠菜、胡萝卜）和一份复合碳水化合物（如糙米、藜麦、全麦意面）。',
      dinner: '清蒸鱼/瘦牛肉，搭配炒时蔬和少量红薯或紫薯。晚餐宜清淡，避免油腻。',
      snacks: '水果（苹果、香蕉、浆果）、原味酸奶、一小把坚果、水煮蛋。',
    };
    recommendations.healthyTips = [
      '多喝水，每天至少8杯（约2升）。',
      '规律作息，保证充足睡眠。',
      '细嚼慢咽，享受食物。',
      '减少加工食品和高糖饮料的摄入。',
      '注意食物多样性，保证营养均衡。',
      '学会阅读食品标签，选择更健康的食品。',
      '适量运动，与健康饮食相辅相成。',
    ];

    recommendationsVisible.value = true;
    activeTab.value = 'macros'; // Reset to macros tab
    ElMessage.success('已生成饮食建议！');

  } catch (errors) {
    ElMessage.error('请检查输入项是否都已正确填写。');
    console.error("Form validation failed:", errors);
  }
};

// Function to reset the form
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  recommendations.macros = null;
  recommendations.mealSuggestions = null;
  recommendations.healthyTips = null;
  recommendationsVisible.value = false;
  ElMessage.info('表单已重置。');
};

</script>

<style>
/* Basic styling to ensure full height and Tailwind compatibility */
html, body, #app {
  height: 100%;
  margin: 0;
  font-family: 'Inter', sans-serif; /* Using Inter font, common with Tailwind */
}

/* Element Plus custom styling if needed */
.el-card__header {
  background-color: #f0fdf4; /* A light green for card headers */
  border-bottom: 1px solid #dcfce7;
}

.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
  color: #16a34a; /* Green color for active tab */
  border-bottom-color: #16a34a !important;
}

.el-button--primary {
  /* Ensure Tailwind overrides default Element Plus styles if needed */
}
</style>
