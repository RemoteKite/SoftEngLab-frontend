<template>
    <div class="order-management-container">
        <h1 class="page-title">订单管理</h1>

        <el-card class="role-selector-card mb-4">
            <div class="filter-group">
                <!-- 角色和用户ID从JWT Token中获取 -->
                <div class="filter-item">
                    <label>当前角色:</label>
                    <span>{{ getOrderStatusText(userRole) || '加载中...' }}</span>
                </div>
                <div class="filter-item" v-if="userRole === 'DINER'">
                    <label>当前用户ID:</label>
                    <span>{{ currentUserId || '加载中...' }}</span>
                </div>

                <div class="filter-item" v-if="userRole !== 'DINER'">
                    <label>订单状态筛选:</label>
                    <el-select v-model="statusFilter" placeholder="筛选状态" clearable class="compact-input">
                        <el-option label="所有" value=""></el-option> <!-- 添加“所有”选项 -->
                        <el-option
                                v-for="status in allOrderStatuses"
                                :key="status"
                                :label="getOrderStatusText(status)"
                                :value="status"
                        ></el-option>
                    </el-select>
                </div>
                <el-button type="primary" @click="fetchOrders" :loading="loading">
                    <el-icon><Refresh /></el-icon> 刷新订单
                </el-button>
            </div>
        </el-card>

        <el-card class="order-list-card">
            <template #header>
                <div class="card-header-title">
                    <span>我的订单</span>
                </div>
            </template>
            <!-- 数据绑定到 filteredOrdersDisplay 计算属性 -->
            <el-table :data="filteredOrdersDisplay" v-loading="loading" style="width: 100%" class="order-table" empty-text="暂无订单数据">
                <el-table-column prop="orderId" label="订单ID" width="120" sortable></el-table-column>
                <el-table-column prop="username" label="用户名" width="120" v-if="userRole !== 'DINER'"></el-table-column>
                <el-table-column prop="canteenName" label="食堂" width="120"></el-table-column>
                <el-table-column prop="orderDate" label="预定日期" width="120" sortable></el-table-column>
                <el-table-column prop="pickupTime" label="取餐时间" width="100"></el-table-column>
                <el-table-column prop="totalAmount" label="总金额" width="100">
                    <template #default="{ row }">
                        ¥{{ row.totalAmount ? row.totalAmount.toFixed(2) : '0.00' }}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getStatusTagType(row.status)">
                            {{ getOrderStatusText(row.status) }}
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
                        <el-button size="small" @click="viewOrderDetails(row)">查看详情</el-button>
                        <el-button
                                v-if="canUpdateStatus(row.status)"
                                size="small"
                                type="warning"
                                @click="showUpdateStatusDialog(row)"
                        >
                            更新状态
                        </el-button>
                        <el-button
                                v-if="canCancelOrder(row.status)"
                                size="small"
                                type="danger"
                                @click="confirmCancelOrder(row)"
                        >
                            取消订单
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 订单详情弹框 -->
        <el-dialog
                v-model="showOrderDetailModal"
                :title="selectedOrderDetails ? '订单详情: ' + selectedOrderDetails.orderId : '订单详情'"
                width="600px"
                destroy-on-close
                center
        >
            <div v-if="selectedOrderDetails" class="order-detail-content">
                <p><strong>订单ID:</strong> {{ selectedOrderDetails.orderId }}</p>
                <p v-if="userRole !== 'DINER'"><strong>用户:</strong> {{ selectedOrderDetails.username }} ({{ selectedOrderDetails.userId }})</p>
                <p><strong>食堂:</strong> {{ selectedOrderDetails.canteenName }}</p>
                <p><strong>预定日期:</strong> {{ selectedOrderDetails.orderDate }}</p>
                <p><strong>取餐时间:</strong> {{ selectedOrderDetails.pickupTime }}</p>
                <p><strong>总金额:</strong> ¥{{ selectedOrderDetails.totalAmount ? selectedOrderDetails.totalAmount.toFixed(2) : '0.00' }}</p>
                <p><strong>状态:</strong>
                    <el-tag :type="getStatusTagType(selectedOrderDetails.status)">
                        {{ getOrderStatusText(selectedOrderDetails.status) }}
                    </el-tag>
                </p>
                <p><strong>创建时间:</strong> {{ formatDateTime(selectedOrderDetails.createdAt) }}</p>

                <h4 class="items-header">订单菜品:</h4>
                <el-table :data="selectedOrderDetails.items" style="width: 100%" max-height="250">
                    <el-table-column prop="dishName" label="菜品名称"></el-table-column>
                    <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
                    <el-table-column prop="dishPrice" label="单价" width="80">
                        <template #default="{ row }">¥{{ row.dishPrice ? row.dishPrice.toFixed(2) : '0.00' }}</template>
                    </el-table-column>
                    <el-table-column prop="subtotal" label="小计" width="80">
                        <template #default="{ row }">¥{{ row.subtotal ? row.subtotal.toFixed(2) : '0.00' }}</template>
                    </el-table-column>
                </el-table>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showOrderDetailModal = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 更新状态弹框 -->
        <el-dialog
                v-model="showUpdateStatusModal"
                title="更新订单状态"
                width="400px"
                destroy-on-close
                center
        >
            <div class="update-status-content">
                <p>订单ID: <strong>{{ orderToUpdateStatus?.orderId }}</strong></p>
                <p>当前状态:
                    <el-tag :type="getStatusTagType(orderToUpdateStatus?.status)">
                        {{ getOrderStatusText(orderToUpdateStatus?.status) }}
                    </el-tag>
                </p>
                <el-form label-position="top" class="mt-4">
                    <el-form-item label="新状态">
                        <el-select v-model="newOrderStatus" placeholder="选择新状态" style="width: 100%">
                            <el-option label="已确认 (CONFIRMED)" value="CONFIRMED"
                                       :disabled="orderToUpdateStatus?.status !== 'PENDING'"></el-option>
                            <el-option label="已完成 (COMPLETED)" value="COMPLETED"
                                       :disabled="orderToUpdateStatus?.status !== 'CONFIRMED' && orderToUpdateStatus?.status !== 'PENDING'"></el-option>
                            <el-option label="已取消 (CANCELLED)" value="CANCELLED"
                                       :disabled="orderToUpdateStatus?.status === 'COMPLETED' || orderToUpdateStatus?.status === 'CANCELLED'"></el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showUpdateStatusModal = false">取消</el-button>
                    <el-button type="primary" @click="updateOrderStatusConfirmed">确认更新</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

