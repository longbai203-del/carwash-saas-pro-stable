// 06-marketing/loyalty.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '06-marketing - loyalty',
  routes: [
    { path: '/06-marketing/loyalty', component: './loyalty.html', meta: { title: 'loyalty' } }
  ],
  init: () => {
    console.log('06-marketing loyalty initialized');
    // 在此处添加业务逻辑
  }
});
