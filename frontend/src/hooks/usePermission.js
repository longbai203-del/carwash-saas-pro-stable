/**
 * 权限钩子
 * 提供权限检查相关的功能
 * 
 * @module hooks/usePermission
 * 
 * @example
 * import { usePermission } from './hooks/usePermission.js'
 * const { can, canAccess } = usePermission()
 */

import { store } from '../store/index.js'

/**
 * 权限钩子
 * @returns {Object} 权限API
 */
export function usePermission() {
  /**
   * 获取当前用户权限
   * @returns {Array} 权限列表
   */
  const getPermissions = () => {
    const user = store.getState('user')
    return user?.permissions || []
  }

  /**
   * 检查是否有指定权限
   * @param {string} resource - 资源
   * @param {string} action - 操作
   * @returns {boolean} 是否有权限
   */
  const can = (resource, action) => {
    const permissions = getPermissions()
    return permissions.some(p => p.resource === resource && p.action === action)
  }

  /**
   * 检查是否有任一权限
   * @param {Array} permissionList - 权限列表
   * @returns {boolean} 是否有任一权限
   */
  const canAny = (permissionList) => {
    if (!Array.isArray(permissionList)) return false
    return permissionList.some(({ resource, action }) => can(resource, action))
  }

  /**
   * 检查是否有所有权限
   * @param {Array} permissionList - 权限列表
   * @returns {boolean} 是否有所有权限
   */
  const canAll = (permissionList) => {
    if (!Array.isArray(permissionList)) return false
    return permissionList.every(({ resource, action }) => can(resource, action))
  }

  /**
   * 检查是否有指定角色
   * @param {string|Array} roles - 角色
   * @returns {boolean} 是否有角色
   */
  const hasRole = (roles) => {
    const user = store.getState('user')
    const userRoles = user?.data?.roles || []
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.some(role => userRoles.includes(role))
  }

  /**
   * 检查是否有任一角色
   * @param {Array} roleList - 角色列表
   * @returns {boolean} 是否有任一角色
   */
  const hasAnyRole = (roleList) => {
    if (!Array.isArray(roleList)) return false
    return roleList.some(role => hasRole(role))
  }

  /**
   * 检查是否可以访问资源
   * @param {string} resource - 资源
   * @param {string} action - 操作
   * @param {string|Array} roles - 需要的角色
   * @returns {boolean} 是否可以访问
   */
  const canAccess = (resource, action, roles = null) => {
    // 检查权限
    if (resource && action && !can(resource, action)) {
      return false
    }

    // 检查角色
    if (roles) {
      return hasRole(roles)
    }

    return true
  }

  return {
    getPermissions,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    canAccess
  }
}

export default usePermission