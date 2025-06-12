<template>
    <div class="dish-ordering-content">
        <div class="top-section-container">
            <div class="page-header">
                <h1>预定餐品</h1>
            </div>

            <el-card class="canteen-selection-card">
                <div class="filter-group">
                    <div class="filter-item">
                        <label>选择餐厅</label>
                        <el-select v-model="filters.canteenId" placeholder="请选择餐厅" clearable class="compact-input">
                            <el-option
                                    v-for="canteen in canteens"
                                    :key="canteen.canteenId"
                                    :label="canteen.name"
                                    :value="canteen.canteenId"
                            />
                        </el-select>
                    </div>
                    <div class="filter-item">
                        <label>预定日期</label>
                        <el-date-picker
                                v-model="filters.reservationDate"
                                type="date"
                                placeholder="选择预定日期"
                                format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD"
                                :disabled-date="disabledDate"
                                clearable
                                class="compact-input"
                        />
                    </div>
                    <div class="filter-item">
                        <label>预定时间</label>
                        <el-time-picker
                                v-model="filters.reservationTime"
                                placeholder="选择时间"
                                format="HH:mm"
                                value-format="HH:mm:ss"
                                clearable
                                class="compact-input"
                        />
                    </div>
                    <!-- 新增膳食标签筛选 -->
                    <div class="filter-item">
                        <label>膳食标签</label>
                        <el-select v-model="filters.selectedDietaryTags" placeholder="选择膳食标签" multiple clearable class="compact-input">
                            <el-option
                                    v-for="tag in allDietaryTags"
                                    :key="tag"
                                    :label="tag"
                                    :value="tag"
                            />
                        </el-select>
                    </div>
                    <!-- 新增过敏原筛选 -->
                    <div class="filter-item">
                        <label>过敏原</label>
                        <el-select v-model="filters.selectedAllergens" placeholder="排除过敏原" multiple clearable class="compact-input">
                            <el-option
                                    v-for="allergen in allAllergens"
                                    :key="allergen"
                                    :label="allergen"
                                    :value="allergen"
                            />
                        </el-select>
                    </div>
                </div>
            </el-card>
        </div>

        <el-card class="menu-section">
            <template #header>
                <div class="section-header">
                    <h3>可预定菜品</h3>
                    <div class="dish-filter-controls">
                        <el-input
                                v-model="dishNameFilter"
                                placeholder="搜索菜品名称"
                                prefix-icon="Search"
                                clearable
                                @input="currentPage = 1"
                                style="width: 200px; margin-right: 12px;"
                        />
                        <el-button @click="resetFilters">
                            <el-icon><Refresh /></el-icon> 重置筛选
                        </el-button>
                    </div>
                    <!-- 移除此处购物车图标和总览 -->
                    <!-- <div class="cart-summary" v-if="cartItems.length > 0">
                        <el-badge :value="totalQuantity" class="cart-badge">
                            <el-icon class="cart-icon"><ShoppingCart /></el-icon>
                        </el-badge>
                        <span class="cart-total">¥{{ totalAmount }}</span>
                    </div> -->
                </div>
            </template>

            <div class="menu-grid" v-loading="loading">
                <div
                        v-for="dish in filteredAndPagedDishes"
                        :key="dish.dishId"
                        class="dish-card"
                        :class="{ 'out-of-stock': !dish.available }"
                        @click="showDishDetails(dish)"
                >
                    <div class="dish-image">
                        <img :src="dish.imageUrl || 'https://placehold.co/220x120/E0E0E0/333333?text=无图片'" :alt="dish.name" />
                    </div>

                    <div class="dish-info">
                        <h4 class="dish-name">{{ dish.name }}</h4>
                        <p class="dish-description">{{ dish.description }}</p>

                        <div class="dish-footer">
                            <div class="price-section">
                                <span class="current-price">¥{{ dish.price.toFixed(2) }}</span>
                            </div>

                            <div class="quantity-control" v-if="dish.available">
                                <el-button
                                        size="small"
                                        circle
                                        :disabled="!getCartQuantity(dish.dishId)"
                                        @click.stop="removeFromCart(dish.dishId)"
                                >
                                    <el-icon><Minus /></el-icon>
                                </el-button>
                                <span class="quantity">{{ getCartQuantity(dish.dishId) || 0 }}</span>
                                <el-button
                                        size="small"
                                        circle
                                        type="primary"
                                        @click.stop="addToCart(dish)"
                                >
                                    <el-icon><Plus /></el-icon>
                                </el-button>
                            </div>

                            <div v-else class="out-of-stock-text">暂时售罄</div>
                        </div>
                    </div>
                </div>
            </div>

            <el-empty v-if="!loading && filteredAndPagedDishes.length === 0" description="暂无可预定的菜品" />
        </el-card>

        <div class="cart-footer" v-if="cartItems.length > 0">
            <div class="cart-info">
                <div class="cart-summary-detail">
                    <span class="item-count">已选 {{ totalQuantity }} 样</span>
                    <span class="total-price">¥{{ totalAmount }}</span>
                </div>
                <div class="delivery-info">
                    <el-icon><Clock /></el-icon>
                    <span>预计 {{ estimatedTime }} 分钟后可取餐</span>
                </div>
            </div>

            <el-button
                    type="primary"
                    size="large"
                    class="checkout-btn"
                    :disabled="!filters.canteenId || !filters.reservationDate || !filters.reservationTime || cartItems.length === 0"
                    @click="proceedToCheckout"
            >
                立即预定
            </el-button>
        </div>

        <!-- 菜品详情弹框 -->
        <el-dialog
                v-model="showDishDetailModal"
                :title="selectedDishDetails ? selectedDishDetails.name + ' 详情' : '菜品详情'"
                width="500px"
                destroy-on-close
                center
        >
            <div v-if="selectedDishDetails" class="dish-detail-content">
                <img :src="selectedDishDetails.imageUrl || 'https://placehold.co/400x200/E0E0E0/333333?text=无图片'" :alt="selectedDishDetails.name" class="detail-dish-image" />
                <div class="detail-info-section">
                    <h3>{{ selectedDishDetails.name }}</h3>
                    <p class="detail-description">{{ selectedDishDetails.description || '暂无描述' }}</p>
                    <p class="detail-price">价格: ¥{{ selectedDishDetails.price ? selectedDishDetails.price.toFixed(2) : 'N/A' }}</p>

                    <div v-if="selectedDishDetails.dietaryTagNames && selectedDishDetails.dietaryTagNames.length" class="detail-tags">
                        <strong>膳食标签:</strong>
                        <el-tag
                                v-for="tag in selectedDishDetails.dietaryTagNames"
                                :key="tag"
                                size="small"
                                type="info"
                                effect="plain"
                                class="tag-item"
                        >{{ tag }}</el-tag>
                    </div>

                    <div v-if="selectedDishDetails.allergenNames && selectedDishDetails.allergenNames.length" class="detail-tags">
                        <strong>过敏原:</strong>
                        <el-tag
                                v-for="allergen in selectedDishDetails.allergenNames"
                                :key="allergen"
                                size="small"
                                type="danger"
                                effect="plain"
                                class="tag-item"
                        >{{ allergen }}</el-tag>
                    </div>

                    <p v-if="selectedDishDetails.averageRating !== undefined && selectedDishDetails.averageRating !== null" class="detail-rating">
                        平均评分: {{ selectedDishDetails.averageRating.toFixed(1) }} ⭐
                    </p>
                    <p v-else class="detail-rating">平均评分: 暂无</p>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showDishDetailModal = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch, ref } from 'vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
