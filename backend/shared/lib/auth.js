/**
 * shared/lib/auth.js - 认证和授权中间件
 * @module auth
 * @description 提供 JWT 认证、角色授权等中间件
 */

import { supabase, getUserById } from './supabase.js';
import { logger } from './logger.js';

/**
 * 认证中间件 - 验证请求中的 JWT token
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express 下一个中间件
 * @returns {void}
 */
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: '未授权，请先登录',
                code: 'UNAUTHORIZED'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // 简单解析 token（生产环境应使用 JWT 验证）
        const userId = token.split('_')[2];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '无效的认证令牌',
                code: 'INVALID_TOKEN'
            });
        }

        const user = await getUserById(userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }

        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                error: '账号未激活，请联系管理员',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('[Auth] 认证失败:', error);
        return res.status(500).json({
            success: false,
            error: '认证失败，请稍后重试',
            code: 'AUTH_ERROR'
        });
    }
}

/**
 * 角色授权中间件 - 检查用户是否有指定角色
 * @param {Array<string>} allowedRoles - 允许的角色列表
 * @returns {Function} Express 中间件
 */
export function roleMiddleware(allowedRoles) {
    return function(req, res, next) {
        try {
            // 确保 req.user 存在（先经过 authenticate）
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: '未授权，请先登录',
                    code: 'UNAUTHORIZED'
                });
            }

            const userRole = req.user.role;
            
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    error: `权限不足，需要以下角色之一: ${allowedRoles.join(', ')}`,
                    code: 'FORBIDDEN'
                });
            }

            next();
        } catch (error) {
            logger.error('[Role] 角色验证失败:', error);
            return res.status(500).json({
                success: false,
                error: '权限验证失败',
                code: 'ROLE_ERROR'
            });
        }
    };
}

/**
 * 组合中间件 - 先认证再授权
 * @param {Array<string>} allowedRoles - 允许的角色列表
 * @returns {Array<Function>} 中间件数组
 */
export function authAndRole(allowedRoles) {
    return [authenticate, roleMiddleware(allowedRoles)];
}

/**
 * 认证中间件包装器（兼容旧版用法）
 * @param {Function} handler - 路由处理器
 * @returns {Function} 包装后的处理器
 */
export function authMiddleware(handler) {
    return async function(req, res, next) {
        try {
            // 先执行认证
            await new Promise((resolve, reject) => {
                authenticate(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            // 认证通过后执行原始 handler
            return handler(req, res, next);
        } catch (error) {
            // 如果认证失败，错误响应已在 authenticate 中发送
            // 这里只捕获其他错误
            if (error) {
                logger.error('[AuthMiddleware] 认证失败:', error);
                return res.status(500).json({
                    success: false,
                    error: '认证失败',
                    code: 'AUTH_ERROR'
                });
            }
        }
    };
}

/**
 * 角色中间件包装器（兼容旧版用法）
 * @param {Array<string>} allowedRoles - 允许的角色列表
 * @param {Function} handler - 路由处理器
 * @returns {Function} 包装后的处理器
 */
export function roleMiddlewareWrapper(allowedRoles) {
    return function(handler) {
        return async function(req, res, next) {
            try {
                // 先执行认证
                await new Promise((resolve, reject) => {
                    authenticate(req, res, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                // 再检查角色
                const userRole = req.user?.role;
                if (!allowedRoles.includes(userRole)) {
                    return res.status(403).json({
                        success: false,
                        error: `权限不足，需要以下角色之一: ${allowedRoles.join(', ')}`,
                        code: 'FORBIDDEN'
                    });
                }
                
                return handler(req, res, next);
            } catch (error) {
                logger.error('[RoleMiddleware] 认证失败:', error);
                return res.status(500).json({
                    success: false,
                    error: '认证失败',
                    code: 'AUTH_ERROR'
                });
            }
        };
    };
}

// 导出默认对象（兼容旧版）
export default {
    authenticate,
    roleMiddleware,
    authAndRole,
    authMiddleware,
    roleMiddlewareWrapper
};

// ============================================================
// 🔥 关键修复：添加 requireRole 别名（兼容 orders.js）
// ============================================================
export const requireRole = roleMiddleware;