/**
 * api/orders/create.js - 创建订单
 * POST /api/orders/create
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
import { validateOrder } from '../_lib/validation.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const userId = req.user?.id;
        const body = req.body;

        // 验证数据
        const errors = validateOrder(body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        // 获取用户信息
        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, name')
            .eq('id', userId)
            .single();

        // 生成订单号
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

        // 构建订单数据
        const orderData = {
            order_number: orderNumber,
            date: today,
            customer_id: body.customer_id || null,
            plate_number: body.plate_number || null,
            employee_id: userId,
            staff_name: user?.name || body.staff_name || '系统',
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
            logger.error('[CreateOrder] 创建订单失败:', result.error);
            return res.status(500).json({
                success: false,
                error: '创建订单失败',
                code: 'DB_ERROR'
            });
        }

        // 更新客户信息
        if (body.customer_id) {
            await supabase.rpc('update_customer_stats', {
                p_customer_id: body.customer_id,
                p_amount: body.total || 0
            }).catch(() => {});
        }

        // 记录审计日志
        await supabase.from('audit_logs').insert({
            action: 'CREATE_ORDER',
            table_name: 'orders',
            record_id: result.data.id,
            username: req.user?.username || 'system',
            data: orderData,
            created_at: new Date().toISOString()
        });

        return res.status(201).json({
            success: true,
            data: result.data,
            message: '订单创建成功'
        });

    } catch (error) {
        logger.error('[CreateOrder] 创建订单异常:', error);
        return res.status(500).json({
            success: false,
            error: '创建订单失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);