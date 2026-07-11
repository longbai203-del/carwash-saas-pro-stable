/**
 * 订单服务
 * 处理所有订单相关的业务逻辑
 * 
 * @module services/OrderService
 * @extends BaseService
 * 
 * @example
 * import OrderService from './OrderService.js'
 * const orderService = new OrderService()
 * const { data } = await orderService.createOrder(orderData)
 */

import BaseService from './BaseService.js'
import CustomerService from './CustomerService.js'
import ProductService from './ProductService.js'
import InventoryService from './InventoryService.js'

/**
 * @typedef {Object} Order
 * @property {string} id - 订单ID
 * @property {string} tenant_id - 租户ID
 * @property {string} customer_id - 客户ID
 * @property {string} vehicle_id - 车辆ID
 * @property {string} order_number - 订单编号
 * @property {string} status - 订单状态
 * @property {string} payment_status - 支付状态
 * @property {number} subtotal - 小计
 * @property {number} tax_amount - 税额
 * @property {number} discount_amount - 折扣
 * @property {number} total_amount - 总计
 * @property {string} payment_method - 支付方式
 * @property {Object} payment_details - 支付详情
 * @property {string} notes - 备注
 * @property {string} created_by - 创建人
 * @property {string} completed_at - 完成时间
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 * @property {string} deleted_at - 删除时间
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id - 订单项ID
 * @property {string} order_id - 订单ID
 * @property {string} product_id - 产品ID
 * @property {number} quantity - 数量
 * @property {number} unit_price - 单价
 * @property {number} discount_amount - 折扣
 * @property {number} total_amount - 小计
 * @property {string} notes - 备注
 * @property {string} created_at - 创建时间
 */

class OrderService extends BaseService {
  /**
   * 创建订单服务实例
   */
  constructor() {
    super({
      table: 'orders',
      selectFields: [
        'id', 'tenant_id', 'customer_id', 'vehicle_id', 'order_number',
        'status', 'payment_status', 'subtotal', 'tax_amount',
        'discount_amount', 'total_amount', 'payment_method',
        'payment_details', 'notes', 'created_by', 'completed_at',
        'created_at', 'updated_at'
      ],
      defaultOrder: { field: 'created_at', ascending: false }
    })

    /** @type {CustomerService} */
    this.customerService = new CustomerService()

    /** @type {ProductService} */
    this.productService = new ProductService()

    /** @type {InventoryService} */
    this.inventoryService = new InventoryService()
  }

  /**
   * 生成订单编号
   * @param {string} tenantId - 租户ID
   * @returns {Promise<string>} 订单编号
   */
  async generateOrderNumber(tenantId) {
    const prefix = 'ORD'
    const date = new Date()
    const dateStr = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0')
    
    // 获取当天的订单数量
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const { count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfDay.toISOString())

    const sequence = String((count || 0) + 1).padStart(4, '0')
    return `${prefix}${dateStr}${sequence}`
  }

  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @param {Array} items - 订单项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async createOrder(orderData, items) {
    try {
      // 1. 验证数据
      this.validateOrderData(orderData)
      this.validateOrderItems(items)

      // 2. 检查库存
      for (const item of items) {
        const { data: product } = await this.productService.findById(item.product_id)
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`)
        }
        if (product.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`)
        }
      }

      // 3. 计算订单金额
      let subtotal = 0
      const orderItems = items.map(item => {
        const total = item.unit_price * item.quantity
        subtotal += total
        return {
          ...item,
          total_amount: total
        }
      })

      const taxAmount = subtotal * 0.1 // 10% 税率
      const totalAmount = subtotal + taxAmount - (orderData.discount_amount || 0)

      // 4. 生成订单编号
      const orderNumber = await this.generateOrderNumber(orderData.tenant_id)

