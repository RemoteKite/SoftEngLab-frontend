<template>
    <div class="package-management-container">
        <div class="page-header">
            <h2>套餐管理</h2>
            <button class="action-button" @click="openPackageDialog('add')">
                <span>+</span> 添加套餐
            </button>
        </div>

        <el-card class="package-table-card">
            <template #header>
                <div class="card-header">
                    <h3>套餐列表</h3>
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
                                v-model="packageNameFilter"
                                placeholder="搜索套餐名称"
                                prefix-icon="Search"
                                style="width: 200px; margin-right: 12px;"
                                @input="currentPage = 1" clearable
                        />
                        <el-button @click="refreshPackageList">
                            <el-icon><Refresh /></el-icon>
                            重置筛选
                        </el-button>
                    </div>
                </div>
            </template>

            <el-table :data="filteredAndPagedPackages" style="width: 100%" v-loading="loading">
                <el-table-column prop="packageId" label="套餐ID" width="120" sortable></el-table-column>
                <el-table-column prop="canteenName" label="餐厅" width="150" sortable></el-table-column>
                <el-table-column prop="name" label="套餐名称" width="180" sortable></el-table-column>
                <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
                <el-table-column prop="price" label="价格" width="100">
                    <template #default="scope">
                        ¥{{ scope.row.price ? scope.row.price.toFixed(2) : '0.00' }}
                    </template>
                </el-table-column>
                <el-table-column prop="dishes" label="包含菜品" min-width="250">
                    <template #default="scope">
                        <div class="dishes-list">
                            <el-tag
                                    v-for="dish in scope.row.dishes"
                                    :key="dish.dishId"
                                    class="dish-tag"
                                    size="small"
                            >
                                {{ dish.name }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="scope">
                        <el-button size="small" @click="openPackageDialog('edit', scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deletePackageConfirm(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="totalFilteredPackages"
                        layout="total, prev, pager, next, jumper"
                        @current-change="handlePageChange"
                />
            </div>
        </el-card>

        <!-- 添加/编辑套餐弹框 -->
        <el-dialog
                v-model="showPackageDialog"
                :title="currentOperation === 'edit' ? '编辑套餐' : '添加套餐'"
                width="800px"
                @close="resetForm"
        >
            <el-form :model="packageForm" :rules="packageRules" ref="packageFormRef" label-width="80px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="餐厅" prop="canteenId">
                            <el-select v-model="packageForm.canteenId" placeholder="请选择餐厅" style="width: 100%;">
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
                        <el-form-item label="套餐名称" prop="name">
                            <el-input v-model="packageForm.name" placeholder="请输入套餐名称"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="价格" prop="price">
                            <el-input-number
                                    v-model="packageForm.price"
                                    :min="0.01"
                                    :precision="2"
                                    :step="0.01"
                                    placeholder="请输入价格"
                                    style="width: 100%;"
                            ></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="描述" prop="description">
                            <el-input v-model="packageForm.description" type="textarea" :rows="2" placeholder="请输入套餐描述"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="包含菜品" prop="dishIds">
                    <div class="dishes-manager">
                        <div class="selected-dishes">
                            <el-tag
                                    v-for="dish in packageForm.dishes"
                                    :key="dish.dishId"
                                    closable
                                    @close="removeDish(dish)"
                                    class="selected-dish-tag"
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
                    <el-button @click="showPackageDialog = false">取消</el-button>
                    <el-button type="primary" @click="publishPackage" :loading="publishing">
                        {{ currentOperation === 'edit' ? '更新套餐' : '立即添加' }}
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 菜品选择弹框 -->
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

// 导入 API 服务
import {
    createPackage, getPackageById, getAllPackages, updatePackage, deletePackage,
    getAllCanteens, getAllDishes
} from '@/services/api.js';


// Reactive data
const loading = ref(false)
const publishing = ref(false) // For add/edit package submission
const showPackageDialog = ref(false) // Controls add/edit package dialog visibility
const showDishSelector = ref(false) // Controls dish selector dialog visibility
const editingPackage = ref(null) // Stores the package object being edited
const currentOperation = ref('add'); // 'add' or 'edit' for the package dialog

// Filters for package list
const selectedCanteenId = ref('');
const packageNameFilter = ref('');

const currentPage = ref(1)
const pageSize = ref(10)
const totalFilteredPackages = ref(0)

const dishSearchKeyword = ref('') // For searching dishes in the dish selector

// Form related
const packageFormRef = ref(null)
const packageForm = reactive({
    packageId: null, // Only for edit mode
    canteenId: '',
    name: '',
    description: '',
    price: 0.01, // Default price
    dishIds: [], // Stores only dish IDs for API payload
    dishes: [], // Stores full dish objects for display in form and table
})

// Form validation rules
const packageRules = {
    canteenId: [{ required: true, message: '请选择餐厅', trigger: 'change' }],
    name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
    price: [{ required: true, message: '请输入套餐价格', trigger: 'blur' }],
    dishIds: [{ type: 'array', required: true, message: '请至少添加一道菜品', trigger: 'change', min: 1 }]
}

// Data lists
const allFetchedPackages = ref([]); // Stores all packages fetched from backend
const canteenList = ref([]);
const dishList = ref([]); // All available dishes fetched from backend

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
const filteredPackages = computed(() => {
    let packages = allFetchedPackages.value;

    // Filter by Canteen ID
    if (selectedCanteenId.value) {
        packages = packages.filter(pkg => pkg.canteenId === selectedCanteenId.value);
    }

    // Filter by Package Name
    if (packageNameFilter.value) {
        packages = packages.filter(pkg =>
            pkg.name.toLowerCase().includes(packageNameFilter.value.toLowerCase())
        );
    }
    return packages;
});

const filteredAndPagedPackages = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    totalFilteredPackages.value = filteredPackages.value.length; // Update total count for pagination
    return filteredPackages.value.slice(start, end);
});


