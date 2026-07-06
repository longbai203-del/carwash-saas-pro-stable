/**
 * services.js - 前端数据服务层
 * 连接 API 层和 UI 组件，提供缓存和状态管理
 * 支持 Supabase 真实数据和 Mock 数据
 */

import { getServiceAdapter } from './services-adapter.js';

// ============================================================
// 1. 数据服务基类
// ============================================================

class BaseService {
    constructor(resourceName) {
        this.resourceName = resourceName;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        this.adapter = null;
    }

    async getAdapter() {
        if (!this.adapter) {
            this.adapter = getServiceAdapter();
            await this.adapter.init();
        }
        return this.adapter;
    }

    // 获取缓存
    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // 设置缓存
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // 清除缓存
    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

// ============================================================
// 2. 产品服务
// ============================================================

class ProductService extends BaseService {
    constructor() {
        super('products');
    }

    async getList(params = {}) {
        const cacheKey = JSON.stringify(params);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const adapter = await this.getAdapter();
            const result = await adapter.getProducts(params);
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('获取产品列表失败:', error);
            throw error;
        }
    }

    async getById(id) {
        const cached = this.getCache(`product_${id}`);
        if (cached) return cached;

        try {
            const adapter = await this.getAdapter();
            const result = await adapter.getProductById(id);
            this.setCache(`product_${id}`, result);
            return result;
        } catch (error) {
            console.error('获取产品详情失败:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.createProduct(data);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('创建产品失败:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.updateProduct(id, data);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('更新产品失败:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.deleteProduct(id);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('删除产品失败:', error);
            throw error;
        }
    }

    getStats() {
        // 从缓存或适配器获取
        return this.getList({ limit: 1 }).then(result => ({
            total: result.total || 0,
            active: result.list.filter(p => p.status === 'active').length || 0
        }));
    }
}

// ============================================================
// 3. 订单服务
// ============================================================

class OrderService extends BaseService {
    constructor() {
        super('orders');
    }

    async getList(params = {}) {
        const cacheKey = JSON.stringify(params);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const adapter = await this.getAdapter();
            const result = await adapter.getOrders(params);
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('获取订单列表失败:', error);
            throw error;
        }
    }

    async getById(id) {
        try {
            const adapter = await this.getAdapter();
            return await adapter.getOrderById(id);
        } catch (error) {
            console.error('获取订单详情失败:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.createOrder(data);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('创建订单失败:', error);
            throw error;
        }
    }

    async updateStatus(id, status) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.updateOrderStatus(id, status);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('更新订单状态失败:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.deleteOrder(id);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('删除订单失败:', error);
            throw error;
        }
    }

    getStats() {
        return this.getList({ limit: 100 }).then(result => {
            const orders = result.list || [];
            return {
                total: orders.length,
                completed: orders.filter(o => o.status === 'completed').length,
                pending: orders.filter(o => o.status === 'pending').length,
                processing: orders.filter(o => o.status === 'processing').length,
                cancelled: orders.filter(o => o.status === 'cancelled').length,
                totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
            };
        });
    }

    getRecent(limit = 5) {
        return this.getList({ limit: limit }).then(result => result.list || []);
    }
}

// ============================================================
// 4. 客户服务
// ============================================================

class CustomerService extends BaseService {
    constructor() {
        super('customers');
    }

    async getList(params = {}) {
        const cacheKey = JSON.stringify(params);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const adapter = await this.getAdapter();
            const result = await adapter.getCustomers(params);
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('获取客户列表失败:', error);
            throw error;
        }
    }

    async getById(id) {
        try {
            const adapter = await this.getAdapter();
            return await adapter.getCustomerById(id);
        } catch (error) {
            console.error('获取客户详情失败:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.createCustomer(data);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('创建客户失败:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.updateCustomer(id, data);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('更新客户失败:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const adapter = await this.getAdapter();
            const result = await adapter.deleteCustomer(id);
            this.clearCache();
            return result;
        } catch (error) {
            console.error('删除客户失败:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const adapter = await this.getAdapter();
            return await adapter.getCustomerStats();
        } catch (error) {
            console.error('获取客户统计失败:', error);
            throw error;
        }
    }
}

// ============================================================
// 5. Dashboard 服务
// ============================================================

class DashboardService extends BaseService {
    constructor() {
        super('dashboard');
        this.orderService = new OrderService();
        this.customerService = new CustomerService();
        this.productService = new ProductService();
    }

    async getDashboardData() {
        const cacheKey = 'dashboard_data';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const adapter = await this.getAdapter();
            const data = await adapter.getDashboardData();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('获取仪表盘数据失败:', error);
            throw error;
        }
    }

    getStats() {
        return this.getDashboardData().then(data => data.stats || {});
    }

    getRecentOrders() {
        return this.getDashboardData().then(data => data.recentOrders || []);
    }

    getChartData() {
        return this.getDashboardData().then(data => data.chartData || { labels: [], values: [] });
    }
}

// ============================================================
// 6. 导出所有服务
// ============================================================

// 创建单例实例
const productService = new ProductService();
const orderService = new OrderService();
const customerService = new CustomerService();
const dashboardService = new DashboardService();

// 导出
export {
    productService,
    orderService,
    customerService,
    dashboardService
};

// 全局访问
window.Services = {
    product: productService,
    order: orderService,
    customer: customerService,
    dashboard: dashboardService
};

console.log('✅ 数据服务层已加载 (支持 Supabase)');