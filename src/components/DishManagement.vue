<template>
    <div class="dish-management">
        <div class="dish-header">
            <h2>菜品管理</h2>
            <button class="action-button" @click="openAddModal">
                <span>+</span> 添加菜品
            </button>
        </div>

        <div class="table-scroll-container">
        <table>
            <thead>
            <tr>
                <th>名称</th>
                <th>价格</th>
                <th>食堂</th>
                <th>图片</th>
                <th>操作</th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="dishes.length === 0">
                <td colspan="5" class="empty-state">暂无菜品数据</td>
            </tr>
            <tr v-for="dish in dishes" :key="dish.dishId">
                <td>{{ dish.name }}</td>
                <td>{{ dish.price.toFixed(2) }}</td>
                <td>{{ getCanteenName(dish.canteenId) }}</td>
                <td>
                    <img v-if="dish.imageUrl" :src="dish.imageUrl" alt="菜品图片" />
                    <span v-else>无图片</span>
                </td>
                <td class="action-cell">
                    <button class="edit-btn" @click="openEditModal(dish)">编辑</button>
                    <button class="delete-btn" @click="confirmDelete(dish.dishId)">删除</button>
                </td>
            </tr>
            </tbody>
        </table>
        </div>

        <!-- 添加/编辑菜品的模态框 -->
        <div v-if="showModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>{{ isEditMode ? '编辑菜品' : '添加菜品' }}</h3>
                    <span class="close" @click="closeModal">&times;</span>
                </div>

                <form @submit.prevent="handleSubmit">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="name">名称:</label>
                            <input type="text" id="name" v-model="currentDish.name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="price">价格:</label>
                            <input type="number" id="price" v-model="currentDish.price" class="form-control" required step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="description">描述:</label>
                            <textarea id="description" v-model="currentDish.description" class="form-control" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="canteen">食堂:</label>
                            <select id="canteen" v-model="currentDish.canteenId" class="form-control" required>
                                <option disabled value="">-- 请选择食堂 --</option>
                                <option v-for="canteen in canteens" :key="canteen.canteenId" :value="canteen.canteenId">
                                    {{ canteen.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>图片:</label>
                            <div class="file-input-wrapper">
                                <span class="file-input-label">选择图片</span>
                                <input type="file" @change="handleFileChange">
                            </div>
                            <div class="image-preview">
                                <img v-if="isEditMode && currentDish.imageUrl && !selectedFile" :src="currentDish.imageUrl" alt="菜品图片" width="100">
                                <img v-if="previewUrl" :src="previewUrl" alt="预览图片" width="100">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" @click="closeModal">取消</button>
                        <button type="submit" class="btn-primary">{{ isEditMode ? '更新' : '创建' }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import {getAllDishes, createDish, updateDish, deleteDish, getAllCanteens} from '@/services/api';

export default {
    name: 'DishManagement',
    data() {
        return {
            dishes: [],
            canteens : [],
            showModal: false,
            isEditMode: false,
            currentDish: {
                dishId: null,
                canteenId: '',
                name: '',
                price: '',
                description: '',
                imageUrl: ''
            },
            selectedFile: null,
            previewUrl: null,
        };
    },
    methods: {
        getCanteenName(canteenId) {
            const canteen = this.canteens.find(c => c.canteenId === canteenId);
            return canteen ? canteen.name : `食堂ID: ${canteenId}`; // 如果找不到，可以显示ID或提示信息
        },
        async fetchCanteens() {
            try {
                const response = await getAllCanteens();
                this.canteens = response.data;
            } catch (error) {
                console.error('获取食堂列表失败:', error);
            }
        },
        async fetchDishes() {
            try {
                const response = await getAllDishes();
                this.dishes = response.data;
            } catch (error) {
                console.error('获取菜品列表失败:', error);
            }
        },
        openAddModal() {
            this.isEditMode = false;
            this.currentDish = {
                dishId: null,
                canteenId: '',
                name: '',
                price: '',
                description: '',
                imageUrl: ''
            };
            this.selectedFile = null;
            this.previewUrl = null;
            this.showModal = true;
        },
        openEditModal(dish) {
            this.isEditMode = true;
            this.currentDish = { ...dish };
            this.selectedFile = null;
            this.previewUrl = null;
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
        },
        handleFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                this.selectedFile = file;
                this.previewUrl = URL.createObjectURL(file);
            } else {
                this.selectedFile = null;
                this.previewUrl = null;
            }
        },
        async handleSubmit() {
            const formData = new FormData();

            // 构造菜品信息对象
            const dishData = {
                canteenId: this.currentDish.canteenId,
                name: this.currentDish.name,
                price: this.currentDish.price,
                description: this.currentDish.description,
                //TODO 过敏原和标签可以在这里添加
            };

            // 将菜品信息作为JSON字符串添加到FormData
            formData.append('dish', new Blob([JSON.stringify(dishData)], {
                type: 'application/json'
            }));

            // 如果有图片文件，添加到FormData
            if (this.selectedFile) {
                formData.append('image', this.selectedFile);
            }

            try {
                if (this.isEditMode) {
                    await updateDish(this.currentDish.dishId, formData);
                } else {
                    await createDish(formData);
                }
                await this.fetchDishes();
                await this.fetchCanteens();
                this.closeModal();
            } catch (error) {
                console.error('保存菜品失败:', error.response ? error.response.data : error);
                alert(`操作失败: ${error.response?.data?.message || error.message}`);
            }
        },
        async confirmDelete(dishId) {
            if (confirm('确定要删除这个菜品吗？')) {
                try {
                    await deleteDish(dishId);
                    await this.fetchDishes();
                    await this.fetchCanteens();
                } catch (error) {
                    console.error('删除菜品失败:', error);
                    alert(`删除失败: ${error.response?.data?.message || error.message}`);
                }
            }
        }
    },
    mounted() {
        this.fetchDishes();
        this.fetchCanteens();
    },
    beforeUnmount() {
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
        }
    }
};
</script>

