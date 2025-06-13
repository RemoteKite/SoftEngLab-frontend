<template>
    <div class="banquet-reservation-container">
        <div class="page-header">
            <h2>宴会预定</h2>
        </div>

        <el-card class="reservation-form-card">
            <template #header>
                <div class="card-header">
                    <h3>填写预定信息</h3>
                </div>
            </template>

            <div class="form-scroll-content">
                <el-form :model="reservationForm" :rules="reservationRules" ref="reservationFormRef" label-width="100px">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="选择餐厅" prop="canteenId">
                                <el-select v-model="reservationForm.canteenId" placeholder="请选择餐厅" style="width: 100%;">
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
                            <el-form-item label="选择包厢" prop="roomId">
                                <el-select
                                        v-model="reservationForm.roomId"
                                        placeholder="请选择包厢"
                                        :loading="roomsLoading"
                                        :disabled="!reservationForm.canteenId"
                                        style="width: 100%;"
                                >
                                    <el-option
                                            v-for="room in roomList"
                                            :key="room.roomId"
                                            :label="room.name + ' (容量: ' + room.capacity + '人, 基础费用: ¥' + room.baseFee + ')'"
                                            :value="room.roomId"
                                    ></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="宴会日期" prop="eventDate">
                                <el-date-picker
                                        v-model="reservationForm.eventDate"
                                        type="date"
                                        placeholder="选择宴会日期"
                                        value-format="YYYY-MM-DD"
                                        :disabled-date="disablePastDates"
                                        style="width: 100%;"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="宴会时间" prop="eventTime">
                                <el-time-picker
                                        v-model="reservationForm.eventTime"
                                        placeholder="选择宴会时间"
                                        value-format="HH:mm:ss"
                                        style="width: 100%;"
                                ></el-time-picker>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="宾客人数" prop="numberOfGuests">
                                <el-input-number
                                        v-model="reservationForm.numberOfGuests"
                                        :min="1"
                                        :step="1"
                                        placeholder="请输入宾客人数"
                                        style="width: 100%;"
                                ></el-input-number>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="联系人姓名" prop="contactName">
                                <el-input v-model="reservationForm.contactName" placeholder="请输入联系人姓名"></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="联系电话" prop="contactPhoneNumber">
                                <el-input v-model="reservationForm.contactPhoneNumber" placeholder="请输入联系电话"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="宴会目的" prop="purpose">
                                <el-input v-model="reservationForm.purpose" placeholder="例如：生日聚会、商务宴请" maxlength="255"></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item label="定制菜单">
                        <div class="menu-selection-area">
                            <div class="selected-items-display">
                                <h4>已选菜品:</h4>
                                <div class="selected-tags-wrapper">
                                    <el-tag
                                            v-for="dish in selectedDishesForDisplay"
                                            :key="dish.dishId"
                                            closable
                                            @close="removeDish(dish)"
                                            size="small"
                                            class="mr-1 mb-1"
                                    >
                                        {{ dish.name }} x{{ dish.quantity }} <!-- 显示数量 -->
                                    </el-tag>
                                    <span v-if="selectedDishesForDisplay.length === 0" class="no-selection-text">未选择菜品</span>
                                </div>
                                <el-tooltip :disabled="!reservationForm.canteenId" content="请先选择餐厅" placement="top">
                                    <el-button @click="openDishSelector" :disabled="!reservationForm.canteenId">
                                        <el-icon><Plus /></el-icon> 选择菜品
                                    </el-button>
                                </el-tooltip>
                            </div>

                            <el-divider>或</el-divider>

                            <div class="selected-items-display">
                                <h4>已选套餐:</h4>
                                <div class="selected-tags-wrapper">
                                    <el-tag
                                            v-for="pkg in reservationForm.selectedPackagesForDisplay"
                                            :key="pkg.packageId"
                                            closable
                                            @close="removePackage(pkg)"
                                            type="success"
                                            size="small"
                                            class="mr-1 mb-1"
                                    >
                                        {{ pkg.name }}
                                    </el-tag>
                                    <span v-if="reservationForm.selectedPackagesForDisplay.length === 0" class="no-selection-text">未选择套餐</span>
                                </div>
                                <el-tooltip :disabled="!reservationForm.canteenId" content="请先选择餐厅" placement="top">
                                    <el-button @click="openPackageSelector" :disabled="!reservationForm.canteenId">
                                        <el-icon><Plus /></el-icon> 选择套餐
                                    </el-button>
                                </el-tooltip>
                            </div>
                        </div>
                    </el-form-item>

                    <el-form-item label="定制菜单请求" prop="customMenuRequest">
                        <el-input v-model="reservationForm.customMenuRequest" type="textarea" :rows="3" placeholder="例如：要求无麸质、素食餐点等" maxlength="1000"></el-input>
                    </el-form-item>

                    <el-form-item label="特殊要求" prop="specialRequests">
                        <el-input v-model="reservationForm.specialRequests" type="textarea" :rows="3" placeholder="例如：需要儿童椅、会场布置要求等" maxlength="500"></el-input>
                    </el-form-item>

                    <el-form-item label="生日蛋糕">
                        <el-checkbox v-model="reservationForm.hasBirthdayCake">需要生日蛋糕</el-checkbox>
                    </el-form-item>

                    <!-- 新增：包厢基础费用显示 -->
                    <el-row :gutter="20">
                        <el-col :span="24">
                            <el-form-item label="包厢基础费用">
                                <span class="base-fee-display">{{ selectedRoomBaseFeeDisplay }}</span>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <!-- 新增：预估总价显示 -->
                    <el-row :gutter="20">
                        <el-col :span="24">
                            <el-form-item label="预估总价">
                                <span class="total-price-display">¥ {{ calculatedTotalPrice }}</span>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item>
                        <el-button type="primary" @click="submitReservation" :loading="submitting">
                            <el-icon><Check /></el-icon> 提交预定
                        </el-button>
                        <el-button @click="resetForm">
                            <el-icon><Refresh /></el-icon> 重置
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </el-card>

        <!-- 菜品选择弹框 -->
        <el-dialog v-model="showDishSelectorDialog" title="选择菜品" width="600px">
            <div class="dish-selector-content">
                <el-input
                        v-model="dishSearchKeyword"
                        placeholder="搜索菜品名称"
                        prefix-icon="Search"
                        style="margin-bottom: 16px;"
                />
                <div v-loading="dishesLoading" class="dish-grid">
                    <div
                            v-for="dish in getFilteredDishes"
                            :key="dish.dishId"
                            class="dish-item"
                            :class="{ selected: isDishSelected(dish) }"
                            @click="toggleDishSelection(dish)"
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
                    <el-empty v-if="!dishesLoading && getFilteredDishes.length === 0" description="暂无可选菜品" :image-size="80"></el-empty>
                </div>
            </div>
            <template #footer>
                <el-button @click="showDishSelectorDialog = false">完成选择</el-button>
            </template>
        </el-dialog>

        <!-- 菜品数量选择弹框 -->
        <el-dialog v-model="showQuantityDialog" :title="`选择 '${quantityDialogDishName}' 的数量`" width="300px" custom-class="quantity-dialog">
            <el-form-item label="数量">
                <el-input-number v-model="currentDishQuantity" :min="0" :step="1"></el-input-number>
            </el-form-item>
            <template #footer>
                <el-button @click="showQuantityDialog = false">取消</el-button>
                <el-button type="primary" @click="handleQuantityConfirm">确定</el-button>
            </template>
        </el-dialog>

        <!-- 套餐选择弹框 -->
        <el-dialog v-model="showPackageSelectorDialog" title="选择套餐" width="600px">
            <div class="package-selector-content">
                <el-input
                        v-model="packageSearchKeyword"
                        placeholder="搜索套餐名称"
                        prefix-icon="Search"
                        style="margin-bottom: 16px;"
                />
                <div v-loading="packagesLoading" class="package-grid">
                    <div
                            v-for="pkg in getFilteredPackages"
                            :key="pkg.packageId"
                            class="package-item"
                            :class="{ selected: isPackageSelected(pkg) }"
                            @click="togglePackageSelection(pkg)"
                    >
                        <div class="package-info">
                            <h4>{{ pkg.name }}</h4>
                            <p class="package-price">¥{{ pkg.price }}</p>
                            <p class="package-desc">{{ pkg.description }}</p>
                            <div class="included-dishes">
                                <el-tag
                                        v-for="dish in pkg.dishes"
                                        :key="dish.dishId"
                                        size="small"
                                        type="info"
                                        class="mr-1"
                                >
                                    {{ dish.name }}
                                </el-tag>
                            </div>
                        </div>
                        <el-icon v-if="isPackageSelected(pkg)" class="selected-icon">
                            <Check />
                        </el-icon>
                    </div>
                    <el-empty v-if="!packagesLoading && getFilteredPackages.length === 0" description="暂无可选套餐" :image-size="80"></el-empty>
                </div>
            </div>
            <template #footer>
                <el-button @click="showPackageSelectorDialog = false">完成选择</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
    Plus,
    Refresh,
    Check,
    Search
} from '@element-plus/icons-vue';

