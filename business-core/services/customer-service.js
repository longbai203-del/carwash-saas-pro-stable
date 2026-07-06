/**
 * business-core/services/customer-service.js
 * 客户服务 - CRM 核心
 */

import { BaseService } from './base-service.js';

export class CustomerService extends BaseService {
    constructor() {
        super('customers');
    }

    // 获取客户列表（含统计）
    async getList(params = {}) {
        const result = await this.find(params);
        return result;
    }

    // 获取客户详情（含车辆、订单）
    async getDetail(id) {
        const customer = await this.findById(id);
        if (!customer) return null;

        // 获取车辆
        const { data: vehicles } = await this.supabase
            .from('customer_vehicles')
            .select('*')
            .eq('customer_id', id);

        // 获取订单统计
        const { data: orders } = await this.supabase
            .from('orders')
            .select('id, total_amount, status, created_at')
            .eq('customer_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        return {
            ...customer,
            vehicles: vehicles || [],
            recentOrders: orders || []
        };
    }

    // 添加车辆
    async addVehicle(customerId, vehicleData) {
        const { data, error } = await this.supabase
            .from('customer_vehicles')
            .insert({
                ...vehicleData,
                customer_id: customerId
            })
            .select()
            .single();

        if (error) throw error;
        this.clearCache();
        this.emit('vehicle:added', { customerId, vehicle: data });
        return data;
    }

    // 获取统计数据
    async getStats() {
        const cacheKey = 'customer:stats';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const all = await this.find({ limit: 9999 });
        const customers = all.list || [];

        const stats = {
            total: customers.length,
            vip: customers.filter(c => c.level === 'vip').length,
            gold: customers.filter(c => c.level === 'gold').length,
            silver: customers.filter(c => c.level === 'silver').length,
            bronze: customers.filter(c => c.level === 'bronze').length,
            totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
            averageSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length : 0
        };

        this.setCache(cacheKey, stats);
        return stats;
    }

    // 搜索客户
    async search(query) {
        if (!query || query.length < 2) return { list: [], total: 0 };

        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        return { list: data || [], total: data?.length || 0 };
    }

    // 更新等级（自动计算）
    async updateLevel(customerId) {
        const customer = await this.findById(customerId);
        if (!customer) throw new Error('Customer not found');

        // 根据消费金额计算等级
        const spent = customer.total_spent || 0;
        let level = 'bronze';
        if (spent >= 50000) level = 'vip';
        else if (spent >= 20000) level = 'gold';
        else if (spent >= 5000) level = 'silver';

        if (level !== customer.level) {
            return this.update(customerId, { level });
        }
        return customer;
    }
}

export default CustomerService;