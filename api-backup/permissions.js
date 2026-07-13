/**
 * api/permissions.js - 权限 API
 * GET /api/permissions/roles
 * GET /api/permissions/menus
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

    if (type === 'roles') {
        return handleRoles(req, res);
    }

    if (type === 'menus') {
        return handleMenus(req, res);
    }

    return res.status(400).json({
        success: false,
        error: '请指定类型: roles 或 menus',
        code: 'INVALID_TYPE'
    });
}

// ===== 角色列表 =====
async function handleRoles(req, res) {
    try {
        const userId = req.user?.id;
        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

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
        logger.error('[Permissions] 获取角色失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取角色失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 菜单树 =====
async function handleMenus(req, res) {
    try {
        const userId = req.user?.id;
        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

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
        logger.error('[Permissions] 获取菜单失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取菜单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));