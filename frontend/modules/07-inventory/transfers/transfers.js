// 07-inventory/transfers.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '07-inventory - transfers',
  routes: [
    { path: '/07-inventory/transfers', component: './transfers.html', meta: { title: 'transfers' } }
  ],
  init: () => {
    console.log('07-inventory transfers initialized');
    // 在此处添加业务逻辑
  }
});
