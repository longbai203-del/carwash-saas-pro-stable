/**
 * api/permissions/roles.js - 获取角色列表
 * GET /api/permissions/roles
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

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', userId)
            .single();

        let query = supabase.from('sys_role').select('*');

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        query = query.order('sort_order', { ascending: true });

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '获取角色失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data || []
        });

    } catch (error) {
        logger.error('[Roles] 获取角色失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取角色失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));