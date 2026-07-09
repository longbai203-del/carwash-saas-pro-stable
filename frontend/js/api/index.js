// frontend/js/api/index.js
// 新增文件：前端统一API导出入口，解决旧版替换脚本导致的AppApi未定义问题。

import { appApi } from './api-client.js';

// 将 AppApi 实例暴露到全局，供 legacy 模块直接调用（兼容 fix-modules.ps1 的替换操作）
// 例如在某个 module.js 里调用 AppApi.query('orders') 等同于调用 appApi.query('orders')
window.AppApi = appApi;

// 同时也支持解构导入
export { appApi };

/**
 * 前端API模块说明
 * @module api/index
 * @description
 * - `AppApi` (全局挂载) : 兼容旧版直接调用 `AppApi.query('table')` 的写法。
 * - `appApi` (导入使用) : 推荐现代模块使用 `import { appApi } from '../api/index.js'` 方式调用。
 * @example
 * // 旧方式 (已兼容):
 * AppApi.query('orders').select('*');
 *
 * // 新方式 (推荐):
 * import { appApi } from '../api/index.js';
 * appApi.query('orders').select('*');
 */