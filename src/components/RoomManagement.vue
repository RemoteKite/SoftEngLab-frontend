<template>
    <div class="room-management-container">
        <div class="page-header">
            <h2>房间管理</h2>
            <button class="action-button" @click="openRoomDialog('add')">
                <span>+</span> 添加房间
            </button>
        </div>

        <el-card class="room-table-card">
            <template #header>
                <div class="card-header">
                    <h3>房间列表</h3>
                    <div class="header-controls">
                        <el-select
                                v-model="selectedCanteenId"
                                placeholder="选择餐厅"
                                style="width: 150px; margin-right: 12px;"
                                @change="currentPage = 1" clearable
                        >
                            <el-option
                                    v-for="canteen in canteenList"
                                    :key="canteen.canteenId"
                                    :label="canteen.name"
                                    :value="canteen.canteenId"
                            ></el-option>
                        </el-select>
                        <el-input
                                v-model="roomNameFilter"
                                placeholder="搜索房间名称"
                                prefix-icon="Search"
                                style="width: 200px; margin-right: 12px;"
                                @input="currentPage = 1" clearable
                        />
                        <el-button @click="refreshRoomList">
                            <el-icon><Refresh /></el-icon>
                            重置筛选
                        </el-button>
                    </div>
                </div>
            </template>

            <el-table :data="filteredAndPagedRooms" style="width: 100%" v-loading="loading" max-height="600">
                <el-table-column prop="roomId" label="房间ID" width="120" sortable></el-table-column>
                <el-table-column prop="canteenName" label="餐厅" width="150" sortable></el-table-column>
                <el-table-column prop="name" label="房间名称" width="150" sortable></el-table-column>
                <el-table-column prop="capacity" label="容量" width="80"></el-table-column>
                <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
                <el-table-column prop="baseFee" label="基础费用" width="100">
                    <template #default="scope">
                        ¥{{ scope.row.baseFee ? scope.row.baseFee.toFixed(2) : '0.00' }}
                    </template>
                </el-table-column>
                <el-table-column label="图片" width="100">
                    <template #default="scope">
                        <img v-if="scope.row.imageUrl" :src="scope.row.imageUrl" :alt="scope.row.name" class="room-image" />
                        <span v-else>无图片</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="scope">
                        <el-button size="small" @click="openRoomDialog('edit', scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteRoomConfirm(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="totalFilteredRooms"
                        layout="total, prev, pager, next, jumper"
                        @current-change="handlePageChange"
                />
            </div>
        </el-card>

        <!-- 添加/编辑房间弹框 -->
        <el-dialog
                v-model="showRoomDialog"
                :title="currentOperation === 'edit' ? '编辑房间' : '添加房间'"
                width="600px"
                @close="resetForm"
        >
            <el-form :model="roomForm" :rules="roomRules" ref="roomFormRef" label-width="90px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="餐厅" prop="canteenId">
                            <el-select v-model="roomForm.canteenId" placeholder="请选择餐厅" style="width: 100%;">
                                <el-option
                                        v-for="canteen in canteenList"
                                        :key="canteen.canteenId"
                                        :label="canteen.name"
                                        :value="canteen.canteenId"
                                ></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <!-- 已移除一个多余的 </el-col> 闭合标签 -->
                    <el-col :span="12">
                        <el-form-item label="房间名称" prop="name">
                            <el-input v-model="roomForm.name" placeholder="请输入房间名称"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="容量" prop="capacity">
                            <el-input-number
                                    v-model="roomForm.capacity"
                                    :min="1"
                                    :step="1"
                                    placeholder="请输入容量"
                                    style="width: 100%;"
                            ></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="基础费用" prop="baseFee">
                            <el-input-number
                                    v-model="roomForm.baseFee"
                                    :min="0.01"
                                    :precision="2"
                                    :step="0.01"
                                    placeholder="请输入基础费用"
                                    style="width: 100%;"
                            ></el-input-number>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="描述" prop="description">
                    <el-input v-model="roomForm.description" type="textarea" :rows="3" placeholder="请输入房间描述"></el-input>
                </el-form-item>

                <el-form-item label="图片" prop="imageUrl">
                    <div class="image-upload-wrapper">
                        <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
                        <el-button type="info">选择图片</el-button>
                    </div>
                    <div class="image-preview">
                        <img v-if="currentOperation === 'edit' && roomForm.imageUrl && !selectedFile" :src="roomForm.imageUrl" alt="房间图片" class="preview-thumb">
                        <img v-if="previewUrl" :src="previewUrl" alt="预览图片" class="preview-thumb">
                    </div>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showRoomDialog = false">取消</el-button>
                    <el-button type="primary" @click="submitRoomForm" :loading="saving">
                        {{ currentOperation === 'edit' ? '更新房间' : '立即添加' }}
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Plus,
    Refresh,
    Search
} from '@element-plus/icons-vue'

