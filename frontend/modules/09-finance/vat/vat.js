// 09-finance/vat.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - vat',
  routes: [
    { path: '/09-finance/vat', component: './vat.html', meta: { title: 'vat' } }
  ],
  init: () => {
    console.log('09-finance vat initialized');
    // 在此处添加业务逻辑
  }
});
