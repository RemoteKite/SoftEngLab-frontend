<template>
  <div class="banquet-booking-content">
    <div class="page-header">
      <h2>宴会预定管理</h2>
      <div class="booking-steps">
        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step title="选择宴会厅" description="挑选适合您的场地" />
          <el-step title="选择时间" description="确定日期和时间段" />
          <el-step title="填写信息" description="提供预定详情" />
          <el-step title="确认预定" description="完成预定流程" />
        </el-steps>
      </div>
    </div>

    <div class="booking-container">
      <!-- 步骤1: 选择宴会厅 -->
      <div v-show="activeStep === 0" class="step-content banquet-selection">
        <div class="section-header">
          <h3>选择宴会厅</h3>
          <el-input
              v-model="hallSearch"
              placeholder="搜索宴会厅名称"
              prefix-icon="Search"
              clearable
              style="width: 300px;"
          />
        </div>

        <div class="hall-grid">
          <div v-for="hall in filteredHalls" :key="hall.id" class="hall-card">
            <div class="hall-image">
              <el-skeleton :loading="!hallImagesLoaded[hall.id]" animated>
                <template #template>
                  <el-skeleton-item variant="image" style="width: 100%; height: 200px;" />
                </template>
                <el-image
                    :src="hall.imageUrl"
                    fit="cover"
                    style="width: 100%; height: 200px;"
                    @load="hallImagesLoaded[hall.id] = true"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
              </el-skeleton>
            </div>
            <div class="hall-info">
              <div class="hall-header">
                <h4>{{ hall.name }}</h4>
                <el-tag type="success" size="small">可容纳 {{ hall.capacity }} 人</el-tag>
              </div>
              <div class="hall-features">
                <div class="feature-item" v-for="feature in hall.features" :key="feature">
                  <el-icon><Check /></el-icon>
                  <span>{{ feature }}</span>
                </div>
              </div>
              <div class="hall-pricing">
                <div>
                  <span class="price-label">平日价格:</span>
                  <span class="price-value">¥{{ hall.weekdayPrice }}</span>
                </div>
                <div>
                  <span class="price-label">周末价格:</span>
                  <span class="price-value">¥{{ hall.weekendPrice }}</span>
                </div>
              </div>
              <div class="hall-description">{{ hall.description }}</div>
            </div>
            <div class="hall-actions">
              <el-button type="primary" @click="selectHall(hall)">选择此宴会厅</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 选择时间 -->
      <div v-show="activeStep === 1" class="step-content time-selection">
        <div class="section-header">
          <h3>选择预定时间</h3>
          <div class="date-picker-wrapper">
            <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择日期"
                :disabled-date="disabledDate"
                @change="loadDateAvailability"
            />
          </div>
        </div>

        <div v-if="selectedDate" class="availability-container">
          <div class="date-info">
            <h4>{{ formatDate(selectedDate) }} 可用时间段</h4>
            <div class="date-note">
              <el-tag type="info">预定规则: 每场宴会时长 {{ bookingDuration }} 小时</el-tag>
            </div>
          </div>

          <div class="time-slots">
            <div
                v-for="slot in availableSlots"
                :key="slot.startTime"
                class="time-slot"
                :class="{
                'selected': selectedSlot && slot.startTime === selectedSlot.startTime,
                'disabled': slot.status !== 'available'
              }"
                @click="selectSlot(slot)"
            >
              <div class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</div>
              <div class="slot-status" :class="slot.status">
                {{ getStatusText(slot.status) }}
              </div>
              <div class="slot-price">
                {{ slot.priceType === 'weekend' ? '周末价' : '平日价' }}: ¥{{ slot.price }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-date-selected">
          <el-icon class="date-icon"><Calendar /></el-icon>
          <p>请先选择日期查看可用时间段</p>
        </div>

        <div class="navigation-buttons">
          <el-button @click="activeStep = 0">返回</el-button>
          <el-button
              type="primary"
              :disabled="!selectedSlot"
              @click="activeStep = 2"
          >下一步</el-button>
        </div>
      </div>

      <!-- 步骤3: 填写信息 -->
      <div v-show="activeStep === 2" class="step-content information-form">
        <div class="section-header">
          <h3>填写预定信息</h3>
          <p>请提供宴会详情和您的联系方式</p>
        </div>

        <div class="booking-summary-card">
          <div class="summary-image">
            <el-image :src="selectedHall.imageUrl" fit="cover" style="width: 100px; height: 100px;" />
          </div>
          <div class="summary-info">
            <h4>{{ selectedHall.name }}</h4>
            <p>日期: {{ formatDate(selectedDate) }}</p>
            <p>时间: {{ selectedSlot.startTime }} - {{ selectedSlot.endTime }}</p>
            <p>场地费用: <strong>¥{{ selectedSlot.price }}</strong></p>
          </div>
        </div>

        <el-form
            ref="bookingForm"
            :model="bookingForm"
            :rules="bookingRules"
            label-width="120px"
            class="booking-form"
        >
          <el-form-item label="宴会主题" prop="eventName">
            <el-input v-model="bookingForm.eventName" placeholder="请输入宴会主题" />
          </el-form-item>

          <el-form-item label="预计人数" prop="attendees">
            <el-input-number
                v-model="bookingForm.attendees"
                :min="selectedHall.minAttendees"
                :max="selectedHall.capacity"
                placeholder="预计参加人数"
            />
          </el-form-item>

          <el-form-item label="联系人姓名" prop="contactName">
            <el-input v-model="bookingForm.contactName" placeholder="请输入联系人姓名" />
          </el-form-item>

          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="bookingForm.contactPhone" placeholder="请输入联系电话" />
          </el-form-item>

          <el-form-item label="电子邮箱" prop="contactEmail">
            <el-input v-model="bookingForm.contactEmail" placeholder="请输入电子邮箱" />
          </el-form-item>

          <el-form-item label="特殊要求" prop="specialRequests">
            <el-input
                v-model="bookingForm.specialRequests"
                type="textarea"
                :rows="3"
                placeholder="例如：需要舞台、音响设备、特殊餐饮需求等"
            />
          </el-form-item>

          <el-form-item label="餐饮服务" prop="cateringRequired">
            <el-radio-group v-model="bookingForm.cateringRequired">
              <el-radio :label="true">需要</el-radio>
              <el-radio :label="false">不需要</el-radio>
            </el-radio-group>
          </el-form-item>

          <div v-if="bookingForm.cateringRequired" class="catering-section">
            <div class="section-title">餐饮选择</div>
            <el-checkbox-group v-model="bookingForm.cateringOptions">
              <el-checkbox label="中式套餐">中式套餐</el-checkbox>
              <el-checkbox label="西式自助">西式自助</el-checkbox>
              <el-checkbox label="饮品吧台">饮品吧台</el-checkbox>
              <el-checkbox label="甜点小吃">甜点小吃</el-checkbox>
            </el-checkbox-group>
            <el-input
                v-model="bookingForm.dietaryRestrictions"
                type="textarea"
                :rows="2"
                placeholder="特殊饮食要求（如素食、过敏食物等）"
                style="margin-top: 15px;"
            />
          </div>
        </el-form>

        <div class="navigation-buttons">
          <el-button @click="activeStep = 1">返回</el-button>
          <el-button type="primary" @click="submitBooking">提交预定</el-button>
        </div>
      </div>

      <!-- 步骤4: 确认预定 -->
      <div v-show="activeStep === 3" class="step-content confirmation">
        <div class="confirmation-success">
          <el-result icon="success" title="预定成功！" sub-title="您的宴会预定已完成">
            <template #extra>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="预定编号">{{ bookingConfirmation.bookingId }}</el-descriptions-item>
                <el-descriptions-item label="宴会厅">{{ selectedHall.name }}</el-descriptions-item>
                <el-descriptions-item label="预定日期">{{ formatDate(selectedDate) }}</el-descriptions-item>
                <el-descriptions-item label="预定时间">{{ selectedSlot.startTime }} - {{ selectedSlot.endTime }}</el-descriptions-item>
                <el-descriptions-item label="宴会主题">{{ bookingForm.eventName }}</el-descriptions-item>
                <el-descriptions-item label="总费用">
                  <span class="total-price">¥{{ bookingConfirmation.totalAmount }}</span>
                </el-descriptions-item>
              </el-descriptions>

              <div class="confirmation-actions">
                <el-button type="primary" @click="downloadConfirmation">下载预定确认单</el-button>
                <el-button @click="backToHome">返回首页</el-button>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Calendar, Picture, Check, View, Edit, Delete, Money, Tickets, Phone, User
} from '@element-plus/icons-vue'
import { getBanquetHalls, getBookingAvailability, createBooking } from '@/services/api.js'

