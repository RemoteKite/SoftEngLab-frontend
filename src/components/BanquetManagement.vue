<template>
    <div class="banquet-management-container">
        <h1 class="page-title">宴会预约管理</h1>

        <el-card class="role-selector-card mb-4">
            <div class="filter-group">
                <!-- 角色和用户ID从JWT Token中获取 -->
                <div class="filter-item">
                    <label>当前角色:</label>
                    <span>{{ getReservationStatusText(userRole) || '加载中...' }}</span>
                </div>
                <div class="filter-item" v-if="userRole === 'DINER'">
                    <label>当前用户名:</label>
                    <span>{{ currentUserId || '加载中...' }}</span>
                </div>

                <div class="filter-item" v-if="userRole !== 'DINER'">
                    <label>预约状态筛选:</label>
                    <el-select v-model="statusFilter" placeholder="筛选状态" clearable class="compact-input">
                        <el-option label="所有" value=""></el-option>
                        <el-option
                                v-for="status in allReservationStatuses"
                                :key="status"
                                :label="getReservationStatusText(status)"
                                :value="status"
                        ></el-option>
                    </el-select>
                </div>
                <el-button type="primary" @click="fetchBanquetReservations" :loading="loading">
                    <el-icon><Refresh /></el-icon> 刷新预约
                </el-button>
            </div>
        </el-card>

        <el-card class="reservation-list-card">
            <template #header>
                <div class="card-header-title">
                    <span>我的预约</span>
                </div>
            </template>
            <el-table :data="filteredReservationsDisplay" v-loading="loading" style="width: 100%" class="reservation-table" empty-text="暂无预约数据">
                <el-table-column prop="banquetId" label="预约ID" width="120" sortable></el-table-column>
                <el-table-column prop="contactName" label="联系人" width="120"></el-table-column>
                <el-table-column prop="canteenName" label="餐厅" width="120"></el-table-column>
                <el-table-column prop="roomName" label="包厢" width="100"></el-table-column>
                <el-table-column prop="eventDate" label="宴会日期" width="120" sortable></el-table-column>
                <el-table-column prop="eventTime" label="宴会时间" width="100"></el-table-column>
                <el-table-column prop="numberOfGuests" label="宾客人数" width="100"></el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getStatusTagType(row.status)">
                            {{ getReservationStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180" sortable>
                    <template #default="{ row }">
                        {{ formatDateTime(row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" min-width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" @click="viewReservationDetails(row)">查看详情</el-button>
                        <el-button
                                v-if="canUpdateStatus(row.status)"
                                size="small"
                                type="warning"
                                @click="showUpdateStatusDialog(row)"
                        >
                            更新状态
                        </el-button>
                        <el-button
                                v-if="canCancelReservation(row.status)"
                                size="small"
                                type="danger"
                                @click="confirmCancelReservation(row)"
                        >
                            取消预约
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 预约详情弹框 -->
        <el-dialog
                v-model="showReservationDetailModal"
                :title="selectedReservationDetails ? '预约详情: ' + selectedReservationDetails.banquetId : '预约详情'"
                width="600px"
                destroy-on-close
                center
        >
            <div v-if="selectedReservationDetails" class="reservation-detail-content">
                <p><strong>预约ID:</strong> {{ selectedReservationDetails.banquetId }}</p>
                <p><strong>联系人:</strong> {{ selectedReservationDetails.contactName }}</p>
                <p><strong>联系电话:</strong> {{ selectedReservationDetails.contactPhoneNumber }}</p>
                <p><strong>餐厅:</strong> {{ selectedReservationDetails.canteenName }}</p>
                <p><strong>包厢:</strong> {{ selectedReservationDetails.roomName }}</p>
                <p><strong>宴会日期:</strong> {{ selectedReservationDetails.eventDate }}</p>
                <p><strong>宴会时间:</strong> {{ selectedReservationDetails.eventTime }}</p>
                <p><strong>宾客人数:</strong> {{ selectedReservationDetails.numberOfGuests }}</p>
                <p><strong>宴会目的:</strong> {{ selectedReservationDetails.purpose || '无' }}</p>
                <p><strong>需要生日蛋糕:</strong> {{ selectedReservationDetails.hasBirthdayCake ? '是' : '否' }}</p>
                <p><strong>定制菜单请求:</strong> {{ selectedReservationDetails.customMenuRequest || '无' }}</p>
                <p><strong>特殊要求:</strong> {{ selectedReservationDetails.specialRequests || '无' }}</p>
                <p><strong>状态:</strong>
                    <el-tag :type="getStatusTagType(selectedReservationDetails.status)">
                        {{ getReservationStatusText(selectedReservationDetails.status) }}
                    </el-tag>
                </p>
                <p><strong>创建时间:</strong> {{ formatDateTime(selectedReservationDetails.createdAt) }}</p>

                <h4 class="items-header" v-if="selectedReservationDetails.customDishDtos && selectedReservationDetails.customDishDtos.length > 0">已选菜品:</h4>
                <div v-if="selectedReservationDetails.customDishDtos && selectedReservationDetails.customDishDtos.length > 0" class="selected-items-tags">
                    <el-tag v-for="dish in selectedReservationDetails.customDishDtos" :key="dish.dishId" size="small">{{ dish.name }}</el-tag>
                </div>

                <h4 class="items-header" v-if="selectedReservationDetails.packageDtos && selectedReservationDetails.packageDtos.length > 0">已选套餐:</h4>
                <div v-if="selectedReservationDetails.packageDtos && selectedReservationDetails.packageDtos.length > 0" class="selected-items-tags">
                    <el-tag type="success" v-for="pkg in selectedReservationDetails.packageDtos" :key="pkg.packageId" size="small">{{ pkg.name }}</el-tag>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showReservationDetailModal = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 更新状态弹框 -->
        <el-dialog
                v-model="showUpdateStatusModal"
                title="更新预约状态"
                width="400px"
                destroy-on-close
                center
        >
            <div class="update-status-content">
                <p>预约ID: <strong>{{ reservationToUpdateStatus?.banquetId }}</strong></p>
                <p>当前状态:
                    <el-tag :type="getStatusTagType(reservationToUpdateStatus?.status)">
                        {{ getReservationStatusText(reservationToUpdateStatus?.status) }}
                    </el-tag>
                </p>
                <el-form label-position="top" class="mt-4">
                    <el-form-item label="新状态">
                        <el-select v-model="newReservationStatus" placeholder="选择新状态" style="width: 100%">
                            <el-option label="已确认 (CONFIRMED)" value="CONFIRMED"
                                       :disabled="reservationToUpdateStatus?.status !== 'PENDING'"></el-option>
                            <el-option label="已完成 (COMPLETED)" value="COMPLETED"
                                       :disabled="reservationToUpdateStatus?.status !== 'CONFIRMED' && reservationToUpdateStatus?.status !== 'PENDING'"></el-option>
                            <el-option label="已取消 (CANCELLED)" value="CANCELLED"
                                       :disabled="reservationToUpdateStatus?.status === 'COMPLETED' || reservationToUpdateStatus?.status === 'CANCELLED'"></el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showUpdateStatusModal = false">取消</el-button>
                    <el-button type="primary" @click="updateReservationStatusConfirmed">确认更新</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

// 导入 API 服务 (已根据您提供的最新API名称进行了更新)
import {
    getAllBanquets, // 原 getAllBanquetReservations
    getBanquetsByCurrentUser, // 原 getBanquetReservationsByCurrentUser
    updateBanquetStatus, // 原 updateBanquetReservationStatus
    cancelBanquet // 原 cancelBanquetReservation
} from '@/services/api.js';

// 获取并解码 JWT Token 中的信息
const getDecodedJwtInfo = () => {
    const token = localStorage.getItem('token'); // 从 localStorage 获取 token
    if (!token) {
        // 没有token，视为普通用户，并给予警告
        console.warn('未检测到登录凭证，将以普通用户身份加载宴会预约。');
        return { role: 'DINER', userId: 'anonymous' }; // 默认普通用户和匿名ID
    }

    try {
        const payloadBase64 = token.split('.')[1]; // JWT 的第二部分是 Payload
        // Base64 解码并解析 JSON
        const decodedPayload = JSON.parse(atob(payloadBase64));

        let role = 'DINER'; // 默认角色
        if (decodedPayload.roles && Array.isArray(decodedPayload.roles)) {
            // 根据角色优先级设置最高权限角色
            if (decodedPayload.roles.includes('ROLE_ADMIN')) {
                role = 'ADMIN';
            } else if (decodedPayload.roles.includes('ROLE_STAFF')) {
                role = 'STAFF';
            }
        }

        const userId = decodedPayload.sub || 'unknownUser'; // 'sub' 字段通常是用户ID或用户名
        return { role, userId };
    } catch (error) {
        console.error('解析JWT Token失败:', error);
        ElMessage.error('JWT Token解析失败，请尝试重新登录。');
        // 解析失败，回退到普通用户角色
        return { role: 'DINER', userId: 'invalidTokenUser' };
    }
};

const userRole = ref(null); // 用户的角色，初始化为null，将从JWT中获取
const currentUserId = ref(null); // 当前用户的ID，初始化为null，将从JWT中获取

const loading = ref(false);
const rawBanquetReservations = ref([]); // 存储从后端获取的所有预约数据（ADMIN/STAFF）
const banquetReservations = ref([]); // 实际绑定到表格的数据（DINER或经过前端筛选后的结果）
const statusFilter = ref(''); // 用于 ADMIN/STAFF 筛选预约状态

// 预约详情弹框相关
const showReservationDetailModal = ref(false);
const selectedReservationDetails = ref(null);

// 更新状态弹框相关
const showUpdateStatusModal = ref(false);
const reservationToUpdateStatus = ref(null); // 存储待更新状态的预约
const newReservationStatus = ref(''); // 存储用户选择的新状态

// 所有可能的预约状态
const allReservationStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

// 辅助函数：根据状态获取标签类型
const getStatusTagType = (status) => {
    switch (status) {
        case 'PENDING': return 'info';
        case 'CONFIRMED': return ''; // 默认类型
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'danger';
        default: return 'info';
    }
};

// 辅助函数：获取预约状态的中文文本，也用于显示角色
const getReservationStatusText = (status) => {
    switch (status) {
        case 'DINER': return '普通用户';
        case 'STAFF': return '员工';
        case 'ADMIN': return '管理员';
        case 'PENDING': return '待处理';
        case 'CONFIRMED': return '已确认';
        case 'COMPLETED': return '已完成';
        case 'CANCELLED': return '已取消';
        default: return '未知';
    }
};

// 辅助函数：格式化日期时间
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            const parts = dateTimeString.split('T');
            const datePart = parts[0];
            const timePart = parts[1] ? parts[1].substring(0, 8) : '';
            return `${datePart} ${timePart}`;
        }
        return date.toLocaleString();
    } catch (e) {
        console.error("日期时间格式化失败:", dateTimeString, e);
        return dateTimeString;
    }
};

// 权限判断：是否可以更新预约状态
const canUpdateStatus = (status) => {
    return (userRole.value === 'ADMIN' || userRole.value === 'STAFF') &&
        (status === 'PENDING' || status === 'CONFIRMED');
};

// 权限判断：是否可以取消预约
const canCancelReservation = (status) => {
    const adminOrStaffCanCancel = (userRole.value === 'ADMIN' || userRole.value === 'STAFF') && status !== 'COMPLETED' && status !== 'CANCELLED';
    const dinerCanCancel = (userRole.value === 'DINER' && (status === 'PENDING' || status === 'CONFIRMED'));
    return adminOrStaffCanCancel || dinerCanCancel;
};

// 获取预约列表
const fetchBanquetReservations = async () => {
    if (userRole.value === null) {
        console.log('用户角色未确定，暂不加载预约。');
        return;
    }

    loading.value = true;
    rawBanquetReservations.value = [];
    banquetReservations.value = [];

    try {
        let response;
        if (userRole.value === 'DINER') {
            // 普通用户通过此API获取自己的宴会预约
            response = await getBanquetsByCurrentUser();
            banquetReservations.value = response.data;
        } else {
            // ADMIN 或 STAFF 获取所有宴会预约，前端进行筛选
            response = await getAllBanquets(); // 调用新的API名称，不带参数
            rawBanquetReservations.value = response.data;
        }
        ElMessage.success('预约加载成功！');
    } catch (error) {
        ElMessage.error(`加载预约失败: ${error.message || '未知错误'}`);
        console.error('加载预约失败:', error);
    } finally {
        loading.value = false;
    }
};

// computed 属性：用于在前端根据状态筛选预约并显示
const filteredReservationsDisplay = computed(() => {
    if (userRole.value === 'DINER') {
        return banquetReservations.value;
    } else {
        if (!statusFilter.value) {
            return rawBanquetReservations.value;
        } else {
            return rawBanquetReservations.value.filter(reservation => reservation.status === statusFilter.value);
        }
    }
});

// 查看预约详情
const viewReservationDetails = (reservation) => {
    selectedReservationDetails.value = reservation;
    showReservationDetailModal.value = true;
};

// 显示更新状态弹框
const showUpdateStatusDialog = (reservation) => {
    reservationToUpdateStatus.value = { ...reservation };
    newReservationStatus.value = '';
    showUpdateStatusModal.value = true;
};

// 确认更新预约状态
const updateReservationStatusConfirmed = async () => {
    if (!reservationToUpdateStatus.value || !newReservationStatus.value) {
        ElMessage.warning('请选择一个新状态！');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定将预约 ${reservationToUpdateStatus.value.banquetId} 的状态更新为 "${getReservationStatusText(newReservationStatus.value)}" 吗？`,
            '确认更新',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        // 调用新的API名称
        await updateBanquetStatus(reservationToUpdateStatus.value.banquetId, newReservationStatus.value);
        ElMessage.success('预约状态更新成功！');
        showUpdateStatusModal.value = false;
        fetchBanquetReservations(); // 刷新预约列表
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`更新预约状态失败: ${error.message || '未知错误'}`);
            console.error('更新预约状态失败:', error);
        }
    }
};

// 确认取消预约
const confirmCancelReservation = async (reservation) => {
    try {
        await ElMessageBox.confirm(
            `确定要取消预约 ${reservation.banquetId} 吗？`,
            '取消预约',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        // 调用新的API名称
        await cancelBanquet(reservation.banquetId);
        ElMessage.success('预约已成功取消！');
        fetchBanquetReservations(); // 刷新预约列表
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`取消预约失败: ${error.message || '未知错误'}`);
            console.error('取消预约失败:', error);
        }
    }
};

// 监听 userRole 和 currentUserId 的变化，以触发预约数据的首次获取或重新获取
watch([userRole, currentUserId], () => {
    if (userRole.value) {
        fetchBanquetReservations();
    }
}, { immediate: true });

// mounted 钩子：模拟获取 JWT 信息并设置用户角色和ID
onMounted(async () => {
    const { role, userId } = await getDecodedJwtInfo();
    userRole.value = role;
    currentUserId.value = userId;
});
</script>

<style scoped>
.banquet-management-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.page-title {
    font-size: 28px;
    color: #1f2937;
    margin-bottom: 24px;
    font-weight: 600;
}

.role-selector-card {
    margin-bottom: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-end;
}

.filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-item label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    white-space: nowrap;
}

.compact-input {
    width: 180px;
}

.reservation-list-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.reservation-table {
    margin-top: 16px;
    border-radius: 8px;
    overflow: hidden;
}

/* 预约详情弹框样式 */
.reservation-detail-content p {
    font-size: 15px;
    color: #374151;
    line-height: 1.8;
    margin-bottom: 8px;
}

.reservation-detail-content p strong {
    color: #1f2937;
}

.items-header {
    font-size: 16px;
    color: #1f2937;
    margin-top: 20px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

.selected-items-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
}

/* 更新状态弹框样式 */
.update-status-content p {
    font-size: 15px;
    color: #374151;
    line-height: 1.8;
    margin-bottom: 8px;
}

.update-status-content p strong {
    color: #1f2937;
}

/* Element Plus 覆盖 */
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
.el-button--warning {
    background-color: #E6A23C;
    border-color: #E6A23C;
}
.el-button--warning:hover {
    background-color: #ebb563;
    border-color: #ebb563;
}
.el-button--danger {
    background-color: #F56C6C;
    border-color: #F56C6C;
}
.el-button--danger:hover {
    background-color: #f78989;
    border-color: #f78989;
}
.el-tag {
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .filter-group {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
    }
    .filter-item {
        width: 100%;
    }
    .compact-input {
        width: 100%;
    }
    .el-table {
        font-size: 12px;
    }
    .el-table-column {
        min-width: 80px;
    }
}
</style>
