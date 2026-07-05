// 01-dashboard/inventory.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - inventory',
  routes: [
    { path: '/01-dashboard/inventory', component: './inventory.html', meta: { title: 'inventory' } }
  ],
  init: () => {
    console.log('01-dashboard inventory initialized');
    // 在此处添加业务逻辑
  }
});
