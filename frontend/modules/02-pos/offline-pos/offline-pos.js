// 02-pos/offline-pos.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '02-pos - offline-pos',
  routes: [
    { path: '/02-pos/offline-pos', component: './offline-pos.html', meta: { title: 'offline-pos' } }
  ],
  init: () => {
    console.log('02-pos offline-pos initialized');
    // 在此处添加业务逻辑
  }
});