<style scoped>
.dish-management {
    padding: 0;
}

.dish-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.dish-management h2 {
    margin: 0;
    font-size: 1.8rem;
    color: #1f2937;
    font-weight: 600;
}

.action-button {
    background: linear-gradient(135deg, #42b983, #2d8f5f);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 6px rgba(45, 143, 95, 0.2);
    transition: all 0.3s ease;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(45, 143, 95, 0.3);
}

.action-button:active {
    transform: translateY(1px);
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    overflow: hidden;
    table-layout: fixed;
}

.table-scroll-container {
    max-height: calc(100vh - 200px); /* Adjust this value as needed based on header/footer heights */
    overflow-y: auto; /* Enable vertical scrolling */
    background-color: #ffffff; /* Add background for a cleaner scroll area */
    border-radius: 10px;
}

th {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: #f9fafb;
    color: #4b5563;
    font-weight: 600;
    padding: 0.8rem 0.8rem;
    border-bottom: 2px solid #e5e7eb;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    text-align: left;
}

th:nth-child(1) { width: 25%; } /* 名称 */
th:nth-child(2) { width: 25%; } /* 价格 */
th:nth-child(3) { width: 20%; } /* 食堂 */
th:nth-child(4) { width: 15%; } /* 图片 */
th:nth-child(5) { width: 15%; } /* 操作 */

td {
    padding: 1rem 0.8rem;
    border-bottom: 1px solid #f3f4f6;
    color: #1f2937;
    vertical-align: middle;
    text-align: left;
}

tr:last-child td {
    border-bottom: none;
}

tr:hover {
    background-color: #f9fafb;
}

td img {
    border-radius: 6px;
    object-fit: cover;
    height: 60px;
    width: 80px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-cell {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 3rem;
}

.edit-btn, .delete-btn {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: none;
    font-size: 0.85rem;
}

.edit-btn {
    background-color: #60a5fa;
    color: white;
}

.delete-btn {
    background-color: #ef4444;
    color: white;
}

.edit-btn:hover {
    background-color: #3b82f6;
}

.delete-btn:hover {
    background-color: #dc2626;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    animation: modal-appear 0.3s ease-out;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

@keyframes modal-appear {
    from { opacity: 0; transform: translateY(-30px); }
    to { opacity: 1; transform: translateY(0); }
}

.modal-header {
    background-color: #42b983;
    color: white;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.5rem;
}

.close {
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: bold;
}

.close:hover {
    opacity: 0.7;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.2rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4b5563;
}

.form-control {
    width: 100%;
    padding: 0.65rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition: all 0.2s;
    box-sizing: border-box;
}

.form-control:focus {
    outline: none;
    border-color: #42b983;
    box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
}

.modal-footer {
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    border-top: 1px solid #e5e7eb;
}

.btn-primary, .btn-secondary {
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    font-weight: 500;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background-color: #42b983;
    color: white;
}

.btn-secondary {
    background-color: #9ca3af;
    color: white;
}

.btn-primary:hover {
    background-color: #38a86d;
}

.btn-secondary:hover {
    background-color: #6b7280;
}

.image-preview {
    margin-top: 0.8rem;
    position: relative;
}

.file-input-wrapper {
    position: relative;
    overflow: hidden;
    display: inline-block;
}

.file-input-wrapper input[type=file] {
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
}

.file-input-label {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
}

/* 页面加载动画 */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dish-management {
    animation: fadeInUp 0.5s ease-out;
}

/* 表格行动画 */
tbody tr {
    transition: all 0.2s ease;
}

tbody tr:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    position: relative;
    z-index: 1;
}
</style>