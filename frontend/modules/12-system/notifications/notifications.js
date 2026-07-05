// 12-system/notifications.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - notifications',
  routes: [
    { path: '/12-system/notifications', component: './notifications.html', meta: { title: 'notifications' } }
  ],
  init: () => {
    console.log('12-system notifications initialized');
    // 在此处添加业务逻辑
  }
});
