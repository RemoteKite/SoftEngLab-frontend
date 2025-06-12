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

export const getOrdersByUserId = (userId) => {
    return api.get(`/orders/user/${userId}`);
}

export const getOrdersByCurrentUser = () => {
    return api.get('/orders/current-user');
}

export const updateOrderStatus = (id, status) => {
    return api.put(`/orders/${id}/status`, null,{
        params: {
            newStatus: status
        }
    });
};

export const cancelOrder = (id) => {
    return api.put(`/orders/${id}/cancel`);
};

export const createOrder = (orderData) => {
    return api.post('/orders', orderData, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const createPackage = (params) => {
    return api.post('/packages', params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const getPackageById = (id) => {
    return api.get(`/packages/${id}`);
};

export const getAllPackages = () => {
    return api.get('/packages');
};

export const updatePackage = (id, params) => {
    return api.put(`/packages/${id}`, params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const deletePackage = (id) => {
    return api.delete(`/packages/${id}`);
};

export const createReview = (params) => {
    return api.post('/reviews', params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const getReviewsByDishId = (dishId) => {
    return api.get(`/reviews/dish/${dishId}`);
};

export const getAllReviews = () => {
    return api.get('/reviews');
};

export const getReviewsByCurrentUser = () => {
    return api.get('/reviews/current-user');
}

export const getReviewById = (id) => {
    return api.get(`/reviews/${id}`);
};

export const updateReview = (id, params) => {
    return api.put(`/reviews/${id}`, params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const deleteReview = (id) => {
    return api.delete(`/reviews/${id}`);
};

export const getReviewsByUserId = (userId) => {
    return api.get(`/reviews/user/${userId}`);
};

export const createRoom = (params) => {
    return api.post('/rooms', params, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const getRoomById = (id) => {
    return api.get(`/rooms/${id}`);
};

export const getAllRooms = () => {
    return api.get('/rooms');
};

export const updateRoom = (id, params) => {
    return api.put(`/rooms/${id}`, params, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    };

export const deleteRoom = (id) => {
    return api.delete(`/rooms/${id}`);
};

export const getRoomsByCanteenId = (canteenId) => {
    return api.get(`/rooms/canteen/${canteenId}`);
};

export const createBanquet = (params) => {
    return api.post('/banquet', params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const getBanquetById = (id) => {
    return api.get(`/banquet/${id}`);
};

export const getAllBanquets = () => {
    return api.get('/banquet');
};

export const updateBanquet = (id, params) => {
    return api.put(`/banquet/${id}`, params, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const deleteBanquet = (id) => {
    return api.delete(`/banquet/${id}`);
};

export const getBanquetsByCanteenId = (canteenId) => {
    return api.get(`/banquet/canteen/${canteenId}`);
};

export const getBanquetsByCanteenIdByUserId = (userId) => {
    return api.get(`/banquet/canteen/user/${userId}`);
};

export const getBanquetsByCurrentUser = () => {
    return api.get('/banquet/current-user');
}

export const updateBanquetStatus = (id, status) => {
    return api.put(`/banquet/${id}/status`, null, { // 注意：后端是 /api/banquet/{id}/status，这里需要确保路径正确
        params: {
            newStatus: status
        }
    });
};

export const cancelBanquet = (id) => {
    return api.put(`/banquet/${id}/cancel`);
};

export const getAllUsers = () => {
    return api.get('/admin/users');
};
export const updateUserRole = (userId, role) => {
    return api.put(`/admin/users/${userId}/role`, null, {
        params: {
            newRole: role
        }
    });
};

export const deleteUser = (userId) => {
    return api.delete(`/admin/users/${userId}`);
};

export const resetUserPassword = (userId, newPassword) => {
    return api.put(`/admin/users/${userId}/password`, null, {
        params: {
            newPassword: newPassword
        }
    });
};

export default api;
