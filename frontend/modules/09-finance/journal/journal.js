// 09-finance/journal.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - journal',
  routes: [
    { path: '/09-finance/journal', component: './journal.html', meta: { title: 'journal' } }
  ],
  init: () => {
    console.log('09-finance journal initialized');
    // 在此处添加业务逻辑
  }
});
