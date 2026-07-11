/**
 * 认证中间件
 * 验证JWT令牌和用户权限
 * 
 * @module middleware/auth
 * 
 * @example
 * import { authenticate, requirePermission } from './middleware/auth.js'
 * router.get('/protected', authenticate, requirePermission('users', 'read'), handler)
 */

import jwt from 'jsonwebtoken'
import { authService } from '../shared/auth/index.js'

/**
 * 认证中间件
 * 验证请求中的JWT令牌
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 * @returns {void}
 */
export function authenticate(req, res, next) {
  // 从请求头获取令牌
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No token provided'
    })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Invalid token format'
    })
  }

  try {
    // 验证令牌
    const decoded = authService.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid or expired token'
      })
    }

    // 将用户信息添加到请求对象
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    })
  }
}

/**
 * 权限验证中间件工厂
 * 检查用户是否有指定资源的权限
 * 
 * @param {string} resource - 资源名称 (如 'orders', 'customers')
 * @param {string} action - 操作名称 (如 'read', 'write', 'delete')
 * @returns {Function} 中间件函数
 * 
 * @example
 * router.delete('/orders/:id', 
 *   authenticate,
 *   requirePermission('orders', 'delete'),
 *   orderController.delete
 * )
 */
export function requirePermission(resource, action) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated'
      })
    }

    try {
      // 检查用户是否有权限
      const hasPermission = await authService.hasPermission(
        req.user.id,
        resource,
        action
      )

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied',
          message: `You do not have permission to ${action} ${resource}`
        })
      }

      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        message: error.message
      })
    }
  }
}

/**
 * 角色验证中间件工厂
 * 检查用户是否有指定角色
 * 
 * @param {string|string[]} roles - 允许的角色列表
 * @returns {Function} 中间件函数
 * 
 * @example
 * router.post('/admin', 
 *   authenticate,
 *   requireRole(['admin', 'manager']),
 *   adminController.action
 * )
 */
export function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated'
      })
    }

    try {
      // 检查用户是否有任一允许的角色
      let hasRole = false
      for (const role of allowedRoles) {
        const result = await authService.hasRole(req.user.id, role)
        if (result) {
          hasRole = true
          break
        }
      }

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: `Required roles: ${allowedRoles.join(', ')}`
        })
      }

      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Role check failed',
        message: error.message
      })
    }
  }
}

/**
 * 可选的认证中间件
 * 如果有令牌则验证，但不强制
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 * @returns {void}
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return next()
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return next()
  }

  try {
    const decoded = authService.verifyToken(token)
    if (decoded) {
      req.user = decoded
    }
    next()
  } catch {
    next()
  }
}

export default {
  authenticate,
  requirePermission,
  requireRole,
  optionalAuth
}