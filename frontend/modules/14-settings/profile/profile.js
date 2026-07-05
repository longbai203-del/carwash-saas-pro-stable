// 14-settings/profile.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '14-settings - profile',
  routes: [
    { path: '/14-settings/profile', component: './profile.html', meta: { title: 'profile' } }
  ],
  init: () => {
    console.log('14-settings profile initialized');
    // 在此处添加业务逻辑
  }
});
