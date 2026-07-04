/**
 * api/auth/reset-password.js - 重置密码
 * POST /api/auth/reset-password
 */
import { supabase } from '../_lib/supabase.js';
import { isRequired, isValidPassword } from '../_lib/validation.js';
import { logger } from '../_lib/logger.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const { username, newPassword } = req.body;

        // 验证参数
        const errors = [];
        const usernameError = isRequired(username, '用户名');
        if (usernameError) errors.push(usernameError);
        const passwordError = isValidPassword(newPassword);
        if (passwordError) errors.push(passwordError);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        // 查询用户
        const { data: users, error: queryError } = await supabase
            .from('users')
            .select('id, status')
            .eq('username', username);

        if (queryError) {
            logger.error('[ResetPassword] 查询用户失败:', queryError);
            return res.status(500).json({
                success: false,
                error: '数据库查询失败',
                code: 'DB_ERROR'
            });
        }

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }

        const user = users[0];

        // 检查用户状态
        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                error: '账号未审核通过，无法重置密码',
                code: 'ACCOUNT_NOT_APPROVED'
            });
        }

        // 加密新密码
        const crypto = await import('crypto-js');
        const newHash = crypto.SHA256(newPassword).toString();

        // 更新密码
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newHash })
            .eq('id', user.id);

        if (updateError) {
            logger.error('[ResetPassword] 更新密码失败:', updateError);
            return res.status(500).json({
                success: false,
                error: '密码重置失败',
                code: 'DB_ERROR'
            });
        }

        // 记录审计日志
        await supabase
            .from('audit_logs')
            .insert({
                action: 'RESET_PASSWORD',
                table_name: 'users',
                username: username,
                data: { user_id: user.id },
                created_at: new Date().toISOString()
            });

        return res.status(200).json({
            success: true,
            message: '密码重置成功'
        });

    } catch (error) {
        logger.error('[ResetPassword] 重置密码异常:', error);
        return res.status(500).json({
            success: false,
            error: '密码重置失败',
            code: 'INTERNAL_ERROR'
        });
    }
}