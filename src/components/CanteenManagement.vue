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

            <el-table :data="PagedCanteens" style="width: 100%" v-loading="loading" max-height="600">
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
                <el-table-column label="操作" width="260" fixed="right">
                    <template #default="scope">
                        <el-button size="small" @click="openEditModal(scope.row)">编辑</el-button>
                        <el-button size="small" @click="openImageModal(scope.row.canteenId)">更多图片</el-button>
                        <el-button size="small" type="danger" @click="confirmDelete(scope.row.canteenId)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="totalCanteens"
                        layout="total, prev, pager, next, jumper"
                        @current-change="handlePageChange"
                />
            </div>
        </el-card>

        <el-dialog
                v-model="showModal"
                :title="isEditMode ? '编辑食堂' : '添加食堂'"
                width="600px"
                @close="closeModal"
        >
            <el-form :model="currentCanteen" :rules="canteenRules" ref="canteenFormRef" label-width="90px">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="currentCanteen.name"></el-input>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input type="textarea" v-model="currentCanteen.description" :rows="3"></el-input>
                </el-form-item>
                <el-form-item label="位置" prop="location">
                    <el-input v-model="currentCanteen.location"></el-input>
                </el-form-item>
                <el-form-item label="营业时间" prop="openingHours">
                    <el-input v-model="currentCanteen.openingHours"></el-input>
                </el-form-item>
                <el-form-item label="联系电话" prop="contactPhone">
                    <el-input v-model="currentCanteen.contactPhone"></el-input>
                </el-form-item>
                <el-form-item label="图片" prop="imageUrl">
                    <div class="image-upload-wrapper">
                        <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
                        <el-button type="info" >选择图片</el-button>
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

        <el-dialog
                v-model="showImageModal"
                title="管理食堂更多图片"
                width="800px"
                @close="closeImageModal"
        >
            <div class="image-gallery-container" v-loading="imageLoading">
                <div v-if="canteenImages.length > 0" class="image-grid">
                    <el-card v-for="img in canteenImages" :key="img.imageId" class="image-card">
                        <img :src="img.imageUrl" :alt="img.description || '食堂图片'" class="gallery-image" />
                        <div class="image-info">
                            <el-input
                                    v-model="img.description"
                                    placeholder="图片描述"
                                    @blur="updateImageDescription(img.imageId, img.description)"
                                    :disabled="imageUpdating"
                            ></el-input>
                            <el-button type="danger" size="small" :icon="Delete" circle @click="confirmDeleteCanteenImage(img.imageId)"></el-button>
                        </div>
                    </el-card>
                </div>
                <el-empty v-else description="暂无更多图片" :image-size="100"></el-empty>

                <el-divider>上传新图片</el-divider>
                <div class="new-image-upload-section">
                    <div class="file-input-group">
                        <div class="image-upload-wrapper">
                            <input type="file" @change="handleNewImageFileChange" accept="image/*" class="file-input" />
                            <el-button type="info">选择图片</el-button>
                        </div>
                        <el-input
                                v-model="newImageDescription"
                                placeholder="图片介绍文字 (可选)"
                                class="image-description-input"
                        ></el-input>
                    </div>
                    <div class="image-preview" v-if="newImagePreviewUrl">
                        <img :src="newImagePreviewUrl" alt="新图片预览" class="preview-thumb">
                    </div>
                    <el-button
                            type="primary"
                            :icon="Upload"
                            @click="uploadNewCanteenImage"
                            :loading="uploadingImage"
                            :disabled="!newSelectedImageFile"
                            class="upload-button"
                    >
                        上传图片
                    </el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import {reactive, ref, onMounted, onBeforeUnmount, computed, nextTick} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Upload } from '@element-plus/icons-vue';

// Assuming these APIs are globally available or imported from a shared file
// If not, you would need to import them:
import {
    getAllCanteens,
    createCanteen,
    updateCanteen,
    deleteCanteen,
    createCanteenImage, // New
    getCanteenImageByCanteen, // New
    deleteCanteenImage, // New
    updateCanteenImageDescription // New
} from '@/services/api.js'; // Assuming your API file path

