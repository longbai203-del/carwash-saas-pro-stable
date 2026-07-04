/**
 * api/auth/register.js - 用户注册
 * POST /api/auth/register
 */
import { supabase } from '../_lib/supabase.js';
import { isRequired, isValidPassword, isValidPhone } from '../_lib/validation.js';
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
        const { username, password, name, role, phone, email } = req.body;

        // 验证参数
        const errors = [];
        const usernameError = isRequired(username, '用户名');
        if (usernameError) errors.push(usernameError);
        const passwordError = isValidPassword(password);
        if (passwordError) errors.push(passwordError);
        if (phone) {
            const phoneError = isValidPhone(phone);
            if (phoneError) errors.push(phoneError);
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        // 检查用户名是否已存在
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username);

        if (checkError) {
            logger.error('[Register] 检查用户名失败:', checkError);
            return res.status(500).json({
                success: false,
                error: '数据库查询失败',
                code: 'DB_ERROR'
            });
        }

        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                error: '用户名已存在',
                code: 'USERNAME_EXISTS'
            });
        }

        // 禁止注册 owner 角色
        const userRole = role || 'employee';
        if (userRole === 'owner') {
            return res.status(403).json({
                success: false,
                error: '老板账号需管理员创建',
                code: 'ROLE_NOT_ALLOWED'
            });
        }

        // 加密密码
        const crypto = await import('crypto-js');
        const passwordHash = crypto.SHA256(password).toString();

        // 创建用户
        const userData = {
            username: username,
            password_hash: passwordHash,
            name: name || username,
            role: userRole,
            status: 'pending',
            phone: phone || null,
            email: email || null,
            registered_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert(userData)
            .select('id, username, name, role, status, phone, email')
            .single();

        if (insertError) {
            logger.error('[Register] 创建用户失败:', insertError);
            return res.status(500).json({
                success: false,
                error: '注册失败，请稍后重试',
                code: 'DB_ERROR'
            });
        }

        // 记录审计日志
        await supabase
            .from('audit_logs')
            .insert({
                action: 'REGISTER',
                table_name: 'users',
                username: username,
                data: { user_id: newUser.id, role: userRole },
                created_at: new Date().toISOString()
            });

        return res.status(201).json({
            success: true,
            data: newUser,
            message: '注册成功，请等待管理员审核'
        });

    } catch (error) {
        logger.error('[Register] 注册异常:', error);
        return res.status(500).json({
            success: false,
            error: '注册失败，请稍后重试',
            code: 'INTERNAL_ERROR'
        });
    }
}