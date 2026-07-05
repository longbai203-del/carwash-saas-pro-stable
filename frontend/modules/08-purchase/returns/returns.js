// 08-purchase/returns.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - returns',
  routes: [
    { path: '/08-purchase/returns', component: './returns.html', meta: { title: 'returns' } }
  ],
  init: () => {
    console.log('08-purchase returns initialized');
    // 在此处添加业务逻辑
  }
});
