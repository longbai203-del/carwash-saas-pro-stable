// 导入原有路由实例（假设默认导出，根据实际调整）
import router from './router.js';  // 若原 router 为默认导出
// 若原 router 是命名导出，改为：import { router } from './router.js';

import { initAuth } from './auth.js';
import { initSidebar } from '../components/sidebar.js';

// 加载所有模块并注册路由
async function loadModules() {
  const moduleDirs = await getModuleDirectories();
  const loaded = [];
  for (const dir of moduleDirs) {
    try {
      const metaRes = await fetch(`/modules/${dir}/module.json`);
      if (!metaRes.ok) continue;
      const meta = await metaRes.json();
      const moduleExports = await import(`/modules/${dir}/index.js`);
      const mod = moduleExports.default;
      if (mod && mod.registerRoutes) {
        mod.registerRoutes(router);  // 传入现有路由实例
        loaded.push({ id: dir, meta, instance: mod });
      }
    } catch (e) {
      console.warn(`Failed to load module ${dir}:`, e);
    }
  }
  return loaded;
}

// 获取所有模块目录（从 module-map.json 读取）
async function getModuleDirectories() {
  const res = await fetch('/modules/module-map.json');
  const map = await res.json();
  return Object.keys(map);
}

// 应用初始化
async function initApp() {
  await initAuth();
  const modules = await loadModules();
  console.log(`✅ Loaded ${modules.length} modules`);

  // 初始化侧边栏（传入模块数据）
  initSidebar(modules);

  // 启动路由（如果原路由有 start 方法）
  if (router.start) {
    router.start();
  } else {
    console.warn('Router has no start method, assuming already active.');
  }

  // 其他原有初始化...
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}