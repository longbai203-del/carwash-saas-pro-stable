// 保留原有 router 功能，新增模块自动加载
import { Router } from './router.js';  // 假设原有路由器

// 单例路由实例（若原有 router 已导出，则复用）
const routerInstance = new Router();

// 新增：扫描 modules/ 下所有 01-* 目录，加载模块
export async function loadModules() {
  const moduleDirs = await getModuleDirectories(); // 获取以数字开头的目录
  const loaded = [];
  for (const dir of moduleDirs) {
    try {
      const metaRes = await fetch(`/modules/${dir}/module.json`);
      if (!metaRes.ok) continue;
      const meta = await metaRes.json();
      // 动态导入模块入口（约定每个模块根目录下 index.js）
      const moduleExports = await import(`/modules/${dir}/index.js`);
      const mod = moduleExports.default;
      if (mod && mod.registerRoutes) {
        mod.registerRoutes(routerInstance);
        loaded.push({ id: dir, meta, instance: mod });
      }
    } catch (e) {
      console.warn(`Failed to load module ${dir}:`, e);
    }
  }
  return loaded;
}

// 辅助：获取目录列表（此处模拟，实际使用 fetch 获取目录清单）
async function getModuleDirectories() {
  // 实际生产环境可通过后端 API 获取目录列表，或硬编码所有编号
  // 此处我们直接返回已知的模块列表（从 module-map.json 读取）
  const res = await fetch('/modules/module-map.json');
  const map = await res.json();
  return Object.keys(map);
}

// 导出路由实例供全局使用
export { routerInstance as router };

// 在 app 初始化时调用 loadModules()