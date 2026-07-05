// 09-finance/cash-flow.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - cash-flow',
  routes: [
    { path: '/09-finance/cash-flow', component: './cash-flow.html', meta: { title: 'cash-flow' } }
  ],
  init: () => {
    console.log('09-finance cash-flow initialized');
    // 在此处添加业务逻辑
  }
});
