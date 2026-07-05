// 02-pos/quick-sale.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - quick-sale',
  routes: [
    { path: '/02-pos/quick-sale', component: './quick-sale.html', meta: { title: 'quick-sale' } }
  ],
  init: () => {
    console.log('02-pos quick-sale initialized');
    // 在此处添加业务逻辑
  }
});
