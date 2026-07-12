/**
 * 客户服务
 * 处理所有客户相关的业务逻辑
 * 
 * @module services/CustomerService
 * @extends BaseService
 * 
 * @example
 * import CustomerService from './CustomerService.js'
 * const customerService = new CustomerService()
 * const { data } = await customerService.findAll()
 */

import BaseService from './BaseService.js'

/**
 * @typedef {Object} Customer
 * @property {string} id - 客户ID
 * @property {string} tenant_id - 租户ID
 * @property {string} first_name - 名
 * @property {string} last_name - 姓
 * @property {string} email - 邮箱
 * @property {string} phone - 电话
 * @property {string} address - 地址
 * @property {string} city - 城市
 * @property {string} state - 州/省
 * @property {string} zip_code - 邮编
 * @property {string} country - 国家
 * @property {number} loyalty_points - 忠诚度积分
 * @property {string} loyalty_tier - 忠诚度等级
 * @property {number} total_spent - 总消费
 * @property {number} total_visits - 总访问次数
 * @property {string} last_visit_at - 最后访问时间
 * @property {string} notes - 备注
 * @property {boolean} is_active - 是否激活
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 * @property {string} deleted_at - 删除时间
 */

class CustomerService extends BaseService {
  /**
   * 创建客户服务实例
   */
  constructor() {
    super({
      table: 'customers',
      selectFields: [
        'id', 'tenant_id', 'first_name', 'last_name', 'email',
        'phone', 'address', 'city', 'state', 'zip_code', 'country',
        'loyalty_points', 'loyalty_tier', 'total_spent', 'total_visits',
        'last_visit_at', 'notes', 'is_active', 'created_at', 'updated_at'
      ],
      defaultOrder: { field: 'created_at', ascending: false }
    })
  }

  /**
   * 根据租户ID查找客户
   * @param {string} tenantId - 租户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async findByTenant(tenantId, options = {}) {
    return this.findAll({
      ...options,
      filters: { tenant_id: tenantId, ...options.filters }
    })
  }

  /**
   * 根据邮箱查找客户
   * @param {string} email - 邮箱地址
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findByEmail(email, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('email', email)
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 根据电话查找客户
   * @param {string} phone - 电话号码
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findByPhone(phone, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('phone', phone)
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 更新客户忠诚度积分
   * @param {string} id - 客户ID
   * @param {number} points - 积分变动（正数增加，负数减少）
   * @param {string} reason - 变动原因
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updateLoyaltyPoints(id, points, reason = '') {
    try {
      // 先获取当前积分
      const { data: current } = await this.findById(id)
      if (!current) {
        throw new Error('Customer not found')
      }

      const newPoints = (current.loyalty_points || 0) + points
      if (newPoints < 0) {
        throw new Error('Insufficient loyalty points')
      }

      // 更新积分
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          loyalty_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 记录积分变动日志（可扩展）
      // await this.logLoyaltyTransaction(id, points, reason, newPoints)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 更新客户总消费和访问次数
   * @param {string} id - 客户ID
   * @param {number} amount - 消费金额
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updateSpending(id, amount) {
    try {
      const { data: current } = await this.findById(id)
      if (!current) {
        throw new Error('Customer not found')
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          total_spent: (current.total_spent || 0) + amount,
          total_visits: (current.total_visits || 0) + 1,
          last_visit_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新忠诚度等级
      await this.updateLoyaltyTier(id)

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 更新忠诚度等级
   * @param {string} id - 客户ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updateLoyaltyTier(id) {
    try {
      const { data: customer } = await this.findById(id)
      if (!customer) {
        throw new Error('Customer not found')
      }

      // 根据积分确定等级
      const points = customer.loyalty_points || 0
      let tier = 'bronze'
      if (points >= 1000) tier = 'platinum'
      else if (points >= 500) tier = 'gold'
      else if (points >= 200) tier = 'silver'

      if (tier !== customer.loyalty_tier) {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .update({
            loyalty_tier: tier,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      }

      return { data: customer, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 搜索客户
   * @param {string} query - 搜索关键词
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async search(query, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 验证客户数据
   * @param {Object} data - 客户数据
   * @throws {Error} 验证失败时抛出
   */
  validateData(data) {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format')
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone format')
    }

    if (data.first_name && data.first_name.length < 1) {
      throw new Error('First name is required')
    }

    if (data.last_name && data.last_name.length < 1) {
      throw new Error('Last name is required')
    }

    return true
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  /**
   * 验证电话格式
   * @param {string} phone - 电话号码
   * @returns {boolean} 是否有效
   */
  isValidPhone(phone) {
    return /^[\d\s\-+()]{7,20}$/.test(phone)
  }
}

export default CustomerService