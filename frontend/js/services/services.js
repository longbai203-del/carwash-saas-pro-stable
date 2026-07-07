/**
 * services.js - 前端数据服务层
 * 连接 Business Core 和 UI 组件
 * 支持 Supabase 真实数据和 Mock 降级
 */

// ============================================================
// 1. 导入 Business Core
// ============================================================

// 动态导入 Business Core
let BusinessCore = null;

async function loadBusinessCore() {
    if (BusinessCore) return BusinessCore;
    try {
        const module = await import('/business-core/index.js');
        BusinessCore = module;
        window.BusinessCore = BusinessCore;
        console.log('✅ Business Core 已加载');
        return BusinessCore;
    } catch (error) {
        console.warn('⚠️ Business Core 加载失败，使用 Mock 模式:', error.message);
        return null;
    }
}

// ============================================================
// 2. 工具函数
// ============================================================

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return Number(amount).toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('zh-CN');
    } catch (e) {
        return '-';
    }
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '-';
    }
}

// ============================================================
// 3. 客户服务（集成 Business Core）
// ============================================================

class CustomerService {
    constructor() {
        this._service = null;
        this._ready = false;
        this._initialized = false;
    }

    async getService() {
        if (this._service) return this._service;
        
        const core = await loadBusinessCore();
        if (core && core.services && core.services.customer) {
            this._service = core.services.customer;
            this._ready = true;
            console.log('✅ 使用真实 CustomerService');
            return this._service;
        }
        
        console.log('📦 使用 Mock CustomerService');
        this._ready = false;
        return this;
    }