// 导入 API 服务
import {
    createRoom, getRoomById, getAllRooms, updateRoom, deleteRoom, getRoomsByCanteenId,
    getAllCanteens
} from '@/services/api.js';

// Reactive data
const loading = ref(false) // Table loading state
const saving = ref(false) // Add/edit room submission state
const showRoomDialog = ref(false) // Controls add/edit room dialog visibility
const currentOperation = ref('add'); // 'add' or 'edit' for the room dialog

// Filters for room list
const selectedCanteenId = ref('');
const roomNameFilter = ref('');

const currentPage = ref(1)
const pageSize = ref(10) // Default page size
const totalFilteredRooms = ref(0)

// Form related
const roomFormRef = ref(null)
const roomForm = reactive({
    roomId: null, // Only for edit mode
    canteenId: '',
    name: '',
    capacity: 1, // Default capacity
    description: '',
    imageUrl: '', // Existing image URL for display in form
    baseFee: 0.01, // Default base fee
})

const selectedFile = ref(null); // File selected for upload
const previewUrl = ref(null); // Local URL for image preview

// Form validation rules
const roomRules = {
    canteenId: [{ required: true, message: '请选择餐厅', trigger: 'change' }],
    name: [{ required: true, message: '请输入房间名称', trigger: 'blur' }],
    capacity: [{ required: true, message: '请输入容量', trigger: 'blur' }],
    baseFee: [{ required: true, message: '请输入基础费用', trigger: 'blur' }],
    // imageUrl is optional for update, but required for add if no default is set
    // For `multipart/form-data`, validation often happens after file selection.
    // We'll handle this in submitRoomForm if `selectedFile` is null for 'add' operation.
};

// Data lists
const allFetchedRooms = ref([]); // Stores all rooms fetched from backend
const canteenList = ref([]); // All available canteens

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

// Computed properties for filtering and pagination
const filteredRooms = computed(() => {
    let rooms = allFetchedRooms.value;

    // Filter by Canteen ID
    if (selectedCanteenId.value) {
        rooms = rooms.filter(room => room.canteenId === selectedCanteenId.value);
    }

    // Filter by Room Name
    if (roomNameFilter.value) {
        rooms = rooms.filter(room =>
            room.name.toLowerCase().includes(roomNameFilter.value.toLowerCase())
        );
    }
    return rooms;
});

const filteredAndPagedRooms = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    totalFilteredRooms.value = filteredRooms.value.length; // Update total count for pagination
    return filteredRooms.value.slice(start, end);
});


// Methods
// Initialize data on component mount
onMounted(async () => {
    await fetchCanteenList();
    await fetchAllRoomsData(); // Fetch all rooms initially
});

// Fetch list of canteens
const fetchCanteenList = async () => {
    try {
        const res = await getAllCanteens();
        canteenList.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取餐厅列表失败:', error);
    }
};

// Fetch all rooms from the backend and enrich data for display
const fetchAllRoomsData = async () => {
    loading.value = true;
    try {
        const res = await getAllRooms();
        allFetchedRooms.value = res.data.map(room => {
            const canteen = canteenList.value.find(c => c.canteenId === room.canteenId);
            return {
                ...room,
                canteenName: canteen ? canteen.name : '未知餐厅',
            };
        });
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取房间列表失败:', error);
        allFetchedRooms.value = [];
    } finally {
        loading.value = false;
    }
};

// Reset filter values and re-fetch all data
const refreshRoomList = () => {
    selectedCanteenId.value = '';
    roomNameFilter.value = '';
    currentPage.value = 1;
    fetchAllRoomsData();
    ElMessage.success('筛选已重置，数据已刷新');
};

// Handle page change for pagination
const handlePageChange = (page) => {
    currentPage.value = page;
};

