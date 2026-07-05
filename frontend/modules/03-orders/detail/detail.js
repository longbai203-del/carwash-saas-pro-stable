// 03-orders/detail.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '03-orders - detail',
  routes: [
    { path: '/03-orders/detail', component: './detail.html', meta: { title: 'detail' } }
  ],
  init: () => {
    console.log('03-orders detail initialized');
    // 在此处添加业务逻辑
  }
});