// 导入 API 服务
import {
    createBanquet,
    getAllCanteens,
    getRoomsByCanteenId,
    getAllDishes,
    getAllPackages
} from '@/services/api.js';

// Reactive data
const submitting = ref(false); // 表单提交加载状态
const roomsLoading = ref(false); // 包厢列表加载状态
const dishesLoading = ref(false); // 菜品列表加载状态
const packagesLoading = ref(false); // 套餐列表加载状态

const showDishSelectorDialog = ref(false); // 菜品选择弹框的显示状态
const showPackageSelectorDialog = ref(false); // 套餐选择弹框的显示状态
const showQuantityDialog = ref(false); // 菜品数量选择弹框的显示状态

const dishSearchKeyword = ref(''); // 菜品搜索关键词
const packageSearchKeyword = ref(''); // 套餐搜索关键词

// 菜品数量选择弹框相关状态
const currentSelectedDishForQuantity = ref({}); // 当前正在设置数量的菜品（完整对象）
const currentDishQuantity = ref(1); // 当前菜品数量
const quantityDialogDishName = ref(''); // 数量弹框中显示的菜品名称

// Form data
const reservationFormRef = ref(null);
const reservationForm = reactive({
    canteenId: '',
    roomId: '',
    eventDate: '',
    eventTime: '',
    numberOfGuests: 1,
    contactName: '',
    contactPhoneNumber: '',
    purpose: '',
    selectedDishItems: [], // 修改：现在存储 { dishId, quantity } 对象的数组
    selectedPackageIds: [],
    hasBirthdayCake: false,
    customMenuRequest: '',
    specialRequests: '',
    selectedPackagesForDisplay: [], // 保持不变，因为套餐没有数量
    totalPrice: 0, // 新增：用于存储计算后的总价，最终会发送给后端
});

