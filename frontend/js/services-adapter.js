/**
 * services-adapter.js - 服务适配器
 * 连接 Supabase 服务，替换 Mock 数据
 */

import {
    getProductService,
    getOrderService,
    getCustomerService,
    getDashboardService
} from './services/supabase.js';

// ============================================================
// 适配器 - 将 Supabase 服务适配为统一接口
// ============================================================

class ServiceAdapter {
    constructor() {
        this._productService = null;
        this._orderService = null;
        this._customerService = null;
        this._dashboardService = null;
        this._initialized = false;
        this._useSupabase = true; // 是否使用真实数据
    }

    async init() {
        if (this._initialized) return;
        try {
            this._productService = getProductService();
            this._orderService = getOrderService();
            this._customerService = getCustomerService();
            this._dashboardService = getDashboardService();
            this._initialized = true;
            console.log('✅ 服务适配器初始化完成 (Supabase 模式)');
        } catch (error) {
            console.warn('⚠️ Supabase 初始化失败，切换到 Mock 模式:', error.message);
            this._useSupabase = false;
            this._initialized = true;
        }
    }

    // ============================================================
    // Product 服务
    // ============================================================

    async getProducts(params = {}) {
        await this.init();
        if (this._useSupabase && this._productService) {
            try {
                const result = await this._productService.getList(params);
                return {
                    list: result.list.map(p => ({
                        id: p.id,
                        name: p.name,
                        category: p.categories?.name || p.category || '未分类',
                        price: p.price || 0,
                        cost: p.cost || 0,
                        stock: p.stock_quantity || 0,
                        unit: p.unit || '个',
                        status: p.status || 'active',
                        createTime: p.created_at
                    })),
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                };
            } catch (error) {
                console.warn('⚠️ Supabase 查询失败，使用 Mock:', error.message);
                return this._getMockProducts(params);
            }
        }
        return this._getMockProducts(params);
    }

    _getMockProducts(params) {
        const mockData = [
            { id: 'PRD-001', name: '泡沫洗车液', category: '洗车', price: 68, cost: 20, stock: 45, unit: '桶', status: 'active' },
            { id: 'PRD-002', name: '水蜡', category: '洗车', price: 128, cost: 40, stock: 30, unit: '瓶', status: 'active' },
            { id: 'PRD-003', name: '轮胎光亮剂', category: '美容', price: 88, cost: 25, stock: 20, unit: '瓶', status: 'active' }
        ];
        return { list: mockData, total: mockData.length };
    }

    async createProduct(data) {
        await this.init();
        if (this._useSupabase && this._productService) {
            try {
                return await this._productService.create(data);
            } catch (error) {
                console.warn('⚠️ Supabase 创建失败:', error.message);
                return { ...data, id: 'PRD-' + Date.now() };
            }
        }
        return { ...data, id: 'PRD-' + Date.now() };
    }

    async updateProduct(id, data) {
        await this.init();
        if (this._useSupabase && this._productService) {
            try {
                return await this._productService.update(id, data);
            } catch (error) {
                console.warn('⚠️ Supabase 更新失败:', error.message);
                return { ...data, id };
            }
        }
        return { ...data, id };
    }

    async deleteProduct(id) {
        await this.init();
        if (this._useSupabase && this._productService) {
            try {
                return await this._productService.delete(id);
            } catch (error) {
                console.warn('⚠️ Supabase 删除失败:', error.message);
                return { success: true };
            }
        }
        return { success: true };
    }

    // ============================================================
    // Order 服务
    // ============================================================

    async getOrders(params = {}) {
        await this.init();
        if (this._useSupabase && this._orderService) {
            try {
                const result = await this._orderService.getList(params);
                return {
                    list: result.list.map(o => ({
                        id: o.id,
                        orderNo: o.order_number || o.id,
                        customer: o.customer_name || '散客',
                        phone: o.customers?.phone || '',
                        total: o.total || 0,
                        status: o.status || 'pending',
                        items: o.order_items || [],
                        createTime: o.created_at
                    })),
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                };
            } catch (error) {
                console.warn('⚠️ Supabase 查询失败，使用 Mock:', error.message);
                return this._getMockOrders(params);
            }
        }
        return this._getMockOrders(params);
    }

    _getMockOrders(params) {
        const mockData = [
            { id: 'ORD-001', orderNo: 'ORD-2026-0001', customer: '张伟', total: 680, status: 'completed', createTime: new Date().toISOString() },
            { id: 'ORD-002', orderNo: 'ORD-2026-0002', customer: '李娜', total: 420, status: 'pending', createTime: new Date().toISOString() }
        ];
        return { list: mockData, total: mockData.length };
    }

