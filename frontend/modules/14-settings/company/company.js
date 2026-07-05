// 14-settings/company.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '14-settings - company',
  routes: [
    { path: '/14-settings/company', component: './company.html', meta: { title: 'company' } }
  ],
  init: () => {
    console.log('14-settings company initialized');
    // 在此处添加业务逻辑
  }
});
