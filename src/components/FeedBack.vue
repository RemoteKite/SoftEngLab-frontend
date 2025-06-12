<template>
    <div class="review-management-container">
        <h1 class="page-title">菜品评价与反馈</h1>

        <el-card class="action-card mb-4">
            <div class="filter-group">
                <div class="filter-item">
                    <label>当前角色:</label>
                    <span>{{ getUserRoleText(userRole) || '加载中...' }}</span>
                </div>
                <div class="filter-item" v-if="userRole === 'DINER' && currentUserId">
                    <label>我的用户ID:</label>
                    <span>{{ currentUserId }}</span>
                </div>
                <el-button type="primary" @click="fetchReviews" :loading="loading">
                    <el-icon><Refresh /></el-icon> 刷新评价列表
                </el-button>
            </div>
        </el-card>

        <el-card class="review-list-card">
            <template #header>
                <div class="card-header-title">
                    <span>{{ userRole === 'DINER' ? '我的评价' : '所有评价' }}</span>
                </div>
            </template>
            <el-table :data="filteredReviewsDisplay" v-loading="loading" style="width: 100%" class="review-table" empty-text="暂无评价数据">
                <el-table-column prop="reviewId" label="评价ID" width="120" sortable></el-table-column>
                <el-table-column prop="username" label="评价人" width="120"></el-table-column>
                <el-table-column prop="dishName" label="菜品名称" width="150"></el-table-column>
                <el-table-column prop="rating" label="评分" width="100" sortable>
                    <template #default="{ row }">
                        <el-tag :type="getRatingTagType(row.rating)">
                            {{ row.rating }} 星
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="comment" label="评论" min-width="200"></el-table-column>
                <el-table-column prop="reviewDate" label="评价时间" width="180" sortable>
                    <template #default="{ row }">
                        {{ formatDateTime(row.reviewDate) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" min-width="180" fixed="right">
                    <template #default="{ row }">
                        <el-button
                                size="small"
                                type="warning"
                                @click="showEditReviewDialog(row)"
                                :disabled="!canManageReview(row)"
                        >
                            编辑评价
                        </el-button>
                        <el-button
                                size="small"
                                type="danger"
                                @click="confirmDeleteReview(row)"
                                :disabled="!canManageReview(row)"
                        >
                            删除评价
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 编辑评价弹框 -->
        <el-dialog
                v-model="showEditReviewModal"
                title="编辑菜品评价"
                width="500px"
                destroy-on-close
                center
        >
            <div class="edit-review-content">
                <p>评价ID: <strong>{{ reviewToEdit?.reviewId }}</strong></p>
                <p>菜品名称: <strong>{{ reviewToEdit?.dishName }}</strong></p>
                <el-form :model="editReviewForm" :rules="editReviewRules" ref="editReviewFormRef" label-position="top" class="mt-4">
                    <el-form-item label="评分" prop="rating">
                        <el-rate v-model="editReviewForm.rating" :max="5" show-text :texts="['极差', '差', '一般', '好', '非常好']"></el-rate>
                    </el-form-item>
                    <el-form-item label="评论" prop="comment">
                        <el-input
                                v-model="editReviewForm.comment"
                                type="textarea"
                                :rows="3"
                                placeholder="请输入您的评论"
                                maxlength="500"
                                show-word-limit
                        ></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showEditReviewModal = false">取消</el-button>
                    <el-button type="primary" @click="updateReviewConfirmed">确认更新</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Plus, Search } from '@element-plus/icons-vue';

// 导入 API 服务
import {
    getAllReviews,
    getReviewsByUserId,
    getReviewsByCurrentUser,
    updateReview,
    deleteReview,
} from '@/services/api.js';

/**
 * 从 JWT Token 中获取用户角色和ID。
 * 此函数直接从 localStorage 获取 token 并进行解码。
 */
const getUserInfoFromJwt = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('未检测到登录凭证，您可能无法访问部分功能。');
        return { role: 'ANONYMOUS', userId: null }; // 未登录用户，角色设为ANONYMOUS，userId为null
    }

    try {
        const payloadBase64 = token.split('.')[1]; // JWT 的第二部分是 Payload
        const decodedPayload = JSON.parse(atob(payloadBase64));

        let role = 'DINER'; // 默认角色
        if (decodedPayload.roles && Array.isArray(decodedPayload.roles)) {
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
        return { role: 'ANONYMOUS', userId: null }; // 解析失败，设为ANONYMOUS
    }
};

const userRole = ref(null); // 当前登录用户的角色
const currentUserId = ref(null); // 当前登录用户的ID

const loading = ref(false);
const rawReviews = ref([]); // 存储从后端获取的所有评价数据（ADMIN/STAFF）
const reviews = ref([]); // 实际绑定到表格的数据（DINER或经过前端筛选后的结果）

// 编辑评价弹框相关
const showEditReviewModal = ref(false);
const reviewToEdit = ref(null); // 存储待编辑的评价对象
const editReviewFormRef = ref(null);
const editReviewForm = reactive({
    rating: 5,
    comment: '',
});

const editReviewRules = reactive({
    rating: [
        { required: true, message: '请选择评分', trigger: 'change' },
        { type: 'number', min: 1, max: 5, message: '评分必须在1到5之间', trigger: 'change' }
    ],
    comment: [{ max: 500, message: '评论不能超过500个字符', trigger: 'blur' }],
});

// 辅助函数：获取用户角色的中文文本
const getUserRoleText = (role) => {
    switch (role) {
        case 'ADMIN': return '管理员';
        case 'STAFF': return '员工';
        case 'DINER': return '普通用户';
        case 'ANONYMOUS': return '未登录用户'; // 新增未登录角色文本
        default: return '未知';
    }
};

