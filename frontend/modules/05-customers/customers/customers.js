// 05-customers/customers.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - customers',
  routes: [
    { path: '/05-customers/customers', component: './customers.html', meta: { title: 'customers' } }
  ],
  init: () => {
    console.log('05-customers customers initialized');
    // 在此处添加业务逻辑
  }
});
