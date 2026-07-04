/**
 * api/reports.js - 报表 API
 * GET /api/reports/daily
 * GET /api/reports/monthly
 */
import { supabase, safeQuery, getUserById } from './_lib/supabase.js';
import { authMiddleware, roleMiddleware } from './_lib/auth.js';
import { logger } from './_lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { type } = req.query;

    if (method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    if (type === 'daily') {
        return handleDaily(req, res);
    }

    if (type === 'monthly') {
        return handleMonthly(req, res);
    }

    return res.status(400).json({
        success: false,
        error: '请指定报表类型: daily 或 monthly',
        code: 'INVALID_TYPE'
    });
}

// ===== 日报 =====
async function handleDaily(req, res) {
    try {
        const userId = req.user?.id;
        const { date } = req.query;

        const reportDate = date || new Date().toISOString().split('T')[0];

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let ordersQuery = supabase
            .from('orders')
            .select('*')
            .eq('date', reportDate);

        if (user?.tenant_id) {
            ordersQuery = ordersQuery.eq('tenant_id', user.tenant_id);
        }
        if (user?.store_id) {
            ordersQuery = ordersQuery.eq('store_id', user.store_id);
        }

        const { data: orders } = await ordersQuery;

        const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = (orders || []).length;
        const pendingOrders = (orders || []).filter(o => o.status === 'pending' || o.status === 'confirmed').length;
        const completedOrders = (orders || []).filter(o => o.status === 'completed').length;

        const paymentStats = {};
        (orders || []).forEach(o => {
            const method = o.payment_method || 'other';
            paymentStats[method] = (paymentStats[method] || 0) + (o.total || 0);
        });

        return res.status(200).json({
            success: true,
            data: {
                date: reportDate,
                summary: {
                    totalRevenue: totalRevenue,
                    totalOrders: totalOrders,
                    pendingOrders: pendingOrders,
                    completedOrders: completedOrders,
                    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                paymentBreakdown: paymentStats,
                orders: orders || []
            }
        });

    } catch (error) {
        logger.error('[Reports] 获取日报失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取日报失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 月报 =====
async function handleMonthly(req, res) {
    try {
        const userId = req.user?.id;
        const { month } = req.query;

        const reportMonth = month || new Date().toISOString().slice(0, 7);
        const startDate = `${reportMonth}-01`;
        const lastDay = new Date(parseInt(reportMonth.split('-')[0]), parseInt(reportMonth.split('-')[1]), 0).getDate();
        const endDate = `${reportMonth}-${String(lastDay).padStart(2, '0')}`;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let ordersQuery = supabase
            .from('orders')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);

        if (user?.tenant_id) {
            ordersQuery = ordersQuery.eq('tenant_id', user.tenant_id);
        }

        const { data: orders } = await ordersQuery;

        const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = (orders || []).length;

        const dailyTrend = {};
        (orders || []).forEach(o => {
            if (!dailyTrend[o.date]) {
                dailyTrend[o.date] = { revenue: 0, count: 0 };
            }
            dailyTrend[o.date].revenue += (o.total || 0);
            dailyTrend[o.date].count += 1;
        });

        return res.status(200).json({
            success: true,
            data: {
                month: reportMonth,
                summary: {
                    totalRevenue: totalRevenue,
                    totalOrders: totalOrders,
                    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                dailyTrend: dailyTrend,
                orders: orders || []
            }
        });

    } catch (error) {
        logger.error('[Reports] 获取月报失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取月报失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin', 'manager'])(handler));