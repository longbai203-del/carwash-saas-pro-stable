// 04-products/combos.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - combos',
  routes: [
    { path: '/04-products/combos', component: './combos.html', meta: { title: 'combos' } }
  ],
  init: () => {
    console.log('04-products combos initialized');
    // 在此处添加业务逻辑
  }
});