// 导入真实的 API 服务
import { getAllOrders, getOrdersByUserId, updateOrderStatus, cancelOrder, getOrdersByCurrentUser } from '@/services/api.js';

/**
 * 从 JWT Token 中获取用户角色和ID。
 * 此函数直接从 localStorage 获取 token 并进行解码。
 */
const getUserInfoFromJwt = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('未检测到登录凭证，将以普通用户身份加载订单。');
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
const rawOrders = ref([]); // 新增：用于存储从后端获取的所有订单数据（ADMIN/STAFF）
const orders = ref([]); // 实际绑定到表格的数据（DINER或经过前端筛选后的结果）
const statusFilter = ref(''); // 用于 ADMIN/STAFF 筛选订单状态

// 订单详情弹框相关
const showOrderDetailModal = ref(false);
const selectedOrderDetails = ref(null);

// 更新状态弹框相关
const showUpdateStatusModal = ref(false);
const orderToUpdateStatus = ref(null); // 存储待更新状态的订单
const newOrderStatus = ref(''); // 存储用户选择的新状态

// 所有可能的订单状态，用于筛选器和状态文本映射
const allOrderStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

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

// 辅助函数：获取订单状态的中文文本，也用于显示角色
const getOrderStatusText = (status) => {
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
        // 检查是否是有效的日期
        if (isNaN(date.getTime())) {
            // 如果是，尝试将其视为纯日期或时间字符串
            const parts = dateTimeString.split('T');
            const datePart = parts[0];
            const timePart = parts[1] ? parts[1].substring(0, 8) : ''; // 截取HH:mm:ss
            return `${datePart} ${timePart}`;
        }
        return date.toLocaleString(); // 使用本地化格式显示
    } catch (e) {
        console.error("日期时间格式化失败:", dateTimeString, e);
        return dateTimeString; // 失败时返回原始字符串
    }
};

// 权限判断：是否可以更新订单状态
const canUpdateStatus = (status) => {
    return (userRole.value === 'ADMIN' || userRole.value === 'STAFF') &&
        (status === 'PENDING' || status === 'CONFIRMED');
};

// 权限判断：是否可以取消订单
const canCancelOrder = (status) => {
    // ADMIN/STAFF 可以在非COMPLETED/CANCELLED状态下取消
    const adminOrStaffCanCancel = (userRole.value === 'ADMIN' || userRole.value === 'STAFF') && status !== 'COMPLETED' && status !== 'CANCELLED';
    // DINER 可以在PENDING/CONFIRMED状态下取消
    const dinerCanCancel = (userRole.value === 'DINER' && (status === 'PENDING' || status === 'CONFIRMED'));
    return adminOrStaffCanCancel || dinerCanCancel;
};

