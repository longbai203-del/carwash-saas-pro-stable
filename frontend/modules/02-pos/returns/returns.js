// 02-pos/returns.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - returns',
  routes: [
    { path: '/02-pos/returns', component: './returns.html', meta: { title: 'returns' } }
  ],
  init: () => {
    console.log('02-pos returns initialized');
    // 在此处添加业务逻辑
  }
});
