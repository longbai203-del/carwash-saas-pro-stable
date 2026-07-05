// 04-products/products.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - products',
  routes: [
    { path: '/04-products/products', component: './products.html', meta: { title: 'products' } }
  ],
  init: () => {
    console.log('04-products products initialized');
    // 在此处添加业务逻辑
  }
});
