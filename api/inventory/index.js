/**
 * api/inventory/index.js - 获取库存列表
 * GET /api/inventory
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
        const { page = 1, limit = 20, search, category, low_stock } = req.query;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id')
            .eq('id', userId)
            .single();

        let query = supabase.from('products').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (category && category !== 'all') {
            query = query.eq('category_id', category);
        }

        if (low_stock === 'true') {
            query = query.lt('current_quantity', supabase.raw('min_quantity'));
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('name', { ascending: true }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询库存失败',
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
        logger.error('[Inventory] 获取库存列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取库存列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);