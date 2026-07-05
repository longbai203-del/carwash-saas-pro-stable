// 08-purchase/receiving.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - receiving',
  routes: [
    { path: '/08-purchase/receiving', component: './receiving.html', meta: { title: 'receiving' } }
  ],
  init: () => {
    console.log('08-purchase receiving initialized');
    // 在此处添加业务逻辑
  }
});
