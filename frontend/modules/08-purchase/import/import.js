// 08-purchase/import.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - import',
  routes: [
    { path: '/08-purchase/import', component: './import.html', meta: { title: 'import' } }
  ],
  init: () => {
    console.log('08-purchase import initialized');
    // 在此处添加业务逻辑
  }
});
