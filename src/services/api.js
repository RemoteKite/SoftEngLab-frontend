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

// 菜品管理相关 API
export const getAllDishes = () => {
    return api.get('/dishes/all');
};

export const getDishById = (id) => {
    return api.get(`/dishes/${id}`);
}

export const createDish = (formData) => {
    return api.post('/dishes', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const getDishesByCanteenId = (id) => {
    return api.get(`/dishes/canteen/${id}`);
}

export const updateDish = (id, formData) => {
    return api.put(`/dishes/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const deleteDish = (id) => {
    return api.delete(`/dishes/${id}`);
}

//TODO 菜品过滤功能
export const filterDishes = (params) => {
    return api.post('/dishes/filter', params);
};

// 菜谱管理相关 API
export const publishDailyMenu = (params) => {
    return api.post('/menu', params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const getDailyMenusByCanteenAndDate = (id,date) => {
    return api.get(`/menu/canteen/${id}/${date}`);
}

export const getDailyMenuById = (id) => {
    return api.get(`/menu/${id}`);
}

export const getAllDailyMenus = () => {
    return api.get('/menu/all');
}

export const updateDailyMenu =(id,params) => {
    return api.put(`/menu/${id}`, params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export const deleteDailyMenu = (id) => {
    return api.delete(`/menu/${id}`);
}

//Canteen Image
export const createCanteenImage = (id,formData) => {
    return api.post(`canteen-images/canteen/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const getCanteenImageById = (id) => {
    return api.get(`/canteen-images/${id}`);
};

export const getCanteenImageByCanteen = (id) => {
    return api.get(`/canteen-images/canteen/${id}`);
}

export const deleteCanteenImage = (id) => {
    return api.delete(`/canteen-images/${id}`);
};

export const updateCanteenImageDescription = (id, params) => {
    return api.put(`/canteen-images/${id}/description`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

//注册功能
export const registerUser = (params) => {
    return api.post('/auth/register', params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

//用户管理
export const showAllUsers = () => {
    return api.get('/users');
};

export const getAllDietaryTags = () => {
    return api.get('/dietary-tags');
};

export const createDietaryTag = (params) => {
    return api.post('/dietary-tags', params);
};

export const getDietaryTagById = (id) => {
    return api.get(`/dietary-tags/${id}`);
};

export const updateDietaryTag = (id, params) => {
    return api.put(`/dietary-tags/${id}`, params);
};

export const deleteDietaryTag = (id) => {
    return api.delete(`/dietary-tags/${id}`);
};
export const getAllAllergens = () => {
    return api.get('/allergens');
};

export const createAllergen = (params) => {
    return api.post('/allergens', params);
};

export const getAllergenById = (id) => {
    return api.get(`/allergens/${id}`);
};

export const updateAllergen = (id, params) => {
    return api.put(`/allergens/${id}`, params);
};

export const deleteAllergen = (id) => {
    return api.delete(`/allergens/${id}`);
};

export const getAllOrders = (params) =>
{
    return api.get('/orders', {params});
};

export const getOrderById = (id) => {
    return api.get(`/orders/${id}`);
};

export const updateOrderStatus = (id, status) => {
    return api.put(`/orders/${id}/status`, { status });
};

export const deleteOrder = (id) => {
    return api.delete(`/orders/${id}`);
};

export const cancelOrder = (id) => {
    return api.post(`/orders/${id}/cancel`);
};

export const getBanquetHalls = () => {
    return api.get('/banquet/halls');
};

export const getBookingAvailability = (params) => {
    return api.get('/banquet/availability', { params });
};

export const createBooking = (bookingData) => {
    return api.post('/banquet/bookings', bookingData);
};

export const updateBookingStatus = (bookingId, status) => {
    return api.put(`/banquet/bookings/${bookingId}/status`, { status });
};

export const cancelBooking = (bookingId) => {
    return api.delete(`/banquet/bookings/${bookingId}`);
};

export default api;
