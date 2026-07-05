// 02-pos/exchange.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - exchange',
  routes: [
    { path: '/02-pos/exchange', component: './exchange.html', meta: { title: 'exchange' } }
  ],
  init: () => {
    console.log('02-pos exchange initialized');
    // 在此处添加业务逻辑
  }
});
