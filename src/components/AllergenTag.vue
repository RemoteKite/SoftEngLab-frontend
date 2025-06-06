<template>
  <div class="allergen-management-content">
    <div class="page-header">
      <h2>过敏原管理</h2>
      <el-button type="primary" @click="openAddModal" class="action-button">
        <el-icon><Plus /></el-icon> 添加过敏原
      </el-button>
    </div>

    <el-card class="allergen-table-card">
      <template #header>
        <div class="card-header">
          <h3>过敏原列表</h3>
          <!-- 过敏原通常数量较少，此处不添加搜索/筛选功能，保持简洁 -->
        </div>
      </template>

      <el-table :data="pagedAllergens" style="width: 100%" v-loading="loading" max-height="600">
        <!-- 序号列 -->
        <el-table-column type="index" label="序号" width="80">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <!-- 过敏原名称列，无排序 -->
        <el-table-column prop="allergenName" label="过敏原名称" min-width="200"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEditModal(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="confirmDelete(scope.row.allergenId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalAllergens"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
        v-model="showModal"
        :title="isEditMode ? '编辑过敏原' : '添加过敏原'"
        width="400px"
        @close="closeModal"
    >
      <el-form :model="currentAllergen" :rules="allergenRules" ref="allergenFormRef" label-width="90px">
        <el-form-item label="过敏原" prop="allergenName">
          <el-input v-model="currentAllergen.allergenName" placeholder="请输入过敏原名称"></el-input>
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
import { reactive, ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 导入真实的 API 服务
// 假设您的 api.js 文件位于 src/services/api.js 或类似路径
// 请确保您的 api.js 已经包含了以下过敏原管理相关的导出函数
import api, {
  getAllAllergens,
  createAllergen,
  updateAllergen,
  deleteAllergen
} from '@/services/api.js';


// Reactive data
const loading = ref(false);
const saving = ref(false);
const allergens = ref([]); // This will hold all fetched allergens
const showModal = ref(false);
const isEditMode = ref(false);
const currentAllergen = reactive({
  allergenId: null,
  allergenName: ''
});
const allergenFormRef = ref(null); // Ref for Element Plus form

// Pagination related reactive data
const currentPage = ref(1);
const pageSize = ref(10); // Adjust page size as needed
const totalAllergens = ref(0);

// Form validation rules
const allergenRules = reactive({
  allergenName: [
    { required: true, message: '请输入过敏原名称', trigger: 'blur' },
    { min: 2, max: 20, message: '过敏原名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
});

// Helper function: Extract error message from API response
const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '操作失败！';
};

// Computed property for client-side pagination
const pagedAllergens = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalAllergens.value = allergens.value.length; // Update total for pagination
  return allergens.value.slice(start, end);
});


// Methods
const fetchAllergens = async () => {
  loading.value = true;
  try {
    // 调用真实的 API 获取所有过敏原
    const response = await getAllAllergens();
    allergens.value = response.data; // Store all allergens
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('获取过敏原列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const openAddModal = async () => {
  isEditMode.value = false;
  // 重置表单验证状态并清空数据
  if (allergenFormRef.value) {
    allergenFormRef.value.resetFields();
    await nextTick(); // 确保DOM更新完成
  }
  Object.assign(currentAllergen, {
    allergenId: null,
    allergenName: ''
  });
  showModal.value = true;
  await nextTick();
  allergenFormRef.value?.clearValidate(); // 再次确保表单状态重置
};

const openEditModal = async (allergen) => {
  isEditMode.value = true;
  if (allergenFormRef.value) {
    allergenFormRef.value.resetFields();
    await nextTick();
  }
  Object.assign(currentAllergen, JSON.parse(JSON.stringify(allergen))); // 深拷贝，避免直接修改原始数据
  showModal.value = true;
  await nextTick();
};

const closeModal = () => {
  showModal.value = false;
  if (allergenFormRef.value) {
    allergenFormRef.value.clearValidate(); // 清除验证状态
  }
};

const handleSubmit = async () => {
  if (!allergenFormRef.value) return;

  try {
    await allergenFormRef.value.validate(); // 验证表单
    saving.value = true;

    if (isEditMode.value) {
      // 调用真实的 API 更新过敏原
      await updateAllergen(currentAllergen.allergenId, { allergenName: currentAllergen.allergenName });
      ElMessage.success('过敏原更新成功！');
    } else {
      // 调用真实的 API 创建过敏原
      await createAllergen({ allergenName: currentAllergen.allergenName });
      ElMessage.success('过敏原创建成功！');
    }
    await fetchAllergens(); // Refresh allergens list
    closeModal();
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('保存过敏原失败:', error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (allergenId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个过敏原吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // 调用真实的 API 删除过敏原
    await deleteAllergen(allergenId);
    ElMessage.success('过敏原删除成功！');
    await fetchAllergens(); // Refresh allergens list
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error));
      console.error('删除过敏原失败:', error);
    } else {
      ElMessage.info('删除已取消');
    }
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

// Lifecycle Hook
onMounted(() => {
  fetchAllergens();
});
</script>

<style scoped>
.allergen-management-content {
  margin: 0 auto;
  padding: 20px;
  max-width: 900px; /* 调整最大宽度，适应管理页面 */
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

.allergen-table-card {
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
