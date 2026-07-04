/**
 * api/orders/[id].js - 获取单个订单详情
 * GET /api/orders/:id
 * PUT /api/orders/:id
 * DELETE /api/orders/:id
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({
            success: false,
            error: '订单ID不能为空',
            code: 'MISSING_ID'
        });
    }

    try {
        const userId = req.user?.id;

        // 获取用户上下文
        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, role')
            .eq('id', userId)
            .single();

        // 构建基础查询
        let query = supabase.from('orders').select('*').eq('id', id);

        // 租户隔离
        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        // 门店隔离
        if (user?.store_id && user?.role !== 'owner' && user?.role !== 'admin') {
            query = query.eq('store_id', user.store_id);
        }

        // GET 请求 - 获取订单详情
        if (req.method === 'GET') {
            const result = await safeQuery(() => query.single());

            if (!result.success) {
                if (result.error?.includes('JSON object requested')) {
                    return res.status(404).json({
                        success: false,
                        error: '订单不存在',
                        code: 'ORDER_NOT_FOUND'
                    });
                }
                return res.status(500).json({
                    success: false,
                    error: '获取订单失败',
                    code: 'DB_ERROR'
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data
            });
        }

        // PUT 请求 - 更新订单
        if (req.method === 'PUT') {
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

            // 记录审计日志
            await supabase.from('audit_logs').insert({
                action: 'UPDATE_ORDER',
                table_name: 'orders',
                record_id: id,
                username: req.user?.username || 'system',
                data: updateData,
                created_at: new Date().toISOString()
            });

            return res.status(200).json({
                success: true,
                data: result.data,
                message: '订单更新成功'
            });
        }

        // DELETE 请求 - 删除订单
        if (req.method === 'DELETE') {
            // 检查用户权限（只有 owner 和 admin 可以删除）
            if (user?.role !== 'owner' && user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: '权限不足，只有老板和管理员可以删除订单',
                    code: 'FORBIDDEN'
                });
            }

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

            // 记录审计日志
            await supabase.from('audit_logs').insert({
                action: 'DELETE_ORDER',
                table_name: 'orders',
                record_id: id,
                username: req.user?.username || 'system',
                created_at: new Date().toISOString()
            });

            return res.status(200).json({
                success: true,
                message: '订单删除成功'
            });
        }

        // 其他方法不允许
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });

    } catch (error) {
        logger.error('[Order] 操作订单失败:', error);
        return res.status(500).json({
            success: false,
            error: '操作失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);