import {
    ShoppingCart,
    Plus,
    Minus,
    Clock,
    Refresh,
    Search
} from '@element-plus/icons-vue'

// Assuming these APIs are globally available or imported from a shared file
import { getAllCanteens, getDailyMenusByCanteenAndDate, createOrder } from '@/services/api.js';

// Reactive data
const loading = ref(false); // Global loading for fetching menu data
const canteens = ref([]);
const dailyMenuDishes = ref([]); // Dishes available for the selected canteen and date

// Filters
const filters = reactive({
    canteenId: '',
    reservationDate: '', // Format:YYYY-MM-DD
    reservationTime: '', // Format:HH:mm:ss
    selectedDietaryTags: [], // 用于存储选中的膳食标签
    selectedAllergens: [], // 用于存储选中的过敏原
});

const dishNameFilter = ref(''); // Pure frontend filter for dish name

// Pagination for dishes
const currentPage = ref(1);
const pageSize = ref(10); // Adjust as needed
const totalFilteredDishes = ref(0);

// Cart
const cartItems = reactive([]);

// 菜品详情弹框相关状态
const showDishDetailModal = ref(false);
const selectedDishDetails = ref(null); // 用于存储当前点击的菜品详情

// 用于存储所有可用的膳食标签和过敏原选项
const allDietaryTags = ref([]);
const allAllergens = ref([]);

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

