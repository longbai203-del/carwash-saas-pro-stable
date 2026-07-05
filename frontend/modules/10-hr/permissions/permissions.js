// 10-hr/permissions.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - permissions',
  routes: [
    { path: '/10-hr/permissions', component: './permissions.html', meta: { title: 'permissions' } }
  ],
  init: () => {
    console.log('10-hr permissions initialized');
    // 在此处添加业务逻辑
  }
});
