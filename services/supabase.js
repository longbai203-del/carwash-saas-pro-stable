/**
 * services/supabase.js - Supabase 客户端封装
 */
(function() {
    // 使用全局 supabase 或创建新客户端
    let client = null;
    
    function getClient() {
        if (client) return client;
        
        // 尝试从全局获取
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            client = supabase.createClient(
                'https://fhwsbdokxgjqyrbvstxq.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3NiZG9reGdqcXlyYnZzdHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODQzNjAsImV4cCI6MjA5Nzk2MDM2MH0.XXR5BhhOuF0t6lzOkeYl6OPyva_QCwcV482TzOFV_84'
            );
            return client;
        }
        
        // 如果 supabase 未加载，直接使用 window.supabase
        if (window.supabase && window.supabase.createClient) {
            client = window.supabase.createClient(
                'https://fhwsbdokxgjqyrbvstxq.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3NiZG9reGdqcXlyYnZzdHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODQzNjAsImV4cCI6MjA5Nzk2MDM2MH0.XXR5BhhOuF0t6lzOkeYl6OPyva_QCwcV482TzOFV_84'
            );
            return client;
        }
        
        console.error('[SupabaseService] 无法创建客户端');
        return null;
    }

    window.SupabaseService = {
        _client: null,
        _initialized: false,

        init: function(url, anonKey) {
            if (this._initialized) return this._client;
            
            // 使用传入的参数或默认配置
            const finalUrl = url || 'https://fhwsbdokxgjqyrbvstxq.supabase.co';
            const finalKey = anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3NiZG9reGdqcXlyYnZzdHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODQzNjAsImV4cCI6MjA5Nzk2MDM2MH0.XXR5BhhOuF0t6lzOkeYl6OPyva_QCwcV482TzOFV_84';
            
            // 从全局获取 supabase
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                this._client = supabase.createClient(finalUrl, finalKey);
            } else if (window.supabase && window.supabase.createClient) {
                this._client = window.supabase.createClient(finalUrl, finalKey);
            } else {
                console.error('[SupabaseService] supabase 未定义，请确保 CDN 加载成功');
                return null;
            }
            
            this._initialized = true;
            console.log('[SupabaseService] 初始化完成');
            return this._client;
        },

        getClient: function() {
            if (!this._client) {
                this.init();
            }
            return this._client;
        },

        query: async function(table, options) {
            const client = this.getClient();
            if (!client) throw new Error('Supabase 客户端未初始化');
            
            options = options || {};
            let query = client.from(table).select(options.select || '*');
            
            if (options.filter) {
                Object.keys(options.filter).forEach(function(key) {
                    query = query.eq(key, options.filter[key]);
                });
            }
            if (options.order) {
                query = query.order(options.order.by, { ascending: options.order.ascending || false });
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const result = await query;
            if (result.error) throw new Error(result.error.message);
            return result.data;
        },

        insert: async function(table, data) {
            const client = this.getClient();
            if (!client) throw new Error('Supabase 客户端未初始化');
            const result = await client.from(table).insert(data).select();
            if (result.error) throw new Error(result.error.message);
            return result.data;
        },

        update: async function(table, id, data) {
            const client = this.getClient();
            if (!client) throw new Error('Supabase 客户端未初始化');
            const result = await client.from(table).update(data).eq('id', id).select();
            if (result.error) throw new Error(result.error.message);
            return result.data;
        },

        delete: async function(table, id) {
            const client = this.getClient();
            if (!client) throw new Error('Supabase 客户端未初始化');
            const result = await client.from(table).delete().eq('id', id);
            if (result.error) throw new Error(result.error.message);
            return true;
        },

        subscribe: function(channel, callback) {
            const client = this.getClient();
            if (!client) throw new Error('Supabase 客户端未初始化');
            return client
                .channel(channel)
                .on('postgres_changes', { event: '*', schema: 'public' }, callback)
                .subscribe();
        }
    };

    // 自动初始化
    setTimeout(function() {
        if (!window.SupabaseService._initialized) {
            window.SupabaseService.init();
        }
    }, 100);

    console.log('[SupabaseService] 加载完成');
})();