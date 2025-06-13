<template>
    <div class="register-page">
        <el-card class="register-card" shadow="hover">
            <template #header>
                <div class="register-header">
                    <div class="logo">
                        <div class="logo-icon">✨</div> <!-- Changed icon for registration -->
                        <h1>用户注册</h1>
                    </div>
                    <p class="welcome-text">创建您的账户，开始使用餐饮管理系统</p>
                </div>
            </template>

            <el-form
                    ref="registerFormRef"
                    :model="registerForm"
                    :rules="registerRules"
                    @submit.prevent="handleRegister"
                    class="register-form"
                    size="large"
                    status-icon
            >
                <el-form-item prop="username">
                    <el-input
                            v-model="registerForm.username"
                            placeholder="请输入用户名(至少3位)"
                            :prefix-icon="User"
                            clearable
                            @keyup.enter="handleRegister"
                    />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input
                            v-model="registerForm.password"
                            type="password"
                            placeholder="请输入密码"
                            :prefix-icon="Lock"
                            show-password
                            clearable
                            @keyup.enter="handleRegister"
                    />
                </el-form-item>

                <el-form-item prop="confirmPassword">
                    <el-input
                            v-model="registerForm.confirmPassword"
                            type="password"
                            placeholder="请再次输入密码"
                            :prefix-icon="Lock"
                            show-password
                            clearable
                            @keyup.enter="handleRegister"
                    />
                </el-form-item>

                <el-form-item prop="email">
                    <el-input
                            v-model="registerForm.email"
                            placeholder="请输入邮箱"
                            :prefix-icon="Message"
                            clearable
                            @keyup.enter="handleRegister"
                    />
                </el-form-item>

                <el-form-item prop="phoneNumber">
                    <el-input
                            v-model="registerForm.phoneNumber"
                            placeholder="请输入手机号"
                            :prefix-icon="Phone"
                            clearable
                            @keyup.enter="handleRegister"
                    />
                </el-form-item>

                <el-form-item>
                    <el-button
                            type="primary"
                            class="register-button-submit"
                            :loading="isLoading"
                            :disabled="isLoading"
                            @click="handleRegister"
                            size="large"
                    >
                        <el-icon v-if="!isLoading" class="register-icon">
                            <Right />
                        </el-icon>
                        {{ isLoading ? '注册中...' : '立即注册' }}
                    </el-button>
                </el-form-item>

                <el-form-item>
                    <el-button
                            type="info"
                            class="go-to-login-button"
                            @click="goToLogin"
                            size="large"
                    >
                        返回登录
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="register-footer">
                <p class="help-text">
                    注册遇到问题？请联系系统管理员
                </p>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import {registerUser} from "@/services/api.js";
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { User, Lock, Message, Phone, Right } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const registerFormRef = ref()
const isLoading = ref(false)

// Form data
const registerForm = reactive({
    username: '',
    password: '',
    confirmPassword: '', // Added for password confirmation
    email: '',
    phoneNumber: '',
    role: 'DINER' // Default role for registration
})

// Custom validation for password confirmation
const validateConfirmPassword = (rule, value, callback) => {
    if (value === '') {
        callback(new Error('请再次输入密码'))
    } else if (value !== registerForm.password) {
        callback(new Error('两次输入的密码不一致!'))
    } else {
        callback()
    }
}

// Form validation rules
const registerRules = reactive({
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少6个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, validator: validateConfirmPassword, trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
    ],
    phoneNumber: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ]
})

