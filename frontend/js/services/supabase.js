/**
 * services/supabase.js - Supabase 数据服务
 * 提供所有数据访问方法
 */

// ============================================================
// 1. Supabase 客户端初始化
// ============================================================

let supabaseClient = null;

function getSupabase() {
    if (supabaseClient) return supabaseClient;

    try {
        // 从全局配置获取
        const config = window.SUPABASE_CONFIG || {};
        const url = config.url || 'https://ukqhdzvegqlkimxzkfcp.supabase.co';
        const anonKey = config.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcWhkenZlZ3Fsa2lteHprZmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjE3OTQsImV4cCI6MjA5ODczNzc5NH0.YuEB1rzpqc8kynZukXU4ANKnVtpIC3JJ9IEacQ2fcQE';

        // 检查是否已加载 Supabase
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(url, anonKey);
        } else {
            // 尝试从 CDN 加载
            console.warn('⚠️ Supabase 未加载，请确保在 index.html 中引入');
            return null;
        }

        console.log('✅ Supabase 客户端已初始化');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Supabase 初始化失败:', error);
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
    } catch (e) { return '-'; }
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
}

function showToast(message, type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-size: 14px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// 3. Mock 数据
// ============================================================

function getMockCustomers() {
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

function getMockOrders() {
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

function getMockProducts() {
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

// ============================================================
// 4. 客户服务
// ============================================================

class CustomerService {
    constructor() {
        this._supabase = null;
        this._usingSupabase = false;
    }

    async getClient() {
        if (this._supabase) return this._supabase;
        this._supabase = getSupabase();
        if (this._supabase) {
            this._usingSupabase = true;
        } else {
            this._usingSupabase = false;
        }
        return this._supabase;
    }

    async getList(params = {}) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                let query = client.from('customers').select('*', { count: 'exact' });

                const page = params.page || 1;
                const limit = params.limit || 10;
                const from = (page - 1) * limit;
                const to = from + limit - 1;
                query = query.range(from, to).order('created_at', { ascending: false });

                if (params.name) query = query.ilike('name', `%${params.name}%`);
                if (params.phone) query = query.ilike('phone', `%${params.phone}%`);
                if (params.level) query = query.eq('level', params.level);

                const { data, error, count } = await query;
                if (error) throw error;

                return {
                    list: data || [],
                    total: count || data?.length || 0,
                    page: page,
                    limit: limit
                };
            }
        } catch (error) {
            console.warn('⚠️ Supabase 查询失败，使用 Mock:', error.message);
        }

        // Mock 降级
        const all = getMockCustomers();
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
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data, error } = await client.from('customers').select('level, total_spent');
                if (error) throw error;

                const customers = data || [];
                return {
                    total: customers.length,
                    vip: customers.filter(c => c.level === 'vip').length,
                    gold: customers.filter(c => c.level === 'gold').length,
                    silver: customers.filter(c => c.level === 'silver').length,
                    bronze: customers.filter(c => c.level === 'bronze').length,
                    totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
                };
            }
        } catch (error) {
            console.warn('⚠️ 统计查询失败，使用 Mock:', error.message);
        }

        const all = getMockCustomers();
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
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data, error } = await client.from('customers').select('*').eq('id', id).single();
                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.warn('⚠️ 查询失败，使用 Mock:', error.message);
        }
        return getMockCustomers().find(c => c.id === id);
    }

    async create(data) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: result, error } = await client.from('customers').insert(data).select().single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 创建失败，使用 Mock:', error.message);
        }
        return { ...data, id: 'CUS-' + Date.now() };
    }

    async update(id, data) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: result, error } = await client.from('customers').update(data).eq('id', id).select().single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 更新失败，使用 Mock:', error.message);
        }
        return { ...data, id: id };
    }

    async delete(id) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { error } = await client.from('customers').delete().eq('id', id);
                if (error) throw error;
                return { success: true };
            }
        } catch (error) {
            console.warn('⚠️ 删除失败，使用 Mock:', error.message);
        }
        return { success: true };
    }
}

// ============================================================
// 5. 订单服务
// ============================================================

class OrderService {
    constructor() {
        this._supabase = null;
        this._usingSupabase = false;
    }

    async getClient() {
        if (this._supabase) return this._supabase;
        this._supabase = getSupabase();
        if (this._supabase) {
            this._usingSupabase = true;
        } else {
            this._usingSupabase = false;
        }
        return this._supabase;
    }

    async getList(params = {}) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                let query = client.from('orders').select('*', { count: 'exact' });

                const page = params.page || 1;
                const limit = params.limit || 10;
                const from = (page - 1) * limit;
                const to = from + limit - 1;
                query = query.range(from, to).order('created_at', { ascending: false });

                if (params.orderNo) query = query.ilike('order_number', `%${params.orderNo}%`);
                if (params.customer) query = query.ilike('customer_name', `%${params.customer}%`);
                if (params.status) query = query.eq('status', params.status);

                const { data, error, count } = await query;
                if (error) throw error;

