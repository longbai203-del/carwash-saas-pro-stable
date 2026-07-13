/**
 * api/orders.js - 订单API路由
 * @module orders
 * @description 订单的CRUD操作、状态管理、统计
 * 
 * @example
 * // GET /api/orders - 获取订单列表
 * // POST /api/orders - 创建订单
 * // PUT /api/orders/:id - 更新订单
 * // DELETE /api/orders/:id - 删除订单
 */

import express from 'express';
import { supabase, getPagination } from '../shared/lib/supabase.js'; // ✅ 修复：显式导入 getPagination
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// 获取订单列表 (支持分页、筛选、排序)
// ============================================================

router.get('/', authenticate, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            customer,
            orderNo,
            startDate,
            endDate,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 构建查询
        let query = supabase
            .from('orders')
            .select('*, customers(name, phone)', { count: 'exact' });

        // 应用筛选
        if (status) {
            query = query.eq('status', status);
        }
        if (customer) {
            query = query.ilike('customer_name', `%${customer}%`);
        }
        if (orderNo) {
            query = query.ilike('order_number', `%${orderNo}%`);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // 应用排序
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // 应用分页
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[Orders] 查询失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询订单失败',
                error: error.message
            });
        }

        // 格式化数据
        const formattedData = (data || []).map(order => ({
            ...order,
            total: order.total || 0,
            items: order.items || [],
            customer_name: order.customers?.name || order.customer_name || '散客'
        }));

        res.json({
            code: 200,
            message: 'success',
            data: formattedData,
            total: count || 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((count || 0) / parseInt(limit))
        });

    } catch (error) {
        console.error('[Orders] 查询异常:', error);
        next(error);
    }
});

// ============================================================
// 获取订单详情
// ============================================================

router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('orders')
            .select('*, customers(*)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '订单不存在'
                });
            }
            console.error('[Orders] 查询详情失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询订单详情失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: 'success',
            data: {
                ...data,
                customer_name: data.customers?.name || data.customer_name || '散客'
            }
        });

    } catch (error) {
        console.error('[Orders] 查询详情异常:', error);
        next(error);
    }
});

// ============================================================
// 创建订单
// ============================================================

router.post('/', authenticate, async (req, res, next) => {
    try {
        const {
            customerId,
            customerName,
            customerPhone,
            items = [],
            total,
            subtotal,
            discount = 0,
            tax = 0,
            paymentMethod = 'cash',
            paymentStatus = 'pending',
            notes = ''
        } = req.body;

        // 验证必填字段
        if (!items || items.length === 0) {
            return res.status(400).json({
                code: 400,
                message: '订单至少包含一个商品'
            });
        }

        if (total === undefined || total <= 0) {
            return res.status(400).json({
                code: 400,
                message: '订单总金额必须大于0'
            });
        }

        // 生成订单号
        const now = new Date();
        const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        // 构建订单数据
        const orderData = {
            order_number: orderNumber,
            customer_id: customerId || null,
            customer_name: customerName || '散客',
            customer_phone: customerPhone || '',
            items: items,
            subtotal: subtotal || total,
            discount: discount || 0,
            tax: tax || 0,
            total: total,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            status: 'pending',
            notes: notes || '',
            created_by: req.user?.id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (error) {
            console.error('[Orders] 创建失败:', error);
            return res.status(500).json({
                code: 500,
                message: '创建订单失败',
                error: error.message
            });
        }

        res.status(201).json({
            code: 201,
            message: '订单创建成功',
            data: data
        });

    } catch (error) {
        console.error('[Orders] 创建异常:', error);
        next(error);
    }
});

// ============================================================
// 更新订单
// ============================================================

router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 不允许修改订单号
        delete updateData.order_number;
        delete updateData.id;

        // 更新时间戳
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '订单不存在'
                });
            }
            console.error('[Orders] 更新失败:', error);
            return res.status(500).json({
                code: 500,
                message: '更新订单失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: '订单更新成功',
            data: data
        });

    } catch (error) {
        console.error('[Orders] 更新异常:', error);
        next(error);
    }
});

// ============================================================
// 更新订单状态
// ============================================================

router.patch('/:id/status', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                code: 400,
                message: '请提供订单状态'
            });
        }

        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                code: 400,
                message: `无效的订单状态: ${status}，有效值: ${validStatuses.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '订单不存在'
                });
            }
            console.error('[Orders] 更新状态失败:', error);
            return res.status(500).json({
                code: 500,
                message: '更新订单状态失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: '订单状态更新成功',
            data: data
        });

    } catch (error) {
        console.error('[Orders] 更新状态异常:', error);
        next(error);
    }
});

// ============================================================
// 删除订单
// ============================================================

router.delete('/:id', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            console.error('[Orders] 删除失败:', error);
            return res.status(500).json({
                code: 500,
                message: '删除订单失败',
                error: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '订单不存在'
            });
        }

        res.json({
            code: 200,
            message: '订单删除成功',
            data: data[0]
        });

    } catch (error) {
        console.error('[Orders] 删除异常:', error);
        next(error);
    }
});

// ============================================================
// 获取订单统计
// ============================================================

router.get('/stats/summary', authenticate, async (req, res, next) => {
    try {
        // 今日统计
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        const { data: todayOrders, error: todayError } = await supabase
            .from('orders')
            .select('total, status')
            .gte('created_at', todayStr);

        if (todayError) {
            console.error('[Orders] 今日统计失败:', todayError);
            return res.status(500).json({
                code: 500,
                message: '获取统计失败'
            });
        }

        const todayTotal = (todayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
        const todayCount = (todayOrders || []).length;
        const completedCount = (todayOrders || []).filter(o => o.status === 'completed').length;

        // 总统计
        const { count: totalOrders, error: totalError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (totalError) {
            console.error('[Orders] 总统计失败:', totalError);
        }

        res.json({
            code: 200,
            message: 'success',
            data: {
                todayRevenue: todayTotal,
                todayOrders: todayCount,
                todayCompleted: completedCount,
                totalOrders: totalOrders || 0,
                pendingOrders: (todayOrders || []).filter(o => o.status === 'pending').length
            }
        });

    } catch (error) {
        console.error('[Orders] 统计异常:', error);
        next(error);
    }
});

// ============================================================
// 导出
// ============================================================

export default router;