// Reactive data
const loading = ref(false); // Table loading state
const saving = ref(false); // Add/edit canteen save state
const canteens = ref([]); // Canteen list data
const showModal = ref(false); // Add/edit canteen modal display state
const isEditMode = ref(false); // Is in edit mode
const currentCanteen = reactive({ // Current canteen data being edited/added
    canteenId: null,
    name: '',
    description: '',
    location: '',
    openingHours: '',
    contactPhone: '',
    imageUrl: '' // Existing image URL
});
const selectedFile = ref(null); // File selected when adding/editing canteen
const previewUrl = ref(null); // File preview URL when adding/editing canteen
const canteenFormRef = ref(null); // Reference to Element Plus form

const currentPage = ref(1);
const pageSize = ref(3); // You can adjust this value
const totalCanteens = ref(0);

// Form validation rules
const canteenRules = reactive({
    name: [{ required: true, message: '请输入食堂名称', trigger: 'blur' }],
    description: [{ required: false, message: '请输入食堂描述', trigger: 'blur' }],
    location: [{ required: true, message: '请输入食堂位置', trigger: 'blur' }],
    openingHours: [{ required: true, message: '请输入营业时间', trigger: 'blur' }],
    contactPhone: [{ required: false, message: '请输入联系电话', trigger: 'blur' }],
});

// More Images Management Modal related data
const showImageModal = ref(false); // More images modal display state
const currentCanteenIdForImages = ref(null); // Canteen ID for which images are currently being managed
const canteenImages = ref([]); // List of more images for the current canteen
const imageLoading = ref(false); // More images loading state
const newSelectedImageFile = ref(null); // New image file to upload
const newImagePreviewUrl = ref(null); // New image preview URL
const newImageDescription = ref(''); // New image description text
const uploadingImage = ref(false); // New image upload state
const imageUpdating = ref(false); // Image description update state

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

// Fetch canteen list
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

// Open add canteen modal
const openAddModal = async () => {
    isEditMode.value = false;

    // 先重置表单验证
    canteenFormRef.value?.resetFields();
    await nextTick();

    // 再清空数据
    Object.assign(currentCanteen, {
        canteenId: null,
        name: '',
        description: '',
        location: '',
        openingHours: '',
        contactPhone: '',
        imageUrl: ''
    });

    // 清除文件相关状态
    selectedFile.value = null;
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
    }

    showModal.value = true;
};

