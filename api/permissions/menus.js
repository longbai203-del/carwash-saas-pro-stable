/**
 * api/permissions/menus.js - 获取菜单树
 * GET /api/permissions/menus
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
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

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        let query = supabase
            .from('sys_menu')
            .select('*')
            .eq('is_deleted', false)
            .eq('is_visible', true);

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        query = query.order('sort_order', { ascending: true });

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '获取菜单失败',
                code: 'DB_ERROR'
            });
        }

        // 构建菜单树
        const menus = result.data || [];
        const menuMap = {};
        const tree = [];

        menus.forEach(m => {
            menuMap[m.id] = { ...m, children: [] };
        });

        menus.forEach(m => {
            if (m.parent_id && menuMap[m.parent_id]) {
                menuMap[m.parent_id].children.push(menuMap[m.id]);
            } else {
                tree.push(menuMap[m.id]);
            }
        });

        return res.status(200).json({
            success: true,
            data: tree
        });

    } catch (error) {
        logger.error('[Menus] 获取菜单失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取菜单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);