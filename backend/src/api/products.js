/**
 * api/products.js - 商品API路由
 * @module products
 * @description 商品的CRUD操作、分类管理、库存管理
 * 
 * @example
 * // GET /api/products - 获取商品列表
 * // POST /api/products - 创建商品
 * // PUT /api/products/:id - 更新商品
 * // DELETE /api/products/:id - 删除商品
 */

import express from 'express';
import { supabase } from '../shared/lib/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// 获取商品列表 (支持分页、筛选、排序)
// ============================================================

router.get('/', authenticate, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            name,
            category,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        // 应用筛选
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }
        if (category) {
            query = query.eq('category', category);
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
            console.error('[Products] 查询失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询商品失败',
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
        console.error('[Products] 查询异常:', error);
        next(error);
    }
});

// ============================================================
// 获取商品详情
// ============================================================

router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '商品不存在'
                });
            }
            console.error('[Products] 查询详情失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询商品详情失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: 'success',
            data: data
        });

    } catch (error) {
        console.error('[Products] 查询详情异常:', error);
        next(error);
    }
});

// ============================================================
// 创建商品
// ============================================================

router.post('/', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const {
            name,
            category,
            price,
            cost,
            stock,
            unit,
            status = 'active',
            description,
            sku
        } = req.body;

        // 验证必填字段
        if (!name) {
            return res.status(400).json({
                code: 400,
                message: '商品名称不能为空'
            });
        }
        if (price === undefined || price < 0) {
            return res.status(400).json({
                code: 400,
                message: '商品价格必须大于等于0'
            });
        }

        // 生成SKU
        const generatedSku = sku || `${category?.substring(0, 2) || 'PR'}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        const productData = {
            name,
            category: category || '其他',
            price,
            cost: cost || 0,
            stock: stock || 0,
            unit: unit || '个',
            status,
            description: description || '',
            sku: generatedSku,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            console.error('[Products] 创建失败:', error);
            return res.status(500).json({
                code: 500,
                message: '创建商品失败',
                error: error.message
            });
        }

        res.status(201).json({
            code: 201,
            message: '商品创建成功',
            data: data
        });

    } catch (error) {
        console.error('[Products] 创建异常:', error);
        next(error);
    }
});

// ============================================================
// 更新商品
// ============================================================

router.put('/:id', authenticate, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        delete updateData.id;
        delete updateData.created_at;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    code: 404,
                    message: '商品不存在'
                });
            }
            console.error('[Products] 更新失败:', error);
            return res.status(500).json({
                code: 500,
                message: '更新商品失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: '商品更新成功',
            data: data
        });

    } catch (error) {
        console.error('[Products] 更新异常:', error);
        next(error);
    }
});

// ============================================================
// 更新库存
// ============================================================

router.patch('/:id/stock', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stock, operation = 'set' } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({
                code: 400,
                message: '库存数量必须大于等于0'
            });
        }

        // 先获取当前商品
        const { data: current, error: getError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', id)
            .single();

        if (getError) {
            return res.status(404).json({
                code: 404,
                message: '商品不存在'
            });
        }

        let newStock;
        if (operation === 'add') {
            newStock = (current.stock || 0) + stock;
        } else if (operation === 'subtract') {
            newStock = Math.max(0, (current.stock || 0) - stock);
        } else {
            newStock = stock;
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                stock: newStock,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Products] 更新库存失败:', error);
            return res.status(500).json({
                code: 500,
                message: '更新库存失败',
                error: error.message
            });
        }

        res.json({
            code: 200,
            message: '库存更新成功',
            data: data
        });

    } catch (error) {
        console.error('[Products] 更新库存异常:', error);
        next(error);
    }
});

// ============================================================
// 删除商品
// ============================================================

router.delete('/:id', authenticate, requireRole(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            console.error('[Products] 删除失败:', error);
            return res.status(500).json({
                code: 500,
                message: '删除商品失败',
                error: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '商品不存在'
            });
        }

        res.json({
            code: 200,
            message: '商品删除成功',
            data: data[0]
        });

    } catch (error) {
        console.error('[Products] 删除异常:', error);
        next(error);
    }
});

// ============================================================
// 获取商品分类
// ============================================================

router.get('/categories/list', authenticate, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('category')
            .not('category', 'is', null);

        if (error) {
            console.error('[Products] 查询分类失败:', error);
            return res.status(500).json({
                code: 500,
                message: '查询分类失败'
            });
        }

        const categories = [...new Set((data || []).map(p => p.category).filter(Boolean))];
        categories.sort();

        res.json({
            code: 200,
            message: 'success',
            data: categories
        });

    } catch (error) {
        console.error('[Products] 查询分类异常:', error);
        next(error);
    }
});

// ============================================================
// 导出
// ============================================================

export default router;