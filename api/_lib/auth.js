/**
 * api/_lib/auth.js - JWT 验证中间件
 */
import { getUserFromRequest } from './supabase.js';

/**
 * 验证 JWT 中间件
 * 用法: export default authMiddleware(handler)
 */
export function authMiddleware(handler) {
    return async function(req, res) {
        try {
            // 获取用户信息
            const user = await getUserFromRequest(req);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: '未授权，请先登录',
                    code: 'UNAUTHORIZED'
                });
            }
            
            // 将用户信息附加到请求对象
            req.user = user;
            
            // 继续执行处理器
            return handler(req, res);
        } catch (error) {
            console.error('[Auth] 验证失败:', error);
            return res.status(401).json({
                success: false,
                error: '认证失败',
                code: 'AUTH_FAILED'
            });
        }
    };
}

/**
 * 可选认证（不强制登录）
 */
export function optionalAuthMiddleware(handler) {
    return async function(req, res) {
        try {
            const user = await getUserFromRequest(req);
            req.user = user;
            return handler(req, res);
        } catch (error) {
            req.user = null;
            return handler(req, res);
        }
    };
}

/**
 * 角色验证中间件
 * 用法: export default roleMiddleware(['owner', 'admin'])(handler)
 */
export function roleMiddleware(allowedRoles) {
    return function(handler) {
        return async function(req, res) {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: '未授权',
                    code: 'UNAUTHORIZED'
                });
            }
            
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    error: '权限不足，需要角色: ' + allowedRoles.join(', '),
                    code: 'FORBIDDEN'
                });
            }
            
            return handler(req, res);
        };
    };
}

/**
 * 生成 JWT（用于测试或特殊场景）
 * 注意：Supabase 会自动生成 JWT，此函数仅用于特殊场景
 */
export function generateToken(userId, email) {
    // 使用 Supabase 的 admin API 生成 token
    // 或者使用第三方库如 jsonwebtoken
    // 这里使用 Supabase 的 admin 方法
    const { supabase } = require('./supabase.js');
    // 实际实现需要根据 Supabase 版本调整
    return null;
}

console.log('[Auth] ✅ 认证中间件已加载');