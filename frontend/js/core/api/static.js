// backend/api/static.js
// 新增文件：统一处理前端静态资源路由，与现有API路由无缝共存，不改变任何架构

import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 下模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 配置Express静态资源服务
 * @param {import('express').Express} app - Express应用实例
 * @returns {void}
 * @description 
 * 1. 将前端 `/frontend` 目录挂载为静态资源根目录
 * 2. 所有未匹配到API的路由，均回退到 `index.html`（支持SPA前端路由）
 */
export const setupStaticAssets = (app) => {
    // 确定前端文件的实际物理路径 (从 backend 目录向上退一层)
    const frontendRoot = path.resolve(__dirname, '../../frontend');

    // 将 /frontend 下所有文件暴露为 / 根路径下的静态资源
    // 例如：访问 /css/style.css 实际指向 /frontend/css/style.css
    app.use(express.static(frontendRoot));

    // 【核心修复】捕获所有未被API拦截的请求，返回前端入口文件
    // 这样可以直接支持前端的原生路由，并且不会干扰 /api/ 开头的后端路由
    app.get('*', (req, res, next) => {
        // 如果是API请求，跳过
        if (req.path.startsWith('/api/')) {
            return next();
        }
        // 否则，返回前端的 index.html，由前端JS接管路由
        res.sendFile(path.join(frontendRoot, 'index.html'));
    });
};