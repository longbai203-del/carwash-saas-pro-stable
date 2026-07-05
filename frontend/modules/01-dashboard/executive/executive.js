// 01-dashboard/executive.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '01-dashboard - executive',
  routes: [
    { path: '/01-dashboard/executive', component: './executive.html', meta: { title: 'executive' } }
  ],
  init: () => {
    console.log('01-dashboard executive initialized');
    // 在此处添加业务逻辑
  }
});