// Open the add/edit room dialog
const openRoomDialog = (operation, row = null) => {
    currentOperation.value = operation;
    showRoomDialog.value = true;
    resetForm(); // Always reset form before populating for edit

    if (operation === 'add') {
        // Set default values for new room
        roomForm.canteenId = selectedCanteenId.value || (canteenList.value.length > 0 ? canteenList.value[0].canteenId : '');
        roomForm.capacity = 1;
        roomForm.baseFee = 0.01;
    } else if (operation === 'edit' && row) {
        // Populate form with existing room data
        Object.assign(roomForm, JSON.parse(JSON.stringify(row))); // Deep copy
    }
    // Ensure `imageUrl` is part of `roomForm` even if it was null in DTO for edit
    if (!roomForm.imageUrl) roomForm.imageUrl = '';
};

// Reset the room form to initial state
const resetForm = () => {
    // Clear validation first
    roomFormRef.value?.resetFields();
    // Then reset data
    Object.assign(roomForm, {
        roomId: null,
        canteenId: '',
        name: '',
        capacity: 1,
        description: '',
        imageUrl: '',
        baseFee: 0.01,
    });
    // Clear file selection and preview
    selectedFile.value = null;
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
    }
};

// Handle file selection for room image
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

// Submit add/edit room form
const submitRoomForm = async () => {
    if (!roomFormRef.value) return;

    try {
        await roomFormRef.value.validate(); // Validate form fields

        // Removed: For 'add' operation, the image selection is now optional.
        // if (currentOperation.value === 'add' && !selectedFile.value) {
        //     ElMessage.warning('请为新房间选择一张图片。');
        //     return;
        // }

        saving.value = true;

        const formData = new FormData();

        // Construct room info object
        const roomData = {
            canteenId: roomForm.canteenId,
            name: roomForm.name,
            capacity: roomForm.capacity,
            description: roomForm.description,
            baseFee: roomForm.baseFee,
            // imageUrl is handled as a file or kept if not changed
        };

        // Append room data as JSON blob
        formData.append('room', new Blob([JSON.stringify(roomData)], {
            type: 'application/json'
        }));

        // If a new image file is selected, append it
        if (selectedFile.value) {
            formData.append('image', selectedFile.value);
        }
        // else if in edit mode and no new file, backend should implicitly keep existing image if it exists.
        // No need to append existing imageUrl explicitly for multipart/form-data update.

        if (currentOperation.value === 'add') {
            await createRoom(formData);
            ElMessage.success('房间添加成功！');
        } else if (currentOperation.value === 'edit' && roomForm.roomId) {
            await updateRoom(roomForm.roomId, formData);
            ElMessage.success('房间更新成功！');
        }
        showRoomDialog.value = false;
        await fetchAllRoomsData(); // Refresh all data after add/update
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('房间操作失败:', error);
    } finally {
        saving.value = false;
    }
};

// Confirm and delete a room
const deleteRoomConfirm = async (room) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除房间 "${room.name}" 吗？删除后无法恢复。`,
            '确认删除',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await deleteRoom(room.roomId);
        ElMessage.success('房间删除成功！');
        await fetchAllRoomsData(); // Refresh all data after deletion
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(getErrorMessage(error));
            console.error('删除房间失败:', error);
        } else {
            ElMessage.info('删除已取消');
        }
    }
};

// Lifecycle Hooks
onBeforeUnmount(() => {
    // Revoke object URLs before component unmounts to prevent memory leaks
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
});
</script>

<style scoped>
.room-management-container {
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
    background-color: #409EFF;
    color: white;
    border: none;
    border-radius: 4px;
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

.room-table-card {
    border-radius: 12px;
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

.room-image {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
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
    z-index: 10; /* Added z-index */
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
    border-radius: 4px;
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
.el-button--info {
    background-color: #909399;
    border-color: #909399;
}
.el-button--info:hover {
    background-color: #a6a9ad;
    border-color: #a6a9ad;
}

/* Responsive design */
@media (max-width: 768px) {
    .header-controls {
        flex-direction: column;
        align-items: flex-start;
    }

    .header-controls > * {
        width: 100%;
        margin-right: 0 !important;
    }

    .page-header h2 {
        font-size: 24px;
    }
}
</style>
