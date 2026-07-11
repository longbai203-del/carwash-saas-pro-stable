/**
 * 库存业务管理器
 * 处理库存相关的核心业务逻辑
 * 
 * @module business-core/inventory/InventoryManager
 * 
 * @example
 * import InventoryManager from './inventory/InventoryManager.js'
 * const manager = new InventoryManager()
 * await manager.processStockAdjustment(productId, quantity, type)
 */

import { InventoryService, ProductService } from '../../src/services/index.js'
import { logger } from '../../src/shared/lib/logger.js'

/**
 * @typedef {Object} StockAlert
 * @property {string} productId - 产品ID
 * @property {string} productName - 产品名称
 * @property {number} currentStock - 当前库存
 * @property {number} minStock - 最小库存
 * @property {string} level - 预警级别
 * @property {string} message - 预警消息
 */

class InventoryManager {
  /**
   * 创建库存业务管理器实例
   */
  constructor() {
    /** @type {InventoryService} */
    this.inventoryService = new InventoryService()
    
    /** @type {ProductService} */
    this.productService = new ProductService()
  }

  /**
   * 处理库存调整
   * @param {string} productId - 产品ID
   * @param {number} quantity - 数量
   * @param {string} type - 调整类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 调整结果
   */
  async processStockAdjustment(productId, quantity, type, options = {}) {
    try {
      // 验证数量
      if (quantity <= 0) {
        throw new Error('Quantity must be positive')
      }

      // 获取产品信息
      const { data: product } = await this.productService.findById(productId)
      if (!product) throw new Error('Product not found')

      // 检查库存是否充足（出库时）
      if (type === 'outbound' && product.current_stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.current_stock}, Requested: ${quantity}`)
      }

      // 执行调整
      const result = await this.inventoryService.adjustStock(
        productId,
        type === 'inbound' ? quantity : -quantity,
        type,
        options.reference || '',
        {
          referenceType: options.referenceType,
          referenceId: options.referenceId,
          createdBy: options.createdBy
        }
      )

      if (result.error) {
        throw new Error(result.error)
      }

      // 检查是否需要预警
      await this.checkAndAlertLowStock(productId)

      logger.info(`Stock adjusted: ${productId}, ${type}, ${quantity}`)
      return result.data
    } catch (error) {
      logger.error('Stock adjustment failed:', error)
      throw error
    }
  }

  /**
   * 检查并预警低库存
   * @param {string} productId - 产品ID
   * @returns {Promise<boolean>} 是否触发预警
   */
  async checkAndAlertLowStock(productId) {
    try {
      const { data: product } = await this.productService.findById(productId)
      if (!product) return false

      const currentStock = product.current_stock || 0
      const minStock = product.min_stock || 0

      if (currentStock <= minStock) {
        const alert = {
          productId: product.id,
          productName: product.name,
          currentStock,
          minStock,
          level: currentStock === 0 ? 'critical' : 'warning',
          message: currentStock === 0 
            ? `Product ${product.name} is out of stock`
            : `Product ${product.name} is below minimum stock (${currentStock}/${minStock})`
        }

        // 触发预警事件
        await this.emitStockAlert(alert)
        return true
      }

      return false
    } catch (error) {
      logger.error('Stock alert check failed:', error)
      return false
    }
  }

  /**
   * 发送库存预警
   * @param {StockAlert} alert - 预警信息
   * @returns {Promise<void>}
   */
  async emitStockAlert(alert) {
    // 可扩展：发送通知、邮件等
    logger.warn(`Stock alert: ${alert.message}`)
  }

  /**
   * 获取所有库存预警
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Array<StockAlert>>} 预警列表
   */
  async getAllStockAlerts(tenantId) {
    try {
      const result = await this.inventoryService.getStockAlerts(tenantId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      return result.data.map(item => ({
        productId: item.id,
        productName: item.name,
        currentStock: item.current_stock || 0,
        minStock: item.min_stock || 0,
        level: item.current_stock === 0 ? 'critical' : 'warning',
        message: item.current_stock === 0 
          ? `Product ${item.name} is out of stock`
          : `Product ${item.name} is below minimum stock`
      }))
    } catch (error) {
      logger.error('Get stock alerts failed:', error)
      return []
    }
  }

  /**
   * 处理库存盘点
   * @param {string} productId - 产品ID
   * @param {number} actualCount - 实际数量
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 盘点结果
   */
  async processStockCount(productId, actualCount, options = {}) {
    try {
      const { data: product } = await this.productService.findById(productId)
      if (!product) throw new Error('Product not found')

      const previousCount = product.current_stock || 0
      const difference = actualCount - previousCount

      // 如果有差异，记录调整
      if (difference !== 0) {
        const result = await this.inventoryService.adjustStock(
          productId,
          difference,
          'count',
          `Stock count: ${options.reference || ''}`,
          {
            referenceType: 'count',
            referenceId: options.countId,
            createdBy: options.createdBy
          }
        )

        if (result.error) {
          throw new Error(result.error)
        }

        logger.info(`Stock count completed: ${productId}, ${previousCount} -> ${actualCount}`)
        return {
          productId,
          previousCount,
          actualCount,
          difference,
          adjusted: true,
          data: result.data
        }
      }

      return {
        productId,
        previousCount,
        actualCount,
        difference: 0,
        adjusted: false
      }
    } catch (error) {
      logger.error('Stock count failed:', error)
      throw error
    }
  }

  /**
   * 获取库存周转率
   * @param {string} tenantId - 租户ID
   * @param {Object} dateRange - 日期范围
   * @returns {Promise<Object>} 周转率数据
   */
  async getInventoryTurnover(tenantId, dateRange = {}) {
    try {
      // 获取销售数量
      let query = this.inventoryService.supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('tenant_id', tenantId)

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end)
      }

      const { data: sales } = await query

      // 获取平均库存
      const { data: products } = await this.productService.findAll({
        filters: { tenant_id: tenantId, is_active: true }
      })

      if (!products || products.length === 0) {
        return { turnoverRate: 0, details: [] }
      }

      // 计算每个产品的周转率
      const turnoverData = products.map(product => {
        const sold = sales?.filter(s => s.product_id === product.id)
          .reduce((sum, s) => sum + (s.quantity || 0), 0) || 0
        
        const averageStock = product.current_stock || 0
        const turnover = averageStock > 0 ? sold / averageStock : 0

        return {
          productId: product.id,
          productName: product.name,
          sold,
          averageStock,
          turnover: Math.round(turnover * 100) / 100
        }
      })

      const totalTurnover = turnoverData.reduce((sum, t) => sum + t.turnover, 0)
      const averageTurnover = turnoverData.length > 0 ? totalTurnover / turnoverData.length : 0

      return {
        turnoverRate: Math.round(averageTurnover * 100) / 100,
        details: turnoverData.sort((a, b) => b.turnover - a.turnover)
      }
    } catch (error) {
      logger.error('Get inventory turnover failed:', error)
      return { turnoverRate: 0, details: [] }
    }
  }
}

export default InventoryManager