// 响应式数据
const activeStep = ref(0)
const hallSearch = ref('')
const hallImagesLoaded = ref({})
const selectedHall = ref(null)
const selectedDate = ref(null)
const selectedSlot = ref(null)
const availableSlots = ref([])

// 预定表单数据
const bookingForm = reactive({
  eventName: '',
  attendees: 20,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  specialRequests: '',
  cateringRequired: true,
  cateringOptions: [],
  dietaryRestrictions: ''
})

// 预定表单验证规则
const bookingRules = reactive({
  eventName: [{ required: true, message: '请输入宴会主题', trigger: 'blur' }],
  attendees: [
    { required: true, message: '请输入预计人数', trigger: 'blur' },
    { type: 'number', min: 5, message: '人数不能少于5人', trigger: 'change' }
  ],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  contactEmail: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
})

// 确认信息
const bookingConfirmation = reactive({
  bookingId: '',
  bookingDate: '',
  totalAmount: 0
})

// 预定参数
const bookingDuration = 4 // 每场宴会持续时间（小时）
const timeSlots = [
  '09:00-13:00',
  '14:00-18:00',
  '19:00-23:00'
]

// 获取宴会厅列表数据
const banquetHalls = ref([
  {
    id: 1,
    name: '皇家宴会厅',
    description: '豪华大气的宴会场地，配有高级音响和灯光系统，适合大型庆典活动',
    weekdayPrice: 6888,
    weekendPrice: 8888,
    capacity: 200,
    minAttendees: 50,
    features: ['豪华舞台', 'LED大屏', '专业灯光音响', '独立休息区', '无线麦克风', '中央空调'],
    imageUrl: '/imgs/hall1.jpg'
  },
  {
    id: 2,
    name: '水晶宴会厅',
    description: '优雅现代的宴会厅，拥有全景落地窗和精美水晶吊灯，适合高端婚礼和商务活动',
    weekdayPrice: 5888,
    weekendPrice: 7888,
    capacity: 150,
    minAttendees: 30,
    features: ['全景落地窗', '水晶吊灯', '高清投影仪', '独立贵宾室', '专业舞台', '声学设计'],
    imageUrl: '/imgs/hall2.jpg'
  },
  {
    id: 3,
    name: '花园宴会厅',
    description: '自然温馨的宴会场地，拥有独特的花园景观和户外露台，适合小型婚礼和聚会',
    weekdayPrice: 4888,
    weekendPrice: 5888,
    capacity: 100,
    minAttendees: 20,
    features: ['花园景观', '户外露台', '温馨氛围', '定制布置', '自然采光', '私密空间'],
    imageUrl: '/imgs/hall3.jpg'
  },
  {
    id: 4,
    name: '豪华包厢',
    description: '精致私密的宴会包间，适合小型商务宴请和家庭聚会，提供专属服务',
    weekdayPrice: 3888,
    weekendPrice: 4888,
    capacity: 50,
    minAttendees: 10,
    features: ['私密环境', '专属服务', '定制菜单', '高清电视', '卡拉OK系统', '专属入口'],
    imageUrl: '/imgs/hall4.jpg'
  }
])

