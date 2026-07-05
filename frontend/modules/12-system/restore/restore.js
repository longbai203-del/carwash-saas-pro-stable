// 12-system/restore.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - restore',
  routes: [
    { path: '/12-system/restore', component: './restore.html', meta: { title: 'restore' } }
  ],
  init: () => {
    console.log('12-system restore initialized');
    // 在此处添加业务逻辑
  }
});
