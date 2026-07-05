// 05-customers/coupons.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - coupons',
  routes: [
    { path: '/05-customers/coupons', component: './coupons.html', meta: { title: 'coupons' } }
  ],
  init: () => {
    console.log('05-customers coupons initialized');
    // 在此处添加业务逻辑
  }
});
