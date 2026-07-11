/**
 * 员工服务
 * 处理员工相关的业务逻辑
 * 
 * @module services/EmployeeService
 * @extends BaseService
 * 
 * @example
 * import EmployeeService from './EmployeeService.js'
 * const employeeService = new EmployeeService()
 * const { data } = await employeeService.findByDepartment('sales')
 */

import BaseService from './BaseService.js'

/**
 * @typedef {Object} Employee
 * @property {string} id - 员工ID
 * @property {string} tenant_id - 租户ID
 * @property {string} employee_id - 工号
 * @property {string} first_name - 名
 * @property {string} last_name - 姓
 * @property {string} email - 邮箱
 * @property {string} phone - 电话
 * @property {string} department - 部门
 * @property {string} position - 职位
 * @property {string} hire_date - 入职日期
 * @property {number} salary - 薪资
 * @property {number} commission_rate - 佣金率
 * @property {string} status - 状态: active, inactive, terminated
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 */

class EmployeeService extends BaseService {
  /**
   * 创建员工服务实例
   */
  constructor() {
    super({
      table: 'employees',
      selectFields: [
        'id', 'tenant_id', 'employee_id', 'first_name', 'last_name',
        'email', 'phone', 'department', 'position', 'hire_date',
        'salary', 'commission_rate', 'status', 'created_at', 'updated_at'
      ],
      defaultOrder: { field: 'created_at', ascending: false }
    })
  }

  /**
   * 根据部门查找员工
   * @param {string} department - 部门名称
   * @param {string} tenantId - 租户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async findByDepartment(department, tenantId, options = {}) {
    return this.findAll({
      ...options,
      filters: { department, tenant_id: tenantId, ...options.filters }
    })
  }

  /**
   * 根据工号查找员工
   * @param {string} employeeId - 工号
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findByEmployeeId(employeeId, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('employee_id', employeeId)
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 获取活跃员工
   * @param {string} tenantId - 租户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async getActiveEmployees(tenantId, options = {}) {
    return this.findAll({
      ...options,
      filters: { status: 'active', tenant_id: tenantId, ...options.filters }
    })
  }

  /**
   * 获取员工统计
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object, error: string|null}>}
   */
  async getEmployeeStats(tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('tenant_id', tenantId)

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        byDepartment: {},
        byStatus: {},
        totalSalary: 0,
        averageSalary: 0
      }

      if (data) {
        data.forEach(emp => {
          // 按部门统计
          const dept = emp.department || 'other'
          stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1

          // 按状态统计
          const status = emp.status || 'unknown'
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

          // 薪资统计
          stats.totalSalary += (emp.salary || 0)
        })

        stats.averageSalary = stats.total > 0 ? stats.totalSalary / stats.total : 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 验证员工数据
   * @param {Object} data - 员工数据
   * @throws {Error} 验证失败时抛出
   */
  validateData(data) {
    if (!data.first_name) {
      throw new Error('First name is required')
    }
    if (!data.last_name) {
      throw new Error('Last name is required')
    }
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format')
    }
    if (data.salary !== undefined && data.salary < 0) {
      throw new Error('Salary must be non-negative')
    }
    if (data.commission_rate !== undefined && (data.commission_rate < 0 || data.commission_rate > 100)) {
      throw new Error('Commission rate must be between 0 and 100')
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
}

export default EmployeeService