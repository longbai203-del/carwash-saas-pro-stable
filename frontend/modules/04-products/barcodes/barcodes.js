// 04-products/barcodes.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '04-products - barcodes',
  routes: [
    { path: '/04-products/barcodes', component: './barcodes.html', meta: { title: 'barcodes' } }
  ],
  init: () => {
    console.log('04-products barcodes initialized');
    // 在此处添加业务逻辑
  }
});
