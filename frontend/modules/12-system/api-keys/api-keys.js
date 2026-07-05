// 12-system/api-keys.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '12-system - api-keys',
  routes: [
    { path: '/12-system/api-keys', component: './api-keys.html', meta: { title: 'api-keys' } }
  ],
  init: () => {
    console.log('12-system api-keys initialized');
    // 在此处添加业务逻辑
  }
});
