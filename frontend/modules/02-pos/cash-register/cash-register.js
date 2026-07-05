// 02-pos/cash-register.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - cash-register',
  routes: [
    { path: '/02-pos/cash-register', component: './cash-register.html', meta: { title: 'cash-register' } }
  ],
  init: () => {
    console.log('02-pos cash-register initialized');
    // 在此处添加业务逻辑
  }
});
