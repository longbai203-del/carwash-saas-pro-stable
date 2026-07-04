/**
 * api/auth/me.js - 获取当前用户信息
 * GET /api/auth/me
 */
import { supabase } from '../_lib/supabase.js';
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
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        // 获取用户详细信息
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, name, role, status, phone, email, tenant_id, store_id, last_login_at, created_at')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error('[Me] 获取用户信息失败:', error);
            return res.status(500).json({
                success: false,
                error: '获取用户信息失败',
                code: 'DB_ERROR'
            });
        }

        // 获取用户权限列表
        const { data: permissions, error: permError } = await supabase
            .from('user_permissions')
            .select('permission_code')
            .eq('user_id', userId);

        if (permError) {
            logger.warn('[Me] 获取权限失败:', permError);
        }

        return res.status(200).json({
            success: true,
            data: {
                ...user,
                permissions: permissions ? permissions.map(p => p.permission_code) : []
            }
        });

    } catch (error) {
        logger.error('[Me] 获取用户信息异常:', error);
        return res.status(500).json({
            success: false,
            error: '获取用户信息失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);