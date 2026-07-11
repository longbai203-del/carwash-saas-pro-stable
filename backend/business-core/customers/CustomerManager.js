/**
 * 客户业务管理器
 * 处理客户相关的核心业务逻辑
 * 
 * @module business-core/customers/CustomerManager
 * 
 * @example
 * import CustomerManager from './customers/CustomerManager.js'
 * const manager = new CustomerManager()
 * const result = await manager.calculateLoyaltyTier(customerId)
 */

import { CustomerService } from '../../src/services/index.js'

/**
 * @typedef {Object} CustomerData
 * @property {string} id - 客户ID
 * @property {string} first_name - 名
 * @property {string} last_name - 姓
 * @property {string} email - 邮箱
 * @property {string} phone - 电话
 * @property {number} loyalty_points - 忠诚度积分
 * @property {string} loyalty_tier - 忠诚度等级
 * @property {number} total_spent - 总消费
 * @property {number} total_visits - 总访问次数
 */

class CustomerManager {
  /**
   * 创建客户业务管理器实例
   */
  constructor() {
    /** @type {CustomerService} */
    this.customerService = new CustomerService()
  }

  /**
   * 计算客户忠诚度等级
   * @param {string} customerId - 客户ID
   * @returns {Promise<{tier: string, points: number, nextTier: string, pointsToNext: number}>}
   */
  async calculateLoyaltyTier(customerId) {
    const { data: customer } = await this.customerService.findById(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    const points = customer.loyalty_points || 0
    let tier = 'bronze'
    let nextTier = 'silver'
    let pointsToNext = 200

    if (points >= 1000) {
      tier = 'platinum'
      nextTier = null
      pointsToNext = 0
    } else if (points >= 500) {
      tier = 'gold'
      nextTier = 'platinum'
      pointsToNext = 1000 - points
    } else if (points >= 200) {
      tier = 'silver'
      nextTier = 'gold'
      pointsToNext = 500 - points
    } else {
      nextTier = 'silver'
      pointsToNext = 200 - points
    }

    // 如果等级变化，更新数据库
    if (tier !== customer.loyalty_tier) {
      await this.customerService.update(customerId, { loyalty_tier: tier })
    }

    return {
      tier,
      points,
      nextTier,
      pointsToNext: Math.max(0, pointsToNext)
    }
  }

  /**
   * 获取客户统计信息
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getCustomerStats(tenantId) {
    const { data: customers } = await this.customerService.findByTenant(tenantId)
    
    const stats = {
      total: customers.length,
      active: customers.filter(c => c.is_active !== false).length,
      byTier: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
      totalSpent: 0,
      averageSpent: 0,
      newThisMonth: 0
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    customers.forEach(customer => {
      // 按等级统计
      const tier = customer.loyalty_tier || 'bronze'
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1

      // 总消费
      stats.totalSpent += (customer.total_spent || 0)

      // 本月新增
      if (customer.created_at && new Date(customer.created_at) >= monthStart) {
        stats.newThisMonth++
      }
    })

    stats.averageSpent = stats.total > 0 ? stats.totalSpent / stats.total : 0

    return stats
  }

  /**
   * 获取客户价值排行
   * @param {string} tenantId - 租户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 价值排行列表
   */
  async getTopCustomers(tenantId, limit = 10) {
    const { data: customers } = await this.customerService.findByTenant(tenantId, {
      order: { field: 'total_spent', ascending: false },
      limit
    })
    return customers
  }

  /**
   * 合并客户数据
   * @param {string} sourceId - 源客户ID（将被合并）
   * @param {string} targetId - 目标客户ID（保留）
   * @returns {Promise<Object>} 合并结果
   */
  async mergeCustomers(sourceId, targetId) {
    const [source, target] = await Promise.all([
      this.customerService.findById(sourceId),
      this.customerService.findById(targetId)
    ])

    if (!source.data || !target.data) {
      throw new Error('One or both customers not found')
    }

    // 合并数据
    const mergedData = {
      first_name: target.data.first_name || source.data.first_name,
      last_name: target.data.last_name || source.data.last_name,
      email: target.data.email || source.data.email,
      phone: target.data.phone || source.data.phone,
      loyalty_points: (target.data.loyalty_points || 0) + (source.data.loyalty_points || 0),
      total_spent: (target.data.total_spent || 0) + (source.data.total_spent || 0),
      total_visits: (target.data.total_visits || 0) + (source.data.total_visits || 0),
      notes: (target.data.notes || '') + '\n---合并自客户 ' + source.data.id + '---\n' + (source.data.notes || '')
    }

    // 更新目标客户
    await this.customerService.update(targetId, mergedData)

    // 软删除源客户
    await this.customerService.delete(sourceId)

    return {
      success: true,
      target: mergedData,
      source: source.data
    }
  }

  /**
   * 批量导入客户
   * @param {Array} customers - 客户数据数组
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Object>} 导入结果
   */
  async bulkImport(customers, tenantId) {
    const results = {
      total: customers.length,
      success: 0,
      failed: 0,
      errors: []
    }

    for (const customer of customers) {
      try {
        const data = {
          ...customer,
          tenant_id: tenantId
        }
        await this.customerService.create(data)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          customer,
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * 获取客户流失风险分析
   * @param {string} tenantId - 租户ID
   * @param {number} daysInactive - 不活跃天数阈值
   * @returns {Promise<Array>} 流失风险客户列表
   */
  async getChurnRiskCustomers(tenantId, daysInactive = 30) {
    const { data: customers } = await this.customerService.findByTenant(tenantId)
    const now = new Date()
    const threshold = new Date(now.getTime() - daysInactive * 24 * 60 * 60 * 1000)

    const atRisk = customers
      .filter(c => {
        if (!c.last_visit_at) return true
        return new Date(c.last_visit_at) < threshold
      })
      .map(c => ({
        ...c,
        risk_level: this.calculateRiskLevel(c, now)
      }))
      .sort((a, b) => b.risk_level - a.risk_level)

    return atRisk
  }

  /**
   * 计算风险等级
   * @param {Object} customer - 客户数据
   * @param {Date} now - 当前时间
   * @returns {number} 风险等级 (0-100)
   */
  calculateRiskLevel(customer, now) {
    let risk = 0

    // 基于不活跃天数
    if (customer.last_visit_at) {
      const daysSince = (now - new Date(customer.last_visit_at)) / (24 * 60 * 60 * 1000)
      risk += Math.min(daysSince, 90) / 90 * 50
    } else {
      risk += 50
    }

    // 基于总消费
    const totalSpent = customer.total_spent || 0
    if (totalSpent > 1000) {
      risk -= 10
    } else if (totalSpent < 100) {
      risk += 20
    }

    // 基于总访问次数
    const visits = customer.total_visits || 0
    if (visits > 10) {
      risk -= 10
    } else if (visits < 3) {
      risk += 20
    }

    return Math.max(0, Math.min(100, risk))
  }
}

export default CustomerManager