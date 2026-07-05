// 06-marketing/campaigns.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '06-marketing - campaigns',
  routes: [
    { path: '/06-marketing/campaigns', component: './campaigns.html', meta: { title: 'campaigns' } }
  ],
  init: () => {
    console.log('06-marketing campaigns initialized');
    // 在此处添加业务逻辑
  }
});
