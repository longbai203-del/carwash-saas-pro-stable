// 01-dashboard/marketing.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - marketing',
  routes: [
    { path: '/01-dashboard/marketing', component: './marketing.html', meta: { title: 'marketing' } }
  ],
  init: () => {
    console.log('01-dashboard marketing initialized');
    // 在此处添加业务逻辑
  }
});