// 过滤宴会厅列表
const filteredHalls = computed(() => {
  return banquetHalls.value.filter(hall =>
      hall.name.toLowerCase().includes(hallSearch.value.toLowerCase())
  )
})

// 选择宴会厅
const selectHall = (hall) => {
  selectedHall.value = hall
  activeStep.value = 1
  // 重置日期和时间选择
  selectedDate.value = null
  selectedSlot.value = null
  availableSlots.value = []
}

// 日期禁用规则
const disabledDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 过去日期不可选
  if (date < today) return true

  // 只能预定未来90天内
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + 90)
  return date > maxDate
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

// 加载日期可用时间段
const loadDateAvailability = async () => {
  if (!selectedHall.value || !selectedDate.value) return

  try {
    // 这里应调用API获取实际可用时间段
    // const response = await getBookingAvailability({
    //   hallId: selectedHall.value.id,
    //   date: selectedDate.value.toISOString().split('T')[0]
    // })

    // 模拟API响应
    const date = new Date(selectedDate.value)
    const isWeekend = date.getDay() === 6 || date.getDay() === 0
    const basePrice = isWeekend ? selectedHall.value.weekendPrice : selectedHall.value.weekdayPrice

    availableSlots.value = timeSlots.map(slot => {
      const [start, end] = slot.split('-')
      return {
        startTime: start,
        endTime: end,
        price: basePrice,
        priceType: isWeekend ? 'weekend' : 'weekday',
        status: Math.random() > 0.3 ? 'available' : 'booked'
      }
    })

    // 重置选中的时间段
    selectedSlot.value = null

  } catch (error) {
    ElMessage.error('获取可用时间段失败: ' + error.message)
    console.error(error)
  }
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    available: '可预定',
    booked: '已预定',
    unavailable: '不可用'
  }
  return statusMap[status] || status
}

// 选择时间段
const selectSlot = (slot) => {
  if (slot.status !== 'available') return
  selectedSlot.value = slot
}