// Methods
// Initialize data on component mount
onMounted(async () => {
    await fetchCanteenList();
    await fetchDishList();
    await fetchAllPackagesData(); // Fetch all packages initially
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

// Fetch list of all dishes
const fetchDishList = async () => {
    try {
        const res = await getAllDishes();
        dishList.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取菜品列表失败:', error);
    }
};

// Fetch all packages from the backend and enrich data for display
const fetchAllPackagesData = async () => {
    loading.value = true;
    try {
        const res = await getAllPackages();
        allFetchedPackages.value = res.data.map(pkg => {
            const canteen = canteenList.value.find(c => c.canteenId === pkg.canteenId);
            const dishes = pkg.dishes?.map(dish => {
                // Ensure dish objects are complete for display if API returns partial data
                return dishList.value.find(d => d.dishId === dish.dishId) || { ...dish, name: dish.name || '未知菜品', price: dish.price || 0 };
            }) || [];
            return {
                ...pkg,
                canteenName: canteen ? canteen.name : '未知餐厅',
                dishes: dishes,
            };
        });
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取套餐列表失败:', error);
        allFetchedPackages.value = [];
    } finally {
        loading.value = false;
    }
};

// Reset filter values and re-fetch all data
const refreshPackageList = () => {
    selectedCanteenId.value = '';
    packageNameFilter.value = '';
    currentPage.value = 1;
    fetchAllPackagesData();
    ElMessage.success('筛选已重置，数据已刷新');
};

// Handle page change for pagination
const handlePageChange = (page) => {
    currentPage.value = page;
};

// Open the add/edit package dialog
const openPackageDialog = (operation, row = null) => {
    currentOperation.value = operation;
    showPackageDialog.value = true;
    resetForm(); // Always reset form before populating for edit

    if (operation === 'add') {
        // Set default values for new package
        packageForm.canteenId = selectedCanteenId.value || (canteenList.value.length > 0 ? canteenList.value[0].canteenId : '');
        packageForm.price = 0.01;
    } else if (operation === 'edit' && row) {
        editingPackage.value = row; // Store the original package object
        // Populate form with existing package data
        packageForm.packageId = row.packageId;
        packageForm.canteenId = row.canteenId;
        packageForm.name = row.name;
        packageForm.description = row.description;
        packageForm.price = row.price;
        packageForm.dishIds = row.dishes.map(d => d.dishId);
        packageForm.dishes = [...row.dishes]; // Clone for reactive updates
    }
};

// Reset the package form to initial state
const resetForm = () => {
    packageFormRef.value?.resetFields(); // Reset validation and form values
    packageForm.packageId = null;
    packageForm.canteenId = '';
    packageForm.name = '';
    packageForm.description = '';
    packageForm.price = 0.01;
    packageForm.dishIds = [];
    packageForm.dishes = [];
    editingPackage.value = null; // Clear editing state
};

// Filter dishes in the dish selector based on search keyword and selected canteen
const getFilteredDishes = () => {
    let dishes = dishList.value;
    // Only show dishes from the currently selected canteen in the package form
    if (packageForm.canteenId) {
        dishes = dishes.filter(dish => dish.canteenId === packageForm.canteenId);
    }
    if (dishSearchKeyword.value) {
        dishes = dishes.filter(dish =>
            dish.name.toLowerCase().includes(dishSearchKeyword.value.toLowerCase()) ||
            dish.description.toLowerCase().includes(dishSearchKeyword.value.toLowerCase())
        );
    }
    return dishes;
};

// Check if a dish is already selected for the current package
const isDishSelected = (dish) => {
    return packageForm.dishIds.includes(dish.dishId);
};

// Toggle selection of a dish (add/remove from packageForm)
const toggleDish = (dish) => {
    const idIndex = packageForm.dishIds.indexOf(dish.dishId);
    const objIndex = packageForm.dishes.findIndex(d => d.dishId === dish.dishId);

    if (idIndex > -1) {
        packageForm.dishIds.splice(idIndex, 1);
        if (objIndex > -1) packageForm.dishes.splice(objIndex, 1);
    } else {
        packageForm.dishIds.push(dish.dishId);
        packageForm.dishes.push({ ...dish }); // Add full dish object for display
    }
    // Manually trigger validation for dishIds after change
    packageFormRef.value?.validateField('dishIds');
};

// Remove a selected dish from the package form
const removeDish = (dish) => {
    const idIndex = packageForm.dishIds.indexOf(dish.dishId);
    const objIndex = packageForm.dishes.findIndex(d => d.dishId === dish.dishId);

    if (idIndex > -1) {
        packageForm.dishIds.splice(idIndex, 1);
    }
    if (objIndex > -1) {
        packageForm.dishes.splice(objIndex, 1);
    }
    // Manually trigger validation for dishIds after change
    packageFormRef.value?.validateField('dishIds');
};

// Create the payload object for package creation/update API
const createPackagePayload = (form) => {
    const payload = {
        canteenId: form.canteenId,
        name: form.name,
        description: form.description,
        price: form.price,
        dishIds: form.dishIds,
    };
    return payload;
};

// Handle package submission (add or update)
const publishPackage = async () => {
    if (!packageFormRef.value) return;

    try {
        await packageFormRef.value.validate(); // Validate form fields
        publishing.value = true;

        const payload = createPackagePayload(packageForm);

        if (currentOperation.value === 'add') {
            await createPackage(payload);
            ElMessage.success('套餐添加成功！');
        } else if (currentOperation.value === 'edit' && packageForm.packageId) {
            await updatePackage(packageForm.packageId, payload);
            ElMessage.success('套餐更新成功！');
        }
        showPackageDialog.value = false;
        await fetchAllPackagesData(); // Refresh all data after add/update
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('套餐操作失败:', error);
    } finally {
        publishing.value = false;
    }
};

// Confirm and delete a package
const deletePackageConfirm = async (pkg) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除套餐 "${pkg.name}" 吗？删除后无法恢复。`,
            '确认删除',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        await deletePackage(pkg.packageId);
        ElMessage.success('套餐删除成功！');
        await fetchAllPackagesData(); // Refresh all data after deletion
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(getErrorMessage(error));
            console.error('删除套餐失败:', error);
        } else {
            ElMessage.info('删除已取消');
        }
    }
};
</script>

<style scoped>
.package-management-container {
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

.package-table-card {
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
    border-color: #409EFF; /* Use primary color for hover */
    background: #ecf5ff; /* Light background on hover */
}

.dish-item.selected {
    border-color: #409EFF; /* Use primary color for selected */
    background: #e0f2fe; /* Lighter primary background for selected */
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
    color: #409EFF; /* Use primary color for checkmark */
    font-size: 16px;
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

    .dish-grid {
        grid-template-columns: 1fr;
    }

    .page-header h2 {
        font-size: 24px;
    }
}

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
