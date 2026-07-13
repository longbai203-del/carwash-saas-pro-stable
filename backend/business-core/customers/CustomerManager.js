/**
 * 客户业务管理器
 * 处理客户相关的核心业务逻辑
 * 
 * @module business-core/customers/CustomerManager
 * 
 * @example
 * import CustomerManager from './customers/CustomerManager.js'
 * const manager = new CustomerManager()
 * await manager.processLoyaltyPoints(customerId, points)
 */

import { CustomerService } from '../../src/services/index.js'
import { logger } from '../../src/shared/lib/logger.js'

/**
 * @typedef {Object} CustomerProfile
 * @property {string} id - 客户ID
 * @property {string} name - 客户名称
 * @property {string} email - 邮箱
 * @property {string} phone - 电话
 * @property {number} loyaltyPoints - 忠诚度积分
 * @property {string} tier - 等级
 * @property {Object} stats - 统计数据
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
   * 处理客户忠诚度积分
   * @param {string} customerId - 客户ID
   * @param {number} points - 积分变动
   * @param {string} reason - 原因
   * @returns {Promise<Object>} 更新结果
   */
  async processLoyaltyPoints(customerId, points, reason = '') {
    try {
      const result = await this.customerService.updateLoyaltyPoints(
        customerId,
        points,
        reason
      )

      if (result.error) {
        logger.error('Loyalty points update failed:', result.error)
        throw new Error(result.error)
      }

      // 检查是否需要升级等级
      await this.checkAndUpgradeTier(customerId)

      logger.info(`Loyalty points updated: ${customerId}, ${points}`)
      return result.data
    } catch (error) {
      logger.error('Loyalty points processing failed:', error)
      throw error
    }
  }

  /**
   * 检查并升级客户等级
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>} 升级结果
   */
  async checkAndUpgradeTier(customerId) {
    try {
      const { data: customer } = await this.customerService.findById(customerId)
      if (!customer) throw new Error('Customer not found')

      const points = customer.loyalty_points || 0
      let newTier = 'bronze'

      if (points >= 1000) newTier = 'platinum'
      else if (points >= 500) newTier = 'gold'
      else if (points >= 200) newTier = 'silver'

      if (newTier !== customer.loyalty_tier) {
        const { data, error } = await this.customerService.update(customerId, {
          loyalty_tier: newTier
        })

        if (error) throw new Error(error)

        logger.info(`Customer ${customerId} upgraded to ${newTier}`)
        
        // 触发升级事件
        await this.emitTierUpgradeEvent(customer, newTier)

        return { upgraded: true, oldTier: customer.loyalty_tier, newTier }
      }

      return { upgraded: false, currentTier: customer.loyalty_tier }
    } catch (error) {
      logger.error('Tier upgrade check failed:', error)
      throw error
    }
  }

  /**
   * 获取客户完整档案
   * @param {string} customerId - 客户ID
   * @returns {Promise<CustomerProfile>} 客户档案
   */
  async getCustomerProfile(customerId) {
    try {
      const { data: customer } = await this.customerService.findById(customerId)
      if (!customer) throw new Error('Customer not found')

      // 获取客户统计数据
      const stats = await this.getCustomerStats(customerId)

      return {
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        email: customer.email,
        phone: customer.phone,
        loyaltyPoints: customer.loyalty_points || 0,
        tier: customer.loyalty_tier || 'bronze',
        stats
      }
    } catch (error) {
      logger.error('Get customer profile failed:', error)
      throw error
    }
  }

  /**
   * 获取客户统计数据
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>} 统计数据
   */
  async getCustomerStats(customerId) {
    try {
      // 获取订单统计
      const { data: orders } = await this.customerService.supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)

      const totalOrders = orders?.length || 0
      const totalSpent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const lastOrder = orders?.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0]

      return {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
        lastOrderDate: lastOrder?.created_at || null,
        lastOrderAmount: lastOrder?.total_amount || 0
      }
    } catch (error) {
      logger.error('Get customer stats failed:', error)
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        lastOrderAmount: 0
      }
    }
  }

  /**
   * 发送等级升级事件
   * @param {Object} customer - 客户信息
   * @param {string} newTier - 新等级
   * @returns {Promise<void>}
   */
  async emitTierUpgradeEvent(customer, newTier) {
    // 可扩展：发送邮件、推送通知等
    logger.info(`🎉 Customer ${customer.id} upgraded to ${newTier}`)
  }

  /**
   * 批量导入客户
   * @param {Array} customers - 客户数据数组
   * @returns {Promise<Object>} 导入结果
   */
  async bulkImport(customers) {
    const results = {
      total: customers.length,
      success: 0,
      failed: 0,
      errors: []
    }

    for (const customer of customers) {
      try {
        const result = await this.customerService.create(customer)
        if (result.error) {
          results.failed++
          results.errors.push({ customer, error: result.error })
        } else {
          results.success++
        }
      } catch (error) {
        results.failed++
        results.errors.push({ customer, error: error.message })
      }
    }

    logger.info(`Bulk import completed: ${results.success}/${results.total}`)
    return results
  }
}

export default CustomerManager