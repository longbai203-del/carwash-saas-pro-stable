// backend/api/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 加载环境变量（必须最先执行）
dotenv.config();

// 导入局部路由
import healthRoute from './health.js';
import authRoute from './auth.js';
import ordersRoute from './orders.js';
import customersRoute from './customers.js';
import productsRoute from './products.js';
import inventoryRoute from './inventory.js';
import reportsRoute from './reports.js';
import vehicleMonitorRoute from './vehicle-monitor.js';
import employeesRoute from './employees.js';
import permissionsRoute from './permissions.js';
import attendanceRoute from './attendance.js';

// 导入统一错误处理器 (第二阶段修复的文件)
import { errorHandler } from '../shared/lib/auth.js';

const app = express();

/**
 * 基础中间件配置
 * @description 全局CORS、安全头、JSON解析
 */
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // 增加JSON大小限制
app.use(express.urlencoded({ extended: true }));

/**
 * 健康检查接口
 * @name GET /api/health
 * @function
 * @returns {Object} 包含服务器状态和时间戳
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// --- API 路由挂载 ---
app.use('/api/auth', authRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/customers', customersRoute);
app.use('/api/products', productsRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/vehicle', vehicleMonitorRoute);
app.use('/api/employees', employeesRoute);
app.use('/api/permissions', permissionsRoute);
app.use('/api/attendance', attendanceRoute);

// --- 404 处理器 ---
app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: 'ROUTE_NOT_FOUND',
        message: `请求的接口 [${req.method}] ${req.originalUrl} 不存在`
    });
});

// --- 全局错误处理中间件 (必须放在最后) ---
app.use(errorHandler);

/**
 * 启动服务
 * @description 监听端口，支持优雅关闭
 */
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ 后端服务已启动，监听端口 ${PORT}`);
        console.log(`   Health 检查地址: http://localhost:${PORT}/api/health`);
    });

    // 优雅关闭 (Render/Signal 友好)
    const gracefulShutdown = () => {
        console.log('接收到关闭信号，正在关闭服务器...');
        server.close(() => {
            console.log('服务器已成功关闭');
            process.exit(0);
        });
        // 如果关闭超时，则强制退出
        setTimeout(() => {
            console.error('服务器关闭超时，强制退出');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

export default app;