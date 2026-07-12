/**
 * 考勤服务
 * 处理考勤记录相关的业务逻辑
 * 
 * @module services/AttendanceService
 * @extends BaseService
 * 
 * @example
 * import AttendanceService from './AttendanceService.js'
 * const attendanceService = new AttendanceService()
 * await attendanceService.checkIn(employeeId, { lat, lng })
 */

import BaseService from './BaseService.js'

/**
 * @typedef {Object} AttendanceRecord
 * @property {string} id - 记录ID
 * @property {string} employee_id - 员工ID
 * @property {string} check_in - 签到时间
 * @property {string} check_out - 签退时间
 * @property {string} status - 状态: present, absent, late, leave
 * @property {Object} location - 签到位置
 * @property {string} notes - 备注
 * @property {string} created_at - 创建时间
 */

class AttendanceService extends BaseService {
  /**
   * 创建考勤服务实例
   */
  constructor() {
    super({
      table: 'attendance_records',
      selectFields: [
        'id', 'employee_id', 'check_in', 'check_out',
        'status', 'location', 'notes', 'created_at'
      ],
      defaultOrder: { field: 'check_in', ascending: false }
    })
  }

  /**
   * 签到
   * @param {string} employeeId - 员工ID
   * @param {Object} options - 选项
   * @param {number} options.lat - 纬度
   * @param {number} options.lng - 经度
   * @param {string} options.notes - 备注
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async checkIn(employeeId, options = {}) {
    try {
      // 检查是否已签到
      const { data: existing } = await this.findTodayRecord(employeeId)
      if (existing) {
        throw new Error('Already checked in today')
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          employee_id: employeeId,
          check_in: new Date().toISOString(),
          status: 'present',
          location: options.location || null,
          notes: options.notes || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 签退
   * @param {string} employeeId - 员工ID
   * @param {Object} options - 选项
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async checkOut(employeeId, options = {}) {
    try {
      const { data: record, error: findError } = await this.findTodayRecord(employeeId)
      if (findError) throw findError
      if (!record) {
        throw new Error('No check-in record found for today')
      }
      if (record.check_out) {
        throw new Error('Already checked out')
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          check_out: new Date().toISOString(),
          notes: options.notes || record.notes
        })
        .eq('id', record.id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 查找今日记录
   * @param {string} employeeId - 员工ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findTodayRecord(employeeId) {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('employee_id', employeeId)
        .gte('check_in', startOfDay.toISOString())
        .lt('check_in', endOfDay.toISOString())
        .order('check_in', { ascending: false })
        .limit(1)

      if (error) throw error

      return { data: data?.[0] || null, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 获取员工考勤统计
   * @param {string} employeeId - 员工ID
   * @param {Object} dateRange - 日期范围
   * @returns {Promise<{data: Object, error: string|null}>}
   */
  async getEmployeeStats(employeeId, dateRange = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('employee_id', employeeId)

      if (dateRange.start) {
        query = query.gte('check_in', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('check_in', dateRange.end)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        onTime: 0,
        lateMinutes: 0
      }

      if (data) {
        data.forEach(record => {
          stats[record.status || 'present'] = (stats[record.status || 'present'] || 0) + 1
          
          // 计算准时率（假设9:00上班）
          if (record.check_in) {
            const checkInTime = new Date(record.check_in)
            const nineAM = new Date(checkInTime)
            nineAM.setHours(9, 0, 0, 0)
            
            if (checkInTime <= nineAM) {
              stats.onTime++
            } else {
              const diff = (checkInTime - nineAM) / 1000 / 60
              stats.lateMinutes += Math.ceil(diff)
            }
          }
        })

        // 计算准时率
        stats.onTimeRate = stats.total > 0 ? (stats.onTime / stats.total) * 100 : 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

export default AttendanceService