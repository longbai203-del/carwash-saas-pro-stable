/**
 * api/auth/logout.js - 用户登出
 * POST /api/auth/logout
 */
import { supabase } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const userId = req.user?.id;
        
        // 记录登出日志
        if (userId) {
            await supabase
                .from('audit_logs')
                .insert({
                    action: 'LOGOUT',
                    table_name: 'users',
                    user_id: userId,
                    username: req.user?.username || 'unknown',
                    created_at: new Date().toISOString()
                });
        }

        // Supabase 登出由前端处理
        return res.status(200).json({
            success: true,
            message: '登出成功'
        });

    } catch (error) {
        logger.error('[Logout] 登出异常:', error);
        return res.status(500).json({
            success: false,
            error: '登出失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);