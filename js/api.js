/**
 * api.js - API 服务层
 * 功能：封装所有数据库操作，统一使用 SupabaseService
 */
(function() {
    'use strict';

    window.AppApi = {

        // ===== 获取客户端 =====
        _getClient: function() {
            if (!window.SupabaseService) {
                console.error('[Api] SupabaseService 未加载');
                return null;
            }
            var client = window.SupabaseService.getClient();
            if (!client) {
                console.error('[Api] 获取客户端失败');
                return null;
            }
            return client;
        },

        // ===== 通用查询 =====
        query: async function(table, options) {
            try {
                var client = this._getClient();
                if (!client) {
                    console.warn('[Api] 客户端未初始化，返回空数据');
                    return [];
                }

                options = options || {};
                var query = client.from(table).select(options.select || '*');

                // 应用过滤器
                if (options.filter) {
                    Object.keys(options.filter).forEach(function(key) {
                        query = query.eq(key, options.filter[key]);
                    });
                }

                // 应用排序
                if (options.order) {
                    query = query.order(options.order.by, {
                        ascending: options.order.ascending || false
                    });
                }

                // 应用限制
                if (options.limit) {
                    query = query.limit(options.limit);
                }

                var result = await query;

                if (result.error) {
                    console.error('[Api] 查询错误:', result.error);
                    return [];
                }

                return result.data || [];

            } catch (error) {
                console.error('[Api] 查询异常:', error);
                return [];
            }
        },

        // ===== 插入数据 =====
        insert: async function(table, data) {
            try {
                var client = this._getClient();
                if (!client) {
                    console.warn('[Api] 客户端未初始化');
                    return [];
                }

                var result = await client.from(table).insert(data).select();

                if (result.error) {
                    console.error('[Api] 插入错误:', result.error);
                    return [];
                }

                return result.data || [];

            } catch (error) {
                console.error('[Api] 插入异常:', error);
                return [];
            }
        },

        // ===== 更新数据 =====
        update: async function(table, id, data) {
            try {
                var client = this._getClient();
                if (!client) {
                    console.warn('[Api] 客户端未初始化');
                    return [];
                }

                var result = await client.from(table).update(data).eq('id', id).select();

                if (result.error) {
                    console.error('[Api] 更新错误:', result.error);
                    return [];
                }

                return result.data || [];

            } catch (error) {
                console.error('[Api] 更新异常:', error);
                return [];
            }
        },

        // ===== 删除数据 =====
        delete: async function(table, id) {
            try {
                var client = this._getClient();
                if (!client) {
                    console.warn('[Api] 客户端未初始化');
                    return false;
                }

                var result = await client.from(table).delete().eq('id', id);

                if (result.error) {
                    console.error('[Api] 删除错误:', result.error);
                    return false;
                }

                return true;

            } catch (error) {
                console.error('[Api] 删除异常:', error);
                return false;
            }
        },

        // ============================================================
        // 业务方法
        // ============================================================

        // ===== 获取用户列表 =====
        getUsers: function() {
            return this.query('users', {
                order: { by: 'created_at', ascending: false }
            });
        },

        // ===== 获取订单列表 =====
        getOrders: function() {
            return this.query('orders', {
                order: { by: 'created_at', ascending: false },
                limit: 200
            });
        },

        // ===== 获取今日订单 =====
        getTodayOrders: function() {
            var today = new Date().toISOString().split('T')[0];
            return this.query('orders', {
                filter: { date: today },
                order: { by: 'created_at', ascending: false }
            });
        },

        // ===== 获取客户列表 =====
        getCustomers: function() {
            return this.query('customers', {
                order: { by: 'created_at', ascending: false }
            });
        },

        // ===== 获取库存列表 =====
        getInventory: function() {
            return this.query('inventory');
        },

        // ===== 获取考勤列表 =====
        getAttendance: function() {
            return this.query('attendance', {
                order: { by: 'time', ascending: false },
                limit: 100
            });
        },

        // ===== 获取门店列表 =====
        getBranches: function() {
            return this.query('stores');
        },

        // ===== 获取审计日志 =====
        getAuditLogs: function() {
            return this.query('audit_logs', {
                order: { by: 'created_at', ascending: false },
                limit: 100
            });
        },

        // ===== 获取费用列表 =====
        getExpenses: function() {
            return this.query('expenses', {
                order: { by: 'created_at', ascending: false },
                limit: 200
            });
        },

        // ===== 获取费用分类 =====
        getExpenseCategories: function() {
            return this.query('expense_categories', {
                order: { by: 'name', ascending: true }
            });
        },

        // ===== 创建订单 =====
        createOrder: function(orderData) {
            return this.insert('orders', orderData);
        },

        // ===== 更新订单状态 =====
        updateOrderStatus: function(orderId, status) {
            return this.update('orders', orderId, {
                status: status,
                updated_at: new Date().toISOString()
            });
        },

        // ===== 创建费用记录 =====
        createExpense: function(expenseData) {
            return this.insert('expenses', expenseData);
        },

        // ===== 获取用户信息 =====
        getUserById: function(userId) {
            return this.query('users', {
                filter: { id: userId }
            });
        },

        // ===== 获取客户信息 =====
        getCustomerById: function(customerId) {
            return this.query('customers', {
                filter: { id: customerId }
            });
        }
    };

    console.log('[Api] 加载完成');
})();