/**
 * api/employees/index.js - 获取员工列表
 * GET /api/employees
 */
import { supabase, getPagination, safeQuery } from '../_lib/supabase.js';
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
        const { page = 1, limit = 20, status, role } = req.query;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id')
            .eq('id', userId)
            .single();

        let query = supabase.from('users').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        // 排除 owner 自己
        query = query.neq('role', 'owner');

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (role && role !== 'all') {
            query = query.eq('role', role);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('created_at', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询员工失败',
                code: 'DB_ERROR'
            });
        }

        // 隐藏密码字段
        const employees = (result.data || []).map(emp => {
            const { password_hash, ...rest } = emp;
            return rest;
        });

        return res.status(200).json({
            success: true,
            data: employees,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.data?.length || 0
            }
        });

    } catch (error) {
        logger.error('[Employees] 获取员工列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取员工列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// 只有 owner 和 admin 可以查看员工列表
export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));