                return {
                    list: data || [],
                    total: count || data?.length || 0,
                    page: page,
                    limit: limit
                };
            }
        } catch (error) {
            console.warn('⚠️ 订单查询失败，使用 Mock:', error.message);
        }

        const all = getMockOrders();
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
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data, error } = await client.from('orders').select('status, total_amount');
                if (error) throw error;

                const orders = data || [];
                return {
                    total: orders.length,
                    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
                    pending: orders.filter(o => o.status === 'pending').length,
                    processing: orders.filter(o => o.status === 'processing').length,
                    completed: orders.filter(o => o.status === 'completed').length,
                    cancelled: orders.filter(o => o.status === 'cancelled').length
                };
            }
        } catch (error) {
            console.warn('⚠️ 统计查询失败，使用 Mock:', error.message);
        }

        const all = getMockOrders();
        return {
            total: all.length,
            totalRevenue: all.reduce((sum, o) => sum + (o.total_amount || 0), 0),
            pending: all.filter(o => o.status === 'pending').length,
            processing: all.filter(o => o.status === 'processing').length,
            completed: all.filter(o => o.status === 'completed').length,
            cancelled: all.filter(o => o.status === 'cancelled').length
        };
    }

    async getById(id) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data, error } = await client.from('orders').select('*').eq('id', id).single();
                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.warn('⚠️ 查询失败，使用 Mock:', error.message);
        }
        return getMockOrders().find(o => o.id === id);
    }

    async create(data) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: result, error } = await client.from('orders').insert(data).select().single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 创建失败，使用 Mock:', error.message);
        }
        return { ...data, id: 'ORD-' + Date.now() };
    }

    async updateStatus(id, status) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: result, error } = await client.from('orders').update({ status }).eq('id', id).select().single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 更新失败，使用 Mock:', error.message);
        }
        return { id, status };
    }

    async delete(id) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { error } = await client.from('orders').delete().eq('id', id);
                if (error) throw error;
                return { success: true };
            }
        } catch (error) {
            console.warn('⚠️ 删除失败，使用 Mock:', error.message);
        }
        return { success: true };
    }
}

// ============================================================
// 6. 商品服务
// ============================================================

class ProductService {
    constructor() {
        this._supabase = null;
        this._usingSupabase = false;
    }

    async getClient() {
        if (this._supabase) return this._supabase;
        this._supabase = getSupabase();
        if (this._supabase) {
            this._usingSupabase = true;
        } else {
            this._usingSupabase = false;
        }
        return this._supabase;
    }

    async getList(params = {}) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                let query = client.from('products').select('*', { count: 'exact' });

                const page = params.page || 1;
                const limit = params.limit || 10;
                const from = (page - 1) * limit;
                const to = from + limit - 1;
                query = query.range(from, to).order('created_at', { ascending: false });

                if (params.name) query = query.ilike('name', `%${params.name}%`);
                if (params.category) query = query.eq('category_id', params.category);
                if (params.status) query = query.eq('status', params.status);

                const { data, error, count } = await query;
                if (error) throw error;

                return {
                    list: data || [],
                    total: count || data?.length || 0,
                    page: page,
                    limit: limit
                };
            }
        } catch (error) {
            console.warn('⚠️ 商品查询失败，使用 Mock:', error.message);
        }

        const all = getMockProducts();
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

    async getById(id) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data, error } = await client.from('products').select('*').eq('id', id).single();
                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.warn('⚠️ 查询失败，使用 Mock:', error.message);
        }
        return getMockProducts().find(p => p.id === id);
    }

    async create(data) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: result, error } = await client.from('products').insert(data).select().single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 创建失败，使用 Mock:', error.message);
        }
        return { ...data, id: 'PRD-' + Date.now() };
    }

    async update(id, data) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: result, error } = await client.from('products').update(data).eq('id', id).select().single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 更新失败，使用 Mock:', error.message);
        }
        return { ...data, id: id };
    }

    async updateStock(id, quantity, warehouseId, note) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { data: product, error: findError } = await client
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', id)
                    .single();
                if (findError) throw findError;

                const newStock = (product.stock_quantity || 0) + quantity;
                const { data: result, error } = await client
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return result;
            }
        } catch (error) {
            console.warn('⚠️ 库存更新失败，使用 Mock:', error.message);
        }
        return { id, stock_quantity: quantity };
    }

    async delete(id) {
        try {
            const client = await this.getClient();
            if (this._usingSupabase && client) {
                const { error } = await client.from('products').delete().eq('id', id);
                if (error) throw error;
                return { success: true };
            }
        } catch (error) {
            console.warn('⚠️ 删除失败，使用 Mock:', error.message);
        }
        return { success: true };
    }
}

// ============================================================
// 7. Dashboard 服务
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
                    todayRevenue: orderStats.totalRevenue || 28650.00,
                    todayOrders: orderStats.total || 47,
                    activeCustomers: customerStats.total || 328,
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
        } catch (error) {
            console.warn('⚠️ Dashboard 加载失败，使用 Mock:', error.message);
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
// 8. 导出所有服务
// ============================================================

export const customerService = new CustomerService();
export const orderService = new OrderService();
export const productService = new ProductService();
export const dashboardService = new DashboardService();

// 兼容旧版导入方式
export function getCustomerService() { return customerService; }
export function getOrderService() { return orderService; }
export function getProductService() { return productService; }
export function getDashboardService() { return dashboardService; }

// 导出工具函数
export {
    formatCurrency,
    formatDate,
    formatDateTime,
    showToast
};

// 全局访问
if (typeof window !== 'undefined') {
    window.SupabaseServices = {
        customerService,
        orderService,
        productService,
        dashboardService,
        getCustomerService,
        getOrderService,
        getProductService,
        getDashboardService
    };
}

console.log('✅ Supabase 服务层已加载');