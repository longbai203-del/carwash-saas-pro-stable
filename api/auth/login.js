/**
 * api/auth/login.js - 用户登录
 * POST /api/auth/login
 */
import { supabase } from '../_lib/supabase.js';
import { isRequired, isValidPassword } from '../_lib/validation.js';
import { logger } from '../_lib/logger.js';

export default async function handler(req, res) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const { username, password } = req.body;

        // 验证参数
        const errors = [];
        const usernameError = isRequired(username, '用户名');
        if (usernameError) errors.push(usernameError);
        const passwordError = isRequired(password, '密码');
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
            .select('*')
            .eq('username', username);

        if (queryError) {
            logger.error('[Login] 查询用户失败:', queryError);
            return res.status(500).json({
                success: false,
                error: '数据库查询失败',
                code: 'DB_ERROR'
            });
        }

        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const user = users[0];

        // 检查用户状态
        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                error: '账号正在审核中，请等待管理员审核',
                code: 'ACCOUNT_PENDING'
            });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({
                success: false,
                error: '账号已被拒绝，请联系管理员',
                code: 'ACCOUNT_REJECTED'
            });
        }

        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                error: '账号状态异常',
                code: 'ACCOUNT_INVALID'
            });
        }

        // 验证密码（使用 CryptoJS）
        const crypto = await import('crypto-js');
        const hash = crypto.SHA256(password).toString();
        
        if (user.password_hash !== hash) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // 使用 Supabase Auth 生成 session
        let token = null;
        let sessionUser = null;

        try {
            // 尝试使用 Supabase Auth 登录
            const email = user.email || `${user.username}@carwash.local`;
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (!authError && authData?.session) {
                token = authData.session.access_token;
                sessionUser = authData.user;
            }
        } catch (authError) {
            // 如果 Supabase Auth 失败，使用自定义 token
            logger.warn('[Login] Supabase Auth 登录失败，使用自定义方式:', authError.message);
        }

        // 更新最后登录时间
        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

        // 返回用户信息
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    email: user.email,
                    phone: user.phone,
                    tenant_id: user.tenant_id,
                    store_id: user.store_id
                },
                token: token || null
            },
            message: '登录成功'
        });

    } catch (error) {
        logger.error('[Login] 登录异常:', error);
        return res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试',
            code: 'INTERNAL_ERROR'
        });
    }
}