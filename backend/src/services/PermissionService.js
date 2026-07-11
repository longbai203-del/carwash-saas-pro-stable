/**
 * 权限服务
 * 处理权限管理相关的业务逻辑
 * 
 * @module services/PermissionService
 * @extends BaseService
 * 
 * @example
 * import PermissionService from './PermissionService.js'
 * const permissionService = new PermissionService()
 * await permissionService.assignPermission(userId, resource, action)
 */

import BaseService from './BaseService.js'

/**
 * @typedef {Object} Permission
 * @property {string} id - 权限ID
 * @property {string} user_id - 用户ID
 * @property {string} resource - 资源
 * @property {string} action - 操作
 * @property {string} created_at - 创建时间
 */

class PermissionService extends BaseService {
  /**
   * 创建权限服务实例
   */
  constructor() {
    super({
      table: 'user_permissions',
      selectFields: ['id', 'user_id', 'resource', 'action', 'created_at'],
      defaultOrder: { field: 'created_at', ascending: false }
    })
  }

  /**
   * 为用户分配权限
   * @param {string} userId - 用户ID
   * @param {string} resource - 资源
   * @param {string} action - 操作
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async assignPermission(userId, resource, action) {
    try {
      // 检查权限是否已存在
      const { data: existing } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('resource', resource)
        .eq('action', action)
        .maybeSingle()

      if (existing) {
        throw new Error('Permission already exists')
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          resource,
          action,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 撤销用户权限
   * @param {string} userId - 用户ID
   * @param {string} resource - 资源
   * @param {string} action - 操作
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async revokePermission(userId, resource, action) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('resource', resource)
        .eq('action', action)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取用户权限列表
   * @param {string} userId - 用户ID
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async getUserPermissions(userId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 检查用户是否有权限
   * @param {string} userId - 用户ID
   * @param {string} resource - 资源
   * @param {string} action - 操作
   * @returns {Promise<{hasPermission: boolean, error: string|null}>}
   */
  async checkPermission(userId, resource, action) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('resource', resource)
        .eq('action', action)
        .maybeSingle()

      if (error) throw error

      return { hasPermission: !!data, error: null }
    } catch (error) {
      return { hasPermission: false, error: error.message }
    }
  }

  /**
   * 批量分配权限
   * @param {string} userId - 用户ID
   * @param {Array} permissions - 权限列表 [{resource, action}]
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async assignBulkPermissions(userId, permissions) {
    try {
      const results = []
      for (const perm of permissions) {
        const result = await this.assignPermission(userId, perm.resource, perm.action)
        if (result.data) {
          results.push(result.data)
        }
      }
      return { data: results, error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 删除用户所有权限
   * @param {string} userId - 用户ID
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async clearUserPermissions(userId) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default PermissionService