      // 5. 创建订单
      const { data: order, error: orderError } = await this.supabase
        .from(this.tableName)
        .insert({
          ...orderData,
          order_number: orderNumber,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'unpaid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 6. 创建订单项
      const orderItemsData = orderItems.map(item => ({
        ...item,
        order_id: order.id,
        created_at: new Date().toISOString()
      }))

      const { data: createdItems, error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItemsData)
        .select()

      if (itemsError) throw itemsError

      // 7. 更新库存
      for (const item of items) {
        await this.inventoryService.reduceStock(item.product_id, item.quantity, 'order', order.id)
      }

      // 8. 更新客户信息
      if (order.customer_id) {
        await this.customerService.updateSpending(order.customer_id, totalAmount)
      }

      return {
        data: { ...order, items: createdItems },
        error: null
      }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 更新订单状态
   * @param {string} id - 订单ID
   * @param {string} status - 新状态
   * @param {Object} options - 选项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updateStatus(id, status, options = {}) {
    try {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded']
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`)
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }

      // 如果完成订单，记录完成时间
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 更新支付状态
   * @param {string} id - 订单ID
   * @param {string} paymentStatus - 支付状态
   * @param {Object} paymentDetails - 支付详情
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updatePayment(id, paymentStatus, paymentDetails = {}) {
    try {
      const validStatuses = ['unpaid', 'paid', 'refunded', 'failed']
      if (!validStatuses.includes(paymentStatus)) {
        throw new Error(`Invalid payment status: ${paymentStatus}`)
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          payment_status: paymentStatus,
          payment_details: paymentDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 根据客户ID查找订单
   * @param {string} customerId - 客户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async findByCustomer(customerId, options = {}) {
    return this.findAll({
      ...options,
      filters: { customer_id: customerId, ...options.filters }
    })
  }

  /**
   * 根据状态查找订单
   * @param {string} status - 订单状态
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async findByStatus(status, tenantId) {
    return this.findAll({
      filters: { status, tenant_id: tenantId },
      order: { field: 'created_at', ascending: false }
    })
  }

  /**
   * 获取订单统计
   * @param {string} tenantId - 租户ID
   * @param {Object} dateRange - 日期范围
   * @returns {Promise<{data: Object, error: string|null}>}
   */
  async getOrderStats(tenantId, dateRange = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)

      // 日期过滤
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end)
      }

      const { data, error, count } = await query

      if (error) throw error

      const stats = {
        totalOrders: count || 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        byStatus: {}
      }

      if (data) {
        // 计算总收入
        stats.totalRevenue = data.reduce((sum, order) => sum + (order.total_amount || 0), 0)

        // 计算平均订单金额
        stats.averageOrderValue = stats.totalOrders > 0 
          ? stats.totalRevenue / stats.totalOrders 
          : 0

        // 按状态统计
        data.forEach(order => {
          const status = order.status || 'unknown'
          if (!stats.byStatus[status]) {
            stats.byStatus[status] = { count: 0, revenue: 0 }
          }
          stats.byStatus[status].count++
          stats.byStatus[status].revenue += (order.total_amount || 0)
        })
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 验证订单数据
   * @param {Object} data - 订单数据
   * @throws {Error} 验证失败时抛出
   */
  validateOrderData(data) {
    if (!data.tenant_id) {
      throw new Error('Tenant ID is required')
    }
    if (!data.customer_id) {
      throw new Error('Customer ID is required')
    }
    return true
  }

  /**
   * 验证订单项
   * @param {Array} items - 订单项列表
   * @throws {Error} 验证失败时抛出
   */
  validateOrderItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order items are required')
    }
    for (const item of items) {
      if (!item.product_id) {
        throw new Error('Product ID is required for each item')
      }
      if (!item.quantity || item.quantity < 1) {
        throw new Error('Quantity must be at least 1')
      }
      if (!item.unit_price || item.unit_price < 0) {
        throw new Error('Unit price must be non-negative')
      }
    }
    return true
  }
}

export default OrderService