// 10-hr/schedules.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - schedules',
  routes: [
    { path: '/10-hr/schedules', component: './schedules.html', meta: { title: 'schedules' } }
  ],
  init: () => {
    console.log('10-hr schedules initialized');
    // 在此处添加业务逻辑
  }
});
