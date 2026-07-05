// 04-products/variants.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - variants',
  routes: [
    { path: '/04-products/variants', component: './variants.html', meta: { title: 'variants' } }
  ],
  init: () => {
    console.log('04-products variants initialized');
    // 在此处添加业务逻辑
  }
});
