// 01-dashboard/employee.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - employee',
  routes: [
    { path: '/01-dashboard/employee', component: './employee.html', meta: { title: 'employee' } }
  ],
  init: () => {
    console.log('01-dashboard employee initialized');
    // 在此处添加业务逻辑
  }
});