// Computed properties
const filteredDishes = computed(() => {
    let currentDishes = [...dailyMenuDishes.value];

    // Filter by dish name (pure frontend)
    if (dishNameFilter.value) {
        currentDishes = currentDishes.filter(dish =>
            dish.name.toLowerCase().includes(dishNameFilter.value.toLowerCase())
        );
    }

    // 根据膳食标签筛选 (必须包含所有选中的标签)
    if (filters.selectedDietaryTags.length > 0) {
        currentDishes = currentDishes.filter(dish =>
            filters.selectedDietaryTags.every(selectedTag =>
                dish.dietaryTagNames && dish.dietaryTagNames.includes(selectedTag)
            )
        );
    }

    // 根据过敏原筛选 (必须不包含任何选中的过敏原)
    if (filters.selectedAllergens.length > 0) {
        currentDishes = currentDishes.filter(dish =>
            // 如果菜品没有过敏原信息，或者菜品的过敏原都不在用户选中的过敏原列表中，则保留该菜品
            !dish.allergenNames?.some(dishAllergen =>
                filters.selectedAllergens.includes(dishAllergen)
            )
        );
    }

    return currentDishes;
});

const filteredAndPagedDishes = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    totalFilteredDishes.value = filteredDishes.value.length;
    return filteredDishes.value.slice(start, end);
});

const totalQuantity = computed(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
});

const totalAmount = computed(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
});

const estimatedTime = computed(() => {
    // Simple estimation: 15 minutes base + 3 minutes per item
    return Math.max(15, totalQuantity.value * 3);
});

// Methods
const fetchCanteens = async () => {
    try {
        const response = await getAllCanteens();
        canteens.value = response.data;
        // Set a default canteen if available
        if (canteens.value.length > 0) {
            filters.canteenId = canteens.value[0].canteenId;
        }
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取餐厅列表失败:', error);
    }
};

const fetchMenuDishes = async () => {
    dailyMenuDishes.value = [];
    cartItems.splice(0);
    currentPage.value = 1;
    allDietaryTags.value = []; // 清空之前的标签和过敏原
    allAllergens.value = [];

    if (!filters.canteenId || !filters.reservationDate || !filters.reservationTime) {
        return;
    }

    loading.value = true;
    try {
        const response = await getDailyMenusByCanteenAndDate(filters.canteenId, filters.reservationDate);
        const selectedTime = filters.reservationTime;
        const dishMap = new Map(); // 使用Map对象根据dishId去重
        const uniqueDietaryTags = new Set(); // 收集所有膳食标签
        const uniqueAllergens = new Set(); // 收集所有过敏原

        response.data.forEach(menu => {
            if (selectedTime >= menu.startTime && selectedTime <= menu.endTime) {
                menu.dishes?.forEach(dish => {
                    if (!dishMap.has(dish.dishId)) {
                        dishMap.set(dish.dishId, {
                            ...dish,
                            // 确保这些字段即使后端未提供，也存在并有默认值
                            dietaryTagNames: dish.dietaryTagNames || [],
                            allergenNames: dish.allergenNames || [],
                            averageRating: dish.averageRating === undefined ? null : dish.averageRating,
                            available: true, // 确保 available 属性存在
                        });

                        // 收集膳食标签和过敏原
                        dish.dietaryTagNames?.forEach(tag => uniqueDietaryTags.add(tag));
                        dish.allergenNames?.forEach(allergen => uniqueAllergens.add(allergen));
                    }
                });
            }
        });

        dailyMenuDishes.value = Array.from(dishMap.values());
        allDietaryTags.value = Array.from(uniqueDietaryTags);
        allAllergens.value = Array.from(uniqueAllergens);

        ElMessage.success(`已加载 ${dailyMenuDishes.value.length} 个菜品`);
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('加载菜品失败:', {
            error,
            filters,
            timestamp: new Date().toISOString()
        });
    } finally {
        loading.value = false;
    }
};

