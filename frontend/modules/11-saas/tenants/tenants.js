// 11-saas/tenants.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '11-saas - tenants',
  routes: [
    { path: '/11-saas/tenants', component: './tenants.html', meta: { title: 'tenants' } }
  ],
  init: () => {
    console.log('11-saas tenants initialized');
    // 在此处添加业务逻辑
  }
});