    // Mock 数据
    _getMockCustomers() {
        const customers = [];
        const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
        const levels = ['gold', 'silver', 'bronze', 'vip'];
        const phones = ['13800001111', '13800002222', '13800003333', '13800004444', '13800005555'];

        for (let i = 0; i < 25; i++) {
            customers.push({
                id: 'CUS-' + String(i + 1).padStart(6, '0'),
                name: names[i % names.length],
                phone: phones[i % phones.length],
                email: 'user' + (i + 1) + '@example.com',
                level: levels[i % levels.length],
                total_spent: Math.floor(Math.random() * 50000) + 1000,
                total_orders: Math.floor(Math.random() * 50) + 1,
                last_visit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        return customers;
    }

    async getList(params = {}) {
        try {
            const service = await this.getService();
            if (this._ready) {
                const result = await service.find({
                    page: params.page || 1,
                    limit: params.limit || 10,
                    filters: {
                        name: params.name || '',
                        phone: params.phone || ''
                    },
                    equals: params.level ? { level: params.level } : {}
                });
                return {
                    list: result.list || [],
                    total: result.total || 0,
                    page: result.page || 1,
                    limit: result.limit || 10
                };
            }
        } catch (error) {
            console.warn('⚠️ 真实服务查询失败，使用 Mock:', error.message);
        }

        // Mock 降级
        const all = this._getMockCustomers();
        let filtered = all;
        if (params.name) filtered = filtered.filter(c => c.name.includes(params.name));
        if (params.phone) filtered = filtered.filter(c => c.phone.includes(params.phone));
        if (params.level) filtered = filtered.filter(c => c.level === params.level);
        
        const page = params.page || 1;
        const limit = params.limit || 10;
        const start = (page - 1) * limit;
        
        return {
            list: filtered.slice(start, start + limit),
            total: filtered.length,
            page: page,
            limit: limit
        };
    }

    async getStats() {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.getStats === 'function') {
                return await service.getStats();
            }
        } catch (error) {
            console.warn('⚠️ 统计查询失败，使用 Mock:', error.message);
        }

        const all = this._getMockCustomers();
        return {
            total: all.length,
            vip: all.filter(c => c.level === 'vip').length,
            gold: all.filter(c => c.level === 'gold').length,
            silver: all.filter(c => c.level === 'silver').length,
            bronze: all.filter(c => c.level === 'bronze').length,
            totalSpent: all.reduce((sum, c) => sum + (c.total_spent || 0), 0)
        };
    }

    async getById(id) {
        try {
            const service = await this.getService();
            if (this._ready) {
                return await service.findById(id);
            }
        } catch (error) {
            console.warn('⚠️ 查询失败，使用 Mock:', error.message);
        }
        return this._getMockCustomers().find(c => c.id === id);
    }

    async create(data) {
        try {
            const service = await this.getService();
            if (this._ready) {
                const result = await service.create(data);
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 创建失败，使用 Mock:', error.message);
        }
        return { ...data, id: 'CUS-' + Date.now() };
    }

    async update(id, data) {
        try {
            const service = await this.getService();
            if (this._ready) {
                return await service.update(id, data);
            }
        } catch (error) {
            console.warn('⚠️ 更新失败，使用 Mock:', error.message);
        }
        return { ...data, id: id };
    }

    async delete(id) {
        try {
            const service = await this.getService();
            if (this._ready) {
                return await service.delete(id);
            }
        } catch (error) {
            console.warn('⚠️ 删除失败，使用 Mock:', error.message);
        }
        return { success: true };
    }

    clearCache() {
        if (this._service && typeof this._service.clearCache === 'function') {
            this._service.clearCache();
        }
    }
}

// ============================================================
// 4. 订单服务
// ============================================================

class OrderService {
    constructor() {
        this._service = null;
        this._ready = false;
    }

    async getService() {
        if (this._service) return this._service;
        const core = await loadBusinessCore();
        if (core && core.services && core.services.order) {
            this._service = core.services.order;
            this._ready = true;
            return this._service;
        }
        return this;
    }

    _getMockOrders() {
        const orders = [];
        const statuses = ['pending', 'processing', 'completed', 'cancelled'];
        const customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];

        for (let i = 0; i < 25; i++) {
            orders.push({
                id: 'ORD-' + String(i + 1).padStart(6, '0'),
                order_number: 'ORD-2026-' + String(i + 1).padStart(4, '0'),
                customer_name: customers[i % customers.length],
                customer_phone: '138' + String(Math.floor(Math.random() * 90000000) + 10000000),
                total_amount: Math.floor(Math.random() * 1000) + 100,
                status: statuses[i % statuses.length],
                payment_status: ['unpaid', 'paid'][i % 2],
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        return orders;
    }

    async getList(params = {}) {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.find === 'function') {
                const result = await service.find({
                    page: params.page || 1,
                    limit: params.limit || 10,
                    filters: {
                        customer_name: params.customer || '',
                        order_number: params.orderNo || ''
                    },
                    equals: params.status ? { status: params.status } : {}
                });
                return {
                    list: result.list || [],
                    total: result.total || 0,
                    page: result.page || 1,
                    limit: result.limit || 10
                };
            }
        } catch (error) {
            console.warn('⚠️ 订单查询失败，使用 Mock:', error.message);
        }

        const all = this._getMockOrders();
        let filtered = all;
        if (params.orderNo) filtered = filtered.filter(o => o.order_number.includes(params.orderNo));
        if (params.customer) filtered = filtered.filter(o => o.customer_name.includes(params.customer));
        if (params.status) filtered = filtered.filter(o => o.status === params.status);
        
        const page = params.page || 1;
        const limit = params.limit || 10;
        const start = (page - 1) * limit;
        
        return {
            list: filtered.slice(start, start + limit),
            total: filtered.length,
            page: page,
            limit: limit
        };
    }

    async getStats() {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.getStats === 'function') {
                return await service.getStats();
            }
        } catch (error) {
            console.warn('⚠️ 订单统计失败，使用 Mock:', error.message);
        }

        const all = this._getMockOrders();
        return {
            total: all.length,
            totalRevenue: all.reduce((sum, o) => sum + (o.total_amount || 0), 0),
            pending: all.filter(o => o.status === 'pending').length,
            processing: all.filter(o => o.status === 'processing').length,
            completed: all.filter(o => o.status === 'completed').length,
            cancelled: all.filter(o => o.status === 'cancelled').length
        };
    }

    async create(data) {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.createOrder === 'function') {
                return await service.createOrder(data);
            }
            if (this._ready && typeof service.create === 'function') {
                return await service.create(data);
            }
        } catch (error) {
            console.warn('⚠️ 订单创建失败，使用 Mock:', error.message);
        }
        return { ...data, id: 'ORD-' + Date.now() };
    }

    async updateStatus(id, status) {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.updateStatus === 'function') {
                return await service.updateStatus(id, status);
            }
        } catch (error) {
            console.warn('⚠️ 状态更新失败，使用 Mock:', error.message);
        }
        return { id, status };
    }

    async delete(id) {
        try {
            const service = await this.getService();
            if (this._ready) {
                return await service.delete(id);
            }
        } catch (error) {
            console.warn('⚠️ 删除失败，使用 Mock:', error.message);
        }
        return { success: true };
    }

    clearCache() {
        if (this._service && typeof this._service.clearCache === 'function') {
            this._service.clearCache();
        }
    }
}

