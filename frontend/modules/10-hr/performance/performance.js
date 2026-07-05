// 10-hr/performance.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - performance',
  routes: [
    { path: '/10-hr/performance', component: './performance.html', meta: { title: 'performance' } }
  ],
  init: () => {
    console.log('10-hr performance initialized');
    // 在此处添加业务逻辑
  }
});
