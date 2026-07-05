// 09-finance/invoices.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - invoices',
  routes: [
    { path: '/09-finance/invoices', component: './invoices.html', meta: { title: 'invoices' } }
  ],
  init: () => {
    console.log('09-finance invoices initialized');
    // 在此处添加业务逻辑
  }
});
