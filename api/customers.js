/**
 * api/customers.js - 客户 API
 * GET    /api/customers
 * GET    /api/customers/:id
 * POST   /api/customers
 * PUT    /api/customers/:id
 */
import { supabase, getPagination, safeQuery, getUserById } from '../shared/lib/supabase.js';
import { authMiddleware } from '../shared/lib/auth.js';
import { validateCustomer } from '../shared/lib/validation.js';
import { logger } from '../shared/lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { id } = req.query;

    // GET /api/customers - 列表
    if (method === 'GET' && !id) {
        return handleList(req, res);
    }

    // GET /api/customers/:id - 详情
    if (method === 'GET' && id) {
        return handleGet(req, res);
    }

    // POST /api/customers - 创建
    if (method === 'POST') {
        return handleCreate(req, res);
    }

    // PUT /api/customers/:id - 更新
    if (method === 'PUT' && id) {
        return handleUpdate(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ===== 客户列表 =====
async function handleList(req, res) {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 20, search, level } = req.query;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let query = supabase.from('customers').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (user?.store_id && user?.role !== 'owner' && user?.role !== 'admin') {
            query = query.eq('store_id', user.store_id);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,plate_number.ilike.%${search}%`);
        }

        if (level && level !== 'all') {
            query = query.eq('level', level);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('created_at', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询客户失败',
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
        logger.error('[Customers] 获取客户列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取客户列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 客户详情 =====
async function handleGet(req, res) {
    try {
        const { id } = req.query;

        const result = await safeQuery(() =>
            supabase.from('customers').select('*').eq('id', id).single()
        );

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: '客户不存在',
                code: 'CUSTOMER_NOT_FOUND'
            });
        }

        // 获取客户订单历史
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        return res.status(200).json({
            success: true,
            data: {
                ...result.data,
                recent_orders: orders || []
            }
        });

    } catch (error) {
        logger.error('[Customers] 获取客户失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取客户失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 创建客户 =====
async function handleCreate(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;

        const errors = validateCustomer(body);
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

        const customerData = {
            tenant_id: user?.tenant_id || null,
            store_id: user?.store_id || null,
            name: body.name,
            phone: body.phone || '',
            email: body.email || null,
            plate_number: body.plate_number || null,
            address: body.address || null,
            level: body.level || '普通',
            notes: body.notes || null,
            points: 0,
            balance: 0,
            visit_count: 0,
            created_at: new Date().toISOString()
        };

        const result = await safeQuery(() =>
            supabase.from('customers').insert(customerData).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '创建客户失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: '客户创建成功'
        });

    } catch (error) {
        logger.error('[Customers] 创建客户失败:', error);
        return res.status(500).json({
            success: false,
            error: '创建客户失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 更新客户 =====
async function handleUpdate(req, res) {
    try {
        const { id } = req.query;
        const body = req.body;

        const updateData = {
            name: body.name,
            phone: body.phone,
            email: body.email,
            plate_number: body.plate_number,
            address: body.address,
            level: body.level,
            notes: body.notes,
            updated_at: new Date().toISOString()
        };

        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        const result = await safeQuery(() =>
            supabase.from('customers').update(updateData).eq('id', id).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '更新客户失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: '客户更新成功'
        });

    } catch (error) {
        logger.error('[Customers] 更新客户失败:', error);
        return res.status(500).json({
            success: false,
            error: '更新客户失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);
