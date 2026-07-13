/**
 * 订单业务管理器
 * 处理订单相关的核心业务逻辑
 * 
 * @module business-core/orders/OrderManager
 * 
 * @example
 * import OrderManager from './orders/OrderManager.js'
 * const manager = new OrderManager()
 * await manager.processOrder(orderId)
 */

import { OrderService, InventoryService, CustomerService } from '../../services/index.js'
import { logger } from '../../shared/lib/logger.js'

/**
 * @typedef {Object} OrderStatus
 * @property {string} id - 订单ID
 * @property {string} status - 当前状态
 * @property {string} previousStatus - 之前状态
 * @property {string} updatedAt - 更新时间
 */

class OrderManager {
  /**
   * 创建订单业务管理器实例
   */
  constructor() {
    /** @type {OrderService} */
    this.orderService = new OrderService()
    
    /** @type {InventoryService} */
    this.inventoryService = new InventoryService()
    
    /** @type {CustomerService} */
    this.customerService = new CustomerService()
  }

  /**
   * 处理订单状态变更
   * @param {string} orderId - 订单ID
   * @param {string} newStatus - 新状态
   * @param {Object} options - 选项
   * @returns {Promise<OrderStatus>} 状态变更结果
   */
  async processOrderStatusChange(orderId, newStatus, options = {}) {
    try {
      const { data: order } = await this.orderService.findById(orderId)
      if (!order) throw new Error('Order not found')

      const previousStatus = order.status
      
      // 验证状态转换
      this.validateStatusTransition(previousStatus, newStatus)

      // 执行状态转换
      const result = await this.orderService.updateStatus(orderId, newStatus)

      if (result.error) {
        throw new Error(result.error)
      }

      // 处理状态变更副作用
      await this.handleStatusSideEffects(order, previousStatus, newStatus, options)

      logger.info(`Order ${orderId} status changed: ${previousStatus} -> ${newStatus}`)

      return {
        id: orderId,
        status: newStatus,
        previousStatus,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Order status change failed:', error)
      throw error
    }
  }

  /**
   * 验证状态转换是否合法
   * @param {string} from - 源状态
   * @param {string} to - 目标状态
   * @throws {Error} 不合法时抛出错误
   */
  validateStatusTransition(from, to) {
    const transitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: ['refunded'],
      cancelled: [],
      refunded: []
    }

    if (!transitions[from]) {
      throw new Error(`Invalid source status: ${from}`)
    }

    if (from === to) {
      throw new Error(`Status already ${from}`)
    }

    if (!transitions[from].includes(to) && to !== from) {
      throw new Error(`Invalid status transition: ${from} -> ${to}`)
    }
  }

  /**
   * 处理状态变更副作用
   * @param {Object} order - 订单
   * @param {string} from - 源状态
   * @param {string} to - 目标状态
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async handleStatusSideEffects(order, from, to, options = {}) {
    // 订单完成时更新客户统计
    if (to === 'completed') {
      await this.customerService.updateSpending(order.customer_id, order.total_amount)
      
      // 更新库存
      if (options.restoreInventory) {
        await this.restoreInventory(order.id)
      }
    }

    // 订单取消时恢复库存
    if (to === 'cancelled') {
      await this.restoreInventory(order.id)
    }

    // 订单退款时恢复库存
    if (to === 'refunded') {
      await this.restoreInventory(order.id)
    }
  }

  /**
   * 恢复订单库存
   * @param {string} orderId - 订单ID
   * @returns {Promise<void>}
   */
  async restoreInventory(orderId) {
    try {
      const { data: items } = await this.orderService.supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (!items) return

      for (const item of items) {
        await this.inventoryService.addStock(
          item.product_id,
          item.quantity,
          `Order ${orderId} cancellation`
        )
      }

      logger.info(`Inventory restored for order ${orderId}`)
    } catch (error) {
      logger.error('Inventory restore failed:', error)
      throw error
    }
  }

  /**
   * 获取订单处理状态
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 处理状态
   */
  async getOrderProcessingStatus(orderId) {
    try {
      const { data: order } = await this.orderService.findById(orderId)
      if (!order) throw new Error('Order not found')

      const { data: items } = await this.orderService.supabase
        .from('order_items')
        .select('product_id, quantity, status')
        .eq('order_id', orderId)

      const totalItems = items?.length || 0
      const processedItems = items?.filter(i => i.status === 'processed').length || 0

      return {
        orderId,
        status: order.status,
        progress: totalItems > 0 ? (processedItems / totalItems) * 100 : 0,
        totalItems,
        processedItems,
        pendingItems: totalItems - processedItems
      }
    } catch (error) {
      logger.error('Get order processing status failed:', error)
      throw error
    }
  }

  /**
   * 取消订单
   * @param {string} orderId - 订单ID
   * @param {string} reason - 取消原因
   * @returns {Promise<Object>} 取消结果
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const { data: order } = await this.orderService.findById(orderId)
      if (!order) throw new Error('Order not found')

      if (order.status === 'completed') {
        throw new Error('Cannot cancel completed order')
      }

      const result = await this.processOrderStatusChange(orderId, 'cancelled', {
        restoreInventory: true
      })

      // 记录取消原因
      await this.orderService.update(orderId, {
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })

      return result
    } catch (error) {
      logger.error('Order cancellation failed:', error)
      throw error
    }
  }

  /**
   * 获取订单统计
   * @param {string} tenantId - 租户ID
   * @param {Object} dateRange - 日期范围
   * @returns {Promise<Object>} 订单统计
   */
  async getOrderStats(tenantId, dateRange = {}) {
    try {
      const result = await this.orderService.getOrderStats(tenantId, dateRange)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // 计算更多指标
      const stats = result.data
      stats.averageItemsPerOrder = await this.getAverageItemsPerOrder(tenantId, dateRange)
      stats.peakHours = await this.getPeakHours(tenantId, dateRange)
      
      return stats
    } catch (error) {
      logger.error('Get order stats failed:', error)
      throw error
    }
  }

  /**
   * 获取平均每单商品数
   * @param {string} tenantId - 租户ID
   * @param {Object} dateRange - 日期范围
   * @returns {Promise<number>} 平均商品数
   */
  async getAverageItemsPerOrder(tenantId, dateRange = {}) {
    try {
      let query = this.orderService.supabase
        .from('orders')
        .select('id')
        .eq('tenant_id', tenantId)

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end)
      }

      const { data: orders } = await query

      if (!orders || orders.length === 0) return 0

      const orderIds = orders.map(o => o.id)
      
      const { data: items } = await this.orderService.supabase
        .from('order_items')
        .select('order_id, quantity')
        .in('order_id', orderIds)

      if (!items) return 0

      const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0)
      return totalItems / orders.length
    } catch (error) {
      logger.error('Get average items per order failed:', error)
      return 0
    }
  }

  /**
   * 获取高峰时段
   * @param {string} tenantId - 租户ID
   * @param {Object} dateRange - 日期范围
   * @returns {Promise<Array>} 高峰时段列表
   */
  async getPeakHours(tenantId, dateRange = {}) {
    try {
      let query = this.orderService.supabase
        .from('orders')
        .select('created_at')
        .eq('tenant_id', tenantId)

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end)
      }

      const { data: orders } = await query

      if (!orders || orders.length === 0) return []

      const hourCounts = {}
      for (const order of orders) {
        const hour = new Date(order.created_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }

      // 排序找出高峰时段
      const sorted = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
          label: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`
        }))

      return sorted
    } catch (error) {
      logger.error('Get peak hours failed:', error)
      return []
    }
  }
}

export default OrderManager