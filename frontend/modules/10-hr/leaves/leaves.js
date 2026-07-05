// 10-hr/leaves.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '10-hr - leaves',
  routes: [
    { path: '/10-hr/leaves', component: './leaves.html', meta: { title: 'leaves' } }
  ],
  init: () => {
    console.log('10-hr leaves initialized');
    // 在此处添加业务逻辑
  }
});
