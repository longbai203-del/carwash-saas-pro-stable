// 12-system/webhooks.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - webhooks',
  routes: [
    { path: '/12-system/webhooks', component: './webhooks.html', meta: { title: 'webhooks' } }
  ],
  init: () => {
    console.log('12-system webhooks initialized');
    // 在此处添加业务逻辑
  }
});