const getCartQuantity = (dishId) => {
    const item = cartItems.find(item => item.dishId === dishId);
    return item ? item.quantity : 0;
};

const addToCart = (dish) => {
    const existingItem = cartItems.find(item => item.dishId === dish.dishId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({
            dishId: dish.dishId,
            name: dish.name,
            price: dish.price,
            quantity: 1,
            imageUrl: dish.imageUrl
        });
    }
    ElMessage.success(`${dish.name} 已加入购物车`);
};

const removeFromCart = (dishId) => {
    const itemIndex = cartItems.findIndex(item => item.dishId === dishId);
    if (itemIndex > -1) {
        const item = cartItems[itemIndex];
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            cartItems.splice(itemIndex, 1);
        }
    }
};

const disabledDate = (time) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return time.getTime() < today.getTime();
};

const resetFilters = () => {
    // 重置所有前端筛选条件和分页
    dishNameFilter.value = '';
    filters.selectedDietaryTags = [];
    filters.selectedAllergens = [];
    currentPage.value = 1;
    // 餐厅ID、预定日期和时间不在此处重置，因为它们是“选择”而不是“筛选”
    ElMessage.success('筛选条件已重置');
};

const handlePageChange = (page) => {
    currentPage.value = page;
};

// 显示菜品详情弹框
const showDishDetails = (dish) => {
    selectedDishDetails.value = { ...dish }; // 复制菜品信息，避免直接修改
    showDishDetailModal.value = true;
};

const proceedToCheckout = async () => {
    try {
        await ElMessageBox.confirm(
            `确认预定 ${totalQuantity.value} 样菜品，总金额 ¥${totalAmount.value} 吗？`,
            '确认预定',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'info'
            }
        );

        // 构建符合 OrderRequest DTO 的数据
        const orderData = {
            canteenId: filters.canteenId,
            orderDate: filters.reservationDate,
            pickupTime: filters.reservationTime,
            items: cartItems.map(item => ({
                dishId: item.dishId,
                quantity: item.quantity
            }))
        };

        console.log('Order Data to be sent:', orderData);

        // 调用 createOrder API
        await createOrder(orderData);

        ElMessage.success('预定成功！请按时到餐厅取餐');

        cartItems.splice(0); // 清空购物车

        // 可以在这里添加导航到订单页面的逻辑，例如：
        // router.push('/orders');

    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`预定失败：${getErrorMessage(error)}`); // 显示具体错误信息
            console.error('预定失败:', error);
        } else {
            ElMessage.info('预定已取消');
        }
    }
};

// Watchers to trigger data fetch when canteenId, reservationDate, or reservationTime changes
watch([() => filters.canteenId, () => filters.reservationDate, () => filters.reservationTime], ([newCanteenId, newReservationDate, newReservationTime]) => {
    if (newCanteenId && newReservationDate && newReservationTime) {
        fetchMenuDishes(); // Only fetch if all three are selected
    } else {
        // If any is cleared, clear the displayed dishes, cart, and filter options
        dailyMenuDishes.value = [];
        cartItems.splice(0);
        currentPage.value = 1;
        allDietaryTags.value = [];
        allAllergens.value = [];
    }
}, { immediate: true }); // immediate: true ensures it runs on initial component mount

// Watchers to reset pagination when dietary tags or allergens filters change
watch([() => filters.selectedDietaryTags, () => filters.selectedAllergens], () => {
    currentPage.value = 1; // 筛选条件变化时重置分页
});

// Lifecycle Hooks
onMounted(() => {
    fetchCanteens();
    // Set default reservation date to today
    filters.reservationDate = new Date().toISOString().slice(0, 10);
    // Set default reservation time (e.g., current time or a common lunch time)
    // 确保时间格式为 HH:mm:ss，Element Plus time-picker的value-format是HH:mm:ss
    filters.reservationTime = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
});
</script>

<style scoped>
.dish-ordering-content {
    margin: 0 auto;
    padding: 20px;
    max-width: 1200px;
    padding-bottom: 100px; /* Ensure space for fixed cart footer */
}

.top-section-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start; /* Align items to the top */
    flex-wrap: wrap; /* Allow wrapping for responsiveness */
    margin-bottom: 24px;
    gap: 20px; /* Space between header and card */
}

