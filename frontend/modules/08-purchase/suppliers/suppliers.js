// 08-purchase/suppliers.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - suppliers',
  routes: [
    { path: '/08-purchase/suppliers', component: './suppliers.html', meta: { title: 'suppliers' } }
  ],
  init: () => {
    console.log('08-purchase suppliers initialized');
    // 在此处添加业务逻辑
  }
});
