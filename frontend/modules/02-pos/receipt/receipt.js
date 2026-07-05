// 02-pos/receipt.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - receipt',
  routes: [
    { path: '/02-pos/receipt', component: './receipt.html', meta: { title: 'receipt' } }
  ],
  init: () => {
    console.log('02-pos receipt initialized');
    // 在此处添加业务逻辑
  }
});
