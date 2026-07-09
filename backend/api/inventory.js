/**
 * api/inventory.js - 库存 API
 * GET    /api/inventory
 * GET    /api/inventory/:id
 * PUT    /api/inventory/:id
 * POST   /api/inventory/stock-in
 * POST   /api/inventory/stock-out
 */
import { supabase, getPagination, safeQuery, getUserById } from '../shared/lib/supabase.js';
import { authMiddleware } from '../shared/lib/auth.js';
import { validateInventory } from '../shared/lib/validation.js';
import { logger } from '../shared/lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { id, action } = req.query;

    // POST /api/inventory/stock-in - 入库
    if (method === 'POST' && action === 'stock-in') {
        return handleStockIn(req, res);
    }

    // POST /api/inventory/stock-out - 出库
    if (method === 'POST' && action === 'stock-out') {
        return handleStockOut(req, res);
    }

    // GET /api/inventory - 列表
    if (method === 'GET' && !id) {
        return handleList(req, res);
    }

    // GET /api/inventory/:id - 详情
    if (method === 'GET' && id) {
        return handleGet(req, res);
    }

    // PUT /api/inventory/:id - 更新
    if (method === 'PUT' && id) {
        return handleUpdate(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ===== 库存列表 =====
async function handleList(req, res) {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 20, search, category, low_stock } = req.query;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let query = supabase.from('products').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (category && category !== 'all') {
            query = query.eq('category_id', category);
        }

        if (low_stock === 'true') {
            query = query.lt('current_quantity', supabase.raw('min_quantity'));
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('name', { ascending: true }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询库存失败',
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
        logger.error('[Inventory] 获取库存列表失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取库存列表失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 产品详情 =====
async function handleGet(req, res) {
    try {
        const { id } = req.query;

        const result = await safeQuery(() =>
            supabase.from('products').select('*').eq('id', id).single()
        );

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: '产品不存在',
                code: 'PRODUCT_NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        logger.error('[Inventory] 获取产品失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取产品失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 更新产品 =====
async function handleUpdate(req, res) {
    try {
        const { id } = req.query;
        const body = req.body;

        const errors = validateInventory(body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        const updateData = {
            name: body.name,
            category_id: body.category_id,
            unit: body.unit,
            cost_price: body.cost_price,
            selling_price: body.selling_price,
            min_quantity: body.min_quantity,
            description: body.description,
            updated_at: new Date().toISOString()
        };

        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        const result = await safeQuery(() =>
            supabase.from('products').update(updateData).eq('id', id).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '更新产品失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: '产品更新成功'
        });

    } catch (error) {
        logger.error('[Inventory] 更新产品失败:', error);
        return res.status(500).json({
            success: false,
            error: '更新产品失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 入库 =====
async function handleStockIn(req, res) {
    try {
        const userId = req.user?.id;
        const { product_id, quantity, unit_price, supplier, note } = req.body;

        // 获取产品
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id)
            .single();

        if (!product) {
            return res.status(404).json({
                success: false,
                error: '产品不存在',
                code: 'PRODUCT_NOT_FOUND'
            });
        }

        const newQuantity = (product.current_quantity || 0) + quantity;

        // 更新库存
        await supabase
            .from('products')
            .update({
                current_quantity: newQuantity,
                cost_price: unit_price || product.cost_price,
                updated_at: new Date().toISOString()
            })
            .eq('id', product_id);

        // 记录入库日志
        await supabase.from('stock_transactions').insert({
            product_id: product_id,
            type: 'in',
            quantity: quantity,
            unit_price: unit_price || 0,
            total_price: (unit_price || 0) * quantity,
            supplier: supplier || '未知',
            note: note || '',
            created_by: userId,
            created_at: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            message: `入库成功，${product.name} 当前库存: ${newQuantity}`,
            data: { product_id, new_quantity: newQuantity }
        });

    } catch (error) {
        logger.error('[Inventory] 入库失败:', error);
        return res.status(500).json({
            success: false,
            error: '入库失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 出库 =====
async function handleStockOut(req, res) {
    try {
        const userId = req.user?.id;
        const { product_id, quantity, reason, note } = req.body;

        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id)
            .single();

        if (!product) {
            return res.status(404).json({
                success: false,
                error: '产品不存在',
                code: 'PRODUCT_NOT_FOUND'
            });
        }

        if ((product.current_quantity || 0) < quantity) {
            return res.status(400).json({
                success: false,
                error: `库存不足！当前库存: ${product.current_quantity}`,
                code: 'INSUFFICIENT_STOCK'
            });
        }

        const newQuantity = (product.current_quantity || 0) - quantity;

        await supabase
            .from('products')
            .update({
                current_quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', product_id);

        await supabase.from('stock_transactions').insert({
            product_id: product_id,
            type: 'out',
            quantity: quantity,
            reason: reason || '日常消耗',
            note: note || '',
            created_by: userId,
            created_at: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            message: `出库成功，${product.name} 当前库存: ${newQuantity}`,
            data: { product_id, new_quantity: newQuantity }
        });

    } catch (error) {
        logger.error('[Inventory] 出库失败:', error);
        return res.status(500).json({
            success: false,
            error: '出库失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);
