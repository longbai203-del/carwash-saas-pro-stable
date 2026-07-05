// 09-finance/taxes.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - taxes',
  routes: [
    { path: '/09-finance/taxes', component: './taxes.html', meta: { title: 'taxes' } }
  ],
  init: () => {
    console.log('09-finance taxes initialized');
    // 在此处添加业务逻辑
  }
});
