/**
 * api/reports/daily.js - 日报
 * GET /api/reports/daily?date=2024-01-01
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware, roleMiddleware } from '../_lib/auth.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const userId = req.user?.id;
        const { date } = req.query;

        const reportDate = date || new Date().toISOString().split('T')[0];

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        // 获取当日订单
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

        // 获取当日支出
        let expensesQuery = supabase
            .from('expenses')
            .select('*')
            .eq('expense_date', reportDate);

        if (user?.tenant_id) {
            expensesQuery = expensesQuery.eq('tenant_id', user.tenant_id);
        }

        const { data: expenses } = await expensesQuery;

        // 计算统计数据
        const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = (orders || []).length;
        const pendingOrders = (orders || []).filter(o => o.status === 'pending' || o.status === 'confirmed').length;
        const completedOrders = (orders || []).filter(o => o.status === 'completed').length;
        const cancelledOrders = (orders || []).filter(o => o.status === 'cancelled').length;

        const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        // 按支付方式统计
        const paymentStats = {};
        (orders || []).forEach(o => {
            const method = o.payment_method || 'other';
            paymentStats[method] = (paymentStats[method] || 0) + (o.total || 0);
        });

        // 按服务统计
        const serviceStats = {};
        (orders || []).forEach(o => {
            const name = o.service_name || '其他';
            serviceStats[name] = (serviceStats[name] || 0) + (o.total || 0);
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
                    cancelledOrders: cancelledOrders,
                    totalExpenses: totalExpenses,
                    netProfit: netProfit,
                    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
                },
                paymentBreakdown: paymentStats,
                serviceBreakdown: serviceStats,
                orders: orders || [],
                expenses: expenses || []
            }
        });

    } catch (error) {
        logger.error('[DailyReport] 获取日报失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取日报失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin', 'manager'])(handler));