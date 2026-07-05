// 13-analytics/custom-reports.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '13-analytics - custom-reports',
  routes: [
    { path: '/13-analytics/custom-reports', component: './custom-reports.html', meta: { title: 'custom-reports' } }
  ],
  init: () => {
    console.log('13-analytics custom-reports initialized');
    // 在此处添加业务逻辑
  }
});