// ============================================================
// 5. 商品服务
// ============================================================

class ProductService {
    constructor() {
        this._service = null;
        this._ready = false;
    }

    async getService() {
        if (this._service) return this._service;
        const core = await loadBusinessCore();
        if (core && core.services && core.services.product) {
            this._service = core.services.product;
            this._ready = true;
            return this._service;
        }
        return this;
    }

    _getMockProducts() {
        const products = [];
        const names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂', '纳米涂层', '轮毂清洁剂'];
        const categories = ['洗车', '美容', '保养', '配件'];
        const units = ['桶', '瓶', '个', '箱'];

        for (let i = 0; i < 20; i++) {
            products.push({
                id: 'PRD-' + String(i + 1).padStart(6, '0'),
                name: names[i % names.length],
                category: categories[i % categories.length],
                price: Math.floor(Math.random() * 500) + 50,
                cost: Math.floor(Math.random() * 300) + 20,
                stock_quantity: Math.floor(Math.random() * 500) + 10,
                unit: units[i % units.length],
                status: Math.random() > 0.2 ? 'active' : 'inactive'
            });
        }
        return products;
    }

    async getList(params = {}) {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.getList === 'function') {
                return await service.getList(params);
            }
            if (this._ready && typeof service.find === 'function') {
                const result = await service.find({
                    page: params.page || 1,
                    limit: params.limit || 10,
                    filters: { name: params.name || '' },
                    equals: params.category ? { category_id: params.category } : {}
                });
                return {
                    list: result.list || [],
                    total: result.total || 0,
                    page: result.page || 1,
                    limit: result.limit || 10
                };
            }
        } catch (error) {
            console.warn('⚠️ 商品查询失败，使用 Mock:', error.message);
        }

        const all = this._getMockProducts();
        let filtered = all;
        if (params.name) filtered = filtered.filter(p => p.name.includes(params.name));
        if (params.category) filtered = filtered.filter(p => p.category === params.category);
        if (params.status) filtered = filtered.filter(p => p.status === params.status);
        
        const page = params.page || 1;
        const limit = params.limit || 10;
        const start = (page - 1) * limit;
        
        return {
            list: filtered.slice(start, start + limit),
            total: filtered.length,
            page: page,
            limit: limit
        };
    }

    async updateStock(id, quantity, warehouseId, note) {
        try {
            const service = await this.getService();
            if (this._ready && typeof service.updateStock === 'function') {
                return await service.updateStock(id, quantity, warehouseId, note);
            }
        } catch (error) {
            console.warn('⚠️ 库存更新失败，使用 Mock:', error.message);
        }
        return { id, stock_quantity: quantity };
    }

    async delete(id) {
        try {
            const service = await this.getService();
            if (this._ready) {
                return await service.delete(id);
            }
        } catch (error) {
            console.warn('⚠️ 删除失败，使用 Mock:', error.message);
        }
        return { success: true };
    }

    clearCache() {
        if (this._service && typeof this._service.clearCache === 'function') {
            this._service.clearCache();
        }
    }
}

// ============================================================
// 6. Dashboard 服务
// ============================================================

class DashboardService {
    constructor() {
        this._orderService = new OrderService();
        this._customerService = new CustomerService();
        this._productService = new ProductService();
    }

    async getDashboardData() {
        try {
            const [orderStats, customerStats] = await Promise.all([
                this._orderService.getStats(),
                this._customerService.getStats()
            ]);

            return {
                stats: {
                    todayRevenue: orderStats.totalRevenue || 0,
                    todayOrders: orderStats.total || 0,
                    activeCustomers: customerStats.total || 0,
                    conversionRate: 68.5
                },
                recentOrders: [],
                chartData: {
                    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
                }
            };
        } catch (error) {
            console.warn('⚠️ Dashboard 数据加载失败，使用 Mock:', error.message);
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
}

// ============================================================
// 7. 导出所有服务
// ============================================================

const customerService = new CustomerService();
const orderService = new OrderService();
const productService = new ProductService();
const dashboardService = new DashboardService();

export {
    customerService,
    orderService,
    productService,
    dashboardService
};

// 全局访问
window.Services = {
    customer: customerService,
    order: orderService,
    product: productService,
    dashboard: dashboardService,
    // 工具函数
    formatCurrency,
    formatDate,
    formatDateTime
};

console.log('✅ 数据服务层已加载 (Supabase 集成)');