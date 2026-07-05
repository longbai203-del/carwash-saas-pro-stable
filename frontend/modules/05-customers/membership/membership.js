// 05-customers/membership.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - membership',
  routes: [
    { path: '/05-customers/membership', component: './membership.html', meta: { title: 'membership' } }
  ],
  init: () => {
    console.log('05-customers membership initialized');
    // 在此处添加业务逻辑
  }
});
