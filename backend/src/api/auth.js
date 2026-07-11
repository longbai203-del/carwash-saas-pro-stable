/**
 * auth 路由
 * 处理 auth 相关的API请求
 * 
 * @module api/auth
 */

import express from 'express'

const router = express.Router()

/**
 * GET / - 获取列表
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'auth API endpoint',
        data: []
    })
})

/**
 * GET /:id - 获取单个
 */
router.get('/:id', (req, res) => {
    res.json({
        success: true,
        message: 'Get auth by id',
        data: { id: req.params.id }
    })
})

/**
 * POST / - 创建
 */
router.post('/', (req, res) => {
    res.status(201).json({
        success: true,
        message: 'Create auth',
        data: req.body
    })
})

/**
 * PUT /:id - 更新
 */
router.put('/:id', (req, res) => {
    res.json({
        success: true,
        message: 'Update auth',
        data: { id: req.params.id, ...req.body }
    })
})

/**
 * DELETE /:id - 删除
 */
router.delete('/:id', (req, res) => {
    res.json({
        success: true,
        message: 'Delete auth',
        data: { id: req.params.id }
    })
})

export default router
