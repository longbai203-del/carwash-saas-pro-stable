// 12-system/roles.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - roles',
  routes: [
    { path: '/12-system/roles', component: './roles.html', meta: { title: 'roles' } }
  ],
  init: () => {
    console.log('12-system roles initialized');
    // 在此处添加业务逻辑
  }
});
