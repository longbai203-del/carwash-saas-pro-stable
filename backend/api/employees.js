/**
 * api/employees.js - 员工 API
 * GET    /api/employees
 * POST   /api/employees/approve
 */
// ❌ 旧路径（错误）
// import { supabase, getPagination, safeQuery, getUserById } from '../shared/lib/supabase.js';

// ✅ 新路径（正确）
import { supabase, getPagination, safeQuery, getUserById } from '../shared/lib/supabase.js';
import { authMiddleware } from '../shared/lib/auth.js';
import { isRequired } from '../shared/lib/validation.js';
import { logger } from '../shared/lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { action } = req.query;

    // GET /api/employees - 列表
    if (method === 'GET' && !action) {
        return handleList(req, res);
    }

    // POST /api/employees/approve - 审核
    if (method === 'POST' && action === 'approve') {
        return handleApprove(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ===== 员工列表 =====
async function handleList(req, res) {
    try {
        const { page = 1, limit = 20, status, role } = req.query;

        let query = supabase.from('users').select('*', { count: 'exact' });
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

// ===== 审核员工 =====
async function handleApprove(req, res) {
    try {
        const { userId, status, note } = req.body;
        const adminId = req.user?.id;

        const errors = [];
        const userIdError = isRequired(userId, '用户ID');
        if (userIdError) errors.push(userIdError);
        const statusError = isRequired(status, '审核状态');
        if (statusError) errors.push(statusError);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '无效的审核状态',
                code: 'INVALID_STATUS'
            });
        }

        const { data: targetUser } = await supabase
            .from('users')
            .select('id, status, username, role')
            .eq('id', userId)
            .single();

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }

        if (targetUser.role === 'owner') {
            return res.status(403).json({
                success: false,
                error: '不能审核老板账号',
                code: 'FORBIDDEN'
            });
        }

        const updateData = {
            status: status,
            approved_by: adminId,
            approved_at: new Date().toISOString(),
            note: note || null
        };

        const result = await safeQuery(() =>
            supabase.from('users').update(updateData).eq('id', userId).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '审核失败',
                code: 'DB_ERROR'
            });
        }

        const message = status === 'approved' ? '用户已审核通过' : '用户已拒绝';
        return res.status(200).json({
            success: true,
            data: result.data,
            message: message
        });

    } catch (error) {
        logger.error('[Employees] 审核员工失败:', error);
        return res.status(500).json({
            success: false,
            error: '审核失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);