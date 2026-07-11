/**
 * 认证钩子
 * 提供认证相关的功能
 * 
 * @module hooks/useAuth
 * 
 * @example
 * import { useAuth } from './hooks/useAuth.js'
 * const { user, login, logout, isAuthenticated } = useAuth()
 */

import { store } from '../store/index.js'
import { api } from '../services/api.js'

/**
 * 认证钩子
 * @returns {Object} 认证API
 */
export function useAuth() {
  /**
   * 获取当前用户
   * @returns {Object|null} 用户信息
   */
  const getUser = () => {
    return store.getState('user')?.data || null
  }

  /**
   * 检查是否已认证
   * @returns {boolean} 是否已认证
   */
  const isAuthenticated = () => {
    const user = store.getState('user')
    return !!(user?.authenticated && user?.data)
  }

  /**
   * 登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      if (response?.success) {
        // 保存令牌
        const token = response.data?.token
        if (token) {
          api.setToken(token)
          localStorage.setItem('auth_token', token)
        }

        // 更新状态
        store.setState('user', {
          authenticated: true,
          data: response.data?.user || null
        })

        return { success: true, user: response.data?.user }
      } else {
        return { success: false, error: response?.message || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 登出
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.warn('Logout error:', error)
    }

    // 清除令牌
    api.setToken(null)
    localStorage.removeItem('auth_token')

    // 更新状态
    store.setState('user', {
      authenticated: false,
      data: null
    })

    // 重定向到登录页
    window.location.href = '/login'
  }

  /**
   * 刷新令牌
   * @returns {Promise<boolean>} 是否成功
   */
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return false

      const response = await api.post('/auth/refresh', { token })
      
      if (response?.success && response.data?.token) {
        const newToken = response.data.token
        api.setToken(newToken)
        localStorage.setItem('auth_token', newToken)
        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  /**
   * 检查权限
   * @param {string} resource - 资源
   * @param {string} action - 操作
   * @returns {boolean} 是否有权限
   */
  const hasPermission = (resource, action) => {
    const user = store.getState('user')
    const permissions = user?.permissions || []
    return permissions.some(p => p.resource === resource && p.action === action)
  }

  /**
   * 检查角色
   * @param {string|Array} roles - 角色
   * @returns {boolean} 是否有角色
   */
  const hasRole = (roles) => {
    const user = store.getState('user')
    const userRoles = user?.data?.roles || []
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.some(role => userRoles.includes(role))
  }

  return {
    user: getUser(),
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole
  }
}

export default useAuth