// 09-finance/payments.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - payments',
  routes: [
    { path: '/09-finance/payments', component: './payments.html', meta: { title: 'payments' } }
  ],
  init: () => {
    console.log('09-finance payments initialized');
    // 在此处添加业务逻辑
  }
});
