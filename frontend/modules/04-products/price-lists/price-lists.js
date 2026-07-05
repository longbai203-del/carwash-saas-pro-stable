// 04-products/price-lists.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - price-lists',
  routes: [
    { path: '/04-products/price-lists', component: './price-lists.html', meta: { title: 'price-lists' } }
  ],
  init: () => {
    console.log('04-products price-lists initialized');
    // 在此处添加业务逻辑
  }
});
