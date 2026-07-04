/**
 * api/employees/approve.js - 审核员工
 * POST /api/employees/approve
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware, roleMiddleware } from '../_lib/auth.js';
import { isRequired } from '../_lib/validation.js';
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
                error: '无效的审核状态，必须是 approved 或 rejected',
                code: 'INVALID_STATUS'
            });
        }

        // 检查被审核用户是否存在
        const { data: targetUser } = await supabase
            .from('users')
            .select('id, status, username')
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

        // 更新用户状态
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

        // 记录审计日志
        await supabase.from('audit_logs').insert({
            action: status === 'approved' ? 'APPROVE_USER' : 'REJECT_USER',
            table_name: 'users',
            record_id: userId,
            username: req.user?.username || 'system',
            data: { status, note },
            created_at: new Date().toISOString()
        });

        const message = status === 'approved' ? '用户已审核通过' : '用户已拒绝';
        return res.status(200).json({
            success: true,
            data: result.data,
            message: message
        });

    } catch (error) {
        logger.error('[Approve] 审核员工失败:', error);
        return res.status(500).json({
            success: false,
            error: '审核失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));