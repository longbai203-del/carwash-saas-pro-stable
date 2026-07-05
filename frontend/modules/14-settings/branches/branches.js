// 14-settings/branches.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '14-settings - branches',
  routes: [
    { path: '/14-settings/branches', component: './branches.html', meta: { title: 'branches' } }
  ],
  init: () => {
    console.log('14-settings branches initialized');
    // 在此处添加业务逻辑
  }
});
