// 12-system/settings.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - settings',
  routes: [
    { path: '/12-system/settings', component: './settings.html', meta: { title: 'settings' } }
  ],
  init: () => {
    console.log('12-system settings initialized');
    // 在此处添加业务逻辑
  }
});
