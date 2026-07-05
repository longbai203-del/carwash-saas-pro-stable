// 12-system/backup.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - backup',
  routes: [
    { path: '/12-system/backup', component: './backup.html', meta: { title: 'backup' } }
  ],
  init: () => {
    console.log('12-system backup initialized');
    // 在此处添加业务逻辑
  }
});
