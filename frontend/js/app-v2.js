// 合并原有 app.js 功能，增加模块加载
import { router } from './router-v2.js';
import { loadModules } from './router-v2.js';
import { initAuth } from './auth.js';
import { initSidebar } from '../components/sidebar.js';

async function initApp() {
  // 1. 认证初始化
  await initAuth();

  // 2. 加载所有模块
  const modules = await loadModules();
  console.log(`✅ Loaded ${modules.length} modules`);

  // 3. 初始化侧边栏（根据 modules 数据生成）
  initSidebar(modules);

  // 4. 启动路由
  router.start();

  // 5. 其他原有初始化逻辑...
}

// 页面加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}