/**
 * services.js - 前端数据服务层
 * 连接 API 层和 UI 组件，提供缓存和状态管理
 */

// ============================================================
// 1. 数据服务基类
// ============================================================

class BaseService {
    constructor(resourceName) {
        this.resourceName = resourceName;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
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

    // 模拟 API 请求（开发环境）
    async mockRequest(data, delay = 500) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(data);
            }, delay);
        });
    }
}

// ============================================================
// 2. 产品服务
// ============================================================

class ProductService extends BaseService {
    constructor() {
        super('products');
        this.mockData = [
            { id: 'PRD-001', name: '泡沫洗车液', category: '洗车', price: 68, cost: 20, stock: 45, unit: '桶', status: 'active', createTime: '2026-01-15T10:30:00' },
            { id: 'PRD-002', name: '水蜡', category: '洗车', price: 128, cost: 40, stock: 30, unit: '瓶', status: 'active', createTime: '2026-01-20T14:20:00' },
            { id: 'PRD-003', name: '轮胎光亮剂', category: '美容', price: 88, cost: 25, stock: 20, unit: '瓶', status: 'active', createTime: '2026-02-01T09:15:00' },
            { id: 'PRD-004', name: '玻璃清洁剂', category: '美容', price: 58, cost: 15, stock: 15, unit: '瓶', status: 'active', createTime: '2026-02-10T11:45:00' },
            { id: 'PRD-005', name: '内饰清洗剂', category: '保养', price: 98, cost: 30, stock: 25, unit: '瓶', status: 'active', createTime: '2026-02-15T16:30:00' },
            { id: 'PRD-006', name: '空调清洗剂', category: '保养', price: 158, cost: 50, stock: 10, unit: '瓶', status: 'active', createTime: '2026-03-01T08:00:00' },
            { id: 'PRD-007', name: '车蜡', category: '美容', price: 228, cost: 70, stock: 8, unit: '盒', status: 'active', createTime: '2026-03-10T13:20:00' },
            { id: 'PRD-008', name: '抛光剂', category: '美容', price: 188, cost: 55, stock: 12, unit: '瓶', status: 'active', createTime: '2026-03-15T10:00:00' }
        ];
    }

