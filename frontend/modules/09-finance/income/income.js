// 09-finance/income.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - income',
  routes: [
    { path: '/09-finance/income', component: './income.html', meta: { title: 'income' } }
  ],
  init: () => {
    console.log('09-finance income initialized');
    // 在此处添加业务逻辑
  }
});
