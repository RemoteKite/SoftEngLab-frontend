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
                    <div class="cart-summary" v-if="cartItems.length > 0">
                        <el-badge :value="totalQuantity" class="cart-badge">
                            <el-icon class="cart-icon"><ShoppingCart /></el-icon>
                        </el-badge>
                        <span class="cart-total">¥{{ totalAmount }}</span>
                    </div>
                </div>
            </template>

            <div class="menu-grid" v-loading="loading">
                <div
                        v-for="dish in filteredAndPagedDishes"
                        :key="dish.dishId"
                        class="dish-card"
                        :class="{ 'out-of-stock': !dish.available }"
                >
                    <div class="dish-image">
                        <img :src="dish.imageUrl || 'src/assets/noImg.svg'" :alt="dish.name" />
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
                                        @click="removeFromCart(dish.dishId)"
                                >
                                    <el-icon><Minus /></el-icon>
                                </el-button>
                                <span class="quantity">{{ getCartQuantity(dish.dishId) || 0 }}</span>
                                <el-button
                                        size="small"
                                        circle
                                        type="primary"
                                        @click="addToCart(dish)"
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
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    ShoppingCart,
    Plus,
    Minus,
    Clock,
    Refresh,
    Search
} from '@element-plus/icons-vue'

// Assuming these APIs are globally available or imported from a shared file
import { getAllCanteens, getDailyMenusByCanteenAndDate } from '@/services/api.js';

// Reactive data
const loading = ref(false); // Global loading for fetching menu data
const canteens = ref([]);
const dailyMenuDishes = ref([]); // Dishes available for the selected canteen and date

// Filters
const filters = reactive({
    canteenId: '',
    reservationDate: '', // Format:YYYY-MM-DD
    reservationTime: '', // Format:HH:mm:ss
});

const dishNameFilter = ref(''); // Pure frontend filter for dish name

// Pagination for dishes
const currentPage = ref(1);
const pageSize = ref(10); // Adjust as needed
const totalFilteredDishes = ref(0);

// Cart
const cartItems = reactive([]);

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

    if (!filters.canteenId || !filters.reservationDate || !filters.reservationTime) {
        return;
    }

    loading.value = true;
    try {
        const response = await getDailyMenusByCanteenAndDate(filters.canteenId, filters.reservationDate);
        const selectedTime = filters.reservationTime;
        const dishMap = new Map(); // 使用Map对象根据dishId去重

        response.data.forEach(menu => {
            if (selectedTime >= menu.startTime && selectedTime <= menu.endTime) {
                menu.dishes?.forEach(dish => {
                    if (!dishMap.has(dish.dishId)) {
                        dishMap.set(dish.dishId, {
                            ...dish,
                            available: true,
                        });
                    }
                });
            }
        });

        dailyMenuDishes.value = Array.from(dishMap.values());

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
    // Only reset the pure frontend filters and pagination
    dishNameFilter.value = '';
    currentPage.value = 1;
    // The canteenId, reservationDate, and reservationTime are intentionally NOT reset here,
    // as they are considered "selection" rather than "filter" now.
    // If the user wants to change canteen/date/time, they do it directly.
    ElMessage.success('筛选条件已重置');
};

const handlePageChange = (page) => {
    currentPage.value = page;
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

        // Placeholder for actual order creation API call
        const orderData = {
            canteenId: filters.canteenId,
            reservationDate: filters.reservationDate,
            reservationTime: filters.reservationTime, // Include reservation time
            items: cartItems.map(item => ({
                dishId: item.dishId,
                quantity: item.quantity,
                priceAtOrder: item.price
            })),
            totalAmount: totalAmount.value,
            estimatedPickupTime: new Date(new Date().getTime() + estimatedTime.value * 60 * 1000).toLocaleString()
        };

        console.log('Order Data to be sent:', orderData);
        // await createOrder(orderData); // Uncomment and implement your actual API call here

        ElMessage.success('预定成功！请按时到餐厅取餐');

        cartItems.splice(0); // Clear cart after successful order

        // Optionally navigate to an orders page
        // router.push('/orders');

    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('预定失败，请重试');
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
        // If any is cleared, clear the displayed dishes and cart
        dailyMenuDishes.value = [];
        cartItems.splice(0);
        currentPage.value = 1;
    }
}, { immediate: true }); // immediate: true ensures it runs on initial component mount

