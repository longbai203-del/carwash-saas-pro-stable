// 05-customers/feedback.js
import { ModuleV2 } from '../../../js/module-base-v2.js';

export default new ModuleV2({
  name: '05-customers - feedback',
  routes: [
    { path: '/05-customers/feedback', component: './feedback.html', meta: { title: 'feedback' } }
  ],
  init: () => {
    console.log('05-customers feedback initialized');
    // 在此处添加业务逻辑
  }
});
