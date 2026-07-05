// 09-finance/expenses.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '09-finance - expenses',
  routes: [
    { path: '/09-finance/expenses', component: './expenses.html', meta: { title: 'expenses' } }
  ],
  init: () => {
    console.log('09-finance expenses initialized');
    // 在此处添加业务逻辑
  }
});
