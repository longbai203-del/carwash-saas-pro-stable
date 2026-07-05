// 11-saas/subscriptions.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '11-saas - subscriptions',
  routes: [
    { path: '/11-saas/subscriptions', component: './subscriptions.html', meta: { title: 'subscriptions' } }
  ],
  init: () => {
    console.log('11-saas subscriptions initialized');
    // 在此处添加业务逻辑
  }
});
