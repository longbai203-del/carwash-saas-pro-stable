/**
 * shared/lib/auth.js - JWT认证中间件
 */

import jwt from 'jsonwebtoken';
import { supabase } from './supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'carwash-saas-pro-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload, options = {}) {
    const expiresIn = options.expiresIn || JWT_EXPIRES_IN;
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('[Auth] 令牌验证失败:', error.message);
        return null;
    }
}

export function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                code: 401,
                message: '未提供认证令牌'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                code: 401,
                message: '无效或过期的认证令牌'
            });
        }

        supabase
            .from('users')
            .select('id, email, name, role, status')
            .eq('id', decoded.id)
            .single()
            .then(({ data: user, error }) => {
                if (error || !user) {
                    return res.status(401).json({
                        code: 401,
                        message: '用户不存在或已被禁用'
                    });
                }

                if (user.status !== 'active') {
                    return res.status(403).json({
                        code: 403,
                        message: '用户账户已被禁用'
                    });
                }

                req.user = user;
                req.token = token;
                req.tokenPayload = decoded;
                next();
            })
            .catch((error) => {
                console.error('[Auth] 认证中间件错误:', error);
                return res.status(500).json({
                    code: 500,
                    message: '认证服务错误'
                });
            });

    } catch (error) {
        console.error('[Auth] 认证中间件错误:', error);
        return res.status(500).json({
            code: 500,
            message: '认证服务错误'
        });
    }
}

export function requireRole(roles) {
    return function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                message: '请先登录'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 403,
                message: '需要以下角色之一: ' + roles.join(', ')
            });
        }

        next();
    };
}

export function requirePermission(permissions) {
    return function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                message: '请先登录'
            });
        }

        supabase
            .from('user_permissions')
            .select('permission')
            .eq('user_id', req.user.id)
            .then(({ data: userPermissions, error }) => {
                if (error) {
                    console.error('[Auth] 查询权限失败:', error);
                    return res.status(500).json({
                        code: 500,
                        message: '权限查询失败'
                    });
                }

                const userPerms = userPermissions.map(p => p.permission);
                const hasPermission = permissions.some(p => userPerms.includes(p));

                if (!hasPermission && req.user.role !== 'admin') {
                    return res.status(403).json({
                        code: 403,
                        message: '需要以下权限之一: ' + permissions.join(', ')
                    });
                }

                next();
            })
            .catch((error) => {
                console.error('[Auth] 权限检查错误:', error);
                return res.status(500).json({
                    code: 500,
                    message: '权限检查失败'
                });
            });
    };
}

export function getCurrentUser(req) {
    return req.user || null;
}

// 别名导出 - 供其他文件使用
export const authMiddleware = authenticate;
export const roleMiddleware = requireRole;

export default {
    generateToken,
    verifyToken,
    authenticate,
    requireRole,
    requirePermission,
    getCurrentUser,
    authMiddleware: authenticate,
    roleMiddleware: requireRole
};
