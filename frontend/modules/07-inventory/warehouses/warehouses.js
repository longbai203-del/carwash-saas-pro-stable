// 07-inventory/warehouses.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '07-inventory - warehouses',
  routes: [
    { path: '/07-inventory/warehouses', component: './warehouses.html', meta: { title: 'warehouses' } }
  ],
  init: () => {
    console.log('07-inventory warehouses initialized');
    // 在此处添加业务逻辑
  }
});
