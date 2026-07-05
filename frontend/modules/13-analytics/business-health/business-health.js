// 13-analytics/business-health.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '13-analytics - business-health',
  routes: [
    { path: '/13-analytics/business-health', component: './business-health.html', meta: { title: 'business-health' } }
  ],
  init: () => {
    console.log('13-analytics business-health initialized');
    // 在此处添加业务逻辑
  }
});
