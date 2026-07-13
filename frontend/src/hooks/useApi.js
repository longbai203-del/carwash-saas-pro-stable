/**
 * API钩子
 * 提供API调用相关的功能
 * 
 * @module hooks/useApi
 * 
 * @example
 * import { useApi } from './hooks/useApi.js'
 * const { data, loading, error, fetch } = useApi('/customers')
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'

/**
 * API钩子
 * @param {string} url - API URL
 * @param {Object} options - 配置选项
 * @returns {Object} API状态
 */
export function useApi(url, options = {}) {
  const { immediate = true, params = {}, method = 'GET' } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 执行API请求
   * @param {Object} requestOptions - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  const fetch = useCallback(async (requestOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.request(
        requestOptions.method || method,
        requestOptions.url || url,
        {
          params: { ...params, ...requestOptions.params },
          data: requestOptions.data,
          ...requestOptions
        }
      )

      setData(response)
      return response
    } catch (err) {
      setError(err.message || 'Request failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [url, method, params])

  // 立即执行
  useEffect(() => {
    if (immediate) {
      fetch()
    }
  }, [immediate])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    fetch,
    reset
  }
}

/**
 * 分页API钩子
 * @param {string} url - API URL
 * @param {Object} options - 配置选项
 * @returns {Object} 分页API状态
 */
export function usePaginatedApi(url, options = {}) {
  const { pageSize = 20, initialPage = 1 } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  /**
   * 加载数据
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const response = await api.get(url, {
        params: {
          page,
          limit: pageSize,
          ...options.params
        }
      })

      if (response?.success) {
        const newData = response.data || []
        setData(prev => [...prev, ...newData])
        setTotal(response.pagination?.total || 0)
        setHasMore(newData.length === pageSize)
        setPage(prev => prev + 1)
      }
    } catch (err) {
      setError(err.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [url, page, pageSize, loading, hasMore, options.params])

  /**
   * 刷新数据
   */
  const refresh = useCallback(async () => {
    setData([])
    setPage(initialPage)
    setHasMore(true)
    setTotal(0)
    
    // 重新加载
    await loadMore()
  }, [initialPage, loadMore])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setData([])
    setError(null)
    setLoading(false)
    setPage(initialPage)
    setTotal(0)
    setHasMore(true)
  }, [initialPage])

  return {
    data,
    loading,
    error,
    page,
    total,
    hasMore,
    loadMore,
    refresh,
    reset
  }
}

export default useApi