// Handle registration
const handleRegister = async () => {
    if (!registerFormRef.value) return

    try {
        const valid = await registerFormRef.value.validate()
        if (!valid) return

        isLoading.value = true

        // Prepare payload for API call
        const payload = {
            username: registerForm.username,
            password: registerForm.password,
            email: registerForm.email,
            phoneNumber: registerForm.phoneNumber,
            role: registerForm.role // 'user' by default
        }

        // Call the registration API
        const res = await registerUser(payload);

        ElNotification({
            title: '注册成功',
            message: `欢迎您，${res.data?.username || registerForm.username}！请返回登录页面。`,
            type: 'success',
            duration: 3000
        })

        // Delay navigation to let the user see the success message
        setTimeout(() => {
            router.push('/login') // Navigate to login page after successful registration
        }, 500)

    } catch (error) {
        console.error('注册错误:', error)

        let errorMessage = '注册失败，请稍后重试'

        if (error.response) {
            switch (error.response.status) {
                case 409: // Conflict, e.g., username or email already exists
                    errorMessage = '用户名或邮箱已被注册'
                    break
                case 400: // Bad Request, e.g., validation errors from backend
                    errorMessage = error.response.data?.message || '请求参数错误'
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

// Navigate to login page
const goToLogin = () => {
    router.push('/login')
}

// On component mount, check if already logged in and redirect if necessary
onMounted(() => {
    const token = localStorage.getItem('token')
    if (token) {
        router.push('/dashboard') // Redirect if user is already authenticated
    }
})
</script>

<style scoped>
/* Base page styling, same as login page */
.register-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    position: relative;
    width: 100%;
}

.register-page::before {
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

/* Card styling, same as login card */
.register-card {
    width: min(85vw, 800px);
    min-width: 420px;
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

.register-card :deep(.el-card__header) {
    padding: 3rem 3rem 2rem;
    background: transparent;
    color: #2c3e50;
    border-bottom: none;
    text-align: center;
}

.register-card :deep(.el-card__body) {
    padding: 0 3rem 3rem;
}

/* Header styling, same as login header */
.register-header {
    text-align: center;
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.logo-icon {
    font-size: 3.2rem;
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
    font-size: 2.2rem;
    color: #2c3e50;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.welcome-text {
    color: #7f8c8d;
    font-size: 1.1rem;
    margin: 0.8rem 0 0;
    font-weight: 400;
}

/* Form styling, now matching login form input styles */
.register-form {
    margin-top: 2rem;
}

.register-form :deep(.el-form-item) {
    margin-bottom: 1.5rem; /* Adjusted margin-bottom to make form more compact */
}

.register-form :deep(.el-form-item__label) {
    color: #7f8c8d;
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
}

.register-form :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    background: rgba(255,255,255,0.8);
    padding: 0.2rem 0.2rem; /* Adjusted padding to be smaller */
}

.register-form :deep(.el-input__inner) {
    color: #2c3e50;
    font-size: 0.95rem; /* Adjusted font-size to be smaller */
}

.register-form :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 4px 12px rgba(66, 185, 131, 0.15);
}

.register-form :deep(.el-input__wrapper.is-focus .el-input__prefix) {
    color: #42b983;
}

.register-form :deep(.el-input.is-active .el-input__inner),
.register-form :deep(.el-input__inner:focus) {
    border-color: #42b983; /* Ensure border color changes on focus */
}

/* Submit Button styling, matches login button */
.register-button-submit {
    width: 100%;
    height: 56px; /* Matches login button height */
    border-radius: 12px;
    font-size: 1.1rem; /* Matches login button font size */
    font-weight: 600;
    background: linear-gradient(135deg, #42b983, #2d8f5f);
    border: none;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    color: white;
    margin-top: 0.5rem;
    box-shadow: 0 4px 6px rgba(66, 185, 131, 0.2);
}

.register-button-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(66, 185, 131, 0.3);
    background: linear-gradient(135deg, #3aa876, #267a52);
}

.register-button-submit:active {
    transform: translateY(0);
}

.register-icon {
    font-size: 1.3rem;
}

/* Go to Login Button styling, matches the register button on login page */
.go-to-login-button {
    width: 100%;
    height: 56px; /* Matches login page's register button height */
    border-radius: 12px;
    font-size: 1.1rem; /* Matches login page's register button font size */
    font-weight: 600;
    background: #f0f2f5;
    color: #2c3e50;
    border: 1px solid #dcdfe6;
    transition: all 0.3s ease;
    margin-top: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.go-to-login-button:hover {
    background: #e0e6ed;
    border-color: #c0c4cc;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.go-to-login-button:active {
    transform: translateY(0);
}

/* Footer styling, same as login footer */
.register-footer {
    text-align: center;
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(0,0,0,0.05);
}

.help-text {
    color: #95a5a6;
    font-size: 1rem;
    margin: 0 0 1rem;
}

/* Page load animation, same as login page */
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

/* Responsive design optimization */
@media (max-width: 768px) {
    .register-page {
        padding: 1.5rem;
    }

    .register-card {
        width: 90vw;
        min-width: 350px;
    }

    .register-card :deep(.el-card__header) {
        padding: 2rem 2rem 1.5rem;
    }

    .register-card :deep(.el-card__body) {
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
    .register-page {
        padding: 1rem;
    }

    .register-card {
        width: 95vw;
        min-width: 300px;
    }

    .register-card :deep(.el-card__header) {
        padding: 1.8rem 1.5rem 1rem;
    }

    .register-card :deep(.el-card__body) {
        padding: 1.5rem;
    }

    h1 {
        font-size: 1.6rem;
    }

    .logo-icon {
        font-size: 2.2rem;
    }

    /* Keep buttons consistent on mobile too */
    .register-button-submit,
    .go-to-login-button {
        height: 50px;
        font-size: 1rem;
    }
}
</style>
