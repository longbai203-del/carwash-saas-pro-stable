// 08-purchase/supplier-payments.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - supplier-payments',
  routes: [
    { path: '/08-purchase/supplier-payments', component: './supplier-payments.html', meta: { title: 'supplier-payments' } }
  ],
  init: () => {
    console.log('08-purchase supplier-payments initialized');
    // 在此处添加业务逻辑
  }
});
