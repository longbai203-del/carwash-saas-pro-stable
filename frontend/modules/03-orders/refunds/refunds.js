// 03-orders/refunds.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '03-orders - refunds',
  routes: [
    { path: '/03-orders/refunds', component: './refunds.html', meta: { title: 'refunds' } }
  ],
  init: () => {
    console.log('03-orders refunds initialized');
    // 在此处添加业务逻辑
  }
});
