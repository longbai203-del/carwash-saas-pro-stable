/**
 * 库存服务
 * 处理所有库存相关的业务逻辑
 * 
 * @module services/InventoryService
 * @extends BaseService
 * 
 * @example
 * import InventoryService from './InventoryService.js'
 * const inventoryService = new InventoryService()
 * await inventoryService.adjustStock(productId, 10, 'adjustment', 'Stock count')
 */

import BaseService from './BaseService.js'
import ProductService from './ProductService.js'

/**
 * @typedef {Object} InventoryTransaction
 * @property {string} id - 交易ID
 * @property {string} tenant_id - 租户ID
 * @property {string} product_id - 产品ID
 * @property {string} transaction_type - 交易类型
 * @property {number} quantity - 数量（正数增加，负数减少）
 * @property {number} previous_quantity - 之前数量
 * @property {number} new_quantity - 新数量
 * @property {string} reference_type - 引用类型
 * @property {string} reference_id - 引用ID
 * @property {string} notes - 备注
 * @property {string} created_by - 创建人
 * @property {string} created_at - 创建时间
 */

class InventoryService extends BaseService {
  /**
   * 创建库存服务实例
   */
  constructor() {
    super({
      table: 'inventory_transactions',
      selectFields: [
        'id', 'tenant_id', 'product_id', 'transaction_type',
        'quantity', 'previous_quantity', 'new_quantity',
        'reference_type', 'reference_id', 'notes',
        'created_by', 'created_at'
      ],
      defaultOrder: { field: 'created_at', ascending: false }
    })

    /** @type {ProductService} */
    this.productService = new ProductService()
  }

  /**
   * 调整库存
   * @param {string} productId - 产品ID
   * @param {number} quantity - 数量（正数增加，负数减少）
   * @param {string} type - 交易类型
   * @param {string} reference - 引用信息
   * @param {Object} options - 选项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async adjustStock(productId, quantity, type, reference = '', options = {}) {
    try {
      // 1. 获取产品信息
      const { data: product, error: productError } = await this.productService.findById(productId)
      if (productError) throw new Error(`Product not found: ${productError}`)
      if (!product) throw new Error('Product not found')

      const previousQuantity = product.current_stock || 0
      const newQuantity = previousQuantity + quantity

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock. Current: ${previousQuantity}, Requested: ${-quantity}`)
      }

      // 2. 更新产品库存
      const { data: updatedProduct, error: updateError } = await this.productService.update(productId, {
        current_stock: newQuantity
      })

      if (updateError) throw updateError

      // 3. 记录库存交易
      const { data: transaction, error: transError } = await this.supabase
        .from(this.tableName)
        .insert({
          tenant_id: product.tenant_id,
          product_id: productId,
          transaction_type: type,
          quantity: quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reference_type: options.referenceType || null,
          reference_id: options.referenceId || null,
          notes: reference,
          created_by: options.createdBy || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (transError) throw transError

      return {
        data: {
          product: updatedProduct,
          transaction: transaction
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 增加库存（入库）
   * @param {string} productId - 产品ID
   * @param {number} quantity - 数量
   * @param {string} reference - 引用信息
   * @param {Object} options - 选项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async addStock(productId, quantity, reference = '', options = {}) {
    return this.adjustStock(productId, quantity, 'inbound', reference, options)
  }

  /**
   * 减少库存（出库）
   * @param {string} productId - 产品ID
   * @param {number} quantity - 数量
   * @param {string} reference - 引用信息
   * @param {Object} options - 选项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async reduceStock(productId, quantity, reference = '', options = {}) {
    return this.adjustStock(productId, -quantity, 'outbound', reference, options)
  }

  /**
   * 根据产品获取交易记录
   * @param {string} productId - 产品ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async getProductTransactions(productId, options = {}) {
    return this.findAll({
      ...options,
      filters: { product_id: productId, ...options.filters }
    })
  }

  /**
   * 获取库存预警列表
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async getStockAlerts(tenantId) {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('is_service', false)

      if (error) throw error

      const alerts = products
        .filter(p => p.current_stock <= p.min_stock)
        .map(p => ({
          ...p,
          alert_level: p.current_stock === 0 ? 'critical' : 'warning'
        }))
        .sort((a, b) => a.current_stock - b.current_stock)

      return { data: alerts, error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 获取库存统计
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object, error: string|null}>}
   */
  async getInventoryStats(tenantId) {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('is_service', false)

      if (error) throw error

      const stats = {
        totalProducts: products.length,
        totalStockValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        categories: {}
      }

      products.forEach(product => {
        // 计算库存价值
        stats.totalStockValue += (product.current_stock || 0) * (product.cost_price || 0)

        // 统计低库存
        if (product.current_stock <= 0) {
          stats.outOfStockCount++
        } else if (product.current_stock <= product.min_stock) {
          stats.lowStockCount++
        }

        // 按分类统计
        const categoryId = product.category_id || 'uncategorized'
        if (!stats.categories[categoryId]) {
          stats.categories[categoryId] = { count: 0, value: 0 }
        }
        stats.categories[categoryId].count++
        stats.categories[categoryId].value += (product.current_stock || 0) * (product.cost_price || 0)
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

export default InventoryService