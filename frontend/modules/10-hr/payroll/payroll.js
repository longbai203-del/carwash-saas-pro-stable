// 10-hr/payroll.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - payroll',
  routes: [
    { path: '/10-hr/payroll', component: './payroll.html', meta: { title: 'payroll' } }
  ],
  init: () => {
    console.log('10-hr payroll initialized');
    // 在此处添加业务逻辑
  }
});
