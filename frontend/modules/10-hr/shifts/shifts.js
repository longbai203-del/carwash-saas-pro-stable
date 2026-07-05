// 10-hr/shifts.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - shifts',
  routes: [
    { path: '/10-hr/shifts', component: './shifts.html', meta: { title: 'shifts' } }
  ],
  init: () => {
    console.log('10-hr shifts initialized');
    // 在此处添加业务逻辑
  }
});
