// 10-hr/bonuses.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - bonuses',
  routes: [
    { path: '/10-hr/bonuses', component: './bonuses.html', meta: { title: 'bonuses' } }
  ],
  init: () => {
    console.log('10-hr bonuses initialized');
    // 在此处添加业务逻辑
  }
});