// Data lists for selectors
const canteenList = ref([]);
const roomList = ref([]); // 所选餐厅的包厢列表
const allAvailableDishes = ref([]); // 所有可用菜品
const allAvailablePackages = ref([]); // 所有可用套餐

// Form validation rules
const reservationRules = reactive({
    canteenId: [{ required: true, message: '请选择餐厅', trigger: 'change' }],
    roomId: [{ required: true, message: '请选择包厢', trigger: 'change' }],
    eventDate: [{ required: true, message: '请选择宴会日期', trigger: 'change' }],
    eventTime: [{ required: true, message: '请选择宴会时间', trigger: 'change' }],
    numberOfGuests: [
        { required: true, message: '请输入宾客人数', trigger: 'blur' },
        { type: 'number', min: 1, message: '宾客人数必须至少为1', trigger: 'blur' }
    ],
    contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
    contactPhoneNumber: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '电话号码格式不正确', trigger: 'blur' }
    ],
    purpose: [{ max: 255, message: '宴会目的不能超过255个字符', trigger: 'blur' }],
    customMenuRequest: [{ max: 1000, message: '定制菜单请求不能超过1000个字符', trigger: 'blur' }],
    specialRequests: [{ max: 500, message: '特殊要求不能超过500个字符', trigger: 'blur' }],
});

// 计算属性：用于在UI中显示已选菜品，包含数量和菜品详细信息
const selectedDishesForDisplay = computed(() => {
    return reservationForm.selectedDishItems.map(selectedItem => {
        const dish = allAvailableDishes.value.find(d => d.dishId === selectedItem.dishId);
        // 如果找到菜品，则返回包含菜品详细信息和数量的对象，否则返回null（会被过滤掉）
        return dish ? { ...dish, quantity: selectedItem.quantity } : null;
    }).filter(Boolean); // 过滤掉任何 null 值
});

