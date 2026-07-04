/**
 * frontend/js/api-client.js - 前端 API 调用客户端
 * 统一管理所有后端 API 调用
 */
(function() {
    'use strict';

    window.ApiClient = {
        _baseUrl: '/api',
        
        /**
         * 获取认证 Token
         */
        _getToken: function() {
            try {
                const session = localStorage.getItem('cw_session');
                if (session) {
                    const s = JSON.parse(session);
                    return s.token || null;
                }
            } catch(e) {}
            return null;
        },

        /**
         * 通用请求方法
         */
        request: async function(endpoint, options = {}) {
            const url = this._baseUrl + endpoint;
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // 添加认证 Token
            const token = this._getToken();
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }

            const response = await fetch(url, {
                ...options,
                headers: headers,
                credentials: 'include'
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // 处理特定错误码
                if (response.status === 401) {
                    // 未授权，清除 session
                    localStorage.removeItem('cw_session');
                    if (window.AppAuth && window.AppAuth.logout) {
                        window.AppAuth.logout();
                    }
                }
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        },

        /**
         * GET 请求
         */
        get: function(endpoint, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? endpoint + '?' + queryString : endpoint;
            return this.request(url, { method: 'GET' });
        },

        /**
         * POST 请求
         */
        post: function(endpoint, data = {}) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * PUT 请求
         */
        put: function(endpoint, data = {}) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * DELETE 请求
         */
        delete: function(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        },

        /**
         * PATCH 请求
         */
        patch: function(endpoint, data = {}) {
            return this.request(endpoint, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        // ============================================================
        // API 分组
        // ============================================================

        auth: {
            login: (username, password) => 
                ApiClient.post('/auth/login', { username, password }),
            
            register: (data) => 
                ApiClient.post('/auth/register', data),
            
            me: () => 
                ApiClient.get('/auth/me'),
            
            logout: () => 
                ApiClient.post('/auth/logout'),
            
            resetPassword: (username, newPassword) =>
                ApiClient.post('/auth/reset-password', { username, newPassword })
        },

        orders: {
            list: (params = {}) => 
                ApiClient.get('/orders', params),
            
            get: (id) => 
                ApiClient.get(`/orders/${id}`),
            
            create: (data) => 
                ApiClient.post('/orders/create', data),
            
            update: (id, data) => 
                ApiClient.put(`/orders/${id}`, data),
            
            delete: (id) => 
                ApiClient.delete(`/orders/${id}`)
        },

        customers: {
            list: (params = {}) => 
                ApiClient.get('/customers', params),
            
            get: (id) => 
                ApiClient.get(`/customers/${id}`),
            
            create: (data) => 
                ApiClient.post('/customers/create', data),
            
            update: (id, data) => 
                ApiClient.put(`/customers/${id}`, data)
        },

        inventory: {
            list: (params = {}) => 
                ApiClient.get('/inventory', params),
            
            get: (id) => 
                ApiClient.get(`/inventory/${id}`),
            
            update: (id, data) => 
                ApiClient.put(`/inventory/${id}`, data)
        },

        employees: {
            list: (params = {}) => 
                ApiClient.get('/employees', params),
            
            approve: (userId, status, note = '') =>
                ApiClient.post('/employees/approve', { userId, status, note })
        },

        attendance: {
            list: (params = {}) => 
                ApiClient.get('/attendance', params),
            
            clockIn: (data = {}) => 
                ApiClient.post('/attendance/clock', { ...data, type: 'in' }),
            
            clockOut: (data = {}) => 
                ApiClient.post('/attendance/clock', { ...data, type: 'out' })
        },

        reports: {
            daily: (date) => 
                ApiClient.get('/reports/daily', { date }),
            
            monthly: (month) => 
                ApiClient.get('/reports/monthly', { month })
        },

        permissions: {
            roles: () => 
                ApiClient.get('/permissions/roles'),
            
            menus: () => 
                ApiClient.get('/permissions/menus')
        },

        vehicleMonitor: {
            list: (params = {}) => 
                ApiClient.get('/vehicle-monitor', params),
            
            entry: (data) => 
                ApiClient.post('/vehicle-monitor/entry', data),
            
            exit: (data) => 
                ApiClient.post('/vehicle-monitor/exit', data),
            
            recognize: (imageData) => 
                ApiClient.post('/vehicle-monitor/recognize', { image: imageData })
        }
    };

    console.log('[ApiClient] ✅ 加载完成');
})();