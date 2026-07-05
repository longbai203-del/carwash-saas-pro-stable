// 06-marketing/promotions.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '06-marketing - promotions',
  routes: [
    { path: '/06-marketing/promotions', component: './promotions.html', meta: { title: 'promotions' } }
  ],
  init: () => {
    console.log('06-marketing promotions initialized');
    // 在此处添加业务逻辑
  }
});
