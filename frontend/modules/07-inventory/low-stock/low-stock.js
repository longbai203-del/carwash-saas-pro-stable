// 07-inventory/low-stock.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '07-inventory - low-stock',
  routes: [
    { path: '/07-inventory/low-stock', component: './low-stock.html', meta: { title: 'low-stock' } }
  ],
  init: () => {
    console.log('07-inventory low-stock initialized');
    // 在此处添加业务逻辑
  }
});
