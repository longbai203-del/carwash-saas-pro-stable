// 05-customers/wallet.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - wallet',
  routes: [
    { path: '/05-customers/wallet', component: './wallet.html', meta: { title: 'wallet' } }
  ],
  init: () => {
    console.log('05-customers wallet initialized');
    // 在此处添加业务逻辑
  }
});
