/**
 * api/auth.js - 认证 API
 * POST /api/auth/login
 * POST /api/auth/register
 * GET  /api/auth/me
 * POST /api/auth/logout
 * POST /api/auth/reset-password
 */
import { supabase, getUserById, safeQuery } from './_lib/supabase.js';
import { isRequired, isValidPassword, isValidPhone } from './_lib/validation.js';
import { logger } from './_lib/logger.js';

export default async function handler(req, res) {
    const { method } = req;
    const { path } = req.query;

    // 解析路径：/api/auth/login -> login
    const action = path || req.url.replace('/api/auth/', '').split('?')[0];

    // ===== 登录 =====
    if (action === 'login' && method === 'POST') {
        return handleLogin(req, res);
    }

    // ===== 注册 =====
    if (action === 'register' && method === 'POST') {
        return handleRegister(req, res);
    }

    // ===== 获取当前用户 =====
    if (action === 'me' && method === 'GET') {
        return handleMe(req, res);
    }

    // ===== 登出 =====
    if (action === 'logout' && method === 'POST') {
        return handleLogout(req, res);
    }

    // ===== 重置密码 =====
    if (action === 'reset-password' && method === 'POST') {
        return handleResetPassword(req, res);
    }

    return res.status(404).json({
        success: false,
        error: 'Not found',
        code: 'NOT_FOUND'
    });
}

// ===== 登录 =====
async function handleLogin(req, res) {
    try {
        const { username, password } = req.body;

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

        const crypto = await import('crypto-js');
        const hash = crypto.SHA256(password).toString();

        if (user.password_hash !== hash) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误',
                code: 'INVALID_CREDENTIALS'
            });
        }

        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

        // 生成临时 token
        const token = 'temp_' + Date.now() + '_' + user.id;

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
                token: token
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

// ===== 注册 =====
async function handleRegister(req, res) {
    try {
        const { username, password, name, role, phone, email } = req.body;

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

        const { data: existingUsers } = await supabase
            .from('users')
            .select('id')
            .eq('username', username);

        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                error: '用户名已存在',
                code: 'USERNAME_EXISTS'
            });
        }

        const userRole = role || 'employee';
        if (userRole === 'owner') {
            return res.status(403).json({
                success: false,
                error: '老板账号需管理员创建',
                code: 'ROLE_NOT_ALLOWED'
            });
        }

        const crypto = await import('crypto-js');
        const passwordHash = crypto.SHA256(password).toString();

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

        return res.status(201).json({
            success: true,
            data: newUser,
            message: '注册成功，请等待管理员审核'
        });

    } catch (error) {
        logger.error('[Register] 注册异常:', error);
        return res.status(500).json({
            success: false,
            error: '注册失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 获取当前用户 =====
async function handleMe(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        // 简单解析 token
        const token = authHeader.replace('Bearer ', '');
        const userId = token.split('_')[2];

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '无效的 token',
                code: 'INVALID_TOKEN'
            });
        }

        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }

        const { data: permissions } = await supabase
            .from('user_permissions')
            .select('permission_code')
            .eq('user_id', userId);

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

// ===== 登出 =====
async function handleLogout(req, res) {
    try {
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

// ===== 重置密码 =====
async function handleResetPassword(req, res) {
    try {
        const { username, newPassword } = req.body;

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

        const { data: users } = await supabase
            .from('users')
            .select('id, status')
            .eq('username', username);

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }

        const user = users[0];

        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                error: '账号未审核通过，无法重置密码',
                code: 'ACCOUNT_NOT_APPROVED'
            });
        }

        const crypto = await import('crypto-js');
        const newHash = crypto.SHA256(newPassword).toString();

        await supabase
            .from('users')
            .update({ password_hash: newHash })
            .eq('id', user.id);

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