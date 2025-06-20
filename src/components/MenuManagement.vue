<template>
    <div class="menu-publish-content">
        <div class="page-header">
            <h2>菜单发布管理</h2>
            <button class="action-button" @click="openMenuDialog('add')">
                <span>+</span> 添加菜单
            </button>
        </div>

        <el-card class="menu-table-card">
            <template #header>
                <div class="card-header">
                    <h3>菜单列表</h3>
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
                        <el-date-picker
                                v-model="selectedDate"
                                type="date"
                                placeholder="选择日期"
                                value-format="YYYY-MM-DD"
                                @change="currentPage = 1" :disabled-date="disablePastDates"
                                style="margin-right: 12px;"
                                clearable
                        />
                        <el-time-picker
                                v-model="filterStartTime"
                                placeholder="开始时间"
                                value-format="HH:mm:ss"
                                style="width: 120px; margin-right: 12px;"
                                @change="currentPage = 1" clearable
                        />
                        <el-time-picker
                                v-model="filterEndTime"
                                placeholder="结束时间"
                                value-format="HH:mm:ss"
                                style="width: 120px; margin-right: 12px;"
                                @change="currentPage = 1" clearable
                        />
                        <el-button @click="refreshMenuList">
                            <el-icon><Refresh /></el-icon>
                            重置筛选
                        </el-button>
                    </div>
                </div>
            </template>

            <el-table :data="filteredAndPagedMenus" style="width: 100%" v-loading="loading">
                <el-table-column prop="menuDate" label="日期" width="120" sortable>
                    <template #default="scope">
                        {{ formatDate(scope.row.menuDate) }}
                    </template>
                </el-table-column>
                <el-table-column prop="canteenName" label="餐厅" width="150" sortable></el-table-column>
                <el-table-column label="开始时间" width="100">
                    <template #default="scope">
                        {{ formatTime(scope.row.startTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="结束时间" width="100">
                    <template #default="scope">
                        {{ formatTime(scope.row.endTime) }}
                    </template>
                </el-table-column>
                <el-table-column prop="dishes" label="菜品列表" min-width="300">
                    <template #default="scope">
                        <div class="dishes-list">
                            <el-tag
                                    v-for="dish in scope.row.dishes"
                                    :key="dish.dishId"
                                    class="dish-tag"
                                    :type="getDishTagType(dish)"
                                    size="small"
                            >
                                {{ dish.name }} ¥{{ dish.price }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="publishedAt" label="发布时间" width="160">
                    <template #default="scope">
                        {{ formatDateTime(scope.row.publishedAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="scope">
                        <el-button size="small" @click="openMenuDialog('edit', scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteMenu(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="totalFilteredMenus"
                        layout="total, prev, pager, next, jumper"
                        @current-change="handlePageChange"
                />
            </div>
        </el-card>

        <el-dialog
                v-model="showPublishDialog"
                :title="currentOperation === 'edit' ? '编辑菜单' : '发布菜单'"
                width="800px"
                @close="resetForm"
        >
            <el-form :model="menuForm" :rules="menuRules" ref="menuFormRef" label-width="80px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="餐厅" prop="canteenId">
                            <el-select v-model="menuForm.canteenId" placeholder="请选择餐厅" style="width: 100%;">
                                <el-option
                                        v-for="canteen in canteenList"
                                        :key="canteen.canteenId"
                                        :label="canteen.name"
                                        :value="canteen.canteenId"
                                ></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="日期" prop="menuDate">
                            <el-date-picker
                                    v-model="menuForm.menuDate"
                                    type="date"
                                    placeholder="选择日期"
                                    value-format="YYYY-MM-DD"
                                    style="width: 100%;"
                                    :disabled-date="disablePastDates"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="开始时间" prop="startTime">
                            <el-time-picker
                                    v-model="menuForm.startTime"
                                    placeholder="选择开始时间"
                                    value-format="HH:mm:ss"
                                    style="width: 100%;"
                            ></el-time-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="结束时间" prop="endTime">
                            <el-time-picker
                                    v-model="menuForm.endTime"
                                    placeholder="选择结束时间"
                                    value-format="HH:mm:ss"
                                    style="width: 100%;"
                            ></el-time-picker>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="菜品列表" prop="dishIds">
                    <div class="dishes-manager">
                        <div class="selected-dishes">
                            <el-tag
                                    v-for="dish in menuForm.dishes"
                                    :key="dish.dishId"
                                    closable
                                    @close="removeDish(dish)"
                                    class="selected-dish-tag"
                                    :type="getDishTagType(dish)"
                            >
                                {{ dish.name }} ¥{{ dish.price }}
                            </el-tag>
                        </div>
                        <el-button @click="showDishSelector = true" class="add-dish-btn">
                            <el-icon><Plus /></el-icon>
                            添加菜品
                        </el-button>
                    </div>
                </el-form-item>

            </el-form>

            <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="publishMenu" :loading="publishing">
            {{ currentOperation === 'edit' ? '更新发布' : '立即发布' }}
          </el-button>
        </span>
            </template>
        </el-dialog>

        <el-dialog v-model="showDishSelector" title="选择菜品" width="600px">
            <div class="dish-selector">
                <el-input
                        v-model="dishSearchKeyword"
                        placeholder="搜索菜品名称"
                        prefix-icon="Search"
                        style="margin-bottom: 16px;"
                />
                <div class="dish-grid">
                    <div
                            v-for="dish in getFilteredDishes()"
                            :key="dish.dishId"
                            class="dish-item"
                            :class="{ selected: isDishSelected(dish) }"
                            @click="toggleDish(dish)"
                    >
                        <div class="dish-info">
                            <h4>{{ dish.name }}</h4>
                            <p class="dish-price">¥{{ dish.price }}</p>
                            <p class="dish-desc">{{ dish.description }}</p>
                        </div>
                        <el-icon v-if="isDishSelected(dish)" class="selected-icon">
                            <Check />
                        </el-icon>
                    </div>
                </div>
            </div>
            <template #footer>
                <el-button @click="showDishSelector = false">完成选择</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Plus,
    Refresh,
    Check,
    Search
} from '@element-plus/icons-vue'

// Assuming these APIs are globally available or imported from a shared file
// as per the user's instruction "你不需要import就能使用"
// If not, you would need to import them:
import { publishDailyMenu, getDailyMenusByCanteenAndDate, getDailyMenuById, getAllDailyMenus, updateDailyMenu, deleteDailyMenu } from '@/services/api.js';
import { getAllDishes, getDishById } from '@/services/api.js';
import { getAllCanteens, getCanteenById } from '@/services/api.js';

// Responsive data
const loading = ref(false)
const publishing = ref(false)
const showPublishDialog = ref(false)
const showDishSelector = ref(false)
const editingMenu = ref(null) // Stores the menu object being edited
const currentOperation = ref('add'); // 'add' or 'edit'

const selectedCanteenId = ref(''); // Filter by canteen
const selectedDate = ref(''); // Filter by date (YYYY-MM-DD)
const filterStartTime = ref(''); // Filter by time period start
const filterEndTime = ref('');   // Filter by time period end

const currentPage = ref(1)
const pageSize = ref(10)
const totalFilteredMenus = ref(0) // Total count after filtering

const dishSearchKeyword = ref('')

// Form related
const menuFormRef = ref(null)
const menuForm = reactive({
    menuId: null, // Use menuId as the primary ID for existing menu
    canteenId: '',
    menuDate: '', // Default to empty, let user select
    startTime: '',
    endTime: '',
    dishIds: [], // Stores only dish IDs for API
    dishes: [], // Stores full dish objects for display in form
})

const menuRules = {
    canteenId: [{ required: true, message: '请选择餐厅', trigger: 'change' }],
    menuDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
    startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
    dishIds: [{ type: 'array', required: true, message: '请至少添加一道菜品', trigger: 'change', min: 1 }]
}

// Data lists
const allFetchedMenus = ref([]); // Stores all menus fetched by getAllDailyMenus
const canteenList = ref([]);
const dishList = ref([]); // All available dishes

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

// Helper function: Disable past dates for date pickers
const disablePastDates = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
};

// Computed properties
const filteredMenus = computed(() => {
    let menus = allFetchedMenus.value; // Start with all menus fetched from backend

    // 1. Filter by Canteen
    if (selectedCanteenId.value) {
        menus = menus.filter(menu => menu.canteenId === selectedCanteenId.value);
    }

    // 2. Filter by Date
    if (selectedDate.value) {
        menus = menus.filter(menu => menu.menuDate === selectedDate.value);
    }

    // 3. Filter by Time Period
    if (filterStartTime.value && filterEndTime.value) {
        const start = new Date(`2000-01-01T${filterStartTime.value}`);
        const end = new Date(`2000-01-01T${filterEndTime.value}`);

        menus = menus.filter(menu => {
            const menuStart = new Date(`2000-01-01T${menu.startTime}`);
            const menuEnd = new Date(`2000-01-01T${menu.endTime}`);
            // Check for overlap: [menuStart, menuEnd] overlaps with [start, end]
            // Overlap occurs if menuStart is before end AND menuEnd is after start
            return (menuStart < end && menuEnd > start);
        });
    }
    return menus;
});

const filteredAndPagedMenus = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    totalFilteredMenus.value = filteredMenus.value.length; // Update total for pagination
    return filteredMenus.value.slice(start, end);
});


// Methods
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
}

const formatTime = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`; // Display HH:mm
}

const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('zh-CN');
}

const getDishTagType = (dish) => {
    return ''; // Default empty type for a neutral tag
};

// Initialize data on mount
onMounted(async () => {
    await fetchCanteenList();
    await fetchDishList();
    await fetchAllDailyMenusData(); // Fetch all menus initially
});

const fetchCanteenList = async () => {
    try {
        const res = await getAllCanteens();
        canteenList.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error(error);
    }
};

const fetchDishList = async () => {
    try {
        const res = await getAllDishes();
        dishList.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error(error);
    }
};

// This function now always fetches all menus from the backend
const fetchAllDailyMenusData = async () => {
    loading.value = true;
    try {
        const res = await getAllDailyMenus(); // Always call getAllDailyMenus
        allFetchedMenus.value = res.data.map(menu => {
            const canteen = canteenList.value.find(c => c.canteenId === menu.canteenId);
            const dishes = menu.dishes.map(dish => {
                return dishList.value.find(d => d.dishId === dish.dishId) || { ...dish, name: dish.name || '未知菜品', price: dish.price || 0 };
            });
            return {
                ...menu,
                canteenName: canteen ? canteen.name : '未知餐厅',
                dishes: dishes,
                id: menu.menuId
            };
        });
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error(error);
        allFetchedMenus.value = [];
    } finally {
        loading.value = false;
        // No need to reset currentPage here, it's handled by filter changes
    }
};

// This function is now just a trigger for re-evaluation of computed properties
// and ensures pagination resets when filters change.
const fetchDailyMenus = () => {
    // The filtering is now handled by the `filteredMenus` computed property
    // We just need to ensure the `selectedCanteenId`, `selectedDate`,
    // `filterStartTime`, `filterEndTime` are updated, which they are by v-model.
    // The table will react to changes in `filteredAndPagedMenus`.
    currentPage.value = 1; // Always reset to the first page when filters change
};


const refreshMenuList = () => {
    // Clear all filters
    selectedCanteenId.value = '';
    selectedDate.value = '';
    filterStartTime.value = '';
    filterEndTime.value = '';
    // Re-fetch all data from backend
    fetchAllDailyMenusData();
    ElMessage.success('数据已刷新');
};

const handlePageChange = (page) => {
    currentPage.value = page;
};

const openMenuDialog = (operation, row = null) => {
    currentOperation.value = operation;
    showPublishDialog.value = true;
    resetForm();

    if (operation === 'add') {
        menuForm.canteenId = selectedCanteenId.value || (canteenList.value.length > 0 ? canteenList.value[0].canteenId : '');
        menuForm.menuDate = selectedDate.value || new Date().toISOString().slice(0, 10);
        menuForm.startTime = '08:00:00';
        menuForm.endTime = '14:00:00';
    } else if (operation === 'edit' && row) {
        editingMenu.value = row;
        menuForm.menuId = row.menuId;
        menuForm.canteenId = row.canteenId;
        menuForm.menuDate = row.menuDate;
        menuForm.startTime = row.startTime;
        menuForm.endTime = row.endTime;
        menuForm.dishIds = row.dishes.map(d => d.dishId);
        menuForm.dishes = [...row.dishes];
    }
};

const resetForm = () => {
    menuFormRef.value?.resetFields();
    menuForm.menuId = null;
    menuForm.canteenId = '';
    menuForm.menuDate = '';
    menuForm.startTime = '';
    menuForm.endTime = '';
    menuForm.dishIds = [];
    menuForm.dishes = [];
    editingMenu.value = null;
};

const getFilteredDishes = () => {
    let dishes = dishList.value;
    if (menuForm.canteenId) {
        dishes = dishes.filter(dish => dish.canteenId === menuForm.canteenId);
    }
    if (dishSearchKeyword.value) {
        dishes = dishes.filter(dish =>
            dish.name.includes(dishSearchKeyword.value) ||
            dish.description.includes(dishSearchKeyword.value)
        );
    }
    return dishes;
};

const isDishSelected = (dish) => {
    return menuForm.dishIds.includes(dish.dishId);
};

const toggleDish = (dish) => {
    const idIndex = menuForm.dishIds.indexOf(dish.dishId);
    const objIndex = menuForm.dishes.findIndex(d => d.dishId === dish.dishId);

    if (idIndex > -1) {
        menuForm.dishIds.splice(idIndex, 1);
        if (objIndex > -1) menuForm.dishes.splice(objIndex, 1);
    } else {
        menuForm.dishIds.push(dish.dishId);
        menuForm.dishes.push({ ...dish });
    }
};

const removeDish = (dish) => {
    const idIndex = menuForm.dishIds.indexOf(dish.dishId);
    const objIndex = menuForm.dishes.findIndex(d => d.dishId === dish.dishId);

    if (idIndex > -1) {
        menuForm.dishIds.splice(idIndex, 1);
    }
    if (objIndex > -1) {
        menuForm.dishes.splice(objIndex, 1);
    }
};

const createMenuPayload = (form) => {
    const payload = {
        canteenId: form.canteenId,
        menuDate: form.menuDate,
        startTime: form.startTime,
        endTime: form.endTime,
        dishIds: form.dishIds,
    };
    return payload;
};

const publishMenu = async () => {
    if (!menuFormRef.value) return;

    try {
        await menuFormRef.value.validate();
        publishing.value = true;

        const payload = createMenuPayload(menuForm);

        if (currentOperation.value === 'add') {
            await publishDailyMenu(payload);
            ElMessage.success('菜单发布成功！');
        } else if (currentOperation.value === 'edit' && menuForm.menuId) {
            await updateDailyMenu(menuForm.menuId, payload);
            ElMessage.success('菜单更新成功！');
        }
        showPublishDialog.value = false;
        await fetchAllDailyMenusData(); // Refresh all data after adding/updating
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error(error);
    } finally {
        publishing.value = false;
    }
};

const deleteMenu = async (menu) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这个菜单吗？删除后无法恢复。',
            '确认删除',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await deleteDailyMenu(menu.menuId);
        ElMessage.success('菜单删除成功');
        await fetchAllDailyMenusData(); // Refresh all data after deletion
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(getErrorMessage(error));
            console.error(error);
        } else {
            ElMessage.info('删除已取消');
        }
    }
};
</script>

<style scoped>
.menu-publish-content {
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

.action-button span {
    font-size: 18px;
    line-height: 1;
}

.menu-table-card {
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

.dishes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.dish-tag {
    margin: 0;
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
}

.dishes-manager {
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    padding: 12px;
    min-height: 60px;
}

.selected-dishes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.selected-dish-tag {
    margin: 0;
}

.add-dish-btn {
    width: 100%;
    border-style: dashed;
}

.dish-selector {
    max-height: 400px;
    overflow-y: auto;
}

.dish-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}

.dish-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.dish-item:hover {
    border-color: #42b983;
    background: #f9fafb;
}

.dish-item.selected {
    border-color: #42b983;
    background: #f0f9f4;
}

.dish-info h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #1f2937;
}

.dish-price {
    color: #f59e0b;
    font-weight: 600;
    margin: 0 0 4px 0;
    font-size: 12px;
}

.dish-desc {
    color: #6b7280;
    font-size: 12px;
    margin: 0;
    line-height: 1.4;
}

.selected-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    color: #42b983;
    font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-controls {
        flex-direction: column;
        align-items: flex-start;
    }

    .header-controls > * {
        width: 100%;
        margin-right: 0 !important;
    }

    .dish-grid {
        grid-template-columns: 1fr;
    }

    .page-header h2 {
        font-size: 24px;
    }
}

/* Removed animation styles to prevent flickering */
/*
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.menu-publish-content > * {
    animation: fadeIn 0.6s ease-out;
}
*/

/* Custom scrollbar */
.dish-selector::-webkit-scrollbar {
    width: 6px;
}

.dish-selector::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.dish-selector::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.dish-selector::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
