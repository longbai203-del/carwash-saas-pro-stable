/**
 * start-simple.js - 简单启动脚本
 * @description 用于本地开发环境启动 API 服务器
 * 
 * @example
 * node start-simple.js
 * 或
 * npm start
 */

import app from './api/index.js';

const PORT = process.env.PORT || 3001;

// 健康检查路由
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});