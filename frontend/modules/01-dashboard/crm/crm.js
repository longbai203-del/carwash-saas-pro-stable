// 01-dashboard/crm.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - crm',
  routes: [
    { path: '/01-dashboard/crm', component: './crm.html', meta: { title: 'crm' } }
  ],
  init: () => {
    console.log('01-dashboard crm initialized');
    // 在此处添加业务逻辑
  }
});
