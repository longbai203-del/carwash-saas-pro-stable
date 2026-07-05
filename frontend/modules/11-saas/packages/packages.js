// 11-saas/packages.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '11-saas - packages',
  routes: [
    { path: '/11-saas/packages', component: './packages.html', meta: { title: 'packages' } }
  ],
  init: () => {
    console.log('11-saas packages initialized');
    // 在此处添加业务逻辑
  }
});
