<template>
  <div class="dietary-tag-management-content">
    <div class="page-header">
      <h2>饮食标签管理</h2>
      <el-button type="primary" @click="openAddModal" class="action-button">
        <el-icon><Plus /></el-icon> 添加标签
      </el-button>
    </div>

    <el-card class="tag-table-card">
      <template #header>
        <div class="card-header">
          <h3>标签列表</h3>
          <!-- 饮食标签通常数量较少，此处不添加搜索/筛选功能，保持简洁 -->
        </div>
      </template>

      <el-table :data="pagedDietaryTags" style="width: 100%" v-loading="loading" max-height="600">
        <!-- 新增的序号列 -->
        <el-table-column type="index" label="序号" width="80">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <!-- 移除了 sortable 属性 -->
        <el-table-column prop="tagName" label="标签名称" min-width="200"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEditModal(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="confirmDelete(scope.row.tagId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalTags"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
        v-model="showModal"
        :title="isEditMode ? '编辑饮食标签' : '添加饮食标签'"
        width="400px"
        @close="closeModal"
    >
      <el-form :model="currentTag" :rules="tagRules" ref="tagFormRef" label-width="90px">
        <el-form-item label="标签名称" prop="tagName">
          <el-input v-model="currentTag.tagName" placeholder="请输入标签名称"></el-input>
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
// 请确保您的 api.js 已经包含了以下饮食标签管理相关的导出函数
import api, { // 导入 axios 实例本身 (如果需要)
  getAllDietaryTags,
  createDietaryTag,
  updateDietaryTag,
  deleteDietaryTag
} from '@/services/api.js';


// Reactive data
const loading = ref(false);
const saving = ref(false);
const dietaryTags = ref([]); // This will hold all fetched tags
const showModal = ref(false);
const isEditMode = ref(false);
const currentTag = reactive({
  tagId: null,
  tagName: ''
});
const tagFormRef = ref(null); // Ref for Element Plus form

// Pagination related reactive data
const currentPage = ref(1);
const pageSize = ref(10); // Adjust page size as needed
const totalTags = ref(0);

// Form validation rules
const tagRules = reactive({
  tagName: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 20, message: '标签名称长度在 2 到 20 个字符', trigger: 'blur' }
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
const pagedDietaryTags = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  totalTags.value = dietaryTags.value.length; // Update total for pagination
  return dietaryTags.value.slice(start, end);
});


// Methods
const fetchDietaryTags = async () => {
  loading.value = true;
  try {
    // 调用真实的 API 获取所有饮食标签
    const response = await getAllDietaryTags();
    dietaryTags.value = response.data; // Store all tags
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('获取饮食标签列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const openAddModal = async () => {
  isEditMode.value = false;
  // 重置表单验证状态并清空数据
  if (tagFormRef.value) {
    tagFormRef.value.resetFields();
    await nextTick(); // 确保DOM更新完成
  }
  Object.assign(currentTag, {
    tagId: null,
    tagName: ''
  });
  showModal.value = true;
  await nextTick();
  tagFormRef.value?.clearValidate(); // 再次确保表单状态重置
};

const openEditModal = async (tag) => {
  isEditMode.value = true;
  if (tagFormRef.value) {
    tagFormRef.value.resetFields();
    await nextTick();
  }
  Object.assign(currentTag, JSON.parse(JSON.stringify(tag))); // 深拷贝，避免直接修改原始数据
  showModal.value = true;
  await nextTick();
};

const closeModal = () => {
  showModal.value = false;
  if (tagFormRef.value) {
    tagFormRef.value.clearValidate(); // 清除验证状态
  }
};

const handleSubmit = async () => {
  if (!tagFormRef.value) return;

  try {
    await tagFormRef.value.validate(); // 验证表单
    saving.value = true;

    if (isEditMode.value) {
      // 调用真实的 API 更新饮食标签
      await updateDietaryTag(currentTag.tagId, { tagName: currentTag.tagName });
      ElMessage.success('饮食标签更新成功！');
    } else {
      // 调用真实的 API 创建饮食标签
      await createDietaryTag({ tagName: currentTag.tagName });
      ElMessage.success('饮食标签创建成功！');
    }
    await fetchDietaryTags(); // Refresh tags list
    closeModal();
  } catch (error) {
    ElMessage.error(getErrorMessage(error));
    console.error('保存饮食标签失败:', error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (tagId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个饮食标签吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // 调用真实的 API 删除饮食标签
    await deleteDietaryTag(tagId);
    ElMessage.success('饮食标签删除成功！');
    await fetchDietaryTags(); // Refresh tags list
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error));
      console.error('删除饮食标签失败:', error);
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
  fetchDietaryTags();
});
</script>

<style scoped>
.dietary-tag-management-content {
  margin: 0 auto;
  padding: 20px;
  max-width: 900px; /* 调整最大宽度，适应标签管理 */
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

.tag-table-card {
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
