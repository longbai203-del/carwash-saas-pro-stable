// 04-products/brands.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - brands',
  routes: [
    { path: '/04-products/brands', component: './brands.html', meta: { title: 'brands' } }
  ],
  init: () => {
    console.log('04-products brands initialized');
    // 在此处添加业务逻辑
  }
});