// Lifecycle Hooks
onMounted(() => {
    fetchCanteens();
    // Set default reservation date to today
    filters.reservationDate = new Date().toISOString().slice(0, 10);
    // Set default reservation time (e.g., current time or a common lunch time)
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
    display: flex; /* Make this a flex container for horizontal items */
    flex-wrap: wrap; /* Allow items to wrap on smaller screens */
    gap: 20px; /* Space between each filter item */
    align-items: flex-end; /* Align items to the bottom, useful if labels are different heights */
}

.filter-item {
    display: flex;
    flex-direction: column; /* Keep label and input on separate lines */
    align-items: flex-end; /* Right-align label and input within each item */
    gap: 8px; /* Space between label and input */
    width: auto; /* Allow item to shrink to content width */
}

.filter-item label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    white-space: nowrap; /* Prevent label from wrapping */
}

.compact-input {
    width: 150px; /* Further reduced width for inputs */
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
    flex-wrap: wrap; /* Allow wrapping for responsiveness */
    gap: 16px; /* Space between header elements */
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
    flex-wrap: wrap; /* Allow wrapping for responsiveness */
    gap: 12px; /* Space between filter controls */
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
    color: #409EFF; /* Consistent primary color */
}

.cart-total {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* Adjusted minmax for smaller cards */
    gap: 15px; /* Reduced gap for more compactness */
    margin-top: 20px;
    max-height: calc(100vh - 400px); /* Adjusted max-height to be dynamic based on viewport height */
    overflow-y: auto; /* Added overflow-y for scrolling */
}

.dish-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    background: white;
    display: flex; /* Make dish-card a flex container */
    flex-direction: column; /* Arrange children in a column */
}

.dish-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dish-card.out-of-stock {
    opacity: 0.6;
    filter: grayscale(0.3);
}

.dish-image {
    position: relative;
    height: 120px; /* Reduced image height */
    overflow: hidden;
    background-color: #f0f0f0; /* Placeholder background */
    flex-shrink: 0; /* Prevent image from shrinking */
}

.dish-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.dish-info {
    padding: 12px; /* Reduced padding */
    flex-grow: 1; /* Allow dish-info to take remaining height */
    display: flex; /* Make dish-info a flex container */
    flex-direction: column; /* Arrange children in a column */
    justify-content: space-between; /* Push footer to bottom */
}

.dish-name {
    font-size: 15px; /* Slightly reduced font size */
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 6px 0; /* Reduced margin */
}

.dish-description {
    font-size: 13px; /* Slightly reduced font size */
    color: #6b7280;
    margin: 0 0 10px 0; /* Reduced margin */
    line-height: 1.4;
    flex-grow: 1; /* Allow description to grow and push footer */
}

.dish-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto; /* Push to the bottom */
}

.price-section {
    display: flex;
    align-items: center;
    gap: 6px; /* Reduced gap */
}

.current-price {
    font-size: 16px; /* Slightly reduced font size */
    font-weight: 700;
    color: #ef4444;
}

.quantity-control {
    display: flex;
    align-items: center;
    gap: 8px; /* Reduced gap */
}

.quantity {
    font-size: 15px; /* Slightly reduced font size */
    font-weight: 600;
    color: #1f2937;
    min-width: 18px; /* Adjusted min-width */
    text-align: center;
}

.out-of-stock-text {
    font-size: 13px; /* Slightly reduced font size */
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
        /* On small screens, the main card will still align to start, but its internal group will be flex-end */
        justify-content: flex-start; /* Align content to start on small screens */
    }
    .filter-group {
        flex-direction: column; /* Stack filter items vertically on small screens */
        align-items: flex-start; /* Align stacked items to the start on small screens */
        width: 100%;
    }
    .filter-item {
        width: 100%; /* On small screens, allow items to take full width */
        align-items: flex-start; /* On small screens, align items to start */
    }
    .compact-input {
        width: 100%; /* On small screens, allow them to take full width */
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
