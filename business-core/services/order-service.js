/**
 * business-core/services/order-service.js
 * 订单服务 - 销售核心
 */

import { BaseService } from './base-service.js';
import { ProductService } from './product-service.js';

export class OrderService extends BaseService {
    constructor() {
        super('orders');
        this.productService = new ProductService();
    }

    // 创建订单（完整流程）
    async createOrder(orderData) {
        const now = new Date().toISOString();

        try {
            // 1. 生成订单号
            const orderNumber = await this._generateOrderNumber();

            // 2. 计算金额
            const items = orderData.items || [];
            let subtotal = 0;
            let totalVat = 0;

            for (const item of items) {
                const product = await this.productService.findById(item.product_id);
                if (!product) throw new Error(`商品 ${item.product_id} 不存在`);

                const unitPrice = item.unit_price || product.price;
                const itemTotal = unitPrice * item.quantity;
                const vatAmount = itemTotal * (product.vat_rate || 15) / 100;

                subtotal += itemTotal;
                totalVat += vatAmount;
            }

            const totalAmount = subtotal + totalVat - (orderData.discount_amount || 0);

            // 3. 创建订单
            const { data: order, error: orderError } = await this.supabase
                .from(this.tableName)
                .insert({
                    tenant_id: localStorage.getItem('tenantId'),
                    branch_id: localStorage.getItem('branchId'),
                    order_number: orderNumber,
                    customer_id: orderData.customer_id || null,
                    customer_name: orderData.customer_name || '散客',
                    customer_phone: orderData.customer_phone || '',
                    subtotal: subtotal,
                    discount_amount: orderData.discount_amount || 0,
                    discount_percent: orderData.discount_percent || 0,
                    vat_rate: 15,
                    vat_amount: totalVat,
                    total_amount: totalAmount,
                    status: 'pending',
                    payment_status: 'unpaid',
                    payment_method: orderData.payment_method || 'cash',
                    source: orderData.source || 'pos',
                    notes: orderData.notes || '',
                    created_by: localStorage.getItem('userId'),
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 4. 创建订单明细
            for (const item of items) {
                const product = await this.productService.findById(item.product_id);
                const unitPrice = item.unit_price || product.price;
                const itemTotal = unitPrice * item.quantity;
                const vatAmount = itemTotal * (product.vat_rate || 15) / 100;

                const { error: itemError } = await this.supabase
                    .from('order_items')
                    .insert({
                        order_id: order.id,
                        product_id: item.product_id,
                        product_name: product.name,
                        product_sku: product.sku,
                        quantity: item.quantity,
                        unit_price: unitPrice,
                        discount_amount: item.discount_amount || 0,
                        vat_rate: product.vat_rate || 15,
                        vat_amount: vatAmount,
                        total_price: itemTotal,
                        notes: item.notes || ''
                    });

                if (itemError) throw itemError;

                // 5. 扣减库存
                await this.productService.updateStock(
                    item.product_id,
                    -item.quantity,
                    localStorage.getItem('branchId') || orderData.warehouse_id,
                    `订单 ${orderNumber} 销售`
                );
            }

            // 6. 更新客户统计
            if (orderData.customer_id) {
                await this._updateCustomerStats(orderData.customer_id, totalAmount);
            }

            // 7. 记录财务
            await this._recordIncome(order, totalAmount, totalVat);

            this.clearCache();
            this.emit('order:created', order);
            return order;

        } catch (error) {
            console.error('❌ OrderService.createOrder 失败:', error);
            throw error;
        }
    }

    // 生成订单号
    async _generateOrderNumber() {
        const prefix = 'ORD';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const { count, error } = await this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        const seq = String((count || 0) + 1).padStart(6, '0');
        return `${prefix}-${date}-${seq}`;
    }

    // 更新客户统计
    async _updateCustomerStats(customerId, amount) {
        const { data: customer, error: findError } = await this.supabase
            .from('customers')
            .select('total_spent, total_orders')
            .eq('id', customerId)
            .single();

        if (findError) throw findError;

        const { error: updateError } = await this.supabase
            .from('customers')
            .update({
                total_spent: (customer.total_spent || 0) + amount,
                total_orders: (customer.total_orders || 0) + 1,
                last_visit: new Date().toISOString()
            })
            .eq('id', customerId);

        if (updateError) throw updateError;
    }

    // 记录收入
    async _recordIncome(order, totalAmount, vatAmount) {
        const { error } = await this.supabase
            .from('income_records')
            .insert({
                tenant_id: localStorage.getItem('tenantId'),
                branch_id: localStorage.getItem('branchId'),
                order_id: order.id,
                invoice_number: order.order_number,
                category: 'service_revenue',
                amount: totalAmount - vatAmount,
                vat_amount: vatAmount,
                total_amount: totalAmount,
                payment_method: order.payment_method,
                description: `订单 ${order.order_number}`,
                recorded_by: localStorage.getItem('userId'),
                recorded_at: new Date().toISOString()
            });

        if (error) console.warn('收入记录失败:', error);
    }

    // 更新订单状态
    async updateStatus(orderId, status) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                status: status,
                updated_at: new Date().toISOString(),
                completed_at: status === 'completed' ? new Date().toISOString() : null
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        this.clearCache();
        this.emit('order:status:updated', { orderId, status });
        return data;
    }

    // 更新支付状态
    async updatePayment(orderId, paymentData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                payment_status: paymentData.status,
                payment_method: paymentData.method,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        this.clearCache();
        this.emit('order:payment:updated', { orderId, payment: paymentData });
        return data;
    }

    // 获取订单统计
    async getStats(params = {}) {
        const cacheKey = `order:stats:${JSON.stringify(params)}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const query = this.supabase.from(this.tableName).select('*');

        if (params.branchId) {
            query.eq('branch_id', params.branchId);
        }
        if (params.dateStart) {
            query.gte('created_at', params.dateStart);
        }
        if (params.dateEnd) {
            query.lte('created_at', params.dateEnd);
        }

        const { data, error } = await query;
        if (error) throw error;

        const orders = data || [];
        const stats = {
            total: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            completed: orders.filter(o => o.status === 'completed').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            paid: orders.filter(o => o.payment_status === 'paid').length,
            unpaid: orders.filter(o => o.payment_status === 'unpaid').length,
            avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length : 0
        };

        this.setCache(cacheKey, stats);
        return stats;
    }

    // 获取订单详情（含明细）
    async getDetail(id) {
        const order = await this.findById(id);
        if (!order) return null;

        const { data: items } = await this.supabase
            .from('order_items')
            .select('*')
            .eq('order_id', id);

        return {
            ...order,
            items: items || []
        };
    }
}

export default OrderService;