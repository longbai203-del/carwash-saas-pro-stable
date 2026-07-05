// 09-finance/bank.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - bank',
  routes: [
    { path: '/09-finance/bank', component: './bank.html', meta: { title: 'bank' } }
  ],
  init: () => {
    console.log('09-finance bank initialized');
    // 在此处添加业务逻辑
  }
});
