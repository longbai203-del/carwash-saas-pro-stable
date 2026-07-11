/**
 * @file auth.js
 * @module backend/shared/lib/auth
 * @description 认证和权限服务 - JWT验证、角色权限管理
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

// ============================================================
// 1. 配置
// ============================================================

/** @type {string} Supabase URL */
const supabaseUrl = process.env.SUPABASE_URL;

/** @type {string} Supabase Service Key */
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

/** @type {import('@supabase/supabase-js').SupabaseClient} Supabase客户端 */
const supabase = createClient(supabaseUrl, supabaseKey);

/** @type {string} JWT密钥 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * @typedef {Object} User
 * @property {string} id - 用户ID
 * @property {string} email - 邮箱
 * @property {string} role - 角色
 * @property {string} name - 姓名
 * @property {string|null} tenant_id - 租户ID
 * @property {string|null} business_id - 业务ID
 */

/**
 * @typedef {Object} PermissionResult
 * @property {User} user - 用户信息
 * @property {boolean} allowed - 是否有权限
 */

// ============================================================
// 2. 角色权限映射
// ============================================================

/**
 * @type {Object<string, string[]>}
 * @description 角色权限映射表
 */
const ROLE_PERMISSIONS = {
    /** 管理员 - 所有权限 */
    admin: ['*'],
    
    /** 经理 - 业务管理权限 */
    manager: [
        'dashboard:view',
        'pos:view', 'pos:create', 'pos:edit',
        'orders:view', 'orders:create', 'orders:edit', 'orders:delete',
        'customers:view', 'customers:create', 'customers:edit',
        'products:view', 'products:create', 'products:edit', 'products:delete',
        'inventory:view', 'inventory:create', 'inventory:edit',
        'reports:view', 'reports:export',
        'employees:view', 'employees:create', 'employees:edit',
        'attendance:view', 'attendance:create', 'attendance:edit',
        'finance:view', 'finance:create', 'finance:edit'
    ],
    
    /** 普通员工 - 基本操作权限 */
    staff: [
        'dashboard:view',
        'pos:view', 'pos:create',
        'orders:view', 'orders:create',
        'customers:view', 'customers:create',
        'products:view',
        'attendance:view'
    ],
    
    /** 收银员 - 收银相关权限 */
    cashier: [
        'dashboard:view',
        'pos:view', 'pos:create',
        'orders:view',
        'customers:view', 'customers:create',
        'products:view'
    ]
};

// ============================================================
// 3. 核心函数
// ============================================================

/**
 * @public
 * @param {string} token - JWT Token
 * @returns {Promise<User>} 用户信息
 * @throws {Error} 验证失败时抛出错误
 * @description 验证JWT Token并返回用户信息
 * 
 * @example
 * const user = await verifyToken(token);
 * console.log(user.email);
 */
export async function verifyToken(token) {
    try {
        if (!token) {
            throw new Error('Token不存在');
        }

        // 尝试从Supabase验证
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            // 如果Supabase验证失败，尝试本地JWT验证
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                return {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role || 'staff',
                    name: decoded.name || decoded.email,
                    tenant_id: decoded.tenant_id || null,
                    business_id: decoded.business_id || null
                };
            } catch (jwtError) {
                logger.warn('JWT验证失败:', jwtError.message);
                throw new Error('Token无效或已过期');
            }
        }

        // 获取用户角色和业务信息
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, business_id, full_name, tenant_id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            logger.warn('获取用户资料失败:', profileError.message);
            // 如果profile不存在，使用默认信息
            return {
                id: user.id,
                email: user.email,
                role: 'staff',
                name: user.user_metadata?.full_name || user.email,
                tenant_id: user.user_metadata?.tenant_id || null,
                business_id: user.user_metadata?.business_id || null
            };
        }

        return {
            id: user.id,
            email: user.email,
            role: profile.role || 'staff',
            name: profile.full_name || user.email,
            tenant_id: profile.tenant_id || null,
            business_id: profile.business_id || null
        };
    } catch (error) {
        logger.error('验证Token失败:', error.message);
        throw error;
    }
}

