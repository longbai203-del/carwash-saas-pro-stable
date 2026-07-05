// 03-orders/returns.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '03-orders - returns',
  routes: [
    { path: '/03-orders/returns', component: './returns.html', meta: { title: 'returns' } }
  ],
  init: () => {
    console.log('03-orders returns initialized');
    // 在此处添加业务逻辑
  }
});
