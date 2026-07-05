// 05-customers/vehicles.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - vehicles',
  routes: [
    { path: '/05-customers/vehicles', component: './vehicles.html', meta: { title: 'vehicles' } }
  ],
  init: () => {
    console.log('05-customers vehicles initialized');
    // 在此处添加业务逻辑
  }
});
