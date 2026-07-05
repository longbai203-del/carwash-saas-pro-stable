// 07-inventory/history.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '07-inventory - history',
  routes: [
    { path: '/07-inventory/history', component: './history.html', meta: { title: 'history' } }
  ],
  init: () => {
    console.log('07-inventory history initialized');
    // 在此处添加业务逻辑
  }
});
