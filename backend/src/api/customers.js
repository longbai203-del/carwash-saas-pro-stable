/**
 * 客户API路由
 * 处理所有客户相关的HTTP请求
 * 
 * @module api/customers
 * @requires express
 * @requires services/CustomerService
 * @requires middleware/auth
 * @requires middleware/validation
 * 
 * @example
 * GET /api/customers - 获取所有客户
 * POST /api/customers - 创建客户
 * GET /api/customers/:id - 获取单个客户
 * PUT /api/customers/:id - 更新客户
 * DELETE /api/customers/:id - 删除客户
 */

import express from 'express'
import { CustomerService } from '../services/index.js'
import { authenticate, requirePermission, catchAsync } from '../middleware/index.js'
import { schemas, validateBody, validateQuery, validateParams } from '../middleware/validation.js'

const router = express.Router()
const customerService = new CustomerService()

/**
 * 获取所有客户
 * @route GET /api/customers
 * @param {string} query.tenant_id - 租户ID (必需)
 * @param {number} query.page - 页码
 * @param {number} query.limit - 每页数量
 * @param {string} query.search - 搜索关键词
 * @returns {Object} 客户列表
 */
router.get('/',
  authenticate,
  requirePermission('customers', 'read'),
  validateQuery({}),
  catchAsync(async (req, res) => {
    const { tenant_id, page = 1, limit = 20, search } = req.query

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TENANT',
        message: 'tenant_id is required'
      })
    }

    let result
    if (search) {
      result = await customerService.search(search, tenant_id)
    } else {
      const offset = (page - 1) * limit
      result = await customerService.findAll({
        filters: { tenant_id },
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
    }

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: result.error
      })
    }

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.count || result.data.length
      }
    })
  })
)

/**
 * 获取单个客户
 * @route GET /api/customers/:id
 * @param {string} params.id - 客户ID
 * @returns {Object} 客户详情
 */
router.get('/:id',
  authenticate,
  requirePermission('customers', 'read'),
  validateParams({ id: { required: true } }),
  catchAsync(async (req, res) => {
    const { id } = req.params
    const { data, error } = await customerService.findById(id)

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Customer not found'
      })
    }

    res.json({
      success: true,
      data
    })
  })
)

/**
 * 创建客户
 * @route POST /api/customers
 * @body {Object} customer - 客户数据
 * @returns {Object} 创建的客户
 */
router.post('/',
  authenticate,
  requirePermission('customers', 'write'),
  catchAsync(async (req, res) => {
    const { tenant_id } = req.query
    const customerData = {
      ...req.body,
      tenant_id: tenant_id || req.user?.tenant_id
    }

    const { data, error } = await customerService.create(customerData)

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'CREATE_FAILED',
        message: error
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Customer created successfully'
    })
  })
)

/**
 * 更新客户
 * @route PUT /api/customers/:id
 * @param {string} params.id - 客户ID
 * @body {Object} customer - 客户数据
 * @returns {Object} 更新后的客户
 */
router.put('/:id',
  authenticate,
  requirePermission('customers', 'write'),
  validateParams({ id: { required: true } }),
  catchAsync(async (req, res) => {
    const { id } = req.params
    const { data, error } = await customerService.update(id, req.body)

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: error
      })
    }

    res.json({
      success: true,
      data,
      message: 'Customer updated successfully'
    })
  })
)

/**
 * 删除客户
 * @route DELETE /api/customers/:id
 * @param {string} params.id - 客户ID
 * @returns {Object} 删除结果
 */
router.delete('/:id',
  authenticate,
  requirePermission('customers', 'delete'),
  validateParams({ id: { required: true } }),
  catchAsync(async (req, res) => {
    const { id } = req.params
    const { success, error } = await customerService.delete(id)

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'DELETE_FAILED',
        message: error
      })
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  })
)

export default router