/**
 * @public
 * @param {string|string[]} required - 需要的权限
 * @returns {Function} Express中间件
 * @description 验证用户权限（中间件格式）
 * 
 * @example
 * router.get('/admin', requirePermission(['admin:view']), handler);
 */
export function requirePermission(required) {
    /**
     * @param {import('express').Request} req - Express请求对象
     * @param {import('express').Response} res - Express响应对象
     * @param {import('express').NextFunction} next - 下一个中间件
     */
    return async function(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: '未提供认证Token'
                });
            }

            const user = await verifyToken(token);
            req.user = user;

            // 如果是admin，拥有所有权限
            if (user.role === 'admin') {
                return next();
            }

            // 检查权限
            const userPermissions = ROLE_PERMISSIONS[user.role] || [];
            const requiredPermissions = Array.isArray(required) ? required : [required];
            
            const hasPermission = requiredPermissions.some(perm => 
                userPermissions.includes('*') || userPermissions.includes(perm)
            );

            if (!hasPermission) {
                logger.warn(`用户 ${user.id} (${user.role}) 无权访问: ${requiredPermissions.join(', ')}`);
                return res.status(403).json({
                    success: false,
                    error: '权限不足',
                    required: requiredPermissions,
                    role: user.role
                });
            }

            next();
        } catch (error) {
            logger.error('权限验证失败:', error.message);
            return res.status(401).json({
                success: false,
                error: error.message || '认证失败'
            });
        }
    };
}

/**
 * @public
 * @param {string|string[]} roles - 允许的角色列表
 * @returns {Function} Express中间件
 * @description 验证用户角色（中间件格式）
 * 
 * @example
 * router.get('/admin-only', requireRole(['admin']), handler);
 */
export function requireRole(roles) {
    /**
     * @param {import('express').Request} req - Express请求对象
     * @param {import('express').Response} res - Express响应对象
     * @param {import('express').NextFunction} next - 下一个中间件
     */
    return async function(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: '未提供认证Token'
                });
            }

            const user = await verifyToken(token);
            req.user = user;

            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            
            if (user.role === 'admin') {
                return next();
            }

            if (!allowedRoles.includes(user.role)) {
                logger.warn(`用户 ${user.id} (${user.role}) 不在允许角色中: ${allowedRoles.join(', ')}`);
                return res.status(403).json({
                    success: false,
                    error: '角色权限不足',
                    allowed: allowedRoles,
                    current: user.role
                });
            }

            next();
        } catch (error) {
            logger.error('角色验证失败:', error.message);
            return res.status(401).json({
                success: false,
                error: error.message || '认证失败'
            });
        }
    };
}

/**
 * @public
 * @param {import('express').Request} req - Express请求对象
 * @param {import('express').Response} res - Express响应对象
 * @param {import('express').NextFunction} next - 下一个中间件
 * @description 获取当前用户（中间件）
 * 
 * @example
 * router.get('/me', getCurrentUser, (req, res) => {
 *   res.json(req.user);
 * });
 */
export async function getCurrentUser(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            req.user = null;
            return next();
        }

        const user = await verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
}

/**
 * @public
 * @param {string} token - JWT Token
 * @param {string|string[]} required - 需要的权限
 * @returns {Promise<PermissionResult>} 验证结果
 * @throws {Error} 验证失败时抛出错误
 * @description 验证用户权限（函数调用格式，用于非中间件场景）
 * 
 * @example
 * const { user, allowed } = await validatePermission(token, 'admin:view');
 * if (!allowed) throw new Error('权限不足');
 */
export async function validatePermission(token, required) {
    try {
        if (!token) {
            throw new Error('Token不存在');
        }

        const user = await verifyToken(token);
        
        if (user.role === 'admin') {
            return { user, allowed: true };
        }

        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        const requiredPermissions = Array.isArray(required) ? required : [required];
        
        const allowed = requiredPermissions.some(perm => 
            userPermissions.includes('*') || userPermissions.includes(perm)
        );

        return { user, allowed };
    } catch (error) {
        throw new Error(`权限验证失败: ${error.message}`);
    }
}

// ============================================================
// 4. 导出
// ============================================================

export default {
    verifyToken,
    requirePermission,
    requireRole,
    getCurrentUser,
    validatePermission,
    ROLE_PERMISSIONS
};