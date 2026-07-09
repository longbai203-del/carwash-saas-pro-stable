/**
 * api/index.js - API主路由入口
 * @module api
 * @description 统一API路由注册和中间件配置
 * 
 * @example
 * // Vercel serverless 函数入口
 * import app from './api/index.js';
 * export default app;
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 导入路由模块
import authRoutes from './auth.js';
import orderRoutes from './orders.js';
import productRoutes from './products.js';
import customerRoutes from './customers.js';
import employeeRoutes from './employees.js';
import inventoryRoutes from './inventory.js';
import reportRoutes from './reports.js';
import attendanceRoutes from './attendance.js';
import permissionRoutes from './permissions.js';
import vehicleMonitorRoutes from './vehicle-monitor.js';

dotenv.config();

const app = express();

// ============================================================
// 中间件配置
// ============================================================

// 安全头
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));

// CORS - 允许前端跨域访问
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
console.log(`[API] CORS 允许来源: ${corsOrigin}`);

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志（开发环境）
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[API] ${req.method} ${req.path}`);
        next();
    });
}

// ============================================================
// 健康检查
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        corsOrigin: corsOrigin
    });
});

// ============================================================
// API路由注册
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/vehicle-monitor', vehicleMonitorRoutes);

// ============================================================
// 404处理
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: `API endpoint not found: ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// 错误处理
// ============================================================

app.use((err, req, res, next) => {
    console.error('[API Error]', err);

    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;

    res.status(status).json({
        code: status,
        message: message,
        ...(details && { details }),
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// 导出（用于 Render / Vercel Serverless）
// ============================================================

export default app;

// 本地开发服务器
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on http://localhost:${PORT}`);
        console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🔗 CORS allowed origin: ${corsOrigin}`);
    });
}