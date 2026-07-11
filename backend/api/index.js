/**
 * backend/api/index.js - API兼容入口层
 * 
 * 此文件作为 Render 部署的兼容入口，重定向到 src/api/index.js
 * 
 * @module api/index
 * @description 保持与旧部署配置的兼容性
 * 
 * @example
 * // Render startCommand: cd backend && node api/index.js
 * // 实际执行: src/api/index.js
 */

// 使用 ES Module 动态导入主入口
import('./src/api/index.js')
  .then((module) => {
    console.log('✅ API 入口加载成功 (兼容层)');
    // 如果主模块有默认导出，可以在这里处理
    if (module.default) {
      // 主模块已启动
    }
  })
  .catch((err) => {
    console.error('❌ 加载主入口失败:', err.message);
    process.exit(1);
  });

// 导出空对象以满足 CommonJS 要求
export default {};