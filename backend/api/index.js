/**
 * API 兼容入口层
 * 重定向到 src/api/index.js
 * 
 * @module api/index
 */

// 使用正确的相对路径导入
import('../src/api/index.js')
  .then(function(module) {
    console.log('API 入口加载成功 (兼容层)');
  })
  .catch(function(err) {
    console.error('加载主入口失败:', err.message);
    process.exit(1);
  });
