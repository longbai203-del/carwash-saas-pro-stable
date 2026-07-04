/**
 * api/reports/monthly.js - 月报
 * GET /api/reports/monthly?month=2024-01
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
        const { month } = req.query;

        const reportMonth = month || new Date().toISOString().slice(0, 7);
        const startDate = `${reportMonth}-01`;
        const lastDay = new Date(parseInt(reportMonth.split('-')[0]), parseInt(reportMonth.split('-')[1]), 0).getDate();
        const endDate = `${reportMonth}-${String(lastDay).padStart(2, '0')}`;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        // 获取月订单
        let ordersQuery = supabase
            .from('orders')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);

        if (user?.tenant_id) {
            ordersQuery = ordersQuery.eq('tenant_id', user.tenant_id);
        }

        const { data: orders } = await ordersQuery;

        // 获取月支出
        let expensesQuery = supabase
            .from('expenses')
            .select('*')
            .gte('expense_date', startDate)
            .lte('expense_date', endDate);

        if (user?.tenant_id) {
            expensesQuery = expensesQuery.eq('tenant_id', user.tenant_id);
        }

        const { data: expenses } = await expensesQuery;

        // 日趋势数据
        const dailyTrend = {};
        (orders || []).forEach(o => {
            if (!dailyTrend[o.date]) {
                dailyTrend[o.date] = { revenue: 0, count: 0 };
            }
            dailyTrend[o.date].revenue += (o.total || 0);
            dailyTrend[o.date].count += 1;
        });

        // 计算汇总
        const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = (orders || []).length;
        const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        return res.status(200).json({
            success: true,
            data: {
                month: reportMonth,
                summary: {
                    totalRevenue: totalRevenue,
                    totalOrders: totalOrders,
                    totalExpenses: totalExpenses,
                    netProfit: netProfit,
                    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    totalCustomers: new Set((orders || []).map(o => o.customer_id).filter(id => id)).size
                },
                dailyTrend: dailyTrend,
                orders: orders || [],
                expenses: expenses || []
            }
        });

    } catch (error) {
        logger.error('[MonthlyReport] 获取月报失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取月报失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin', 'manager'])(handler));