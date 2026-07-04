/**
 * api/customers/index.js - 获取客户列表
 * GET /api/customers
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
        const { page = 1, limit = 20, search, level } = req.query;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        let query = supabase.from('customers').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (user?.store_id && user?.role !== 'owner' && user?.role !== 'admin') {
            query = query.eq('store_id', user.store_id);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,plate_number.ilike.%${search}%`);
        }

        if (level && level !== 'all') {
            query = query.eq('level', level);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('created_at', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询客户失败',
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
        logger.error('[Customers] 获取客户列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取客户列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);