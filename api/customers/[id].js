/**
 * api/customers/[id].js - 获取单个客户详情
 * GET /api/customers/:id
 * PUT /api/customers/:id
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
import { validateCustomer } from '../_lib/validation.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({
            success: false,
            error: '客户ID不能为空',
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

        let query = supabase.from('customers').select('*').eq('id', id);

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (req.method === 'GET') {
            const result = await safeQuery(() => query.single());

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
        }

        if (req.method === 'PUT') {
            const errors = validateCustomer(req.body);
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
                phone: req.body.phone,
                email: req.body.email,
                plate_number: req.body.plate_number,
                address: req.body.address,
                level: req.body.level,
                notes: req.body.notes,
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

            await supabase.from('audit_logs').insert({
                action: 'UPDATE_CUSTOMER',
                table_name: 'customers',
                record_id: id,
                username: req.user?.username || 'system',
                data: updateData,
                created_at: new Date().toISOString()
            });

            return res.status(200).json({
                success: true,
                data: result.data,
                message: '客户更新成功'
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });

    } catch (error) {
        logger.error('[Customer] 操作客户失败:', error);
        return res.status(500).json({
            success: false,
            error: '操作失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);