.page-header {
    flex-shrink: 0; /* Prevent header from shrinking too much */
    margin-bottom: 20px; /* Added bottom margin here */
}

.page-header h1 {
    font-size: 28px;
    color: #1f2937;
    margin: 0;
    font-weight: 600;
}

.canteen-selection-card {
    flex-grow: 1; /* Allow card to take available space */
    min-width: 280px; /* Adjusted min-width for a more compact card */
    border-radius: 12px;
    border: 0 !important; /* Explicitly removed border */
    box-shadow: none !important; /* Explicitly removed box-shadow */
    background-color: transparent !important; /* Removed background color */
    padding: 0 !important; /* Removed padding */
    display: flex; /* Changed to flex to allow horizontal alignment of filter-group */
    justify-content: flex-end; /* Push content to the right */
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
    align-items: flex-end;
    gap: 8px;
    width: auto;
}

.filter-item label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    white-space: nowrap;
}

.compact-input {
    width: 150px;
}

.menu-section {
    border-radius: 12px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.section-header h3 {
    margin: 0;
    font-size: 18px;
    color: #1f2937;
    font-weight: 600;
}

.dish-filter-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.cart-summary {
    display: flex;
    align-items: center;
    gap: 12px;
}

.cart-badge {
    cursor: pointer;
}

.cart-icon {
    font-size: 24px;
    color: #409EFF;
}

.cart-total {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
    margin-top: 20px;
    max-height: calc(100vh - 400px);
    overflow-y: auto;
}

.dish-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    background: white;
    display: flex;
    flex-direction: column;
    cursor: pointer;
}

.dish-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dish-card.out-of-stock {
    opacity: 0.6;
    filter: grayscale(0.3);
    cursor: default;
}

.dish-image {
    position: relative;
    height: 120px;
    overflow: hidden;
    background-color: #f0f0f0;
    flex-shrink: 0;
}

.dish-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.dish-info {
    padding: 12px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.dish-name {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 6px 0;
}

.dish-description {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 10px 0;
    line-height: 1.4;
    flex-grow: 1;
}

.dish-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}

.price-section {
    display: flex;
    align-items: center;
    gap: 6px;
}

.current-price {
    font-size: 16px;
    font-weight: 700;
    color: #ef4444;
}

.quantity-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.quantity {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    min-width: 18px;
    text-align: center;
}

.out-of-stock-text {
    font-size: 13px;
    color: #9ca3af;
    font-weight: 500;
}

.cart-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
}

.cart-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cart-summary-detail {
    display: flex;
    align-items: center;
    gap: 16px;
}

.item-count {
    font-size: 14px;
    color: #6b7280;
}

.total-price {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
}

.delivery-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #6b7280;
}

.checkout-btn {
    padding: 12px 32px;
    font-size: 16px;
    font-weight: 600;
    height: auto;
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

/* 菜品详情弹框样式 */
.dish-detail-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
}

.detail-dish-image {
    width: 100%;
    max-width: 400px;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 20px;
}

.detail-info-section h3 {
    font-size: 24px;
    color: #1f2937;
    margin-bottom: 10px;
}

.detail-description {
    font-size: 15px;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 15px;
}

.detail-price {
    font-size: 20px;
    font-weight: 700;
    color: #ef4444;
    margin-bottom: 15px;
}

.detail-tags {
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 14px;
    color: #374151;
}

.tag-item {
    margin-right: 8px;
    margin-bottom: 8px;
}

.detail-rating {
    font-size: 16px;
    color: #374151;
    margin-top: 15px;
}

.dialog-footer {
    text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .top-section-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
    .canteen-selection-card {
        width: 100%;
        min-width: unset;
        justify-content: flex-start;
    }
    .filter-group {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
    }
    .filter-item {
        width: 100%;
        align-items: flex-start;
    }
    .compact-input {
        width: 100%;
    }

    .menu-grid {
        grid-template-columns: 1fr;
    }

    .cart-footer {
        flex-direction: column;
        gap: 16px;
        padding: 20px 16px;
    }

    .cart-info {
        width: 100%;
        text-align: center;
    }

    .checkout-btn, .reset-button {
        width: 100%;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .dish-filter-controls {
        width: 100%;
        justify-content: space-between;
    }

    .dish-filter-controls .el-input {
        flex-grow: 1;
        margin-right: 0 !important;
    }
}
</style>
