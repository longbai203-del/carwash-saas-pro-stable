// 05-customers/gift-cards.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - gift-cards',
  routes: [
    { path: '/05-customers/gift-cards', component: './gift-cards.html', meta: { title: 'gift-cards' } }
  ],
  init: () => {
    console.log('05-customers gift-cards initialized');
    // 在此处添加业务逻辑
  }
});
