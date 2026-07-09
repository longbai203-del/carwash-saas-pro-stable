/**
 * api/api-client.js - 统一API客户端
 * @module api-client
 * @description 封装所有API请求，支持认证、错误处理、Mock降级
 * 
 * @example
 * import { apiClient } from './api/api-client.js';
 * // 获取数据
 * const orders = await apiClient.getOrders({ page: 1, limit: 10 });
 * // 创建数据
 * const newOrder = await apiClient.createOrder({ customer: '张伟', total: 680 });
 */

import { appStore } from '../../frontend/js/core/store.js';

/**
 * API响应格式
 * @typedef {Object} ApiResponse
 * @property {number} code - 状态码
 * @property {string} message - 消息
 * @property {*} data - 数据
 * @property {number} total - 总数(分页时)
 */

class ApiClient {
    constructor() {
        /**
         * API基础URL
         * 优先从全局配置读取，否则使用默认值
         * @type {string}
         */
        this.baseURL = window.APP_CONFIG?.API_BASE_URL || '/api/v1';
        
        /** @type {boolean} 是否使用Mock数据 - 生产环境应设为false */
        this.useMock = false;
        
        /** @type {Object} Mock数据 */
        this.mockData = this.getMockData();
        
        /** @type {number} 请求超时时间(ms) */
        this.timeout = 30000;
        
        /** @type {boolean} 是否正在使用Mock模式 (运行时状态) */
        this._usingMock = false;

        console.log(`[API Client] 初始化完成，API 基地址: ${this.baseURL}`);
    }

    /**
     * 通用请求方法
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @param {string} options.method - HTTP方法
     * @param {Object} options.params - URL参数
     * @param {Object} options.body - 请求体
     * @param {Object} options.headers - 自定义请求头
     * @returns {Promise<ApiResponse>} API响应
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            params = {},
            body = null,
            headers = {}
        } = options;

        // 构建URL
        let url = `${this.baseURL}${endpoint}`;
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        // 构建请求配置
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            signal: AbortSignal.timeout(this.timeout)
        };

        // 添加认证头
        const user = appStore.get('user');
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }

        // 添加请求体
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);

            // 处理HTTP错误
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this._usingMock = false;
            return data;

        } catch (error) {
            console.error(`[API] ❌ 请求失败 (${endpoint}):`, error);

            // 如果使用Mock，返回Mock数据
            if (this.useMock) {
                console.log(`[API] 📦 使用Mock数据降级: ${endpoint}`);
                this._usingMock = true;
                return this.mockRequest(endpoint, method, params, body);
            }

            // 重新抛出错误
            throw new Error(`请求失败: ${error.message}`);
        }
    }

    /**
     * 检查当前是否在使用Mock模式
     * @returns {boolean}
     */
    isUsingMock() {
        return this._usingMock;
    }

    /**
     * GET请求
     * @param {string} endpoint - API端点
     * @param {Object} params - URL参数
     * @returns {Promise<ApiResponse>}
     */
    async get(endpoint, params = {}) {
        return this.request(endpoint, { method: 'GET', params });
    }

    /**
     * POST请求
     * @param {string} endpoint - API端点
     * @param {Object} body - 请求体
     * @param {Object} params - URL参数
     * @returns {Promise<ApiResponse>}
     */
    async post(endpoint, body = {}, params = {}) {
        return this.request(endpoint, { method: 'POST', params, body });
    }

    /**
     * PUT请求
     * @param {string} endpoint - API端点
     * @param {Object} body - 请求体
     * @param {Object} params - URL参数
     * @returns {Promise<ApiResponse>}
     */
    async put(endpoint, body = {}, params = {}) {
        return this.request(endpoint, { method: 'PUT', params, body });
    }

    /**
     * DELETE请求
     * @param {string} endpoint - API端点
     * @param {Object} params - URL参数
     * @returns {Promise<ApiResponse>}
     */
    async delete(endpoint, params = {}) {
        return this.request(endpoint, { method: 'DELETE', params });
    }