// 辅助函数：根据评分获取标签类型
const getRatingTagType = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return ''; // Default type (info)
    return 'danger';
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

// 权限判断：是否可以管理（编辑/删除）此评价
// 根据用户要求，只要用户登录（role不是ANONYMOUS），就可以尝试编辑和删除，
// 具体的权限校验交给后端处理。
const canManageReview = (review) => {
    // 只要用户已登录 (userRole不是ANONYMOUS)，就允许尝试操作
    return userRole.value !== 'ANONYMOUS' && userRole.value !== null;
};

// 获取评价列表
const fetchReviews = async () => {
    // 如果用户角色未确定，或确定为未登录用户，则不加载评价
    if (userRole.value === null || userRole.value === 'ANONYMOUS') {
        console.log('用户未登录，暂不加载评价。');
        reviews.value = []; // 清空可能残留的数据
        rawReviews.value = [];
        loading.value = false;
        return;
    }

    loading.value = true;
    rawReviews.value = [];
    reviews.value = [];

    try {
        let response;
        if (userRole.value === 'DINER') {
            // 对 DINER 角色使用 getReviewsByCurrentUser API
            response = await getReviewsByCurrentUser();
            reviews.value = response.data; // DINER 直接绑定到 reviews
        } else {
            // ADMIN 或 STAFF 获取所有评价
            response = await getAllReviews();
            rawReviews.value = response.data; // ADMIN/STAFF 将所有评价存储到 rawReviews
        }
        ElMessage.success('评价列表加载成功！');
    } catch (error) {
        ElMessage.error(`加载评价失败: ${error.message || '未知错误'}`);
        console.error('加载评价失败:', error);
    } finally {
        loading.value = false;
    }
};

// computed 属性：用于根据用户角色显示正确的评价数据
const filteredReviewsDisplay = computed(() => {
    if (userRole.value === 'DINER') {
        return reviews.value;
    } else {
        return rawReviews.value; // ADMIN/STAFF 直接显示所有评价
    }
});

// 显示编辑评价弹框
const showEditReviewDialog = (review) => {
    // 客户端仅做最基本的前置判断：用户是否已登录。
    // 具体权限校验会在后端API层面进行。
    if (!canManageReview(review)) {
        ElMessage.warning('您没有权限编辑此评价，请检查您的登录状态。');
        return;
    }
    reviewToEdit.value = { ...review }; // 复制评价对象
    editReviewForm.rating = review.rating;
    editReviewForm.comment = review.comment;
    showEditReviewModal.value = true;
    nextTick(() => {
        editReviewFormRef.value?.clearValidate(); // 清除之前的验证状态
    });
};

// 确认更新评价
const updateReviewConfirmed = async () => {
    if (!editReviewFormRef.value) return;

    try {
        await editReviewFormRef.value.validate(); // 验证表单

        await ElMessageBox.confirm(
            `确定更新此评价吗？`,
            '确认更新评价',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        // 构建符合 RatingReviewRequest 的参数
        const payload = {
            dishId: reviewToEdit.value.dishId, // dishId 是必需的
            rating: editReviewForm.rating,
            comment: editReviewForm.comment
        };

        await updateReview(reviewToEdit.value.reviewId, payload);
        ElMessage.success('评价更新成功！');
        showEditReviewModal.value = false;
        fetchReviews(); // 刷新评价列表
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`更新评价失败: ${error.message || '未知错误'}`);
            console.error('更新评价失败:', error);
        }
    }
};

// 确认删除评价
const confirmDeleteReview = async (review) => {
    // 客户端仅做最基本的前置判断：用户是否已登录。
    // 具体权限校验会在后端API层面进行。
    if (!canManageReview(review)) {
        ElMessage.warning('您没有权限删除此评价，请检查您的登录状态。');
        return;
    }
    try {
        await ElMessageBox.confirm(
            `确定要删除此评价 (ID: ${review.reviewId}) 吗？此操作不可逆！`,
            '确认删除评价',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'danger'
            }
        );

        await deleteReview(review.reviewId);
        ElMessage.success('评价删除成功！');
        fetchReviews(); // 刷新评价列表
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`删除评价失败: ${error.message || '未知错误'}`);
            console.error('删除评价失败:', error);
        }
    }
};

// 监听 userRole 的变化以触发评价数据的首次获取或重新获取
watch(userRole, () => {
    if (userRole.value) { // 确保 userRole 已经确定（不为null）
        fetchReviews();
    }
}, { immediate: true });

// mounted 钩子：获取当前登录用户的信息
onMounted(() => {
    const userInfo = getUserInfoFromJwt();
    userRole.value = userInfo.role;
    currentUserId.value = userInfo.userId;
});
</script>

<style scoped>
.review-management-container {
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

.action-card {
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

.review-list-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.review-table {
    margin-top: 16px;
    border-radius: 8px;
    overflow: hidden;
}

/* 弹框内容样式 */
.edit-review-content p,
.add-review-content p { /* Added .add-review-content */
    font-size: 15px;
    color: #374151;
    line-height: 1.8;
    margin-bottom: 8px;
}

.edit-review-content p strong,
.add-review-content p strong { /* Added .add-review-content */
    color: #1f2937;
}

/* 菜品详情显示样式 */
.dish-details-display {
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
    margin-bottom: 20px;
    background-color: #fcfcfc;
}

.dish-details-display h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #303133;
    font-size: 14px;
}

.dish-details-display p {
    margin-bottom: 5px;
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
.el-button--success { /* Added success button style */
    background-color: #67C23A;
    border-color: #67C23A;
}
.el-button--success:hover {
    background-color: #85ce61;
    border-color: #85ce61;
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
    /* 在小屏幕上隐藏评论列，优化显示 */
    .el-table-column[prop="comment"] {
        display: none;
    }
}
</style>