// 计算属性：实时计算宴会总价
const calculatedTotalPrice = computed(() => {
    let price = 0;

    // 1. 添加包厢基础费用
    const selectedRoom = roomList.value.find(room => room.roomId === reservationForm.roomId);
    if (selectedRoom && selectedRoom.baseFee) {
        price += selectedRoom.baseFee;
    }

    // 2. 添加定制菜品项的价格 (数量 * 单价)
    reservationForm.selectedDishItems.forEach(item => {
        const dish = allAvailableDishes.value.find(d => d.dishId === item.dishId);
        if (dish && dish.price) {
            price += dish.price * item.quantity;
        }
    });

    // 3. 添加已选套餐的价格
    reservationForm.selectedPackageIds.forEach(packageId => {
        const pkg = allAvailablePackages.value.find(p => p.packageId === packageId);
        if (pkg && pkg.price) {
            price += pkg.price;
        }
    });

    // 确保价格保留两位小数
    return parseFloat(price.toFixed(2));
});

// 计算属性：显示已选包厢的基础费用
const selectedRoomBaseFeeDisplay = computed(() => {
    const selectedRoom = roomList.value.find(room => room.roomId === reservationForm.roomId);
    return selectedRoom ? `¥ ${selectedRoom.baseFee.toFixed(2)}` : '未选择包厢';
});


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

// Helper function: Disable past dates
const disablePastDates = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
};

// --- Data Fetching Methods ---
const fetchCanteens = async () => {
    try {
        const res = await getAllCanteens();
        canteenList.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取餐厅列表失败:', error);
    }
};

const fetchRoomsByCanteen = async (canteenId) => {
    roomList.value = [];
    reservationForm.roomId = ''; // 清除已选包厢
    if (!canteenId) return;

    roomsLoading.value = true;
    try {
        const res = await getRoomsByCanteenId(canteenId);
        roomList.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取包厢列表失败:', error);
    } finally {
        roomsLoading.value = false;
    }
};

const fetchAllDishes = async () => {
    dishesLoading.value = true;
    try {
        const res = await getAllDishes();
        allAvailableDishes.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取菜品列表失败:', error);
    } finally {
        dishesLoading.value = false;
    }
};

const fetchAllPackages = async () => {
    packagesLoading.value = true;
    try {
        const res = await getAllPackages();
        allAvailablePackages.value = res.data;
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('获取套餐列表失败:', error);
    } finally {
        packagesLoading.value = false;
    }
};

// --- Dish Selector Methods ---
const openDishSelector = () => {
    if (!reservationForm.canteenId) {
        ElMessage.warning('请先选择餐厅才能选择菜品。');
        return;
    }
    showDishSelectorDialog.value = true;
    dishSearchKeyword.value = ''; // 重置搜索关键词
};

const getFilteredDishes = computed(() => {
    let dishes = allAvailableDishes.value;
    if (reservationForm.canteenId) {
        dishes = dishes.filter(dish => dish.canteenId === reservationForm.canteenId);
    }
    if (dishSearchKeyword.value) {
        dishes = dishes.filter(dish =>
            dish.name.toLowerCase().includes(dishSearchKeyword.value.toLowerCase())
        );
    }
    return dishes;
});

const isDishSelected = (dish) => {
    // 检查菜品是否已在 selectedDishItems 中
    return reservationForm.selectedDishItems.some(item => item.dishId === dish.dishId);
};

const toggleDishSelection = (dish) => {
    const existingItem = reservationForm.selectedDishItems.find(item => item.dishId === dish.dishId);

    currentSelectedDishForQuantity.value = dish; // 存储完整的菜品对象
    quantityDialogDishName.value = dish.name;

    if (existingItem) {
        // 菜品已选，预填充现有数量
        currentDishQuantity.value = existingItem.quantity;
    } else {
        // 菜品未选，默认数量为1
        currentDishQuantity.value = 1;
    }
    showQuantityDialog.value = true; // 打开数量选择弹框
};

const handleQuantityConfirm = () => {
    const dish = currentSelectedDishForQuantity.value;
    const quantity = currentDishQuantity.value;

    if (quantity <= 0) {
        // 如果数量为0或更少，则移除该菜品项
        removeDish(dish);
        showQuantityDialog.value = false;
        return;
    }

    const existingItemIndex = reservationForm.selectedDishItems.findIndex(item => item.dishId === dish.dishId);

    if (existingItemIndex > -1) {
        // 更新现有菜品项的数量
        reservationForm.selectedDishItems[existingItemIndex].quantity = quantity;
    } else {
        // 添加新的菜品项
        reservationForm.selectedDishItems.push({ dishId: dish.dishId, quantity: quantity });
    }
    showQuantityDialog.value = false; // 关闭数量选择弹框
};

