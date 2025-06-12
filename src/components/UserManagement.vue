<template>
    <div class="user-management-container">
        <h1 class="page-title">用户管理</h1>

        <el-card class="action-card mb-4">
            <div class="filter-group">
                <div class="filter-item">
                    <label>当前角色:</label>
                    <span>{{ getUserRoleText(userRole) || '加载中...' }}</span>
                </div>
                <el-button type="primary" @click="fetchUsers" :loading="loading">
                    <el-icon><Refresh /></el-icon> 刷新用户列表
                </el-button>
            </div>
        </el-card>

        <el-card class="user-list-card">
            <template #header>
                <div class="card-header-title">
                    <span>所有用户</span>
                </div>
            </template>
            <el-table :data="users" v-loading="loading" style="width: 100%" class="user-table" empty-text="暂无用户数据">
                <el-table-column prop="userId" label="用户ID" width="120" sortable></el-table-column>
                <el-table-column prop="username" label="用户名" width="150"></el-table-column>
                <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
                <el-table-column prop="phoneNumber" label="电话号码" width="150"></el-table-column>
                <el-table-column prop="role" label="角色" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getRoleTagType(row.role)">
                            {{ getUserRoleText(row.role) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180" sortable>
                    <template #default="{ row }">
                        {{ formatDateTime(row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" min-width="250" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="warning" @click="showUpdateRoleDialog(row)" :disabled="row.role === 'ADMIN'">
                            更新角色
                        </el-button>
                        <el-button size="small" @click="showResetPasswordDialog(row)">
                            重置密码
                        </el-button>
                        <el-button size="small" type="danger" @click="confirmDeleteUser(row)" :disabled="row.role === 'ADMIN'">
                            删除用户
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 更新角色弹框 -->
        <el-dialog
                v-model="showUpdateRoleModal"
                title="更新用户角色"
                width="400px"
                destroy-on-close
                center
        >
            <div class="update-role-content">
                <p>用户ID: <strong>{{ userToUpdateRole?.userId }}</strong></p>
                <p>用户名: <strong>{{ userToUpdateRole?.username }}</strong></p>
                <p>当前角色:
                    <el-tag :type="getRoleTagType(userToUpdateRole?.role)">
                        {{ getUserRoleText(userToUpdateRole?.role) }}
                    </el-tag>
                </p>
                <el-form label-position="top" class="mt-4">
                    <el-form-item label="新角色">
                        <el-select v-model="newUserRole" placeholder="选择新角色" style="width: 100%">
                            <el-option label="普通用户 (DINER)" value="DINER"></el-option>
                            <el-option label="员工 (STAFF)" value="STAFF"></el-option>
                            <!-- 不允许直接在前端将角色更改为 ADMIN，通常 ADMIN 权限管理有更严格的流程 -->
                            <!-- <el-option label="管理员 (ADMIN)" value="ADMIN"></el-option> -->
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showUpdateRoleModal = false">取消</el-button>
                    <el-button type="primary" @click="updateUserRoleConfirmed">确认更新</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 重置密码弹框 -->
        <el-dialog
                v-model="showResetPasswordModal"
                title="重置用户密码"
                width="400px"
                destroy-on-close
                center
        >
            <div class="reset-password-content">
                <p>用户ID: <strong>{{ userToResetPassword?.userId }}</strong></p>
                <p>用户名: <strong>{{ userToResetPassword?.username }}</strong></p>
                <el-form label-position="top" class="mt-4">
                    <el-form-item label="新密码">
                        <el-input v-model="newPassword" type="password" placeholder="请输入新密码"></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showResetPasswordModal = false">取消</el-button>
                    <el-button type="primary" @click="resetUserPasswordConfirmed">确认重置</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

// 导入 API 服务
import { getAllUsers, updateUserRole, deleteUser, resetUserPassword } from '@/services/api.js';

/**
 * 从 JWT Token 中获取用户角色和ID。
 * 此函数直接从 localStorage 获取 token 并进行解码。
 */
const getUserInfoFromJwt = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('未检测到登录凭证，您可能无法访问用户管理功能。');
        return { role: null, userId: null }; // 未登录状态
    }

    try {
        const payloadBase64 = token.split('.')[1]; // JWT 的第二部分是 Payload
        const decodedPayload = JSON.parse(atob(payloadBase64));

        let role = null;
        if (decodedPayload.roles && Array.isArray(decodedPayload.roles)) {
            // 根据角色优先级设置最高权限角色
            if (decodedPayload.roles.includes('ROLE_ADMIN')) {
                role = 'ADMIN';
            } else if (decodedPayload.roles.includes('ROLE_STAFF')) {
                role = 'STAFF';
            } else if (decodedPayload.roles.includes('ROLE_DINER')) {
                role = 'DINER';
            }
        }

        const userId = decodedPayload.sub || 'unknownUser'; // 'sub' 字段通常是用户ID或用户名
        return { role, userId };
    } catch (error) {
        console.error('解析JWT Token失败:', error);
        ElMessage.error('JWT Token解析失败，请尝试重新登录。');
        return { role: null, userId: null }; // 解析失败
    }
};

const userRole = ref(null); // 当前登录用户的角色
const currentUserId = ref(null); // 当前登录用户的ID

const loading = ref(false);
const users = ref([]); // 用户列表

// 更新角色弹框相关
const showUpdateRoleModal = ref(false);
const userToUpdateRole = ref(null); // 存储待更新角色的用户对象
const newUserRole = ref(''); // 存储用户选择的新角色

// 重置密码弹框相关
const showResetPasswordModal = ref(false);
const userToResetPassword = ref(null); // 存储待重置密码的用户对象
const newPassword = ref(''); // 存储用户输入的新密码

// 辅助函数：根据角色获取标签类型
const getRoleTagType = (role) => {
    switch (role) {
        case 'ADMIN': return 'danger';
        case 'STAFF': return 'warning';
        case 'DINER': return 'info';
        default: return '';
    }
};

// 辅助函数：获取用户角色的中文文本
const getUserRoleText = (role) => {
    switch (role) {
        case 'ADMIN': return '管理员';
        case 'STAFF': return '员工';
        case 'DINER': return '普通用户';
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

// 获取用户列表
const fetchUsers = async () => {
    // 只有管理员或员工才能获取用户列表
    if (userRole.value !== 'ADMIN' && userRole.value !== 'STAFF') {
        ElMessage.warning('您没有权限查看用户列表。');
        return;
    }

    loading.value = true;
    users.value = []; // 清空现有用户数据
    try {
        const response = await getAllUsers();
        users.value = response.data;
        ElMessage.success('用户列表加载成功！');
    } catch (error) {
        ElMessage.error(`加载用户列表失败: ${error.message || '未知错误'}`);
        console.error('加载用户列表失败:', error);
    } finally {
        loading.value = false;
    }
};

// 显示更新角色弹框
const showUpdateRoleDialog = (user) => {
    if (user.role === 'ADMIN') {
        ElMessage.warning('不允许直接通过此界面修改管理员角色。');
        return;
    }
    userToUpdateRole.value = { ...user };
    newUserRole.value = user.role; // 默认选中当前角色
    showUpdateRoleModal.value = true;
};

// 确认更新用户角色
const updateUserRoleConfirmed = async () => {
    if (!userToUpdateRole.value || !newUserRole.value) {
        ElMessage.warning('请选择一个新角色！');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定将用户 ${userToUpdateRole.value.username} 的角色更新为 "${getUserRoleText(newUserRole.value)}" 吗？`,
            '确认更新角色',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await updateUserRole(userToUpdateRole.value.userId, newUserRole.value);
        ElMessage.success('用户角色更新成功！');
        showUpdateRoleModal.value = false;
        fetchUsers(); // 刷新用户列表
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`更新用户角色失败: ${error.message || '未知错误'}`);
            console.error('更新用户角色失败:', error);
        }
    }
};

// 显示重置密码弹框
const showResetPasswordDialog = (user) => {
    userToResetPassword.value = { ...user };
    newPassword.value = ''; // 清空新密码输入
    showResetPasswordModal.value = true;
};

// 确认重置用户密码
const resetUserPasswordConfirmed = async () => {
    if (!userToResetPassword.value || !newPassword.value) {
        ElMessage.warning('请输入新密码！');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定重置用户 ${userToResetPassword.value.username} 的密码吗？`,
            '确认重置密码',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await resetUserPassword(userToResetPassword.value.userId, newPassword.value);
        ElMessage.success('用户密码重置成功！');
        showResetPasswordModal.value = false;
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`重置用户密码失败: ${error.message || '未知错误'}`);
            console.error('重置用户密码失败:', error);
        }
    }
};

// 确认删除用户
const confirmDeleteUser = async (user) => {
    if (user.role === 'ADMIN') {
        ElMessage.warning('不允许直接通过此界面删除管理员。');
        return;
    }
    try {
        await ElMessageBox.confirm(
            `确定要删除用户 ${user.username} (ID: ${user.userId}) 吗？此操作不可逆！`,
            '确认删除用户',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'danger'
            }
        );

        await deleteUser(user.userId);
        ElMessage.success('用户删除成功！');
        fetchUsers(); // 刷新用户列表
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`删除用户失败: ${error.message || '未知错误'}`);
            console.error('删除用户失败:', error);
        }
    }
};

// mounted 钩子：获取当前登录用户的信息并加载用户列表
onMounted(() => {
    const userInfo = getUserInfoFromJwt();
    userRole.value = userInfo.role;
    currentUserId.value = userInfo.userId;
    // 只有在userRole确定后，并且是ADMIN或STAFF才尝试获取用户列表
    if (userRole.value === 'ADMIN' || userRole.value === 'STAFF') {
        fetchUsers();
    }
});
</script>

<style scoped>
.user-management-container {
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

.user-list-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.user-table {
    margin-top: 16px;
    border-radius: 8px;
    overflow: hidden;
}

/* 弹框内容样式 */
.update-role-content p,
.reset-password-content p {
    font-size: 15px;
    color: #374151;
    line-height: 1.8;
    margin-bottom: 8px;
}

.update-role-content p strong,
.reset-password-content p strong {
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
    /* 在小屏幕上隐藏一些不那么重要的列，以优化显示 */
    .el-table-column[prop="email"],
    .el-table-column[prop="phoneNumber"] {
        display: none;
    }
}
</style>
