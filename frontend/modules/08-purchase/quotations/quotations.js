// 08-purchase/quotations.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '08-purchase - quotations',
  routes: [
    { path: '/08-purchase/quotations', component: './quotations.html', meta: { title: 'quotations' } }
  ],
  init: () => {
    console.log('08-purchase quotations initialized');
    // 在此处添加业务逻辑
  }
});