const removeDish = (dishToRemove) => {
    const itemIndex = reservationForm.selectedDishItems.findIndex(item => item.dishId === dishToRemove.dishId);
    if (itemIndex > -1) {
        reservationForm.selectedDishItems.splice(itemIndex, 1);
    }
    // selectedDishesForDisplay 是计算属性，无需手动修改
};

// --- Package Selector Methods ---
const openPackageSelector = () => {
    if (!reservationForm.canteenId) {
        ElMessage.warning('请先选择餐厅才能选择套餐。');
        return;
    }
    showPackageSelectorDialog.value = true;
    packageSearchKeyword.value = ''; // Reset search
};

const getFilteredPackages = computed(() => {
    let packages = allAvailablePackages.value;
    if (reservationForm.canteenId) {
        packages = packages.filter(pkg => pkg.canteenId === reservationForm.canteenId);
    }
    if (packageSearchKeyword.value) {
        packages = packages.filter(pkg =>
            pkg.name.toLowerCase().includes(packageSearchKeyword.value.toLowerCase())
        );
    }
    return packages;
});

const isPackageSelected = (pkg) => {
    return reservationForm.selectedPackageIds.includes(pkg.packageId);
};

const togglePackageSelection = (pkg) => {
    const idIndex = reservationForm.selectedPackageIds.indexOf(pkg.packageId);
    const displayIndex = reservationForm.selectedPackagesForDisplay.findIndex(p => p.packageId === pkg.packageId);

    if (idIndex > -1) {
        // Remove package
        reservationForm.selectedPackageIds.splice(idIndex, 1);
        if (displayIndex > -1) reservationForm.selectedPackagesForDisplay.splice(displayIndex, 1);
    } else {
        // Add package
        reservationForm.selectedPackageIds.push(pkg.packageId);
        reservationForm.selectedPackagesForDisplay.push({ ...pkg });
    }
};

const removePackage = (pkg) => {
    togglePackageSelection(pkg); // Reuse toggle logic for removal
};

// --- Form Submission ---
const submitReservation = async () => {
    if (!reservationFormRef.value) return;

    try {
        await reservationFormRef.value.validate(); // Validate all form fields
        submitting.value = true;

        // 构建 API 请求的 payload
        const payload = {
            canteenId: reservationForm.canteenId,
            roomId: reservationForm.roomId,
            eventDate: reservationForm.eventDate,
            eventTime: reservationForm.eventTime,
            numberOfGuests: reservationForm.numberOfGuests,
            contactName: reservationForm.contactName,
            contactPhoneNumber: reservationForm.contactPhoneNumber,
            purpose: reservationForm.purpose,
            selectedDishItems: reservationForm.selectedDishItems, // 直接使用已包含数量的数组
            selectedPackageIds: reservationForm.selectedPackageIds,
            hasBirthdayCake: reservationForm.hasBirthdayCake,
            customMenuRequest: reservationForm.customMenuRequest,
            specialRequests: reservationForm.specialRequests,
            totalPrice: calculatedTotalPrice.value, // 新增：将计算后的总价发送给后端
        };

        // 调用 API
        await createBanquet(payload);
        ElMessage.success('宴会预定成功！');
        resetForm(); // 成功提交后重置表单
    } catch (error) {
        ElMessage.error(getErrorMessage(error));
        console.error('宴会预定失败:', error);
    } finally {
        submitting.value = false;
    }
};

const resetForm = () => {
    reservationFormRef.value?.resetFields();
    // 手动清除未被 resetFields 覆盖或需要特定清除的字段
    Object.assign(reservationForm, {
        canteenId: '',
        roomId: '',
        eventDate: '',
        eventTime: '',
        numberOfGuests: 1,
        contactName: '',
        contactPhoneNumber: '',
        purpose: '',
        selectedDishItems: [], // 清除菜品项
        selectedPackageIds: [],
        hasBirthdayCake: false,
        customMenuRequest: '',
        specialRequests: '',
        selectedPackagesForDisplay: [],
        totalPrice: 0, // 重置总价
    });
    roomList.value = []; // 重置餐厅时清除包厢列表
};