    // 获取产品列表
    async getList(params = {}) {
        const cacheKey = JSON.stringify(params);
        const cached = this.getCache(cacheKey);
        if (cached) {
            console.log('📦 使用缓存数据:', this.resourceName);
            return cached;
        }

        try {
            // 尝试真实 API
            // const result = await ProductAPI.list(params);
            // this.setCache(cacheKey, result);
            // return result;

            // 开发环境使用 Mock
            let filtered = [...this.mockData];
            
            if (params.name) {
                filtered = filtered.filter(p => p.name.includes(params.name));
            }
            if (params.category) {
                filtered = filtered.filter(p => p.category === params.category);
            }
            if (params.status) {
                filtered = filtered.filter(p => p.status === params.status);
            }

            const result = {
                list: filtered,
                total: filtered.length,
                page: params.page || 1,
                limit: params.limit || 10
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('获取产品列表失败:', error);
            throw error;
        }
    }

    // 获取产品详情
    async getById(id) {
        const cached = this.getCache(`product_${id}`);
        if (cached) return cached;

        const product = this.mockData.find(p => p.id === id);
        this.setCache(`product_${id}`, product);
        return product;
    }

    // 创建产品
    async create(data) {
        const newProduct = {
            id: 'PRD-' + String(this.mockData.length + 1).padStart(6, '0'),
            ...data,
            createTime: new Date().toISOString()
        };
        this.mockData.push(newProduct);
        this.clearCache();
        return newProduct;
    }

    // 更新产品
    async update(id, data) {
        const index = this.mockData.findIndex(p => p.id === id);
        if (index === -1) throw new Error('产品不存在');
        this.mockData[index] = { ...this.mockData[index], ...data };
        this.clearCache();
        return this.mockData[index];
    }

    // 删除产品
    async delete(id) {
        const index = this.mockData.findIndex(p => p.id === id);
        if (index === -1) throw new Error('产品不存在');
        this.mockData.splice(index, 1);
        this.clearCache();
        return { success: true };
    }

    // 获取分类列表
    getCategories() {
        const categories = [...new Set(this.mockData.map(p => p.category))];
        return categories.map(c => ({ name: c, count: this.mockData.filter(p => p.category === c).length }));
    }

    // 获取统计信息
    getStats() {
        return {
            total: this.mockData.length,
            active: this.mockData.filter(p => p.status === 'active').length,
            inactive: this.mockData.filter(p => p.status === 'inactive').length,
            totalValue: this.mockData.reduce((sum, p) => sum + p.price * p.stock, 0)
        };
    }
}

// ============================================================
// 3. 订单服务
// ============================================================

class OrderService extends BaseService {
    constructor() {
        super('orders');
        this.mockData = [
            { id: 'ORD-000001', orderNo: 'ORD-2026-0001', customer: '张伟', phone: '13800001111', total: 680, status: 'completed', items: [{ name: '标准洗车', qty: 1, price: 680 }], createTime: '2026-07-06T10:30:00' },
            { id: 'ORD-000002', orderNo: 'ORD-2026-0002', customer: '李娜', phone: '13800002222', total: 420, status: 'pending', items: [{ name: '水蜡', qty: 2, price: 210 }], createTime: '2026-07-06T10:15:00' },
            { id: 'ORD-000003', orderNo: 'ORD-2026-0003', customer: '王强', phone: '13800003333', total: 1250, status: 'processing', items: [{ name: '抛光打蜡', qty: 1, price: 1250 }], createTime: '2026-07-06T09:45:00' },
            { id: 'ORD-000004', orderNo: 'ORD-2026-0004', customer: '刘洋', phone: '13800004444', total: 380, status: 'completed', items: [{ name: '内饰清洗', qty: 1, price: 380 }], createTime: '2026-07-06T09:20:00' },
            { id: 'ORD-000005', orderNo: 'ORD-2026-0005', customer: '陈静', phone: '13800005555', total: 890, status: 'completed', items: [{ name: '车蜡', qty: 1, price: 890 }], createTime: '2026-07-06T08:55:00' },
            { id: 'ORD-000006', orderNo: 'ORD-2026-0006', customer: '赵明', phone: '13800006666', total: 158, status: 'pending', items: [{ name: '空调清洗剂', qty: 1, price: 158 }], createTime: '2026-07-06T08:30:00' },
            { id: 'ORD-000007', orderNo: 'ORD-2026-0007', customer: '孙丽', phone: '13800007777', total: 688, status: 'processing', items: [{ name: '精致洗车', qty: 1, price: 688 }], createTime: '2026-07-06T08:00:00' }
        ];
    }

    async getList(params = {}) {
        const cacheKey = JSON.stringify(params);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        let filtered = [...this.mockData];

        if (params.orderNo) {
            filtered = filtered.filter(o => o.orderNo.includes(params.orderNo));
        }
        if (params.customer) {
            filtered = filtered.filter(o => o.customer.includes(params.customer));
        }
        if (params.status) {
            filtered = filtered.filter(o => o.status === params.status);
        }
        if (params.dateStart) {
            filtered = filtered.filter(o => o.createTime >= params.dateStart);
        }
        if (params.dateEnd) {
            filtered = filtered.filter(o => o.createTime <= params.dateEnd);
        }

        // 排序
        filtered.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

        const result = {
            list: filtered,
            total: filtered.length,
            page: params.page || 1,
            limit: params.limit || 10
        };

        this.setCache(cacheKey, result);
        return result;
    }

    async getById(id) {
        return this.mockData.find(o => o.id === id);
    }

    async create(data) {
        const newOrder = {
            id: 'ORD-' + String(this.mockData.length + 1).padStart(6, '0'),
            orderNo: 'ORD-2026-' + String(this.mockData.length + 1).padStart(4, '0'),
            ...data,
            createTime: new Date().toISOString()
        };
        this.mockData.push(newOrder);
        this.clearCache();
        return newOrder;
    }

    async updateStatus(id, status) {
        const order = this.mockData.find(o => o.id === id);
        if (!order) throw new Error('订单不存在');
        order.status = status;
        this.clearCache();
        return order;
    }

    async delete(id) {
        const index = this.mockData.findIndex(o => o.id === id);
        if (index === -1) throw new Error('订单不存在');
        this.mockData.splice(index, 1);
        this.clearCache();
        return { success: true };
    }

