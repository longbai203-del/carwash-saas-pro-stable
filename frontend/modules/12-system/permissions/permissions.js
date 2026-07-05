// 12-system/permissions.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - permissions',
  routes: [
    { path: '/12-system/permissions', component: './permissions.html', meta: { title: 'permissions' } }
  ],
  init: () => {
    console.log('12-system permissions initialized');
    // 在此处添加业务逻辑
  }
});
