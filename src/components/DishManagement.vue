<template>
  <div class="dish-management-content">
    <div class="page-header">
      <h2>菜品管理</h2>
      <el-button type="primary" @click="openAddModal" class="action-button">
        <el-icon><Plus /></el-icon> 添加菜品
      </el-button>
    </div>

    <el-card class="dish-table-card">
      <template #header>
        <div class="card-header">
          <h3>菜品列表</h3>
          <div class="header-controls">
            <el-input
                v-model="dishNameFilter"
                placeholder="搜索菜品名称"
                prefix-icon="Search"
                style="width: 200px; margin-right: 12px;"
                clearable
                @input="currentPage = 1"
            />
            <el-select
                v-model="canteenFilterId"
                placeholder="选择食堂"
                style="width: 150px; margin-right: 12px;"
                clearable
                @change="currentPage = 1"
            >
              <el-option
                  v-for="canteen in canteens"
                  :key="canteen.canteenId"
                  :label="canteen.name"
                  :value="canteen.canteenId"
              ></el-option>
            </el-select>
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon> 重置筛选
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredAndPagedDishes" style="width: 100%" v-loading="loading" max-height="600">
        <el-table-column prop="name" label="名称" width="150" sortable></el-table-column>
        <el-table-column prop="price" label="价格" width="100" sortable>
          <template #default="scope">
            {{ scope.row.price !== null ? scope.row.price.toFixed(2) : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="canteenId" label="食堂" width="150" sortable>
          <template #default="scope">
            {{ getCanteenName(scope.row.canteenId) }}
          </template>
        </el-table-column>
        <el-table-column label="饮食标签" width="150">
          <template #default="scope">
            <el-tag
                v-for="tagId in scope.row.dietaryTagIds"
                :key="tagId"
                size="small"
                class="mr-1 mb-1"
            >
              {{ getDietaryTagName(tagId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过敏原" width="150">
          <template #default="scope">
            <el-tag
                v-for="allergenId in scope.row.allergenIds"
                :key="allergenId"
                type="warning"
                size="small"
                class="mr-1 mb-1"
            >
              {{ getAllergenName(allergenId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="100">
          <template #default="scope">
            <img v-if="scope.row.imageUrl" :src="scope.row.imageUrl" alt="菜品图片" class="dish-image" />
            <span v-else>无图片</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEditModal(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="confirmDelete(scope.row.dishId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalFilteredDishes"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
        v-model="showModal"
        :title="isEditMode ? '编辑菜品' : '添加菜品'"
        width="600px"
        @close="closeModal"
    >
      <el-form :model="currentDish" :rules="dishRules" ref="dishFormRef" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="currentDish.name"></el-input>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input type="number" v-model.number="currentDish.price" step="0.01"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="currentDish.description" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="食堂" prop="canteenId">
          <el-select v-model="currentDish.canteenId" placeholder="请选择食堂" style="width: 100%;">
            <el-option
                v-for="canteen in canteens"
                :key="canteen.canteenId"
                :label="canteen.name"
                :value="canteen.canteenId"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- 新增：饮食标签选择 -->
        <el-form-item label="饮食标签" prop="dietaryTagIds">
          <el-select
              v-model="currentDish.dietaryTagIds"
              multiple
              placeholder="选择饮食标签"
              style="width: 100%;"
          >
            <el-option
                v-for="tag in dietaryTags"
                :key="tag.tagId"
                :label="tag.tagName"
                :value="tag.tagId"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- 新增：过敏原标签选择 -->
        <el-form-item label="过敏原" prop="allergenIds">
          <el-select
              v-model="currentDish.allergenIds"
              multiple
              placeholder="选择过敏原"
              style="width: 100%;"
          >
            <el-option
                v-for="allergen in allergens"
                :key="allergen.allergenId"
                :label="allergen.allergenName"
                :value="allergen.allergenId"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="图片" prop="imageUrl">
          <div class="image-upload-wrapper">
            <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
            <el-button type="info" plain>选择图片</el-button>
          </div>
          <div class="image-preview">
            <img v-if="isEditMode && currentDish.imageUrl && !selectedFile" :src="currentDish.imageUrl" alt="菜品图片" class="preview-thumb">
            <img v-if="previewUrl" :src="previewUrl" alt="预览图片" class="preview-thumb">
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="saving">
            {{ isEditMode ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {reactive, ref, computed, onMounted, onBeforeUnmount, nextTick} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';

// 假设这些 API 是全局可用的或从共享文件导入的
// 如果不是，您需要导入它们，例如：
import {
  getAllDishes,
  createDish,
  updateDish,
  deleteDish,
  getAllCanteens,
  getAllDietaryTags, // 新增：获取饮食标签的 API
  getAllAllergens   // 新增：获取过敏原的 API
} from '@/services/api.js'; // 请确保这些 API 在您的 api.js 中存在

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const dishes = ref([]); // 存储所有获取到的菜品
const canteens = ref([]); // 存储食堂列表用于下拉选择
const dietaryTags = ref([]); // 新增：存储饮食标签列表
const allergens = ref([]); // 新增：存储过敏原列表

const showModal = ref(false);
const isEditMode = ref(false);
const currentDish = reactive({
  dishId: null,
  canteenId: '',
  name: '',
  price: null,
  description: '',
  imageUrl: '',
  dietaryTagIds: [], // 新增：用于存储选中的饮食标签 ID
  allergenIds: []    // 新增：用于存储选中的过敏原 ID
});
const selectedFile = ref(null);
const previewUrl = ref(null);
const dishFormRef = ref(null); // Element Plus 表单的引用

// 筛选和分页相关的响应式数据
const dishNameFilter = ref('');
const canteenFilterId = ref('');
const currentPage = ref(1);
const pageSize = ref(5); // 可调整此值
const totalFilteredDishes = ref(0);

// 表单验证规则
const dishRules = reactive({
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入菜品价格', trigger: ['blur', 'change'] },
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(); // 交给必填规则处理
        } else if (typeof value !== 'number' || isNaN(value)) {
          callback(new Error('价格必须是有效的数字'));
        } else if (value < 0.01) {
          callback(new Error('价格必须大于或等于0.01'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  description: [{ required: false, message: '请输入菜品描述', trigger: 'blur' }],
  canteenId: [{ required: true, message: '请选择所属食堂', trigger: 'change' }],
  // dietaryTagIds: [{ type: 'array', required: false, message: '请选择饮食标签', trigger: 'change' }],
  // allergenIds: [{ type: 'array', required: false, message: '请选择过敏原', trigger: 'change' }],
});

// 辅助函数：提取错误信息
const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '操作失败！';
};

// 用于筛选和分页的计算属性
const filteredDishes = computed(() => {
  let currentDishes = [...dishes.value]; // 复制所有菜品

  // 按菜品名称筛选
  if (dishNameFilter.value) {
    currentDishes = currentDishes.filter(dish =>
        dish.name.toLowerCase().includes(dishNameFilter.value.toLowerCase())
    );
  }

  // 按食堂筛选
  if (canteenFilterId.value) {
    currentDishes = currentDishes.filter(dish =>
        dish.canteenId === canteenFilterId.value
    );
  }
  return currentDishes;
});

const filteredAndPagedDishes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalFilteredDishes.value = filteredDishes.value.length; // 更新分页总数
  return filteredDishes.value.slice(start, end);
});


// 方法
const getCanteenName = (canteenId) => {
  const canteen = canteens.value.find(c => c.canteenId === canteenId);
  return canteen ? canteen.name : `食堂ID: ${canteenId}`;
};

// 新增：获取饮食标签的名称
const getDietaryTagName = (tagId) => {
  const tag = dietaryTags.value.find(t => t.tagId === tagId);
  return tag ? tag.tagName : `未知标签 (${tagId})`;
};

// 新增：获取过敏原的名称
const getAllergenName = (allergenId) => {
  const allergen = allergens.value.find(a => a.allergenId === allergenId);
  return allergen ? allergen.allergenName : `未知过敏原 (${allergenId})`;
};

const fetchCanteens = async () => {
  try {
    const response = await getAllCanteens();
    canteens.value = response.data;
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('获取食堂列表失败:', error);
  }
};

// 新增：获取饮食标签列表
const fetchDietaryTags = async () => {
  try {
    const response = await getAllDietaryTags(); // 调用 API
    dietaryTags.value = response.data;
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('获取饮食标签列表失败:', error);
  }
};

// 新增：获取过敏原列表
const fetchAllergens = async () => {
  try {
    const response = await getAllAllergens(); // 调用 API
    allergens.value = response.data;
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('获取过敏原列表失败:', error);
  }
};


const fetchDishes = async () => {
  loading.value = true;
  try {
    const response = await getAllDishes();
    dishes.value = response.data; // 存储所有菜品
  }
  catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('获取菜品列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const openAddModal = async () => {
  isEditMode.value = false;

  // 1. 先重置表单验证状态
  dishFormRef.value?.resetFields();
  await nextTick(); // 确保DOM更新完成

  // 2. 清空响应式数据
  Object.assign(currentDish, {
    dishId: null,
    canteenId: null,  // 改为null更符合语义
    name: '',
    price: null,      // 保持null而不是0，便于验证必填
    description: '',
    imageUrl: '',
    dietaryTagIds: [], // 重置为[]
    allergenIds: []    // 重置为[]
  });

  // 3. 重置文件相关状态
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value); // 安全释放内存
  }
  previewUrl.value = null;

  // 4. 显示模态框
  showModal.value = true;

  // 5. 再次确保表单状态重置（针对某些UI库的特殊情况）
  await nextTick();
  dishFormRef.value?.clearValidate(); // 比resetFields更轻量
};

const openEditModal = async (dish) => {
  isEditMode.value = true;
  // 1. 先完全重置表单
  if (dishFormRef.value) {
    dishFormRef.value.resetFields();
    await nextTick(); // 确保重置完成
  }
  // 2. 清空当前数据
  Object.keys(currentDish).forEach(key => {
    if (Array.isArray(currentDish[key])) {
      currentDish[key] = []; // 保持数组类型
    } else {
      currentDish[key] = key === 'dishId' ? null : '';
    }
  });
  // 3. 等待一个tick确保清空完成
  await nextTick();
  // 4. 填充新数据
  const newData = JSON.parse(JSON.stringify(dish));
  Object.keys(newData).forEach(key => {
    if (key in currentDish) {
      // 特别处理数组类型，确保是新数组引用
      if (Array.isArray(newData[key])) {
        currentDish[key] = [...newData[key]];
      } else {
        currentDish[key] = newData[key];
      }
    }
  });
  // 5. 处理文件相关状态
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = null;
  // 6. 最后显示模态框
  showModal.value = true;
  // 7. 确保UI更新完成
  await nextTick();
};

const closeModal = () => {
  showModal.value = false;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);
  } else {
    selectedFile.value = null;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = null;
  }
};

const handleSubmit = async () => {
  if (!dishFormRef.value) return;

  try {
    await dishFormRef.value.validate();
    saving.value = true;

    const formData = new FormData();

    const dishData = {
      canteenId: currentDish.canteenId,
      name: currentDish.name,
      price: currentDish.price,
      description: currentDish.description,
      dietaryTagIds: currentDish.dietaryTagIds, // 新增：添加饮食标签 ID 数组
      allergenIds: currentDish.allergenIds,     // 新增：添加过敏原 ID 数组
    };

    // 将 dishData 转换为 JSON 字符串并作为 Blob 添加
    formData.append('dish', new Blob([JSON.stringify(dishData)], {
      type: 'application/json'
    }));

    if (selectedFile.value) {
      formData.append('image', selectedFile.value);
    }

    if (isEditMode.value) {
      await updateDish(currentDish.dishId, formData);
      ElMessage.success('菜品更新成功！');
    } else {
      await createDish(formData);
      ElMessage.success('菜品创建成功！');
    }
    await fetchDishes(); // 刷新菜品列表
    closeModal();
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('保存菜品失败:', error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (dishId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个菜品吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteDish(dishId);
    ElMessage.success('菜品删除成功！');
    await fetchDishes(); // 刷新菜品列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error));
      console.error('删除菜品失败:', error);
    } else {
      ElMessage.info('删除已取消');
    }
  }
};

const resetFilters = () => {
  dishNameFilter.value = '';
  canteenFilterId.value = '';
  currentPage.value = 1; // 重置到第一页
  ElMessage.success('筛选条件已重置');
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

// 生命周期钩子
onMounted(() => {
  fetchCanteens();
  fetchDietaryTags(); // 新增：在组件挂载时获取饮食标签
  fetchAllergens();   // 新增：在组件挂载时获取过敏原
  fetchDishes();
});

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<style scoped>
.dish-management-content {
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  font-size: 28px;
  color: #1f2937;
  margin: 0;
  font-weight: 600;
}

.action-button {
  background-color: #409EFF; /* Consistent blue button */
  color: white;
  border: none;
  border-radius: 4px; /* Consistent rounded corners */
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #66b1ff;
}

.dish-table-card {
  border-radius: 12px; /* Consistent card style */
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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
  flex-wrap: wrap;
  gap: 10px;
}

.dish-image {
  width: 80px; /* Consistent image size */
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Dialog specific styles */
.image-upload-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.file-input {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.preview-thumb {
  width: 100px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
  margin-top: 10px;
  border: 1px solid #e5e7eb;
}

/* Element Plus overrides for consistent button styles */
.el-button {
  border-radius: 4px; /* Consistent with action-button */
}
.el-button--primary {
  background-color: #409EFF;
  border-color: #409EFF;
}
.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
.el-button--danger {
  background-color: #F56C6C;
  border-color: #F56C6C;
}
.el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

/* Pagination wrapper (if needed for dish management in future) */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* Added styles for tags */
.el-tag.mr-1 {
  margin-right: 4px;
}
.el-tag.mb-1 {
  margin-bottom: 4px;
}
</style>
