/**
 * api/orders.js - 订单 API
 * GET    /api/orders
 * GET    /api/orders/:id
 * POST   /api/orders
 * PUT    /api/orders/:id
 * DELETE /api/orders/:id
 */
import { supabase, getPagination, safeQuery, getUserById } from './_lib/supabase.js';
import { authMiddleware } from './_lib/auth.js';
import { validateOrder } from './_lib/validation.js';
import { logger } from './_lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { id } = req.query;

    // GET /api/orders - 列表
    if (method === 'GET' && !id) {
        return handleList(req, res);
    }

    // GET /api/orders/:id - 详情
    if (method === 'GET' && id) {
        return handleGet(req, res);
    }

    // POST /api/orders - 创建
    if (method === 'POST') {
        return handleCreate(req, res);
    }

    // PUT /api/orders/:id - 更新
    if (method === 'PUT' && id) {
        return handleUpdate(req, res);
    }

    // DELETE /api/orders/:id - 删除
    if (method === 'DELETE' && id) {
        return handleDelete(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ===== 订单列表 =====
async function handleList(req, res) {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 20, status, date, customer_id } = req.query;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let query = supabase.from('orders').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (user?.store_id && user?.role !== 'owner' && user?.role !== 'admin') {
            query = query.eq('store_id', user.store_id);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (date) {
            query = query.eq('date', date);
        }

        if (customer_id) {
            query = query.eq('customer_id', customer_id);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('created_at', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询订单失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.data?.length || 0
            }
        });

    } catch (error) {
        logger.error('[Orders] 获取订单列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取订单列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 订单详情 =====
async function handleGet(req, res) {
    try {
        const { id } = req.query;
        const userId = req.user?.id;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let query = supabase.from('orders').select('*').eq('id', id);

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        const result = await safeQuery(() => query.single());

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: '订单不存在',
                code: 'ORDER_NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        logger.error('[Orders] 获取订单失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取订单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 创建订单 =====
async function handleCreate(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;

        const errors = validateOrder(body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const { data: todayOrders } = await supabase
            .from('orders')
            .select('order_number')
            .eq('date', today)
            .order('created_at', { ascending: false })
            .limit(1);

        let orderNumber = `ORD-${today.replace(/-/g, '')}-0001`;
        if (todayOrders && todayOrders.length > 0) {
            const lastNumber = parseInt(todayOrders[0].order_number.split('-')[2]);
            orderNumber = `ORD-${today.replace(/-/g, '')}-${String(lastNumber + 1).padStart(4, '0')}`;
        }

        const orderData = {
            order_number: orderNumber,
            date: today,
            customer_id: body.customer_id || null,
            plate_number: body.plate_number || null,
            employee_id: userId,
            staff_name: user?.name || '系统',
            service_name: body.service_name || '',
            amount: body.amount || 0,
            discount: body.discount || 0,
            vat: body.vat || 0,
            total: body.total || 0,
            payment_method: body.payment_method || 'cash',
            status: body.status || 'pending',
            note: body.note || '',
            tenant_id: user?.tenant_id || null,
            store_id: user?.store_id || null,
            created_at: new Date().toISOString(),
            paid_at: body.paid_at || null
        };

        const result = await safeQuery(() =>
            supabase.from('orders').insert(orderData).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '创建订单失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: '订单创建成功'
        });

    } catch (error) {
        logger.error('[Orders] 创建订单失败:', error);
        return res.status(500).json({
            success: false,
            error: '创建订单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 更新订单 =====
async function handleUpdate(req, res) {
    try {
        const { id } = req.query;
        const { status, payment_method, note } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (payment_method) updateData.payment_method = payment_method;
        if (note !== undefined) updateData.note = note;
        updateData.updated_at = new Date().toISOString();

        const result = await safeQuery(() =>
            supabase.from('orders').update(updateData).eq('id', id).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '更新订单失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: '订单更新成功'
        });

    } catch (error) {
        logger.error('[Orders] 更新订单失败:', error);
        return res.status(500).json({
            success: false,
            error: '更新订单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 删除订单 =====
async function handleDelete(req, res) {
    try {
        const { id } = req.query;

        const result = await safeQuery(() =>
            supabase.from('orders').delete().eq('id', id)
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '删除订单失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            message: '订单删除成功'
        });

    } catch (error) {
        logger.error('[Orders] 删除订单失败:', error);
        return res.status(500).json({
            success: false,
            error: '删除订单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);