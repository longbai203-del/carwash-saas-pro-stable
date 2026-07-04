/**
 * api/attendance/index.js - 获取考勤记录
 * GET /api/attendance
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
        const { page = 1, limit = 20, date, employee_id } = req.query;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        let query = supabase.from('attendance').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (date) {
            query = query.eq('date', date);
        }

        // 普通员工只能看自己的考勤
        if (user?.role === 'employee' || user?.role === 'cashier') {
            query = query.eq('employee_id', userId);
        } else if (employee_id) {
            query = query.eq('employee_id', employee_id);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('time', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询考勤失败',
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
        logger.error('[Attendance] 获取考勤失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取考勤失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);