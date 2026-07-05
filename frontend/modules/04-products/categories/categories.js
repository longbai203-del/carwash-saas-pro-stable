// 04-products/categories.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - categories',
  routes: [
    { path: '/04-products/categories', component: './categories.html', meta: { title: 'categories' } }
  ],
  init: () => {
    console.log('04-products categories initialized');
    // 在此处添加业务逻辑
  }
});