// 提交预定
const submitBooking = async () => {
  try {
    // 表单验证
    // ...

    // 组织预定数据
    const bookingData = {
      hallId: selectedHall.value.id,
      date: selectedDate.value,
      startTime: selectedSlot.value.startTime,
      endTime: selectedSlot.value.endTime,
      contactInfo: {
        name: bookingForm.contactName,
        phone: bookingForm.contactPhone,
        email: bookingForm.contactEmail
      },
      eventName: bookingForm.eventName,
      attendees: bookingForm.attendees,
      specialRequests: bookingForm.specialRequests,
      cateringRequired: bookingForm.cateringRequired,
      cateringOptions: bookingForm.cateringOptions,
      dietaryRestrictions: bookingForm.dietaryRestrictions,
      totalAmount: selectedSlot.value.price // 实际应计算总价
    }

    // 调用API创建预定
    // const response = await createBooking(bookingData)

    // 模拟API响应
    bookingConfirmation.bookingId = 'BK' + new Date().getTime()
    bookingConfirmation.bookingDate = new Date().toISOString()
    bookingConfirmation.totalAmount = bookingData.totalAmount

    // 进入确认步骤
    activeStep.value = 3

    // 实际应用中应该重置表单
    // ...

  } catch (error) {
    ElMessage.error('预定提交失败: ' + error.message)
    console.error(error)
  }
}

// 下载预定确认单
const downloadConfirmation = () => {
  ElMessage.success('预定确认单已开始下载')
  // 实际应用中应生成并下载PDF
}

// 返回首页
const backToHome = () => {
  // 重置整个预定流程
  activeStep.value = 0
  selectedHall.value = null
  selectedDate.value = null
  selectedSlot.value = null
  // 重置表单数据
  Object.keys(bookingForm).forEach(key => {
    if (Array.isArray(bookingForm[key])) {
      bookingForm[key] = []
    } else if (typeof bookingForm[key] === 'boolean') {
      bookingForm[key] = key === 'cateringRequired'
    } else {
      bookingForm[key] = ''
    }
  })
}

// 组件挂载时加载宴会厅数据
onMounted(async () => {
  try {
    // 实际应用中从API获取数据
    // const response = await getBanquetHalls()
    // banquetHalls.value = response.data
  } catch (error) {
    ElMessage.error('获取宴会厅列表失败: ' + error.message)
    console.error(error)
  }
})
</script>

<style scoped>
.banquet-booking-content {
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 15px;
  font-weight: 600;
  text-align: center;
}

.booking-steps {
  margin-bottom: 30px;
}

.booking-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
  font-weight: 600;
}

/* 宴会厅选择区域 */
.hall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.hall-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.hall-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
}

.hall-info {
  padding: 15px;
}

.hall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.hall-header h4 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.hall-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 4px 8px;
}

.feature-item .el-icon {
  margin-right: 4px;
  color: #67C23A;
}

.hall-pricing {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 15px;
}

.price-label {
  color: #909399;
}

.price-value {
  font-weight: bold;
  color: #E6A23C;
}

.hall-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.hall-actions {
  padding: 15px;
  text-align: center;
  background: #f9fafc;
  border-top: 1px solid #ebeef5;
}

/* 时间选择区域 */
.date-picker-wrapper {
  min-width: 250px;
}

.availability-container {
  margin-top: 20px;
}

.date-info {
  margin-bottom: 20px;
}

.date-info h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.time-slot {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.time-slot:hover {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.time-slot.selected {
  border-color: #409EFF;
  background-color: #ecf5ff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.time-slot.disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  cursor: not-allowed;
  opacity: 0.7;
}

.slot-time {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.slot-status {
  margin-bottom: 8px;
  font-weight: 500;
}

.slot-status.available {
  color: #67C23A;
}

.slot-status.booked {
  color: #F56C6C;
}

.slot-price {
  color: #E6A23C;
  font-weight: 500;
}

.no-date-selected {
  text-align: center;
  padding: 40px 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.date-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 15px;
}

/* 信息填写区域 */
.booking-summary-card {
  display: flex;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  background: #f9fafc;
}

.summary-image {
  margin-right: 20px;
}

.summary-info {
  flex-grow: 1;
}

.summary-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.booking-form {
  max-width: 600px;
  margin: 0 auto;
}

.catering-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.section-title {
  font-weight: 500;
  margin-bottom: 10px;
  color: #606266;
}

/* 导航按钮 */
.navigation-buttons {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  gap: 15px;
}

/* 确认页面 */
.confirmation-success {
  max-width: 800px;
  margin: 0 auto;
}

.total-price {
  font-size: 18px;
  color: #E6A23C;
  font-weight: bold;
}

.confirmation-actions {
  margin-top: 25px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hall-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .section-header > * {
    width: 100%;
  }

  .time-slots {
    grid-template-columns: 1fr;
  }

  .booking-summary-card {
    flex-direction: column;
    text-align: center;
  }

  .summary-image {
    margin-right: 0;
    margin-bottom: 15px;
    display: flex;
    justify-content: center;
  }
}
</style>