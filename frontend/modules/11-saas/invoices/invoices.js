// 11-saas/invoices.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '11-saas - invoices',
  routes: [
    { path: '/11-saas/invoices', component: './invoices.html', meta: { title: 'invoices' } }
  ],
  init: () => {
    console.log('11-saas invoices initialized');
    // 在此处添加业务逻辑
  }
});
