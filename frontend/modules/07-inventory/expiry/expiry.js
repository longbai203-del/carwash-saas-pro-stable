// 07-inventory/expiry.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '07-inventory - expiry',
  routes: [
    { path: '/07-inventory/expiry', component: './expiry.html', meta: { title: 'expiry' } }
  ],
  init: () => {
    console.log('07-inventory expiry initialized');
    // 在此处添加业务逻辑
  }
});