const openEditModal = async (canteen) => {
    isEditMode.value = true;

    // 1. 先完全重置表单
    if (canteenFormRef.value) {
        canteenFormRef.value.resetFields();
        await nextTick(); // 确保重置完成
    }

    // 2. 清空当前数据
    Object.keys(currentCanteen).forEach(key => {
        currentCanteen[key] = key === 'canteenId' ? null : '';
    });

    // 3. 等待一个tick确保清空完成
    await nextTick();

    // 4. 填充新数据
    const newData = JSON.parse(JSON.stringify(canteen));
    Object.keys(newData).forEach(key => {
        if (key in currentCanteen) {
            currentCanteen[key] = newData[key];
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

// Close add/edit canteen modal
const closeModal = () => {
    showModal.value = false;
    // Revoke object URL when closing modal to free memory
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
    }
};

// Handle file selection for add/edit canteen
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

// Submit add/edit canteen form
const handleSubmit = async () => {
    if (!canteenFormRef.value) return;

    try {
        await canteenFormRef.value.validate(); // Validate form fields
        saving.value = true;

        const formData = new FormData();

        // Construct canteen info object
        const canteenData = {
            name: currentCanteen.name,
            description: currentCanteen.description,
            location: currentCanteen.location,
            openingHours: currentCanteen.openingHours,
            contactPhone: currentCanteen.contactPhone
            // imageUrl is handled separately as a file or kept if not changed
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

// Confirm canteen deletion
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

// More Images Management Modal related methods

// Open more images modal
const openImageModal = async (canteenId) => {
    currentCanteenIdForImages.value = canteenId;
    showImageModal.value = true;
    await fetchCanteenImages(canteenId);
};

// Fetch more images for the canteen
const fetchCanteenImages = async (canteenId) => {
    imageLoading.value = true;
    try {
        const response = await getCanteenImageByCanteen(canteenId);
        canteenImages.value = response.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取食堂图片失败:', error);
    } finally {
        imageLoading.value = false;
    }
};

// Close more images modal
const closeImageModal = () => {
    showImageModal.value = false;
    currentCanteenIdForImages.value = null;
    canteenImages.value = [];
    newSelectedImageFile.value = null;
    if (newImagePreviewUrl.value) {
        URL.revokeObjectURL(newImagePreviewUrl.value);
    }
    newImagePreviewUrl.value = null;
    newImageDescription.value = ''; // Clear new image description
};

// Handle new image file selection
const handleNewImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        newSelectedImageFile.value = file;
        if (newImagePreviewUrl.value) {
            URL.revokeObjectURL(newImagePreviewUrl.value);
        }
        newImagePreviewUrl.value = URL.createObjectURL(file);
    } else {
        newSelectedImageFile.value = null;
        if (newImagePreviewUrl.value) {
            URL.revokeObjectURL(newImagePreviewUrl.value);
        }
        newImagePreviewUrl.value = null;
    }
};

// Upload new image
const uploadNewCanteenImage = async () => {
    if (!newSelectedImageFile.value || !currentCanteenIdForImages.value) {
        ElMessage.warning('请选择一个图片');
        return;
    }

    uploadingImage.value = true;
    try {
        const formData = new FormData();
        formData.append('image', newSelectedImageFile.value);
        // Append the new image description if available
        if (newImageDescription.value) {
            formData.append('description', newImageDescription.value);
        }

        await createCanteenImage(currentCanteenIdForImages.value, formData);
        ElMessage.success('图片上传成功');
        newSelectedImageFile.value = null;
        if (newImagePreviewUrl.value) {
            URL.revokeObjectURL(newImagePreviewUrl.value);
        }
        newImagePreviewUrl.value = null;
        newImageDescription.value = ''; // Clear new image description after upload
        await fetchCanteenImages(currentCanteenIdForImages.value); // Refresh image list
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('上传图片失败:', error);
    } finally {
        uploadingImage.value = false;
    }
};

// Confirm deletion of canteen image
const confirmDeleteCanteenImage = async (imageId) => {
    try {
        await ElMessageBox.confirm('确定要删除这个图片吗？删除后无法恢复。', '确认删除', {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
        });
        await deleteCanteenImage(imageId);
        ElMessage.success('图片删除成功');
        await fetchCanteenImages(currentCanteenIdForImages.value); // Refresh image list
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(getErrorMessage(error));
            console.error('删除图片失败:', error);
        } else {
            ElMessage.info('删除已取消');
        }
    }
};

// Update image description
const updateImageDescription = async (imageId, description) => {
    imageUpdating.value = true;
    try {
        // API requires application/x-www-form-urlencoded, so pass an object directly
        // axios will automatically serialize it to form-urlencoded
        await updateCanteenImageDescription(imageId, { updatedDescription: description });
        ElMessage.success('成功更新图片描述');
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('更新图片描述失败:', error);
        // If update fails, might need to re-fetch image list or rollback description
        await fetchCanteenImages(currentCanteenIdForImages.value);
    } finally {
        imageUpdating.value = false;
    }
};

const PagedCanteens = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    totalCanteens.value = canteens.value.length; // Update total for pagination
    return canteens.value.slice(start, end);
});


const handlePageChange = (page) => {
    currentPage.value = page;
};


// Lifecycle Hooks
onMounted(() => {
    fetchCanteens();
});

onBeforeUnmount(() => {
    // Revoke all preview URLs before component unmounts
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
    if (newImagePreviewUrl.value) {
        URL.revokeObjectURL(newImagePreviewUrl.value);
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

/* More images management modal styles */
.image-gallery-container {
    padding: 10px;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.image-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
}

.gallery-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 10px;
}

.image-info {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.image-info .el-input {
    flex-grow: 1;
}

.new-image-upload-section {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.file-input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-grow: 1; /* Allows it to take available space */
}

.image-description-input {
    max-width: 250px; /* Limit width of the input field */
}

.new-image-upload-section .preview-thumb {
    margin-top: 0; /* Override default margin */
}

.upload-button {
    margin-left: auto; /* Push button to the right */
}
</style>
