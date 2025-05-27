<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="login-header">
          <div class="logo">
            <div class="logo-icon">🍽️</div>
            <h1>餐饮管理系统</h1>
          </div>
          <p class="welcome-text">欢迎回来，请登录您的账户</p>
        </div>
      </template>

      <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
          class="login-form"
          size="large"
          status-icon
      >
        <el-form-item prop="usernameOrEmail">
          <el-input
              v-model="loginForm.usernameOrEmail"
              placeholder="请输入用户名或邮箱"
              :prefix-icon="User"
              clearable
              @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe" class="remember-checkbox">
            记住登录状态
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              class="login-button"
              :loading="isLoading"
              :disabled="isLoading"
              @click="handleLogin"
              size="large"
          >
            <el-icon v-if="!isLoading" class="login-icon">
              <Right />
            </el-icon>
            {{ isLoading ? '登录中...' : '立即登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p class="help-text">
          遇到问题？请联系系统管理员
        </p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { User, Lock, Right } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const loginFormRef = ref()
const isLoading = ref(false)
const rememberMe = ref(false)

// 表单数据
const loginForm = reactive({
  usernameOrEmail: '',
  password: ''
})

// 表单验证规则
const loginRules = reactive({
  usernameOrEmail: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
})

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    isLoading.value = true

    const res = await axios.post('http://localhost:18081/api/auth/login', {
      usernameOrEmail: loginForm.usernameOrEmail,
      password: loginForm.password
    })

    const { token, user } = res.data

    // 保存 token
    localStorage.setItem('token', token)

    // 如果选择记住登录状态，设置更长的过期时间
    if (rememberMe.value) {
      localStorage.setItem('rememberLogin', 'true')
    }

    // 保存用户信息（可选）
    if (user) {
      localStorage.setItem('userInfo', JSON.stringify(user))
    }

    // 显示成功消息
    ElNotification({
      title: '登录成功',
      message: `欢迎回来，${user?.username || '用户'}！`,
      type: 'success',
      duration: 3000
    })

    // 获取重定向路径，如果没有则跳转到默认页面
    const redirectPath = route.query.redirect || '/dashboard'

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push(redirectPath)
    }, 500)

  } catch (error) {
    console.error('登录错误:', error)

    let errorMessage = '登录失败，请稍后重试'

    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = '用户名或密码错误'
          break
        case 403:
          errorMessage = '账户已被禁用，请联系管理员'
          break
        case 429:
          errorMessage = '登录尝试过于频繁，请稍后再试'
          break
        case 500:
          errorMessage = '服务器错误，请联系技术支持'
          break
        default:
          errorMessage = error.response.data?.message || errorMessage
      }
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络设置'
    }

    ElMessage.error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

// 页面加载时检查是否已登录
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    // 如果已经登录，直接跳转
    router.push('/dashboard')
  }

  // 恢复记住登录状态的设置
  const remembered = localStorage.getItem('rememberLogin')
  if (remembered === 'true') {
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  width: 100%;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background:
      radial-gradient(circle at 70% 30%, rgba(255,255,255,0.8) 0%, transparent 20%),
      radial-gradient(circle at 30% 70%, rgba(255,255,255,0.6) 0%, transparent 20%);
  animation: grain 8s steps(10) infinite;
  pointer-events: none;
}

@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, -35%); }
  90% { transform: translate(-10%, 10%); }
}

.login-card {
  width: min(85vw, 800px); /* 增加最大宽度到650px */
  min-width: 420px; /* 增加最小宽度到420px */
  border-radius: 20px;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out;
  position: relative;
  z-index: 1;
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(255,255,255,0.3);
}

.login-card :deep() {
  padding: 3rem 3rem 2rem; /* 增加内边距 */
  background: transparent;
  color: #2c3e50;
  border-bottom: none;
  text-align: center;
}

.login-card :deep() {
  padding: 2.5rem 3rem 3rem; /* 增加内边距 */
}

.login-header {
  text-align: center;
  margin-bottom: 2rem; /* 增加底部边距 */
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem; /* 增加间距 */
  margin-bottom: 1.5rem;
}

.logo-icon {
  font-size: 3.2rem; /* 增加图标大小 */
  color: #42b983;
  animation: float 3s infinite ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

h1 {
  margin: 0;
  font-size: 2.2rem; /* 增加字体大小 */
  color: #2c3e50;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.welcome-text {
  color: #7f8c8d;
  font-size: 1.1rem; /* 增加字体大小 */
  margin: 0.8rem 0 0; /* 增加上边距 */
  font-weight: 400;
}

.login-form {
  margin-top: 2rem; /* 增加顶部边距 */
}

.login-form :deep() {
  margin-bottom: 2rem; /* 增加底部边距 */
}

.login-form :deep() {
  color: #7f8c8d;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}

.login-form :deep() {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.8);
  padding: 1rem 1.2rem; /* 增加内边距 */
}

.login-form :deep() {
  color: #2c3e50;
  font-size: 1rem; /* 增加字体大小 */
}

.login-form :deep() {
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.15);
}

.login-form :deep() {
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.remember-checkbox {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem; /* 增加底部边距 */
}

.remember-checkbox :deep() {
  color: #7f8c8d;
  font-size: 1rem; /* 增加字体大小 */
}


.login-button {
  width: 100%;
  height: 56px; /* 增加按钮高度 */
  border-radius: 12px;
  font-size: 1.1rem; /* 增加字体大小 */
  font-weight: 600;
  background: linear-gradient(135deg, #42b983, #2d8f5f);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem; /* 增加间距 */
  color: white;
  margin-top: 0.5rem;
  box-shadow: 0 4px 6px rgba(66, 185, 131, 0.2);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 185, 131, 0.3);
  background: linear-gradient(135deg, #3aa876, #267a52);
}

.login-button:active {
  transform: translateY(0);
}

.login-icon {
  font-size: 1.3rem; /* 增加图标大小 */
}

.login-footer {
  text-align: center;
  margin-top: 2.5rem; /* 增加顶部边距 */
  padding-top: 2rem; /* 增加顶部内边距 */
  border-top: 1px solid rgba(0,0,0,0.05);
}

.help-text {
  color: #95a5a6;
  font-size: 1rem; /* 增加字体大小 */
  margin: 0 0 1rem;
}



/* 页面加载动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 优化响应式设计 */
@media (max-width: 768px) {
  .login-page {
    padding: 1.5rem;
  }

  .login-card {
    width: 90vw;
    min-width: 350px; /* 调整移动端最小宽度 */
  }

  .login-card :deep() {
    padding: 2rem 2rem 1.5rem;
  }

  .login-card :deep() {
    padding: 2rem;
  }

  h1 {
    font-size: 1.8rem;
  }

  .logo-icon {
    font-size: 2.6rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
  }

  .login-card {
    width: 95vw;
    min-width: 300px; /* 进一步调整最小宽度 */
  }

  .login-card :deep() {
    padding: 1.8rem 1.5rem 1rem;
  }

  .login-card :deep() {
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.6rem;
  }

  .logo-icon {
    font-size: 2.2rem;
  }

  .login-form :deep() {
    padding: 0.8rem 1rem;
  }

  .login-button {
    height: 50px;
    font-size: 1rem;
  }
}</style>