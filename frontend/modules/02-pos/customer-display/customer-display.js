// 02-pos/customer-display.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - customer-display',
  routes: [
    { path: '/02-pos/customer-display', component: './customer-display.html', meta: { title: 'customer-display' } }
  ],
  init: () => {
    console.log('02-pos customer-display initialized');
    // 在此处添加业务逻辑
  }
});
