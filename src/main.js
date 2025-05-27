import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'; // 不要忘记导入 CSS！
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
const app = createApp(App)
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.use(router)     // 一定要调用 use(router)
app.use(ElementPlus); // 使用 Element Plus
app.mount('#app')