// 获取订单列表
const fetchOrders = async () => {
    // 只有当角色已确定时才发起请求
    if (userRole.value === null) {
        console.log('用户角色未确定，暂不加载订单。');
        return;
    }

    loading.value = true;
    rawOrders.value = []; // 每次获取前清空原始订单数据
    orders.value = []; // 清空用于 DINER 角色，filteredOrdersDisplay 会重新计算

    try {
        let response;
        if (userRole.value === 'DINER') {
            // 对于普通用户，使用新的API，后端从JWT中获取用户ID
            // 如果 getOrdersByCurrentUser 依赖于 currentUserId，需要确保它在调用时已存在。
            // 否则，后端应能根据JWT token自动识别用户ID。
            response = await getOrdersByCurrentUser();
            orders.value = response.data; // DINER 直接将数据赋值给 orders
        } else {
            // ADMIN 或 STAFF 获取所有订单，前端进行筛选
            // 这里不再传递 statusFilter，因为我们将在前端进行筛选
            response = await getAllOrders(); // 调用 getAllOrders() 不带参数
            rawOrders.value = response.data; // ADMIN/STAFF 将所有订单存储到 rawOrders
        }
        ElMessage.success('订单加载成功！');
    } catch (error) {
        ElMessage.error(`加载订单失败: ${error.message || '未知错误'}`); // 改进错误信息获取
        console.error('加载订单失败:', error);
    } finally {
        loading.value = false;
    }
};

// 新增 computed 属性：用于在前端根据状态筛选订单并显示
const filteredOrdersDisplay = computed(() => {
    // 普通用户直接显示 orders.value (因为 getOrdersByCurrentUser 已经返回其自己的订单)
    if (userRole.value === 'DINER') {
        return orders.value;
    }
    // 管理员或员工根据 statusFilter 筛选 rawOrders
    else {
        if (!statusFilter.value) {
            return rawOrders.value; // 如果没有筛选条件（statusFilter为空字符串），显示所有原始订单
        } else {
            return rawOrders.value.filter(order => order.status === statusFilter.value);
        }
    }
});


// 查看订单详情
const viewOrderDetails = (order) => {
    selectedOrderDetails.value = order;
    showOrderDetailModal.value = true;
};

// 显示更新状态弹框
const showUpdateStatusDialog = (order) => {
    orderToUpdateStatus.value = { ...order }; // 复制订单对象
    newOrderStatus.value = ''; // 重置新状态选择
    showUpdateStatusModal.value = true;
};

// 确认更新订单状态
const updateOrderStatusConfirmed = async () => {
    if (!orderToUpdateStatus.value || !newOrderStatus.value) {
        ElMessage.warning('请选择一个新状态！');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定将订单 ${orderToUpdateStatus.value.orderId} 的状态更新为 "${getOrderStatusText(newOrderStatus.value)}" 吗？`,
            '确认更新',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await updateOrderStatus(orderToUpdateStatus.value.orderId, newOrderStatus.value);
        ElMessage.success('订单状态更新成功！');
        showUpdateStatusModal.value = false;
        fetchOrders(); // 刷新订单列表
    } catch (error) {
        if (error !== 'cancel') { // 忽略用户取消操作
            ElMessage.error(`更新订单状态失败: ${error.message || '未知错误'}`);
            console.error('更新订单状态失败:', error);
        }
    }
};

// 确认取消订单
const confirmCancelOrder = async (order) => {
    try {
        await ElMessageBox.confirm(
            `确定要取消订单 ${order.orderId} 吗？`,
            '取消订单',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await cancelOrder(order.orderId);
        ElMessage.success('订单已成功取消！');
        fetchOrders(); // 刷新订单列表
    } catch (error) {
        if (error !== 'cancel') { // 忽略用户取消操作
            ElMessage.error(`取消订单失败: ${error.message || '未知错误'}`);
            console.error('取消订单失败:', error);
        }
    }
};

// 监听 userRole 的变化，以触发订单数据的首次获取或重新获取
// statusFilter 的变化将通过 computed 属性自动反映，不再触发 fetchOrders
watch(userRole, () => {
    if (userRole.value) { // 确保 userRole 已经确定
        fetchOrders();
    }
}, { immediate: true }); // 组件加载时立即执行一次，确保初始数据加载

// mounted 钩子：从 JWT Token 中获取用户角色和ID
onMounted(() => {
    const userInfo = getUserInfoFromJwt();
    userRole.value = userInfo.role;
    currentUserId.value = userInfo.userId; // 即使DINER不显式传递ID，这里仍保留获取和显示
});
</script>

<style scoped>
.order-management-container {
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
    width: 180px; /* 调整输入框宽度 */
}

.order-list-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.order-table {
    margin-top: 16px;
    border-radius: 8px;
    overflow: hidden; /* Ensure rounded corners for table */
}

/* 订单详情弹框样式 */
.order-detail-content p {
    font-size: 15px;
    color: #374151;
    line-height: 1.8;
    margin-bottom: 8px;
}

.order-detail-content p strong {
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
        font-size: 12px; /* Adjust font size for smaller screens */
    }
    .el-table-column {
        min-width: 80px; /* Ensure columns are not too narrow */
    }
}
</style>