// --- Watchers ---
// 监听餐厅选择变化以获取包厢
watch(() => reservationForm.canteenId, (newCanteenId) => {
    fetchRoomsByCanteen(newCanteenId);
    // 餐厅改变时，清除已选菜品和套餐，因为它们可能不再适用于新餐厅
    reservationForm.selectedDishItems = []; // 清除菜品项
    reservationForm.selectedPackageIds = [];
    reservationForm.selectedPackagesForDisplay = [];
});

// --- Lifecycle Hooks ---
onMounted(async () => {
    await fetchCanteens();
    await fetchAllDishes();
    await fetchAllPackages();
    // 设置默认日期为今天
    reservationForm.eventDate = new Date().toISOString().slice(0, 10);
});
</script>

<style scoped>
.banquet-reservation-container {
    margin: 0 auto;
    padding: 20px;
    padding-bottom: 50px; /* 增加底部空隙 */
    max-width: 900px; /* Adjusted max-width for better form layout */
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

.reservation-form-card {
    border-radius: 12px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    /* 移除此处的 padding，将控制权交给 form-scroll-content 和 card-header */
    /* padding: 20px; */
}

/* 覆盖 Element Plus 默认的 el-card__header 和 el-card__body 样式 */
:deep(.el-card__header) {
    padding: 0 !important; /* 移除默认内边距 */
}

:deep(.el-card__body) {
    padding: 0 !important; /* 移除默认内边距 */
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    /* 移除 margin-bottom: 15px; */
    margin-bottom: 0;
    padding: 15px 20px; /* 为表头内容添加内边距 */
}

/* 新增样式：用于可滚动表单内容的容器 */
.form-scroll-content {
    max-height: calc(100vh - 280px); /* 调整最大高度以适应视图 */
    overflow-y: auto; /* 垂直滚动条 */
    padding: 20px; /* 为表单内容添加内边距 */
}

/* 自定义滚动条样式 */
.form-scroll-content::-webkit-scrollbar {
    width: 6px;
}

.form-scroll-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.form-scroll-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.form-scroll-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.menu-selection-area {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%; /* Ensure it takes full width of form item */
    padding: 15px;
    border: 1px dashed #dcdfe6; /* Light border */
    border-radius: 8px;
    background-color: #fcfcfc;
}

.selected-items-display h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #303133;
    font-size: 14px;
}

.selected-tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 32px; /* Ensure some height even if no tags */
    align-items: center;
    margin-bottom: 10px;
}

.el-tag {
    margin-right: 4px; /* Consistent tag spacing */
    margin-bottom: 4px;
}

.no-selection-text {
    color: #909399;
    font-size: 13px;
}

.el-divider {
    margin: 15px 0;
}

/* Selector Dialogs */
.dish-selector-content, .package-selector-content {
    max-height: 450px; /* Limit height of scrollable content */
    overflow-y: auto;
    padding-right: 10px; /* Space for scrollbar */
}

.dish-grid, .package-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
}

.dish-item, .package-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.dish-item:hover, .package-item:hover {
    border-color: #409EFF;
    background: #ecf5ff;
}

.dish-item.selected, .package-item.selected {
    border-color: #409EFF;
    background: #e0f2fe;
}

.dish-info h4, .package-info h4 {
    margin: 0 0 4px 0;
    font-size: 15px;
    color: #1f2937;
}

.dish-price, .package-price {
    color: #f59e0b;
    font-weight: 600;
    margin: 0 0 4px 0;
    font-size: 13px;
}

.dish-desc, .package-desc {
    color: #6b7280;
    font-size: 12px;
    margin: 0;
    line-height: 1.4;
}

.selected-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    color: #409EFF;
    font-size: 18px;
}

.included-dishes {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
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
    .el-col {
        flex: 0 0 100%; /* Make columns full width on small screens */
        max-width: 100%;
    }

    .page-header h2 {
        font-size: 24px;
    }

    .card-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .menu-selection-area {
        padding: 10px;
    }

    .dish-grid, .package-grid {
        grid-template-columns: 1fr;
    }
    .form-scroll-content {
        max-height: calc(100vh - 200px); /* Adjust for smaller screens */
    }
}

.total-price-display {
    font-size: 18px;
    font-weight: bold;
    color: #f59e0b; /* Orange color for price */
}

.base-fee-display {
    font-size: 16px;
    font-weight: bold;
    color: #34d399; /* Green color for base fee */
}
</style>