    getStats() {
        const total = this.mockData.length;
        const completed = this.mockData.filter(o => o.status === 'completed').length;
        const pending = this.mockData.filter(o => o.status === 'pending').length;
        const processing = this.mockData.filter(o => o.status === 'processing').length;
        const cancelled = this.mockData.filter(o => o.status === 'cancelled').length;
        const totalRevenue = this.mockData.reduce((sum, o) => sum + o.total, 0);

        return { total, completed, pending, processing, cancelled, totalRevenue };
    }

    getRecent(limit = 5) {
        const sorted = [...this.mockData].sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        return sorted.slice(0, limit);
    }
}

// ============================================================
// 4. 客户服务
// ============================================================

class CustomerService extends BaseService {
    constructor() {
        super('customers');
        this.mockData = [
            { id: 'CUS-000001', name: '张伟', phone: '13800001111', email: 'zhangwei@example.com', level: 'gold', totalSpent: 12500, orderCount: 15, lastVisit: '2026-07-05T10:30:00', createTime: '2025-12-01T10:00:00' },
            { id: 'CUS-000002', name: '李娜', phone: '13800002222', email: 'lina@example.com', level: 'vip', totalSpent: 32800, orderCount: 28, lastVisit: '2026-07-06T09:15:00', createTime: '2025-11-15T14:30:00' },
            { id: 'CUS-000003', name: '王强', phone: '13800003333', email: 'wangqiang@example.com', level: 'silver', totalSpent: 5600, orderCount: 8, lastVisit: '2026-07-04T16:45:00', createTime: '2026-01-20T09:00:00' },
            { id: 'CUS-000004', name: '刘洋', phone: '13800004444', email: 'liuyang@example.com', level: 'bronze', totalSpent: 2300, orderCount: 4, lastVisit: '2026-07-03T11:20:00', createTime: '2026-03-10T08:30:00' },
            { id: 'CUS-000005', name: '陈静', phone: '13800005555', email: 'chenjing@example.com', level: 'vip', totalSpent: 45600, orderCount: 35, lastVisit: '2026-07-06T08:55:00', createTime: '2025-10-01T13:00:00' }
        ];
    }

    async getList(params = {}) {
        let filtered = [...this.mockData];

        if (params.name) {
            filtered = filtered.filter(c => c.name.includes(params.name));
        }
        if (params.phone) {
            filtered = filtered.filter(c => c.phone.includes(params.phone));
        }
        if (params.level) {
            filtered = filtered.filter(c => c.level === params.level);
        }

        const result = {
            list: filtered,
            total: filtered.length,
            page: params.page || 1,
            limit: params.limit || 10
        };

        return result;
    }

    async getById(id) {
        return this.mockData.find(c => c.id === id);
    }

    getStats() {
        return {
            total: this.mockData.length,
            vip: this.mockData.filter(c => c.level === 'vip').length,
            gold: this.mockData.filter(c => c.level === 'gold').length,
            silver: this.mockData.filter(c => c.level === 'silver').length,
            bronze: this.mockData.filter(c => c.level === 'bronze').length,
            totalSpent: this.mockData.reduce((sum, c) => sum + c.totalSpent, 0)
        };
    }
}

// ============================================================
// 5. 采购订单服务
// ============================================================

class PurchaseOrderService extends BaseService {
    constructor() {
        super('purchaseOrders');
        this.mockData = [
            { id: 'PO-000001', orderNo: 'PO-2026-0001', supplier: '上海供应商有限公司', totalAmount: 12500, status: 'completed', items: 5, createTime: '2026-06-20T10:30:00' },
            { id: 'PO-000002', orderNo: 'PO-2026-0002', supplier: '深圳科技材料公司', totalAmount: 8500, status: 'pending', items: 3, createTime: '2026-06-25T14:20:00' },
            { id: 'PO-000003', orderNo: 'PO-2026-0003', supplier: '广州五金制品厂', totalAmount: 32000, status: 'approved', items: 8, createTime: '2026-06-28T09:15:00' },
            { id: 'PO-000004', orderNo: 'PO-2026-0004', supplier: '北京电子元件商行', totalAmount: 6800, status: 'draft', items: 2, createTime: '2026-07-01T11:45:00' },
            { id: 'PO-000005', orderNo: 'PO-2026-0005', supplier: '成都建材批发中心', totalAmount: 15600, status: 'completed', items: 6, createTime: '2026-07-03T16:30:00' }
        ];
    }

