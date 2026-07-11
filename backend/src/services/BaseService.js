/**
 * 基础服务类 - 所有业务服务的基类
 * 提供通用的CRUD操作和数据库连接
 * 
 * @module services/BaseService
 * @requires supabase
 * 
 * @example
 * class CustomerService extends BaseService {
 *   constructor() {
 *     super('customers')
 *   }
 * }
 */

import { createClient } from '@supabase/supabase-js'

/**
 * @typedef {Object} ServiceOptions
 * @property {string} table - 数据库表名
 * @property {string[]} selectFields - 默认查询字段
 * @property {Object} defaultOrder - 默认排序 { field: 'created_at', ascending: false }
 */

class BaseService {
  /**
   * 创建服务实例
   * @param {string|ServiceOptions} options - 表名或配置对象
   * @throws {Error} 当SUPABASE_URL或SUPABASE_KEY未配置时
   */
  constructor(options) {
    // 验证环境变量
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    /** @type {import('@supabase/supabase-js').SupabaseClient} */
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    /** @type {string} */
    this.tableName = typeof options === 'string' ? options : options.table

    /** @type {string[]} */
    this.selectFields = options.selectFields || ['*']

    /** @type {Object} */
    this.defaultOrder = options.defaultOrder || { field: 'created_at', ascending: false }

    /** @type {string} */
    this.serviceName = this.constructor.name
  }

  /**
   * 获取当前服务的表名
   * @returns {string} 表名
   */
  getTableName() {
    return this.tableName
  }

  /**
   * 构建查询对象
   * @param {Object} options - 查询选项
   * @param {string[]} [options.select] - 要选择的字段
   * @param {Object} [options.filters] - 过滤条件
   * @param {Object} [options.order] - 排序 { field, ascending }
   * @param {number} [options.limit] - 限制条数
   * @param {number} [options.offset] - 偏移量
   * @returns {Object} 查询构建器
   */
  buildQuery(options = {}) {
    const {
      select = this.selectFields,
      filters = {},
      order = this.defaultOrder,
      limit,
      offset
    } = options

    let query = this.supabase
      .from(this.tableName)
      .select(select.join(','))

    // 应用过滤
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })

    // 应用排序
    if (order) {
      query = query.order(order.field, { ascending: order.ascending ?? false })
    }

    // 应用分页
    if (limit) query = query.limit(limit)
    if (offset) query = query.range(offset, offset + (limit || 10) - 1)

    return query
  }

  /**
   * 查找所有记录
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: Object|null, count: number}>}
   */
  async findAll(options = {}) {
    try {
      const query = this.buildQuery(options)
      const { data, error, count } = await query
      
      if (error) throw error
      
      return {
        data: data || [],
        error: null,
        count: count || data?.length || 0
      }
    } catch (error) {
      console.error(`[${this.serviceName}] findAll error:`, error)
      return {
        data: [],
        error: error.message,
        count: 0
      }
    }
  }

  /**
   * 根据ID查找记录
   * @param {string|number} id - 记录ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id, options = {}) {
    try {
      const { select = this.selectFields } = options
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(select.join(','))
        .eq('id', id)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error(`[${this.serviceName}] findById error:`, error)
      return { data: null, error: error.message }
    }
  }

  /**
   * 创建新记录
   * @param {Object} data - 要创建的数据
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(data) {
    try {
      // 验证数据
      this.validateData(data)

      // 添加时间戳
      const now = new Date().toISOString()
      const record = {
        ...data,
        created_at: now,
        updated_at: now
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(record)
        .select()
        .single()

      if (error) throw error

      return { data: result, error: null }
    } catch (error) {
      console.error(`[${this.serviceName}] create error:`, error)
      return { data: null, error: error.message }
    }
  }

  /**
   * 更新记录
   * @param {string|number} id - 记录ID
   * @param {Object} data - 要更新的数据
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, data) {
    try {
      // 验证数据
      this.validateData(data)

      // 添加更新时间戳
      const record = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(record)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: result, error: null }
    } catch (error) {
      console.error(`[${this.serviceName}] update error:`, error)
      return { data: null, error: error.message }
    }
  }

  /**
   * 删除记录（软删除）
   * @param {string|number} id - 记录ID
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async delete(id) {
    try {
      // 软删除：更新 deleted_at
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error(`[${this.serviceName}] delete error:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 永久删除记录
   * @param {string|number} id - 记录ID
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async hardDelete(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error(`[${this.serviceName}] hardDelete error:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 批量创建记录
   * @param {Array} records - 记录数组
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async bulkCreate(records) {
    try {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('Records must be a non-empty array')
      }

      const now = new Date().toISOString()
      const data = records.map(record => ({
        ...record,
        created_at: now,
        updated_at: now
      }))

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()

      if (error) throw error

      return { data: result, error: null }
    } catch (error) {
      console.error(`[${this.serviceName}] bulkCreate error:`, error)
      return { data: [], error: error.message }
    }
  }

  /**
   * 验证数据（子类可重写）
   * @param {Object} data - 要验证的数据
   * @throws {Error} 验证失败时抛出错误
   */
  validateData(data) {
    // 基类不做验证，子类重写
    return true
  }

  /**
   * 获取服务元信息
   * @returns {Object} 服务元信息
   */
  getMetadata() {
    return {
      serviceName: this.serviceName,
      tableName: this.tableName,
      selectFields: this.selectFields,
      defaultOrder: this.defaultOrder
    }
  }
}

export default BaseService