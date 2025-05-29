<template>
    <div class="canteen-management-content">
        <div class="page-header">
            <h2>食堂管理</h2>
            <el-button type="primary" @click="openAddModal" class="action-button">
                <el-icon><Plus /></el-icon> 添加食堂
            </el-button>
        </div>

        <el-card class="canteen-table-card">
            <template #header>
                <div class="card-header">
                    <h3>食堂列表</h3>
                </div>
            </template>

            <el-table :data="canteens" style="width: 100%" v-loading="loading" max-height="600">
                <el-table-column prop="name" label="名称" width="150" sortable></el-table-column>
                <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
                <el-table-column prop="location" label="位置" width="150"></el-table-column>
                <el-table-column prop="openingHours" label="营业时间" width="120"></el-table-column>
                <el-table-column prop="contactPhone" label="联系电话" width="120"></el-table-column>
                <el-table-column label="图片" width="100">
                    <template #default="scope">
                        <img v-if="scope.row.imageUrl" :src="scope.row.imageUrl" alt="食堂图片" class="canteen-image" />
                        <span v-else>无图片</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                    <template #default="scope">
                        <el-button size="small" @click="openEditModal(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="confirmDelete(scope.row.canteenId)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog
                v-model="showModal"
                :title="isEditMode ? '编辑食堂' : '添加食堂'"
                width="600px"
                @close="closeModal"
        >
            <el-form :model="currentCanteen" :rules="canteenRules" ref="canteenFormRef" label-width="90px">
                <el-form-item label="名称" prop="name" >
                    <el-input v-model="currentCanteen.name"></el-input>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input type="textarea" v-model="currentCanteen.description" :rows="3"></el-input>
                </el-form-item>
                <el-form-item label="位置" prop="location">
                    <el-input v-model="currentCanteen.location"></el-input>
                </el-form-item>
                <el-form-item label="营业时间">
                    <el-col :span="11">
                        <el-form-item prop="openingTimeStart">
                            <el-time-picker
                                    v-model="currentCanteen.openingTimeStart"
                                    placeholder="开始时间"
                                    value-format="HH:mm:ss"
                                    style="width: 100%;"
                            ></el-time-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="2" style="text-align: center;">-</el-col>
                    <el-col :span="11">
                        <el-form-item prop="openingTimeEnd">
                            <el-time-picker
                                    v-model="currentCanteen.openingTimeEnd"
                                    placeholder="结束时间"
                                    value-format="HH:mm:ss"
                                    style="width: 100%;"
                            ></el-time-picker>
                        </el-form-item>
                    </el-col>
                </el-form-item>
                <el-form-item label="联系电话" prop="contactPhone">
                    <el-input v-model="currentCanteen.contactPhone"></el-input>
                </el-form-item>
                <el-form-item label="图片" prop="imageUrl">
                    <div class="image-upload-wrapper">
                        <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
                        <el-button type="info" plain>选择图片</el-button>
                    </div>
                    <div class="image-preview">
                        <img v-if="isEditMode && currentCanteen.imageUrl && !selectedFile" :src="currentCanteen.imageUrl" alt="食堂图片" class="preview-thumb">
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
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// Assuming these APIs are globally available or imported from a shared file
// as per the user's instruction "你不需要import就能使用"
// If not, you would need to import them:
import { getAllCanteens, createCanteen, updateCanteen, deleteCanteen } from '@/services/api.js';

// Reactive data
const loading = ref(false);
const saving = ref(false);
const canteens = ref([]);
const showModal = ref(false);
const isEditMode = ref(false);
const currentCanteen = reactive({
    canteenId: null,
    name: '',
    description: '',
    location: '',
    openingHours: '', // This will be the combined string for API
    openingTimeStart: '', // New property for time picker 1
    openingTimeEnd: '',   // New property for time picker 2
    contactPhone: '',
    imageUrl: '' // Existing image URL
});
const selectedFile = ref(null);
const previewUrl = ref(null);
const canteenFormRef = ref(null); // Ref for Element Plus form

// Form validation rules
const canteenRules = reactive({
    name: [{ required: true, message: '请输入食堂名称', trigger: 'blur' }],
    description: [{ required: false, message: '请输入食堂描述', trigger: 'blur' }],
    location: [{ required: false, message: '请输入食堂位置', trigger: 'blur' }],
    openingTimeStart: [{ required: false, message: '请选择开始时间', trigger: 'change' }],
    openingTimeEnd: [{ required: false, message: '请选择结束时间', trigger: 'change' }],
    contactPhone: [{ required: false, message: '请输入联系电话', trigger: 'blur' }],
});

