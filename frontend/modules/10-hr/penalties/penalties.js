// 10-hr/penalties.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - penalties',
  routes: [
    { path: '/10-hr/penalties', component: './penalties.html', meta: { title: 'penalties' } }
  ],
  init: () => {
    console.log('10-hr penalties initialized');
    // 在此处添加业务逻辑
  }
});
