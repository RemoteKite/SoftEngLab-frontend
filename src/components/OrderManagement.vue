<template>
  <div class="order-management-content">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-controls">
        <el-button type="primary" @click="exportOrders">
          <el-icon><Download /></el-icon> 导出数据
        </el-button>
      </div>
    </div>

    <el-card class="order-table-card">
      <template #header>
        <div class="card-header">
          <h3>订单列表</h3>
          <div class="filter-controls">
            <el-input
                v-model="orderIdFilter"
                placeholder="搜索订单ID"
                prefix-icon="Search"
                clearable
                style="width: 200px; margin-right: 12px;"
            />
            <el-select
                v-model="statusFilter"
                placeholder="订单状态"
                clearable
                style="width: 150px; margin-right: 12px;"
            >
              <el-option
                  v-for="status in orderStatusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
              />
            </el-select>
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 300px; margin-right: 12px;"
            />
            <el-button type="primary" @click="fetchOrders" :icon="Search">搜索</el-button>
            <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
          </div>
        </div>
      </template>

      <el-table
          :data="orders"
          style="width: 100%"
          v-loading="loading"
          max-height="600"
          @sort-change="handleSortChange"
      >
        <el-table-column prop="orderId" label="订单ID" width="120" sortable="custom" fixed="left"></el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" sortable="custom">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="canteenName" label="餐厅" width="150"></el-table-column>
        <el-table-column prop="userName" label="用户" width="150"></el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="120" sortable="custom">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120"></el-table-column>
        <el-table-column prop="reservationTime" label="预定时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.reservationTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewOrderDetails(scope.row)">详情</el-button>
            <el-button
                v-if="scope.row.status === 'pending'"
                size="small"
                type="success"
                @click="updateStatus(scope.row.orderId, 'processing')"
            >
              接单
            </el-button>
            <el-button
                v-if="scope.row.status === 'processing'"
                size="small"
                type="primary"
                @click="updateStatus(scope.row.orderId, 'completed')"
            >
              完成
            </el-button>
            <el-button
                v-if="scope.row.status === 'pending'"
                size="small"
                type="danger"
                @click="cancelOrder(scope.row.orderId)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalOrders"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
        v-model="showDetailDialog"
        :title="'订单详情 - ' + currentOrder.orderId"
        width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单ID">{{ currentOrder.orderId }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="餐厅">{{ currentOrder.canteenName }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.userName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.userPhone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ currentOrder.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="预定时间">{{ formatDateTime(currentOrder.reservationTime) }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentOrder.totalAmount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remarks || '无' }}</el-descriptions-item>

        <el-descriptions-item label="菜品列表" :span="2">
          <div class="order-items-list">
            <div v-for="item in currentOrder.items" :key="item.dishId" class="order-item">
              <div class="item-image">

              </div>
              <div class="item-info">
                <div class="item-name">{{ item.dishName }}</div>
                <div class="item-price">¥{{ item.priceAtOrder.toFixed(2) }} × {{ item.quantity }}</div>
              </div>
              <div class="item-total">¥{{ (item.priceAtOrder * item.quantity).toFixed(2) }}</div>
            </div>
            <div class="order-total">
              <span>合计：</span>
              <span>¥{{ currentOrder.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { getAllOrders, getOrderById, updateOrderStatus, cancelOrder } from '@/services/api.js'

// 订单状态选项
const orderStatusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

// 响应式数据
const loading = ref(false)
const orders = ref([])
const orderIdFilter = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalOrders = ref(0)
const sortField = ref('createTime')
const sortOrder = ref('descending')
const showDetailDialog = ref(false)
const currentOrder = reactive({
  orderId: '',
  createTime: '',
  canteenName: '',
  userName: '',
  userPhone: '',
  status: '',
  totalAmount: 0,
  paymentMethod: '',
  reservationTime: '',
  remarks: '',
  items: []
})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      orderId: orderIdFilter.value,
      status: statusFilter.value,
      startDate: dateRange.value ? dateRange.value[0] : '',
      endDate: dateRange.value ? dateRange.value[1] : '',
      sort: sortField.value,
      order: sortOrder.value === 'descending' ? 'desc' : 'asc'
    }

    const response = await getAllOrders(params)
    orders.value = response.data.content
    totalOrders.value = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取订单列表失败: ' + error.message)
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  orderIdFilter.value = ''
  statusFilter.value = ''
  dateRange.value = []
  currentPage.value = 1
  sortField.value = 'createTime'
  sortOrder.value = 'descending'
  fetchOrders()
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  fetchOrders()
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  sortField.value = prop
  sortOrder.value = order
  fetchOrders()
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return ''
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  const option = orderStatusOptions.find(opt => opt.value === status)
  return option ? option.label : status
}

// 查看订单详情
const viewOrderDetails = async (order) => {
  try {
    const response = await getOrderById(order.orderId)
    Object.assign(currentOrder, response.data)
    showDetailDialog.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败: ' + error.message)
    console.error(error)
  }
}

// 更新订单状态
const updateStatus = async (orderId, status) => {
  try {
    await updateOrderStatus(orderId, status)
    ElMessage.success('订单状态更新成功')
    fetchOrders()
  } catch (error) {
    ElMessage.error('更新订单状态失败: ' + error.message)
    console.error(error)
  }
}

// 取消订单
const cancelSelectedOrder = async (orderId) => {
  try {
    await ElMessageBox.confirm('确定要取消此订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelOrder(orderId)
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消订单失败: ' + error.message)
      console.error(error)
    }
  }
}

// 导出订单数据
const exportOrders = async () => {
  try {
    // 实际项目中这里会调用导出API
    ElMessage.info('导出功能正在准备数据...')
    // 模拟导出延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    ElMessage.success('订单数据已导出')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 生命周期钩子
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-management-content {
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  color: #1f2937;
  margin: 0;
  font-weight: 600;
}

.order-table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.filter-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.order-items-list {
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.item-image {
  width: 50px;
  height: 50px;
  margin-right: 15px;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.item-info {
  flex-grow: 1;
}

.item-name {
  font-weight: 500;
  margin-bottom: 5px;
}

.item-price {
  font-size: 14px;
  color: #666;
}

.item-total {
  font-weight: bold;
  min-width: 70px;
  text-align: right;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
  font-weight: bold;
  font-size: 16px;
  border-top: 1px solid #eee;
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-controls {
    width: 100%;
    margin-top: 10px;
  }

  .filter-controls > * {
    flex: 1;
    margin-bottom: 10px;
  }

  .el-date-picker {
    width: 100% !important;
  }
}
</style>