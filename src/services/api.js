import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
    baseURL: 'http://localhost:18081/api', // 根据你的后端端口修改
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器
api.interceptors.request.use(
    config => {
        // 在发送请求之前统一加 token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        // 统一错误处理
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                console.error('未登录或token失效，请重新登录');
                // 这里可以做跳转到登录页的操作
                // window.location.href = '/login';
            } else if (status === 403) {
                console.error('无权限访问');
            } else {
                console.error('API Error:', error.response.data.message || error.message);
            }
        } else {
            console.error('API 请求失败:', error.message);
        }
        return Promise.reject(error);
    }
);

// 食堂管理相关 API
export const getAllCanteens = () => {
    return api.get('/canteens');
};

export const getCanteenById = (id) => {
    return api.get(`/canteens/${id}`);
};

export const createCanteen = (formData) => {
    return api.post('/canteens', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const updateCanteen = (id, formData) => {
    return api.put(`/canteens/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const deleteCanteen = (id) => {
    return api.delete(`/canteens/${id}`);
};

export default api;
