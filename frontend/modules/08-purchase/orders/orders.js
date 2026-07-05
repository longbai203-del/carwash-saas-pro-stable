// 08-purchase/orders.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - orders',
  routes: [
    { path: '/08-purchase/orders', component: './orders.html', meta: { title: 'orders' } }
  ],
  init: () => {
    console.log('08-purchase orders initialized');
    // 在此处添加业务逻辑
  }
});
