// 01-dashboard/ai.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - ai',
  routes: [
    { path: '/01-dashboard/ai', component: './ai.html', meta: { title: 'ai' } }
  ],
  init: () => {
    console.log('01-dashboard ai initialized');
    // 在此处添加业务逻辑
  }
});