    async createOrder(data) {
        await this.init();
        if (this._useSupabase && this._orderService) {
            try {
                return await this._orderService.create(data);
            } catch (error) {
                console.warn('⚠️ Supabase 创建失败:', error.message);
                return { ...data, id: 'ORD-' + Date.now() };
            }
        }
        return { ...data, id: 'ORD-' + Date.now() };
    }

    async updateOrderStatus(id, status) {
        await this.init();
        if (this._useSupabase && this._orderService) {
            try {
                return await this._orderService.updateStatus(id, status);
            } catch (error) {
                console.warn('⚠️ Supabase 更新失败:', error.message);
                return { id, status };
            }
        }
        return { id, status };
    }

    async deleteOrder(id) {
        await this.init();
        if (this._useSupabase && this._orderService) {
            try {
                return await this._orderService.delete(id);
            } catch (error) {
                console.warn('⚠️ Supabase 删除失败:', error.message);
                return { success: true };
            }
        }
        return { success: true };
    }

    // ============================================================
    // Customer 服务
    // ============================================================

    async getCustomers(params = {}) {
        await this.init();
        if (this._useSupabase && this._customerService) {
            try {
                const result = await this._customerService.getList(params);
                return {
                    list: result.list.map(c => ({
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        email: c.email,
                        level: c.level || 'bronze',
                        totalSpent: c.total_spent || 0,
                        orderCount: c.order_count || 0,
                        lastVisit: c.last_visit,
                        createTime: c.created_at
                    })),
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                };
            } catch (error) {
                console.warn('⚠️ Supabase 查询失败，使用 Mock:', error.message);
                return this._getMockCustomers(params);
            }
        }
        return this._getMockCustomers(params);
    }

    _getMockCustomers(params) {
        const mockData = [
            { id: 'CUS-001', name: '张伟', phone: '13800001111', level: 'gold', totalSpent: 12500, orderCount: 15 },
            { id: 'CUS-002', name: '李娜', phone: '13800002222', level: 'vip', totalSpent: 32800, orderCount: 28 }
        ];
        return { list: mockData, total: mockData.length };
    }

    async createCustomer(data) {
        await this.init();
        if (this._useSupabase && this._customerService) {
            try {
                return await this._customerService.create(data);
            } catch (error) {
                console.warn('⚠️ Supabase 创建失败:', error.message);
                return { ...data, id: 'CUS-' + Date.now() };
            }
        }
        return { ...data, id: 'CUS-' + Date.now() };
    }

    async updateCustomer(id, data) {
        await this.init();
        if (this._useSupabase && this._customerService) {
            try {
                return await this._customerService.update(id, data);
            } catch (error) {
                console.warn('⚠️ Supabase 更新失败:', error.message);
                return { ...data, id };
            }
        }
        return { ...data, id };
    }

    async deleteCustomer(id) {
        await this.init();
        if (this._useSupabase && this._customerService) {
            try {
                return await this._customerService.delete(id);
            } catch (error) {
                console.warn('⚠️ Supabase 删除失败:', error.message);
                return { success: true };
            }
        }
        return { success: true };
    }

    // ============================================================
    // Dashboard 服务
    // ============================================================

    async getDashboardData() {
        await this.init();
        if (this._useSupabase && this._dashboardService) {
            try {
                return await this._dashboardService.getDashboardData();
            } catch (error) {
                console.warn('⚠️ Supabase 查询失败，使用 Mock:', error.message);
                return this._getMockDashboardData();
            }
        }
        return this._getMockDashboardData();
    }

    _getMockDashboardData() {
        return {
            stats: {
                todayRevenue: 28650.00,
                todayOrders: 47,
                activeCustomers: 328,
                conversionRate: 68.5
            },
            recentOrders: [
                { id: 'ORD-001', customer: '张伟', amount: 680, status: 'completed', time: '10:30' },
                { id: 'ORD-002', customer: '李娜', amount: 420, status: 'pending', time: '10:15' },
                { id: 'ORD-003', customer: '王强', amount: 1250, status: 'processing', time: '09:45' }
            ],
            chartData: {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
            }
        };
    }
}

// ============================================================
// 创建单例
// ============================================================

let adapterInstance = null;

function getServiceAdapter() {
    if (!adapterInstance) {
        adapterInstance = new ServiceAdapter();
    }
    return adapterInstance;
}

// 导出
export { getServiceAdapter, ServiceAdapter };

// 全局访问
window.ServiceAdapter = getServiceAdapter;

console.log('✅ 服务适配器已加载');