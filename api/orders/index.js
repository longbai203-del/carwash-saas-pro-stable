/**
 * api/orders/index.js - 获取订单列表
 * GET /api/orders
 * 支持分页和筛选
 */
import { supabase, getPagination, safeQuery } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
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
        const { page = 1, limit = 20, status, date, customer_id, startDate, endDate } = req.query;

        // 获取用户上下文
        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        // 构建查询
        let query = supabase.from('orders').select('*', { count: 'exact' });

        // 租户隔离
        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        // 门店过滤（非 owner/admin 只能看自己门店）
        if (user?.store_id && user?.role !== 'owner' && user?.role !== 'admin') {
            query = query.eq('store_id', user.store_id);
        }

        // 状态筛选
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // 日期筛选
        if (date) {
            query = query.eq('date', date);
        }

        // 日期范围筛选
        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        // 客户筛选
        if (customer_id) {
            query = query.eq('customer_id', customer_id);
        }

        // 分页
        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('created_at', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询订单失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.data?.length || 0
            }
        });

    } catch (error) {
        logger.error('[Orders] 获取订单列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取订单列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);