    /**
     * Mock请求处理
     * @param {string} endpoint - API端点
     * @param {string} method - HTTP方法
     * @param {Object} params - URL参数
     * @param {Object} body - 请求体
     * @returns {Promise<ApiResponse>}
     */
    async mockRequest(endpoint, method, params = {}, body = {}) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

        // 根据端点返回不同的Mock数据
        const key = endpoint.replace(/^\//, '').split('/')[0];

        // 处理分页
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;

        let data = [];
        let total = 0;

        switch (key) {
            case 'dashboard':
                return this.mockData.dashboard;

            case 'orders':
                data = this.mockData.orders || [];
                total = data.length;
                const start = (page - 1) * limit;
                const end = start + limit;
                return {
                    code: 200,
                    message: 'success (mock)',
                    data: data.slice(start, end),
                    total: total,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(total / limit)
                };

            case 'products':
                data = this.mockData.products || [];
                total = data.length;
                return {
                    code: 200,
                    message: 'success (mock)',
                    data: data.slice((page - 1) * limit, page * limit),
                    total: total,
                    page: page,
                    limit: limit
                };

            case 'customers':
                data = this.mockData.customers || [];
                total = data.length;
                return {
                    code: 200,
                    message: 'success (mock)',
                    data: data.slice((page - 1) * limit, page * limit),
                    total: total,
                    page: page,
                    limit: limit
                };

            case 'auth':
                if (method === 'POST') {
                    return this.mockData.auth;
                }
                break;

            default:
                // 通用Mock响应
                return {
                    code: 200,
                    message: 'success (mock)',
                    data: this.mockData.default || [],
                    total: 0
                };
        }

        return this.mockData.default || { code: 200, message: 'success (mock)', data: [] };
    }

    /**
     * 获取Mock数据
     * @returns {Object} Mock数据对象
     */
    getMockData() {
        return {
            dashboard: {
                code: 200,
                message: 'success',
                data: {
                    stats: {
                        todayRevenue: 28650.00,
                        todayOrders: 47,
                        activeCustomers: 328,
                        conversionRate: 68.5
                    },
                    recentOrders: [
                        { id: 'ORD-001', customer: '张伟', amount: 680, status: 'completed', time: '10:30' },
                        { id: 'ORD-002', customer: '李娜', amount: 420, status: 'pending', time: '10:15' },
                        { id: 'ORD-003', customer: '王强', amount: 1250, status: 'processing', time: '09:45' },
                        { id: 'ORD-004', customer: '刘洋', amount: 380, status: 'completed', time: '09:20' },
                        { id: 'ORD-005', customer: '陈静', amount: 890, status: 'completed', time: '08:55' }
                    ],
                    chartData: {
                        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                        values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
                    }
                }
            },

            orders: [
                { id: 'ORD-001', customer: '张伟', items: ['标准洗车 × 1', '抛光打蜡 × 1'], total: 456, status: 'completed', date: '2024-01-15 14:30' },
                { id: 'ORD-002', customer: '李娜', items: ['精致洗车 × 2'], total: 256, status: 'pending', date: '2024-01-15 15:20' },
                { id: 'ORD-003', customer: '王强', items: ['深度清洁 × 1', '内饰清洗 × 1'], total: 596, status: 'processing', date: '2024-01-16 09:00' },
                { id: 'ORD-004', customer: '刘洋', items: ['标准洗车 × 1'], total: 68, status: 'completed', date: '2024-01-16 10:30' },
                { id: 'ORD-005', customer: '陈静', items: ['洗车月卡 × 1'], total: 398, status: 'pending', date: '2024-01-17 08:45' }
            ],

            products: [
                { id: 'P001', name: '标准洗车', price: 68, category: '洗车', stock: 45, unit: '次', status: 'active' },
                { id: 'P002', name: '精致洗车', price: 128, category: '洗车', stock: 30, unit: '次', status: 'active' },
                { id: 'P003', name: '深度清洁', price: 268, category: '洗车', stock: 20, unit: '次', status: 'active' },
                { id: 'P004', name: '抛光打蜡', price: 388, category: '美容', stock: 15, unit: '次', status: 'active' },
                { id: 'P005', name: '内饰清洗', price: 328, category: '美容', stock: 12, unit: '次', status: 'active' },
                { id: 'P006', name: '发动机清洗', price: 188, category: '保养', stock: 8, unit: '次', status: 'active' },
                { id: 'P007', name: '空调清洗', price: 158, category: '保养', stock: 10, unit: '次', status: 'active' },
                { id: 'P008', name: '洗车月卡', price: 398, category: '会员', stock: 50, unit: '张', status: 'active' }
            ],

            customers: [
                { id: 'C001', name: '张伟', phone: '13800001111', level: 'gold', totalSpent: 5000, orders: 12 },
                { id: 'C002', name: '李娜', phone: '13800002222', level: 'vip', totalSpent: 12000, orders: 25 },
                { id: 'C003', name: '王强', phone: '13800003333', level: 'silver', totalSpent: 2800, orders: 8 },
                { id: 'C004', name: '刘洋', phone: '13800004444', level: 'bronze', totalSpent: 1500, orders: 5 },
                { id: 'C005', name: '陈静', phone: '13800005555', level: 'vip', totalSpent: 8000, orders: 18 }
            ],

            auth: {
                code: 200,
                message: 'success',
                data: {
                    user: { id: 'U001', name: '管理员', role: 'admin', email: 'admin@carwash.com' },
                    token: 'mock-jwt-token-xxxxx',
                    permissions: ['dashboard', 'pos', 'orders', 'products', 'crm', 'marketing']
                }
            },

            default: { code: 200, message: 'success (mock)', data: [] }
        };
    }

