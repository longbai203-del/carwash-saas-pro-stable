/**
 * api/customers.js - 客户API路由
 * @module customers
 * @description 客户的CRUD操作、搜索、分级管理
 * 
 * @example
 * // GET /api/customers - 获取客户列表
 * // POST /api/customers - 创建客户
 * // PUT /api/customers/:id - 更新客户
 * // DELETE /api/customers/:id - 删除客户
 */

import express from 'express';
import { supabase, getPagination, safeQuery } from '../shared/lib/supabase.js'; // ✅ 修复：补充 getPagination 和 safeQuery
import { authenticate } from '../shared/lib/auth.js';

const router = express.Router();

// ============================================================
// 获取客户列表 (支持分页、筛选、排序)
// ============================================================

router.get('/', authenticate, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            name,
            phone,
            level,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' });

        // 应用筛选
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }
        if (phone) {
            query = query.ilike('phone', `%${phone}%`);
        }
        if (level) {
            query = query.eq('level', level);
        }
        if (status) {
            query = query.eq('status', status);
        }

        // 应用排序
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // 应用分页
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[Customers] 查询失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询客户失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: 'success',
            data: data || [],
            total: count || 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((count || 0) / parseInt(limit))
        });

    } catch (error) {
        console.error('[Customers] 查询异常:', error);
        next(error);
    }
});

// ============================================================
// 获取客户详情
// ============================================================

router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('customers')
            .select('*, vehicles(*)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '客户不存在'
                });
            }
            console.error('[Customers] 查询详情失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询客户详情失败',
                error: error.message
            });
        }

        // 获取订单统计
        const { count: orderCount, error: orderError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', id);

        const { data: orderData, error: orderDataError } = await supabase
            .from('orders')
            .select('total')
            .eq('customer_id', id)
            .eq('status', 'completed');

        const totalSpent = (orderData || []).reduce((sum, o) => sum + (o.total || 0), 0);

        res.json({
            code: 200,
            message: 'success',
            data: {
                ...data,
                orderCount: orderCount || 0,
                totalSpent: totalSpent
            }
        });

    } catch (error) {
        console.error('[Customers] 查询详情异常:', error);
        next(error);
    }
});

// ============================================================
// 创建客户
// ============================================================

router.post('/', authenticate, async (req, res, next) => {
    try {
        const {
            name,
            phone,
            email,
            level = 'bronze',
            address,
            notes,
            plateNumber,
            vehicleBrand,
            vehicleModel
        } = req.body;

        // 验证必填字段
        if (!name) {
            return res.status(400).json({
                code: 400,
                message: '客户姓名不能为空'
            });
        }
        if (!phone) {
            return res.status(400).json({
                code: 400,
                message: '手机号不能为空'
            });
        }

        // 检查客户是否已存在
        const { data: existing, error: existError } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({
                code: 409,
                message: '该手机号已被注册'
            });
        }

        // 创建客户
        const customerData = {
            name,
            phone,
            email: email || null,
            level: level || 'bronze',
            address: address || null,
            notes: notes || null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single();

        if (customerError) {
            console.error('[Customers] 创建失败:', customerError);
            return res.status(500).json({
                code: 500,
                message: '创建客户失败',
                error: customerError.message
            });
        }

        // 如果有车辆信息，创建车辆
        if (plateNumber && customer) {
            const vehicleData = {
                customer_id: customer.id,
                plate_number: plateNumber,
                brand: vehicleBrand || null,
                model: vehicleModel || null,
                created_at: new Date().toISOString()
            };

            await supabase
                .from('vehicles')
                .insert(vehicleData)
                .select();
        }

        res.status(201).json({
            code: 201,
            message: '客户创建成功',
            data: customer
        });

    } catch (error) {
        console.error('[Customers] 创建异常:', error);
        next(error);
    }
});

// ============================================================
// 更新客户
// ============================================================

router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        delete updateData.id;
        delete updateData.created_at;
        delete updateData.totalSpent;
        delete updateData.orderCount;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '客户不存在'
                });
            }
            console.error('[Customers] 更新失败:', error);
            return res.status(500).json({
                code: 500,
                message: '更新客户失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: '客户更新成功',
            data: data
        });

    } catch (error) {
        console.error('[Customers] 更新异常:', error);
        next(error);
    }
});

// ============================================================
// 删除客户
// ============================================================

router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        // 检查是否有订单
        const { count, error: countError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', id);

        if (count > 0) {
            return res.status(400).json({
                code: 400,
                message: '该客户有订单记录，无法删除'
            });
        }

        // 删除车辆
        await supabase
            .from('vehicles')
            .delete()
            .eq('customer_id', id);

        const { data, error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            console.error('[Customers] 删除失败:', error);
            return res.status(500).json({
                code: 500,
                message: '删除客户失败',
                error: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '客户不存在'
            });
        }

        res.json({
            code: 200,
            message: '客户删除成功',
            data: data[0]
        });

    } catch (error) {
        console.error('[Customers] 删除异常:', error);
        next(error);
    }
});

// ============================================================
// 获取客户统计
// ============================================================

router.get('/stats/summary', authenticate, async (req, res, next) => {
    try {
        const { count: total, error: totalError } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });

        const { count: active, error: activeError } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { data: vipData, error: vipError } = await supabase
            .from('customers')
            .select('count')
            .eq('level', 'vip');

        const vipCount = vipData?.[0]?.count || 0;

        const { data: goldData, error: goldError } = await supabase
            .from('customers')
            .select('count')
            .eq('level', 'gold');

        const goldCount = goldData?.[0]?.count || 0;

        res.json({
            code: 200,
            message: 'success',
            data: {
                total: total || 0,
                active: active || 0,
                vip: vipCount,
                gold: goldCount
            }
        });

    } catch (error) {
        console.error('[Customers] 统计异常:', error);
        next(error);
    }
});

// ============================================================
// 导出
// ============================================================

export default router;