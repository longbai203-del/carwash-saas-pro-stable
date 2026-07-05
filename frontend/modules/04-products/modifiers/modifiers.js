// 04-products/modifiers.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - modifiers',
  routes: [
    { path: '/04-products/modifiers', component: './modifiers.html', meta: { title: 'modifiers' } }
  ],
  init: () => {
    console.log('04-products modifiers initialized');
    // 在此处添加业务逻辑
  }
});
