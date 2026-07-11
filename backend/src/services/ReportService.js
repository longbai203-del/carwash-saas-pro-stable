/**
 * 报表服务
 * 生成各类业务报表
 * 
 * @module services/ReportService
 * @extends BaseService
 * 
 * @example
 * import ReportService from './ReportService.js'
 * const reportService = new ReportService()
 * const report = await reportService.generateSalesReport(tenantId, dateRange)
 */

import BaseService from './BaseService.js'
import OrderService from './OrderService.js'
import CustomerService from './CustomerService.js'
import ProductService from './ProductService.js'
import EmployeeService from './EmployeeService.js'

/**
 * @typedef {Object} ReportConfig
 * @property {string} type - 报表类型
 * @property {Object} dateRange - 日期范围
 * @property {Array} filters - 过滤条件
 * @property {string} format - 输出格式
 */

class ReportService extends BaseService {
  /**
   * 创建报表服务实例
   */
  constructor() {
    super({
      table: 'reports',
      selectFields: ['*'],
      defaultOrder: { field: 'created_at', ascending: false }
    })

    /** @type {OrderService} */
    this.orderService = new OrderService()
    
    /** @type {CustomerService} */
    this.customerService = new CustomerService()
    
    /** @type {ProductService} */
    this.productService = new ProductService()
    
    /** @type {EmployeeService} */
    this.employeeService = new EmployeeService()
  }

  /**
   * 生成销售报表
   * @param {string} tenantId - 租户ID
   * @param {Object} dateRange - 日期范围
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 销售报表
   */
  async generateSalesReport(tenantId, dateRange = {}, options = {}) {
    try {
      // 获取订单数据
      const { data: orders } = await this.orderService.findAll({
        filters: { tenant_id: tenantId },
        order: { field: 'created_at', ascending: true }
      })

      // 过滤日期
      let filteredOrders = orders || []
      if (dateRange.start) {
        filteredOrders = filteredOrders.filter(o => o.created_at >= dateRange.start)
      }
      if (dateRange.end) {
        filteredOrders = filteredOrders.filter(o => o.created_at <= dateRange.end)
      }

      // 计算统计数据
      const totalOrders = filteredOrders.length
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // 按状态分组
      const byStatus = {}
      filteredOrders.forEach(o => {
        const status = o.status || 'unknown'
        byStatus[status] = byStatus[status] || { count: 0, revenue: 0 }
        byStatus[status].count++
        byStatus[status].revenue += (o.total_amount || 0)
      })

      // 按日期分组
      const byDate = {}
      filteredOrders.forEach(o => {
        const date = o.created_at?.split('T')[0] || 'unknown'
        byDate[date] = byDate[date] || { count: 0, revenue: 0 }
        byDate[date].count++
        byDate[date].revenue += (o.total_amount || 0)
      })

      // 按支付方式分组
      const byPaymentMethod = {}
      filteredOrders.forEach(o => {
        const method = o.payment_method || 'unknown'
        byPaymentMethod[method] = byPaymentMethod[method] || { count: 0, revenue: 0 }
        byPaymentMethod[method].count++
        byPaymentMethod[method].revenue += (o.total_amount || 0)
      })

      return {
        type: 'sales',
        period: dateRange,
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          uniqueCustomers: new Set(filteredOrders.map(o => o.customer_id)).size
        },
        breakdown: {
          byStatus,
          byDate,
          byPaymentMethod
        },
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Generate sales report failed:', error)
      throw error
    }
  }

  /**
   * 生成客户报表
   * @param {string} tenantId - 租户ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 客户报表
   */
  async generateCustomerReport(tenantId, options = {}) {
    try {
      const { data: customers } = await this.customerService.findAll({
        filters: { tenant_id: tenantId, is_active: true }
      })

      const { data: orders } = await this.orderService.findAll({
        filters: { tenant_id: tenantId }
      })

      // 客户分析
      const customerAnalysis = (customers || []).map(customer => {
        const customerOrders = (orders || []).filter(o => o.customer_id === customer.id)
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        const orderCount = customerOrders.length

        return {
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          email: customer.email,
          phone: customer.phone,
          totalSpent,
          orderCount,
          averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
          loyaltyPoints: customer.loyalty_points || 0,
          tier: customer.loyalty_tier || 'bronze',
          lastOrder: customerOrders.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0]?.created_at || null
        }
      })

      // 排序
      const topCustomers = [...customerAnalysis]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)

      const totalCustomers = customerAnalysis.length
      const activeCustomers = customerAnalysis.filter(c => c.orderCount > 0).length

      return {
        type: 'customers',
        summary: {
          totalCustomers,
          activeCustomers,
          inactiveCustomers: totalCustomers - activeCustomers,
          totalRevenue: customerAnalysis.reduce((sum, c) => sum + c.totalSpent, 0),
          averageSpent: totalCustomers > 0 ? 
            customerAnalysis.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0
        },
        topCustomers,
        customerDistribution: {
          byTier: customerAnalysis.reduce((acc, c) => {
            acc[c.tier] = (acc[c.tier] || 0) + 1
            return acc
          }, {})
        },
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Generate customer report failed:', error)
      throw error
    }
  }

  /**
   * 生成员工报表
   * @param {string} tenantId - 租户ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 员工报表
   */
  async generateEmployeeReport(tenantId, options = {}) {
    try {
      const { data: employees } = await this.employeeService.findAll({
        filters: { tenant_id: tenantId }
      })

      const employeeAnalysis = (employees || []).map(emp => {
        // 可扩展：查询销售数据
        return {
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          department: emp.department || 'other',
          position: emp.position || 'staff',
          status: emp.status || 'active',
          salary: emp.salary || 0,
          hireDate: emp.hire_date,
          salesCount: 0,
          salesAmount: 0
        }
      })

      return {
        type: 'employees',
        summary: {
          totalEmployees: employeeAnalysis.length,
          activeEmployees: employeeAnalysis.filter(e => e.status === 'active').length,
          byDepartment: employeeAnalysis.reduce((acc, e) => {
            acc[e.department] = (acc[e.department] || 0) + 1
            return acc
          }, {}),
          totalSalary: employeeAnalysis.reduce((sum, e) => sum + e.salary, 0)
        },
        employees: employeeAnalysis,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Generate employee report failed:', error)
      throw error
    }
  }

  /**
   * 生成库存报表
   * @param {string} tenantId - 租户ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 库存报表
   */
  async generateInventoryReport(tenantId, options = {}) {
    try {
      const { data: products } = await this.productService.findAll({
        filters: { tenant_id: tenantId }
      })

      const totalItems = products?.length || 0
      const totalValue = products?.reduce((sum, p) => 
        sum + ((p.current_stock || 0) * (p.cost_price || 0)), 0) || 0

      const lowStock = (products || []).filter(p => 
        (p.current_stock || 0) <= (p.min_stock || 0) && !p.is_service
      )

      return {
        type: 'inventory',
        summary: {
          totalItems,
          totalValue,
          lowStockCount: lowStock.length,
          categories: products?.reduce((acc, p) => {
            const cat = p.category_id || 'uncategorized'
            acc[cat] = (acc[cat] || 0) + 1
            return acc
          }, {}) || {}
        },
        lowStock,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Generate inventory report failed:', error)
      throw error
    }
  }
}

export default ReportService