// 09-finance/trial-balance.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - trial-balance',
  routes: [
    { path: '/09-finance/trial-balance', component: './trial-balance.html', meta: { title: 'trial-balance' } }
  ],
  init: () => {
    console.log('09-finance trial-balance initialized');
    // 在此处添加业务逻辑
  }
});
