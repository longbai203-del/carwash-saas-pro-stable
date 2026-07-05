// 11-saas/plans.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '11-saas - plans',
  routes: [
    { path: '/11-saas/plans', component: './plans.html', meta: { title: 'plans' } }
  ],
  init: () => {
    console.log('11-saas plans initialized');
    // 在此处添加业务逻辑
  }
});
