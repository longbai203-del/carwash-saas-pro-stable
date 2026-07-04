/**
 * api/inventory/[id].js - 获取单个产品详情
 * GET /api/inventory/:id
 * PUT /api/inventory/:id
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
import { validateInventory } from '../_lib/validation.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({
            success: false,
            error: '产品ID不能为空',
            code: 'MISSING_ID'
        });
    }

    try {
        const userId = req.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        let query = supabase.from('products').select('*').eq('id', id);

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (req.method === 'GET') {
            const result = await safeQuery(() => query.single());

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
        }

        if (req.method === 'PUT') {
            const errors = validateInventory(req.body);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: '参数验证失败',
                    errors: errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const updateData = {
                name: req.body.name,
                category_id: req.body.category_id,
                unit: req.body.unit,
                cost_price: req.body.cost_price,
                selling_price: req.body.selling_price,
                min_quantity: req.body.min_quantity,
                description: req.body.description,
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

            await supabase.from('audit_logs').insert({
                action: 'UPDATE_PRODUCT',
                table_name: 'products',
                record_id: id,
                username: req.user?.username || 'system',
                data: updateData,
                created_at: new Date().toISOString()
            });

            return res.status(200).json({
                success: true,
                data: result.data,
                message: '产品更新成功'
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });

    } catch (error) {
        logger.error('[Inventory] 操作产品失败:', error);
        return res.status(500).json({
            success: false,
            error: '操作失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);