    // ============================================================
    // 业务API方法
    // ============================================================

    /**
     * 获取仪表盘统计
     * @returns {Promise<ApiResponse>}
     */
    async getDashboardStats() {
        return this.get('/dashboard/stats');
    }

    /**
     * 获取订单列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.limit - 每页数量
     * @param {string} params.status - 状态筛选
     * @param {string} params.customer - 客户筛选
     * @returns {Promise<ApiResponse>}
     */
    async getOrders(params = {}) {
        return this.get('/orders', params);
    }

    /**
     * 获取订单详情
     * @param {string} id - 订单ID
     * @returns {Promise<ApiResponse>}
     */
    async getOrderById(id) {
        return this.get(`/orders/${id}`);
    }

    /**
     * 创建订单
     * @param {Object} data - 订单数据
     * @param {Array} data.items - 商品列表
     * @param {string} data.customerId - 客户ID
     * @param {number} data.total - 总金额
     * @param {string} data.paymentMethod - 支付方式
     * @returns {Promise<ApiResponse>}
     */
    async createOrder(data) {
        return this.post('/orders', data);
    }

    /**
     * 更新订单
     * @param {string} id - 订单ID
     * @param {Object} data - 更新数据
     * @returns {Promise<ApiResponse>}
     */
    async updateOrder(id, data) {
        return this.put(`/orders/${id}`, data);
    }

    /**
     * 删除订单
     * @param {string} id - 订单ID
     * @returns {Promise<ApiResponse>}
     */
    async deleteOrder(id) {
        return this.delete(`/orders/${id}`);
    }

    /**
     * 获取商品列表
     * @param {Object} params - 查询参数
     * @returns {Promise<ApiResponse>}
     */
    async getProducts(params = {}) {
        return this.get('/products', params);
    }

    /**
     * 获取客户列表
     * @param {Object} params - 查询参数
     * @returns {Promise<ApiResponse>}
     */
    async getCustomers(params = {}) {
        return this.get('/customers', params);
    }

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<ApiResponse>}
     */
    async login(username, password) {
        return this.post('/auth/login', { username, password });
    }

    /**
     * 用户登出
     * @returns {Promise<ApiResponse>}
     */
    async logout() {
        return this.post('/auth/logout');
    }

    /**
     * 获取当前用户信息
     * @returns {Promise<ApiResponse>}
     */
    async getCurrentUser() {
        return this.get('/auth/me');
    }
}

// 导出单例
export const apiClient = new ApiClient();