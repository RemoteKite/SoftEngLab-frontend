<template>
  <el-container class="h-screen font-sans antialiased bg-gradient-to-br from-gray-50 to-gray-100">
    <el-header class="flex items-center justify-center h-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl px-4">
      <h1 class="text-3xl font-bold tracking-wide">健康饮食指导 - AI助手</h1>
    </el-header>

    <el-main class="p-4 md:p-8 flex-grow">
      <el-row :gutter="20" class="justify-center">
        <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="7" class="mb-6 md:mb-0">
          <el-card class="rounded-xl shadow-2xl border border-green-100 transition-all duration-300 hover:shadow-3xl">
            <template #header>
              <div class="text-2xl font-semibold text-green-700 flex items-center">
                <i class="el-icon-user-solid mr-2 text-green-600"></i> 个性化信息
              </div>
            </template>
            <el-form :model="formData" ref="formRef" label-position="top" :rules="formRules" @submit.prevent="getAdvice">
              <el-form-item label="年龄 (岁)" prop="age">
                <el-input-number v-model="formData.age" :min="1" :max="120" placeholder="请输入年龄" class="w-full" controls-position="right" />
              </el-form-item>

              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="formData.gender" class="flex justify-around bg-green-50 rounded-lg p-1">
                  <el-radio-button label="male">男</el-radio-button>
                  <el-radio-button label="female">女</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="身高 (cm)" prop="height">
                <el-input-number v-model="formData.height" :min="50" :max="250" placeholder="请输入身高" class="w-full" controls-position="right" />
              </el-form-item>

              <el-form-item label="体重 (kg)" prop="weight">
                <el-input-number v-model="formData.weight" :min="10" :max="300" :precision="1" :step="0.1" placeholder="请输入体重" class="w-full" controls-position="right" />
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

              <el-form-item class="mt-6">
                <el-button type="primary" native-type="submit" class="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-300 ease-in-out transform hover:-translate-y-0.5" :loading="isLoading">
                  <el-icon v-if="isLoading" class="is-loading mr-2"><loading /></el-icon>
                  获取AI建议
                </el-button>
                <el-button @click="resetForm" class="w-full md:w-auto mt-3 md:mt-0 md:ml-3 bg-gray-200 hover:bg-gray-300 text-gray-800 border-none transition duration-300 ease-in-out">
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="17">
          <el-card v-if="recommendationsVisible" class="rounded-xl shadow-2xl border border-green-100 transition-all duration-300 hover:shadow-3xl min-h-[400px] flex flex-col">
            <template #header>
              <div class="text-2xl font-semibold text-green-700 flex items-center">
                <i class="el-icon-cpu mr-2 text-green-600"></i> AI饮食建议
              </div>
            </template>
            <div v-if="isLoading" class="flex flex-col items-center justify-center flex-grow py-12">
              <el-icon class="is-loading text-6xl text-green-500 mb-6"><loading /></el-icon>
              <p class="text-gray-600 text-lg font-medium">AI助手正在为您量身定制建议，请稍候片刻...</p>
            </div>
            <el-tabs v-else v-model="activeTab" type="border-card" class="rounded-lg flex-grow">
              <el-tab-pane label="每日宏量" name="macros">
                <div v-if="recommendations.macros" class="p-4">
                  <el-descriptions :column="1" border class="mb-6 rounded-lg overflow-hidden">
                    <el-descriptions-item label-class-name="w-1/3 bg-green-50 text-green-800 font-semibold text-lg" label="推荐总卡路里">
                      <el-tag type="success" size="large" class="text-xl font-bold px-4 py-2 rounded-full shadow-md">{{ recommendations.macros.calories.toFixed(0) }} 千卡</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-green-50 p-4 rounded-lg shadow-sm">
                      <h4 class="font-bold text-lg mb-2 text-green-700">蛋白质</h4>
                      <el-progress :percentage="recommendations.macros.proteinPercentage" color="#3b82f6" :stroke-width="12" :format="(percentage) => `${percentage.toFixed(0)}%`" class="mb-2"/>
                      <p class="text-base text-gray-700">{{ recommendations.macros.proteinGrams.toFixed(0) }} 克</p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg shadow-sm">
                      <h4 class="font-bold text-lg mb-2 text-yellow-700">碳水化合物</h4>
                      <el-progress :percentage="recommendations.macros.carbsPercentage" color="#10b981" :stroke-width="12" :format="(percentage) => `${percentage.toFixed(0)}%`" class="mb-2"/>
                      <p class="text-base text-gray-700">{{ recommendations.macros.carbsGrams.toFixed(0) }} 克</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg shadow-sm">
                      <h4 class="font-bold text-lg mb-2 text-red-700">脂肪</h4>
                      <el-progress :percentage="recommendations.macros.fatPercentage"  color="#f59e0b" :stroke-width="12" :format="(percentage) => `${percentage.toFixed(0)}%`" class="mb-2"/>
                      <p class="text-base text-gray-700">{{ recommendations.macros.fatGrams.toFixed(0) }} 克</p>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无宏量营养素建议" :image-size="100"></el-empty>
              </el-tab-pane>

              <el-tab-pane label="膳食建议 (AI)" name="meals">
                <div v-if="recommendations.mealSuggestions" class="space-y-6 p-4">
                  <div class="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
                    <h4 class="font-bold text-xl mb-2 text-green-800 flex items-center"><i class="el-icon-sunrise mr-2"></i> 早餐建议：</h4>
                    <p class="text-gray-700 text-base whitespace-pre-line leading-relaxed">{{ recommendations.mealSuggestions.breakfast }}</p>
                  </div>
                  <div class="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
                    <h4 class="font-bold text-xl mb-2 text-blue-800 flex items-center"><i class="el-icon-sunny mr-2"></i> 午餐建议：</h4>
                    <p class="text-gray-700 text-base whitespace-pre-line leading-relaxed">{{ recommendations.mealSuggestions.lunch }}</p>
                  </div>
                  <div class="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-100">
                    <h4 class="font-bold text-xl mb-2 text-purple-800 flex items-center"><i class="el-icon-moon mr-2"></i> 晚餐建议：</h4>
                    <p class="text-gray-700 text-base whitespace-pre-line leading-relaxed">{{ recommendations.mealSuggestions.dinner }}</p>
                  </div>
                  <div class="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-100">
                    <h4 class="font-bold text-xl mb-2 text-yellow-800 flex items-center"><i class="el-icon-dessert mr-2"></i> 加餐建议：</h4>
                    <p class="text-gray-700 text-base whitespace-pre-line leading-relaxed">{{ recommendations.mealSuggestions.snacks }}</p>
                  </div>
                </div>
                <el-empty v-else description="暂无AI膳食建议" :image-size="100"></el-empty>
              </el-tab-pane>

              <el-tab-pane label="健康贴士 (AI)" name="tips">
                <div v-if="recommendations.healthyTips && recommendations.healthyTips.length > 0" class="space-y-4 p-4">
                  <div
                      v-for="(tip, index) in recommendations.healthyTips"
                      :key="index"
                      class="bg-indigo-50 p-3 rounded-lg shadow-sm"
                      style="display: flex; align-items: flex-start;"
                  >
                    <el-icon class="text-indigo-600 text-lg" style="margin-top: 0.125rem; margin-right: 1rem; flex-shrink: 0;">
                      <star />
                    </el-icon>
                    <p class="text-base leading-relaxed" style="margin: 0;">{{ tip }}</p>
                  </div>
                </div>
                <el-empty v-else description="暂无AI健康贴士" :image-size="100"></el-empty>
              </el-tab-pane>

              <el-tab-pane label="免责声明" name="disclaimer">
                <el-alert
                    title="AI建议免责声明"
                    type="warning"
                    show-icon
                    :closable="false"
                    class="mb-4 rounded-lg"
                >
                  <p class="text-base leading-relaxed">此健康饮食建议由AI生成，仅供参考，不能替代专业的医疗、营养建议或治疗。在做出任何饮食或健康改变之前，请务必咨询医生或注册营养师。个体差异显著，AI建议可能不完全适用于您的具体健康状况。</p>
                </el-alert>
              </el-tab-pane>
            </el-tabs>
          </el-card>
          <el-card v-else class="rounded-xl shadow-2xl border border-green-100 flex items-center justify-center min-h-[400px]">
            <el-empty description="请输入您的信息以获取AI健康饮食建议" :image-size="180">
              <template #image>
                <img src="https://placehold.co/180x180/e0ffe0/22c55e?text=AI+Health" alt="AI Health Icon" class="rounded-full shadow-lg">
              </template>
            </el-empty>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <el-footer class="flex items-center justify-center text-sm text-gray-600 bg-gray-200 h-16 shadow-inner">
      © {{ new Date().getFullYear() }} 健康饮食指导 - 您的智能健康伙伴
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { Loading, UserFilled, Cpu, Star } from '@element-plus/icons-vue'; // Import necessary icons

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
const isLoading = ref(false); // Loading state for AI response

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
    isLoading.value = true;
    recommendationsVisible.value = true; // Show card container, loading will be inside
    activeTab.value = 'macros'; // Reset to macros tab initially

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

    // Macronutrient Ratios
    let proteinRatio, carbsRatio, fatRatio;
    if (formData.dietaryGoal === 'lose_weight') {
      proteinRatio = 0.30; carbsRatio = 0.40; fatRatio = 0.30;
    } else if (formData.dietaryGoal === 'gain_muscle') {
      proteinRatio = 0.30; carbsRatio = 0.45; fatRatio = 0.25;
    } else { // maintain
      proteinRatio = 0.25; carbsRatio = 0.50; fatRatio = 0.25;
    }

    const proteinGrams = (targetCalories * proteinRatio) / 4;
    const carbsGrams = (targetCalories * carbsRatio) / 4;
    const fatGrams = (targetCalories * fatRatio) / 9;

    recommendations.macros = {
      calories: targetCalories,
      proteinGrams: proteinGrams,
      carbsGrams: carbsGrams,
      fatGrams: fatGrams,
      proteinPercentage: proteinRatio * 100,
      carbsPercentage: carbsRatio * 100,
      fatPercentage: fatRatio * 100,
    };

    // --- AI Integration (DeepSeek) ---
    // 请确保您的 DeepSeek API Key 是有效的
    const apiKey = "sk-9f4b0f3442bc4c689611e1e67314cf84";
    const apiUrl = "https://api.deepseek.com/v1/chat/completions";

    const dietaryGoalText = {
      maintain: "保持健康",
      lose_weight: "减轻体重",
      gain_muscle: "增加肌肉"
    }[formData.dietaryGoal];

    const activityLevelText = {
      sedentary: "久坐（基本不运动）",
      light: "轻度（少量运动/每周1-3天）",
      moderate: "中度（中等强度运动/每周3-5天）",
      active: "高度（高强度运动/每周6-7天）",
      very_active: "极高（专业运动员水平）"
    }[formData.activityLevel];

    const prompt = `
请根据以下个人信息和饮食目标，提供一份详细的中文健康饮食建议。
个人信息：
- 年龄: ${formData.age} 岁
- 性别: ${formData.gender === 'male' ? '男' : '女'}
- 身高: ${formData.height} cm
- 体重: ${formData.weight} kg
- 活动水平: ${activityLevelText}
- 饮食目标: ${dietaryGoalText}
- 每日目标总热量: ${targetCalories.toFixed(0)} 千卡
- 每日目标蛋白质: ${proteinGrams.toFixed(0)} 克
- 每日目标碳水化合物: ${carbsGrams.toFixed(0)} 克
- 每日目标脂肪: ${fatGrams.toFixed(0)} 克

请提供以下两部分内容，并确保内容健康、均衡、多样化，并具有可操作性：
1. 膳食建议 (mealSuggestions): 针对早餐、午餐、晚餐和加餐，分别提供具体的食物建议。请给出一些实际的食物例子，而不仅仅是食物类别。
2. 健康贴士 (healthyTips): 提供5条实用的健康饮食和生活习惯贴士。

返回的膳食建议和健康贴士需要适合中国人的饮食习惯。
返回的膳食建议和健康贴士应该更有趣味性，以主人的口吻说给我。
返回的膳食建议和健康贴士应该更有创新性，不要八杯水。
请确保膳食建议中的食物种类丰富，考虑到营养均衡。
请以严格的JSON格式返回响应，格式如下：
{
  "mealSuggestions": {
    "breakfast": "早餐建议",
    "lunch": "午餐建议",
    "dinner": "晚餐建议",
    "snacks": "加餐建议"
  },
  "healthyTips": [
    "健康贴士1",
    "健康贴士2",
    "健康贴士3",
    "健康贴士4",
    "健康贴士5"
  ]
}
`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.85,
          max_tokens: 500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("DeepSeek API Error:", errorData);
        throw new Error(`AI服务请求失败: ${errorData?.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
        let rawContent = result.choices[0].message.content;
        console.log("Raw AI response content:", rawContent);

        try {
          const aiResponse = JSON.parse(rawContent);

          recommendations.mealSuggestions = aiResponse.mealSuggestions;
          recommendations.healthyTips = aiResponse.healthyTips;
          ElMessage.success('AI饮食建议已生成！');
          activeTab.value = 'meals'; // Switch to meal suggestions tab
        } catch (parseError) {
          console.error("Failed to parse AI response as valid JSON:", parseError);
          console.error("String that failed to parse:", rawContent);
          throw new Error('AI返回的内容不是有效的JSON格式，即使已请求JSON格式输出。');
        }
      } else {
        console.error("Unexpected DeepSeek response structure:", result);
        throw new Error('AI返回的数据结构不符合预期。');
      }

    } catch (aiError) {
      ElMessage.error(`获取AI建议失败: ${aiError.message}`);
      console.error("Error fetching AI advice:", aiError);
      // Fallback to some default/static advice if AI fails
      recommendations.mealSuggestions = {
        breakfast: 'AI建议获取失败，请尝试全麦面包和鸡蛋。',
        lunch: 'AI建议获取失败，请尝试鸡胸肉和蔬菜沙拉。',
        dinner: 'AI建议获取失败，请尝试清蒸鱼和时蔬。',
        snacks: 'AI建议获取失败，请尝试一个苹果。',
      };
      recommendations.healthyTips = [
        'AI建议获取失败，请确保网络连接并稍后重试。',
        '多喝水，保持身体水分。',
        '规律作息，保证充足睡眠。',
        '均衡饮食，多吃蔬菜水果。',
        '适量运动，保持身体健康。'
      ];
    } finally {
      isLoading.value = false;
    }

  } catch (validationErrors) {
    ElMessage.error('请检查输入项是否都已正确填写。');
    console.error("Form validation failed:", validationErrors);
    isLoading.value = false; // Stop loading if validation fails
    recommendationsVisible.value = false; // Hide card if validation fails before showing it
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
  isLoading.value = false;
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

/* Element Plus custom styling for better integration with Tailwind */
/* Header of El-Card */
.el-card__header {
  background-color: #f0fdf4; /* Light green for card headers */
  border-bottom: 1px solid #dcfce7;
  padding: 18px 24px; /* More padding */
}

/* Active tab in El-Tabs */
.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
  color: #16a34a; /* Green color for active tab text */
  border-bottom-color: #16a34a !important; /* Green border for active tab */
  font-weight: 600; /* Bolder text for active tab */
}

/* Hover effect for tabs */
.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {
  color: #22c55e; /* Lighter green on hover */
}

/* Progress bar text color */
.el-progress__text {
  color: #4b5563; /* Darker gray for progress text */
}

/* Ensure Tailwind overrides default Element Plus styles for buttons */
.el-button.el-button--primary {
  /* Tailwind classes handle styling */
}

/* Style for AI generated meal suggestions to respect newlines */
.whitespace-pre-line {
  white-space: pre-line;
}

/* Custom loading icon animation */
.el-icon.is-loading {
  animation: rotating 2s linear infinite;
}



/* Custom styling for radio buttons in Element Plus */
.el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background-color: #22c55e !important; /* Green background for checked radio */
  border-color: #22c55e !important;
  color: #fff !important; /* White text for checked radio */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.el-radio-button__inner {
  border: none !important; /* Remove default border */
  border-radius: 6px !important; /* Rounded corners */
  padding: 10px 20px !important;
  transition: all 0.3s ease;
  color: #4b5563;
  background-color: #e5e7eb; /* Light gray for unchecked */
}

.el-radio-button__inner:hover {
  color: #16a34a !important;
  background-color: #d1fae5; /* Lighter green on hover */
}

/* Custom styling for input number controls */
.el-input-number__increase,
.el-input-number__decrease {
  background-color: #ecfdf5 !important; /* Light green background */
  border-left: 1px solid #d1fae5 !important;
  border-color: #d1fae5 !important;
  color: #10b981 !important; /* Green icon color */
}

.el-input-number__increase:hover,
.el-input-number__decrease:hover {
  background-color: #d1fae5 !important; /* Darker green on hover */
}

/* Custom styling for select dropdown */
.el-select .el-input__inner {
  border-color: #d1fae5 !important; /* Light green border */
}

.el-select .el-input__inner:focus {
  border-color: #22c55e !important; /* Green border on focus */
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); /* Green shadow on focus */
}

/* Icon styling for descriptions */
.el-descriptions-item__label.is-bordered-label {
  display: flex;
  align-items: center;
}
.el-descriptions-item__label.is-bordered-label .el-icon {
  margin-right: 8px;
}
</style>