    async getList(params = {}) {
        let filtered = [...this.mockData];

        if (params.orderNo) {
            filtered = filtered.filter(p => p.orderNo.includes(params.orderNo));
        }
        if (params.supplier) {
            filtered = filtered.filter(p => p.supplier.includes(params.supplier));
        }
        if (params.status) {
            filtered = filtered.filter(p => p.status === params.status);
        }

        const result = {
            list: filtered,
            total: filtered.length,
            page: params.page || 1,
            limit: params.limit || 10
        };

        return result;
    }
}

// ============================================================
// 6. 员工服务
// ============================================================

class EmployeeService extends BaseService {
    constructor() {
        super('employees');
        this.mockData = [
            { id: 'EMP-000001', name: '张伟', department: '管理部', position: '经理', phone: '13800001111', email: 'zhangwei@company.com', salary: 12000, hireDate: '2025-01-15T00:00:00', status: 'active' },
            { id: 'EMP-000002', name: '李娜', department: '销售部', position: '主管', phone: '13800002222', email: 'lina@company.com', salary: 8000, hireDate: '2025-03-20T00:00:00', status: 'active' },
            { id: 'EMP-000003', name: '王强', department: '服务部', position: '员工', phone: '13800003333', email: 'wangqiang@company.com', salary: 5000, hireDate: '2025-06-01T00:00:00', status: 'active' },
            { id: 'EMP-000004', name: '刘洋', department: '技术部', position: '员工', phone: '13800004444', email: 'liuyang@company.com', salary: 5500, hireDate: '2025-07-10T00:00:00', status: 'active' },
            { id: 'EMP-000005', name: '陈静', department: '市场部', position: '主管', phone: '13800005555', email: 'chenjing@company.com', salary: 7500, hireDate: '2025-08-01T00:00:00', status: 'active' }
        ];
    }

    async getList(params = {}) {
        let filtered = [...this.mockData];

        if (params.name) {
            filtered = filtered.filter(e => e.name.includes(params.name));
        }
        if (params.department) {
            filtered = filtered.filter(e => e.department === params.department);
        }
        if (params.status) {
            filtered = filtered.filter(e => e.status === params.status);
        }

        const result = {
            list: filtered,
            total: filtered.length,
            page: params.page || 1,
            limit: params.limit || 10
        };

        return result;
    }
}

// ============================================================
// 7. Dashboard 服务
// ============================================================

class DashboardService extends BaseService {
    constructor() {
        super('dashboard');
        this.orderService = new OrderService();
        this.productService = new ProductService();
        this.customerService = new CustomerService();
    }

    getStats() {
        const orderStats = this.orderService.getStats();
        const customerStats = this.customerService.getStats();
        const productStats = this.productService.getStats();

        return {
            todayRevenue: 28650.00,
            todayOrders: 47,
            activeCustomers: 328,
            conversionRate: 68.5,
            totalOrders: orderStats.total,
            totalRevenue: orderStats.totalRevenue,
            totalCustomers: customerStats.total,
            totalProducts: productStats.total
        };
    }

    getRecentOrders() {
        return this.orderService.getRecent(5);
    }

    getChartData() {
        return {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
        };
    }

    async getDashboardData() {
        const cacheKey = 'dashboard_data';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const data = {
            stats: this.getStats(),
            recentOrders: this.getRecentOrders(),
            chartData: this.getChartData()
        };

        this.setCache(cacheKey, data);
        return data;
    }
}

// ============================================================
// 8. 导出所有服务
// ============================================================

// 创建单例实例
const productService = new ProductService();
const orderService = new OrderService();
const customerService = new CustomerService();
const purchaseOrderService = new PurchaseOrderService();
const employeeService = new EmployeeService();
const dashboardService = new DashboardService();

// 导出
export {
    productService,
    orderService,
    customerService,
    purchaseOrderService,
    employeeService,
    dashboardService
};

// 全局访问
window.Services = {
    product: productService,
    order: orderService,
    customer: customerService,
    purchase: purchaseOrderService,
    employee: employeeService,
    dashboard: dashboardService
};

console.log('✅ 数据服务层已加载');