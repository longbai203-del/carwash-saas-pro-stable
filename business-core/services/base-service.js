/**
 * business-core/services/base-service.js
 * Service Layer 基类 - 所有业务服务的父类
 * 提供统一的 CRUD、缓存、事件、错误处理
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// 1. 配置
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || window.SUPABASE_CONFIG?.url;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || window.SUPABASE_CONFIG?.anonKey;

let supabaseClient = null;

function getSupabase() {
    if (!supabaseClient) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// ============================================================
// 2. 基类
// ============================================================

export class BaseService {
    constructor(tableName) {
        this.tableName = tableName;
        this.supabase = getSupabase();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟
        this.events = [];
    }

    // ============================================================
    // 缓存管理
    // ============================================================

    getCacheKey(params = {}) {
        return `${this.tableName}:${JSON.stringify(params)}`;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
        this.emit('cache:cleared', { key });
    }

    // ============================================================
    // 事件系统
    // ============================================================

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    // ============================================================
    // 核心 CRUD 操作
    // ============================================================

    // 查询列表
    async find(params = {}) {
        const cacheKey = this.getCacheKey(params);
        const cached = this.getCache(cacheKey);
        if (cached) {
            this.emit('cache:hit', { key: cacheKey });
            return cached;
        }

        try {
            const query = this.supabase.from(this.tableName).select('*');

            // 分页
            if (params.page) {
                const from = (params.page - 1) * (params.limit || 10);
                const to = from + (params.limit || 10) - 1;
                query.range(from, to);
            }

            // 排序
            if (params.orderBy) {
                query.order(params.orderBy, { ascending: params.ascending || false });
            } else {
                query.order('created_at', { ascending: false });
            }

            // 过滤
            if (params.filters) {
                Object.keys(params.filters).forEach(key => {
                    const value = params.filters[key];
                    if (value) {
                        query.ilike(key, `%${value}%`);
                    }
                });
            }

            // 精确匹配
            if (params.equals) {
                Object.keys(params.equals).forEach(key => {
                    query.eq(key, params.equals[key]);
                });
            }

            const { data, error, count } = await query;
            if (error) throw error;

            const result = {
                list: data || [],
                total: count || data?.length || 0,
                page: params.page || 1,
                limit: params.limit || 10
            };

            this.setCache(cacheKey, result);
            this.emit('cache:set', { key: cacheKey });
            return result;

        } catch (error) {
            console.error(`❌ ${this.tableName}.find 失败:`, error);
            throw error;
        }
    }

    // 根据 ID 查询
    async findById(id) {
        const cacheKey = this.getCacheKey({ id });
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            this.setCache(cacheKey, data);
            return data;

        } catch (error) {
            console.error(`❌ ${this.tableName}.findById 失败:`, error);
            throw error;
        }
    }

    // 创建
    async create(data) {
        try {
            // 添加时间戳
            const now = new Date().toISOString();
            const record = {
                ...data,
                created_at: data.created_at || now,
                updated_at: now
            };

            const { data: result, error } = await this.supabase
                .from(this.tableName)
                .insert(record)
                .select()
                .single();

            if (error) throw error;

            this.clearCache();
            this.emit('created', result);
            return result;

        } catch (error) {
            console.error(`❌ ${this.tableName}.create 失败:`, error);
            throw error;
        }
    }

    // 更新
    async update(id, data) {
        try {
            const record = {
                ...data,
                updated_at: new Date().toISOString()
            };

            const { data: result, error } = await this.supabase
                .from(this.tableName)
                .update(record)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            this.clearCache();
            this.emit('updated', result);
            return result;

        } catch (error) {
            console.error(`❌ ${this.tableName}.update 失败:`, error);
            throw error;
        }
    }

    // 删除
    async delete(id) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.clearCache();
            this.emit('deleted', { id });
            return { success: true };

        } catch (error) {
            console.error(`❌ ${this.tableName}.delete 失败:`, error);
            throw error;
        }
    }

    // 批量删除
    async deleteMany(ids) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .in('id', ids);

            if (error) throw error;

            this.clearCache();
            this.emit('deleted:many', { ids });
            return { success: true };

        } catch (error) {
            console.error(`❌ ${this.tableName}.deleteMany 失败:`, error);
            throw error;
        }
    }

    // 统计
    async count(filters = {}) {
        try {
            const query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });

            if (filters.equals) {
                Object.keys(filters.equals).forEach(key => {
                    query.eq(key, filters.equals[key]);
                });
            }

            const { count, error } = await query;
            if (error) throw error;

            return count || 0;

        } catch (error) {
            console.error(`❌ ${this.tableName}.count 失败:`, error);
            throw error;
        }
    }
}

// ============================================================
// 3. 导出
// ============================================================

export default BaseService;