// 09-finance/settlements.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - settlements',
  routes: [
    { path: '/09-finance/settlements', component: './settlements.html', meta: { title: 'settlements' } }
  ],
  init: () => {
    console.log('09-finance settlements initialized');
    // 在此处添加业务逻辑
  }
});
