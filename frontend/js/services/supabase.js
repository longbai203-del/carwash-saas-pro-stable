/**
 * services/supabase.js - Supabase 客户端封装（新项目）
 */
(function() {
    'use strict';

    var CONFIG = {
        url: 'https://ukqhdzvegqlkimxzkfcp.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcWhkenZlZ3Fsa2lteHprZmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjE3OTQsImV4cCI6MjA5ODczNzc5NH0.YuEB1rzpqc8kynZukXU4ANKnVtpIC3JJ9IEacQ2fcQE'
    };

    window.SupabaseService = {
        _client: null,
        _initialized: false,

        init: function() {
            if (this._initialized && this._client) {
                return this._client;
            }

            console.log('[SupabaseService] 初始化...');

            try {
                var sb = window.supabase;
                if (!sb) {
                    console.warn('[SupabaseService] window.supabase 不存在，等待加载...');
                    return null;
                }

                if (typeof sb.createClient !== 'function') {
                    console.error('[SupabaseService] supabase.createClient 不是函数');
                    return null;
                }

                this._client = sb.createClient(CONFIG.url, CONFIG.anonKey);
                this._initialized = true;
                console.log('[SupabaseService] ✅ 初始化完成');
                return this._client;

            } catch (error) {
                console.error('[SupabaseService] ❌ 初始化失败:', error.message);
                return null;
            }
        },

        getClient: function() {
            if (!this._initialized || !this._client) {
                this.init();
            }
            if (!this._client && window.supabase) {
                try {
                    this._client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
                    this._initialized = true;
                } catch (e) {
                    console.error('[SupabaseService] 重新创建客户端失败:', e);
                }
            }
            return this._client;
        },

        isReady: function() {
            return this._initialized && this._client !== null;
        },

        waitForReady: function(timeout) {
            timeout = timeout || 5000;
            var self = this;
            return new Promise(function(resolve) {
                var startTime = Date.now();
                var check = function() {
                    if (self.isReady()) {
                        resolve(true);
                        return;
                    }
                    if (Date.now() - startTime > timeout) {
                        console.warn('[SupabaseService] 等待超时');
                        resolve(false);
                        return;
                    }
                    self.init();
                    setTimeout(check, 200);
                };
                check();
            });
        },

        query: async function(table, options) {
            var client = this.getClient();
            if (!client) {
                console.error('[SupabaseService] 客户端未初始化');
                return [];
            }

            try {
                options = options || {};
                var query = client.from(table).select(options.select || '*');

                if (options.filter) {
                    Object.keys(options.filter).forEach(function(key) {
                        query = query.eq(key, options.filter[key]);
                    });
                }
                if (options.order) {
                    query = query.order(options.order.by, {
                        ascending: options.order.ascending || false
                    });
                }
                if (options.limit) {
                    query = query.limit(options.limit);
                }

                var result = await query;
                if (result.error) {
                    console.error('[SupabaseService] 查询错误:', result.error);
                    return [];
                }
                return result.data || [];

            } catch (error) {
                console.error('[SupabaseService] 查询异常:', error);
                return [];
            }
        },

        insert: async function(table, data) {
            var client = this.getClient();
            if (!client) {
                console.error('[SupabaseService] 客户端未初始化');
                return [];
            }

            try {
                var result = await client.from(table).insert(data).select();
                if (result.error) {
                    console.error('[SupabaseService] 插入错误:', result.error);
                    return [];
                }
                return result.data || [];

            } catch (error) {
                console.error('[SupabaseService] 插入异常:', error);
                return [];
            }
        },

        update: async function(table, id, data) {
            var client = this.getClient();
            if (!client) {
                console.error('[SupabaseService] 客户端未初始化');
                return [];
            }

            try {
                var result = await client.from(table).update(data).eq('id', id).select();
                if (result.error) {
                    console.error('[SupabaseService] 更新错误:', result.error);
                    return [];
                }
                return result.data || [];

            } catch (error) {
                console.error('[SupabaseService] 更新异常:', error);
                return [];
            }
        },

        delete: async function(table, id) {
            var client = this.getClient();
            if (!client) {
                console.error('[SupabaseService] 客户端未初始化');
                return false;
            }

            try {
                var result = await client.from(table).delete().eq('id', id);
                if (result.error) {
                    console.error('[SupabaseService] 删除错误:', result.error);
                    return false;
                }
                return true;

            } catch (error) {
                console.error('[SupabaseService] 删除异常:', error);
                return false;
            }
        },

        subscribe: function(channel, callback) {
            var client = this.getClient();
            if (!client) {
                console.error('[SupabaseService] 客户端未初始化');
                return null;
            }

            try {
                return client
                    .channel(channel)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public'
                    }, callback)
                    .subscribe();

            } catch (error) {
                console.error('[SupabaseService] 订阅失败:', error);
                return null;
            }
        }
    };

    function autoInit() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            window.SupabaseService.init();
        } else {
            console.log('[SupabaseService] 等待 supabase 加载...');
            setTimeout(autoInit, 300);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        setTimeout(autoInit, 100);
    }

    console.log('[SupabaseService] 加载完成');
})();