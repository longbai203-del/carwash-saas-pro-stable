// 01-dashboard/finance.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - finance',
  routes: [
    { path: '/01-dashboard/finance', component: './finance.html', meta: { title: 'finance' } }
  ],
  init: () => {
    console.log('01-dashboard finance initialized');
    // 在此处添加业务逻辑
  }
});
