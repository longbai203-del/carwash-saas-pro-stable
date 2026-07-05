// 06-marketing/referrals.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '06-marketing - referrals',
  routes: [
    { path: '/06-marketing/referrals', component: './referrals.html', meta: { title: 'referrals' } }
  ],
  init: () => {
    console.log('06-marketing referrals initialized');
    // 在此处添加业务逻辑
  }
});
