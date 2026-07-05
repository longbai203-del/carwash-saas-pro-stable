// 01-dashboard/sales.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - sales',
  routes: [
    { path: '/01-dashboard/sales', component: './sales.html', meta: { title: 'sales' } }
  ],
  init: () => {
    console.log('01-dashboard sales initialized');
    // 在此处添加业务逻辑
  }
});
