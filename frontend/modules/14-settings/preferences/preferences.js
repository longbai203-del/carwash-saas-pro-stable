// 14-settings/preferences.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '14-settings - preferences',
  routes: [
    { path: '/14-settings/preferences', component: './preferences.html', meta: { title: 'preferences' } }
  ],
  init: () => {
    console.log('14-settings preferences initialized');
    // 在此处添加业务逻辑
  }
});
