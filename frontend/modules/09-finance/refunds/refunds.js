// 09-finance/refunds.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - refunds',
  routes: [
    { path: '/09-finance/refunds', component: './refunds.html', meta: { title: 'refunds' } }
  ],
  init: () => {
    console.log('09-finance refunds initialized');
    // 在此处添加业务逻辑
  }
});
