/**
 * 认证模块
 * 处理JWT令牌生成、验证和权限检查
 * 
 * @module shared/auth
 * 
 * @example
 * import { authService, validateAuth } from '../shared/auth/index.js'
 * const token = authService.generateToken({ id: user.id, email: user.email })
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

/**
 * 认证服务类
 * 提供认证和授权功能
 */
class AuthService {
  /**
   * 创建认证服务实例
   */
  constructor() {
    /** @type {string} */
    this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    
    /** @type {string} */
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d'
    
    /** @type {import('@supabase/supabase-js').SupabaseClient} */
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - 令牌载荷
   * @param {string|number} payload.id - 用户ID
   * @param {string} payload.email - 用户邮箱
   * @param {string} [payload.tenant_id] - 租户ID
   * @param {Object} [options] - 令牌选项
   * @returns {string} JWT令牌
   */
  generateToken(payload, options = {}) {
    return jwt.sign(payload, this.secret, {
      expiresIn: options.expiresIn || this.expiresIn,
      ...options
    })
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Object|null} 解码后的载荷或null
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret)
    } catch (error) {
      console.warn('Token verification failed:', error.message)
      return null
    }
  }

  /**
   * 刷新JWT令牌
   * @param {string} token - 旧令牌
   * @returns {Object} 新令牌和旧令牌信息
   */
  refreshToken(token) {
    const decoded = this.verifyToken(token)
    if (!decoded) {
      throw new Error('Invalid token')
    }

    // 移除过期时间相关字段
    const { exp, iat, ...payload } = decoded
    
    const newToken = this.generateToken(payload)
    return {
      token: newToken,
      expiresIn: this.expiresIn,
      decoded: payload
    }
  }

  /**
   * 哈希密码
   * @param {string} password - 明文密码
   * @param {number} saltRounds - 盐轮数
   * @returns {Promise<string>} 哈希后的密码
   */
  async hashPassword(password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * 验证密码
   * @param {string} password - 明文密码
   * @param {string} hash - 哈希密码
   * @returns {Promise<boolean>} 是否匹配
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash)
  }

  /**
   * 检查用户是否有权限
   * @param {string} userId - 用户ID
   * @param {string} resource - 资源名称
   * @param {string} action - 操作名称
   * @returns {Promise<boolean>} 是否有权限
   */
  async hasPermission(userId, resource, action) {
    try {
      // 检查用户权限表
      const { data, error } = await this.supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('resource', resource)
        .eq('action', action)
        .maybeSingle()

      if (error) {
        console.error('Permission check error:', error)
        return false
      }

      if (data) return true

      // 检查角色权限
      const { data: roles } = await this.supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)

      if (!roles || roles.length === 0) return false

      const roleIds = roles.map(r => r.role_id)
      
      const { data: rolePermissions } = await this.supabase
        .from('roles')
        .select('permissions')
        .in('id', roleIds)

      if (!rolePermissions) return false

      // 检查角色权限中是否包含该权限
      for (const role of rolePermissions) {
        const permissions = role.permissions || []
        if (permissions.some(p => p.resource === resource && p.action === action)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }

  /**
   * 检查用户是否有角色
   * @param {string} userId - 用户ID
   * @param {string|string[]} roles - 角色名称或角色列表
   * @returns {Promise<boolean>} 是否有角色
   */
  async hasRole(userId, roles) {
    try {
      const roleNames = Array.isArray(roles) ? roles : [roles]
      
      const { data, error } = await this.supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)

      if (error || !data || data.length === 0) return false

      const roleIds = data.map(r => r.role_id)
      
      const { data: rolesData } = await this.supabase
        .from('roles')
        .select('name')
        .in('id', roleIds)

      if (!rolesData) return false

      const userRoleNames = rolesData.map(r => r.name)
      return roleNames.some(role => userRoleNames.includes(role))
    } catch (error) {
      console.error('Role check failed:', error)
      return false
    }
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息
   */
  async getUser(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, avatar_url, role, is_active, tenant_id')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user failed:', error)
      return null
    }
  }

  /**
   * 获取用户权限列表
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 权限列表
   */
  async getUserPermissions(userId) {
    try {
      // 获取直接权限
      const { data: directPermissions } = await this.supabase
        .from('user_permissions')
        .select('resource, action')
        .eq('user_id', userId)

      // 获取角色权限
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)

      let rolePermissions = []
      if (userRoles && userRoles.length > 0) {
        const roleIds = userRoles.map(r => r.role_id)
        const { data: roles } = await this.supabase
          .from('roles')
          .select('permissions')
          .in('id', roleIds)
        
        if (roles) {
          rolePermissions = roles.flatMap(r => r.permissions || [])
        }
      }

      // 合并权限（去重）
      const allPermissions = [...(directPermissions || []), ...rolePermissions]
      const uniquePermissions = []
      const seen = new Set()
      
      for (const p of allPermissions) {
        const key = `${p.resource}:${p.action}`
        if (!seen.has(key)) {
          seen.add(key)
          uniquePermissions.push(p)
        }
      }

      return uniquePermissions
    } catch (error) {
      console.error('Get user permissions failed:', error)
      return []
    }
  }
}

/**
 * 验证工具
 */
export const validateAuth = {
  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {boolean} 是否有效
   */
  password: (password) => password && password.length >= 8,

  /**
   * 验证用户名
   * @param {string} username - 用户名
   * @returns {boolean} 是否有效
   */
  username: (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username),

  /**
   * 验证手机号
   * @param {string} phone - 手机号
   * @returns {boolean} 是否有效
   */
  phone: (phone) => /^[\d\s\-+()]{7,20}$/.test(phone)
}

// 导出单例
export const authService = new AuthService()

export default {
  authService,
  validateAuth
}