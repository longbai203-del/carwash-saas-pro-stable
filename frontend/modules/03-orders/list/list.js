// 03-orders/list.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '03-orders - list',
  routes: [
    { path: '/03-orders/list', component: './list.html', meta: { title: 'list' } }
  ],
  init: () => {
    console.log('03-orders list initialized');
    // 在此处添加业务逻辑
  }
});
