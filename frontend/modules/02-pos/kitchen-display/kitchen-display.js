// 02-pos/kitchen-display.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - kitchen-display',
  routes: [
    { path: '/02-pos/kitchen-display', component: './kitchen-display.html', meta: { title: 'kitchen-display' } }
  ],
  init: () => {
    console.log('02-pos kitchen-display initialized');
    // 在此处添加业务逻辑
  }
});