// Helper function: Extract error message
const getErrorMessage = (error) => {
    if (error.response && error.response.data && error.response.data.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return '操作失败！';
};

// Methods
const fetchCanteens = async () => {
    loading.value = true;
    try {
        const response = await getAllCanteens();
        canteens.value = response.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取食堂列表失败:', error);
    } finally {
        loading.value = false;
    }
};

const openAddModal = () => {
    isEditMode.value = false;
    // Reset reactive object properties
    Object.assign(currentCanteen, {
        canteenId: null,
        name: '',
        description: '',
        location: '',
        openingHours: '', // Reset combined string
        openingTimeStart: '08:00:00', // Default start
        openingTimeEnd: '22:00:00',   // Default end
        contactPhone: '',
        imageUrl: ''
    });
    selectedFile.value = null;
    previewUrl.value = null;
    showModal.value = true;
    // Reset form validation state after modal opens and data is set
    canteenFormRef.value?.resetFields();
};

const openEditModal = (canteen) => {
    isEditMode.value = true;
    // Assign properties from existing canteen to reactive currentCanteen
    Object.assign(currentCanteen, { ...canteen });
    // Parse openingHours string into two time picker values
    const [start, end] = canteen.openingHours ? canteen.openingHours.split('-') : ['', ''];
    currentCanteen.openingTimeStart = start ? (start.length === 5 ? start + ':00' : start) : '';
    currentCanteen.openingTimeEnd = end ? (end.length === 5 ? end + ':00' : end) : '';

    selectedFile.value = null;
    previewUrl.value = null;
    showModal.value = true;
    // Reset form validation state after modal opens and data is set
    canteenFormRef.value?.resetFields();
};

const closeModal = () => {
    showModal.value = false;
    // Revoke object URL when closing modal to free memory
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
            URL.revokeObjectURL(previewUrl.value); // Revoke previous URL if exists
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
    if (!canteenFormRef.value) return;

    try {
        // Construct the openingHours string before validation
        currentCanteen.openingHours = `${currentCanteen.openingTimeStart.substring(0, 5)}-${currentCanteen.openingTimeEnd.substring(0, 5)}`;

        await canteenFormRef.value.validate(); // Validate form fields (including new time fields)
        saving.value = true;

        const formData = new FormData();

        // Construct canteen info object
        const canteenData = {
            name: currentCanteen.name,
            description: currentCanteen.description,
            location: currentCanteen.location,
            openingHours: currentCanteen.openingHours, // Use the constructed string
            contactPhone: currentCanteen.contactPhone
        };

        // Append canteen data as JSON blob
        formData.append('canteen', new Blob([JSON.stringify(canteenData)], {
            type: 'application/json'
        }));

        // If a new image file is selected, append it
        if (selectedFile.value) {
            formData.append('image', selectedFile.value);
        } else if (isEditMode.value && currentCanteen.imageUrl) {
            // If in edit mode and no new file selected, but there's an existing image URL,
            // you might need to tell the backend to keep the existing image.
            // This depends on your backend API design.
            // For now, if no new file is selected, no 'image' field is sent,
            // implying the backend should retain the existing one if it's an update.
        }


        if (isEditMode.value) {
            await updateCanteen(currentCanteen.canteenId, formData);
            ElMessage.success('食堂更新成功！');
        } else {
            await createCanteen(formData);
            ElMessage.success('食堂创建成功！');
        }
        await fetchCanteens(); // Refresh list
        closeModal();
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('保存食堂失败:', error);
    } finally {
        saving.value = false;
    }
};

const confirmDelete = async (canteenId) => {
    try {
        await ElMessageBox.confirm('确定要删除这个食堂吗？删除后无法恢复。', '确认删除', {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
        });
        await deleteCanteen(canteenId);
        ElMessage.success('食堂删除成功！');
        await fetchCanteens(); // Refresh list
    } catch (error) {
        if (error !== 'cancel') { // Check if it's not just a user cancellation
            ElMessage.error(getErrorMessage(error));
            console.error('删除食堂失败:', error);
        } else {
            ElMessage.info('删除已取消');
        }
    }
};

// Lifecycle Hooks
onMounted(() => {
    fetchCanteens();
});

onBeforeUnmount(() => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
});
</script>

<style scoped>
.canteen-management-content {
    margin: 0 auto;
    padding: 20px;
    max-width: 1200px; /* Consistent with menu management */
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

.canteen-table-card {
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

.canteen-image {
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

/* Pagination wrapper for consistent centering */
.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
}
</style>
