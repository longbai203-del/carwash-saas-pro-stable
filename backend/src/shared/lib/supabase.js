/**
 * shared/lib/supabase.js - Supabase数据库客户端
 * @module supabase
 * @description 封装Supabase数据库操作，提供统一的CRUD接口
 * 
 * @example
 * import { supabase, query, insert, update, delete } from './supabase.js';
 * // 查询数据
 * const orders = await query('orders', { status: 'completed' });
 * // 插入数据
 * const newOrder = await insert('orders', { customer: '张伟', total: 680 });
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// 初始化Supabase客户端
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found. Using mock mode.');
}

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export const supabase = createClient(
    supabaseUrl || 'https://example.supabase.co',
    supabaseKey || 'mock-key'
);

// ============================================================
// 通用查询函数
// ============================================================

/**
 * 查询数据
 * @param {string} table - 表名
 * @param {Object} options - 查询选项
 * @param {Object} options.filter - 过滤条件
 * @param {Object} options.order - 排序
 * @param {number} options.limit - 限制数量
 * @param {number} options.offset - 偏移量
 * @param {Array<string>} options.select - 选择字段
 * @returns {Promise<{data: Array, error: Object, total: number}>}
 */
export async function query(table, options = {}) {
    const {
        filter = {},
        order = { by: 'created_at', ascending: false },
        limit = 100,
        offset = 0,
        select = '*'
    } = options;

    try {
        let query = supabase.from(table).select(select, { count: 'exact' });

        // 应用过滤条件
        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query = query.eq(key, value);
            }
        });

        // 应用排序
        if (order.by) {
            query = query.order(order.by, { ascending: order.ascending !== false });
        }

        // 应用分页
        if (limit > 0) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error(`[Supabase] 查询失败 (${table}):`, error);
            return { data: [], error, total: 0 };
        }

        return { data: data || [], error: null, total: count || 0 };

    } catch (error) {
        console.error(`[Supabase] 查询异常 (${table}):`, error);
        return { data: [], error, total: 0 };
    }
}

/**
 * 根据ID查询单条数据
 * @param {string} table - 表名
 * @param {string|number} id - 记录ID
 * @param {string} idField - ID字段名 (默认 'id')
 * @returns {Promise<{data: Object|null, error: Object}>}
 */
export async function getById(table, id, idField = 'id') {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq(idField, id)
            .single();

        if (error) {
            console.error(`[Supabase] 查询单条失败 (${table}):`, error);
            return { data: null, error };
        }

        return { data, error: null };

    } catch (error) {
        console.error(`[Supabase] 查询单条异常 (${table}):`, error);
        return { data: null, error };
    }
}

/**
 * 插入数据
 * @param {string} table - 表名
 * @param {Object|Array} data - 要插入的数据
 * @param {Object} options - 选项
 * @param {string} options.idField - ID字段名 (默认 'id')
 * @returns {Promise<{data: Array, error: Object}>}
 */
export async function insert(table, data, options = {}) {
    const { idField = 'id' } = options;

    try {
        // 自动添加时间戳
        const now = new Date().toISOString();
        const dataWithTimestamp = Array.isArray(data)
            ? data.map(item => ({ ...item, created_at: now, updated_at: now }))
            : { ...data, created_at: now, updated_at: now };

        const { data: result, error } = await supabase
            .from(table)
            .insert(dataWithTimestamp)
            .select();

        if (error) {
            console.error(`[Supabase] 插入失败 (${table}):`, error);
            return { data: null, error };
        }

        return { data: result || [], error: null };

    } catch (error) {
        console.error(`[Supabase] 插入异常 (${table}):`, error);
        return { data: null, error };
    }
}

/**
 * 更新数据
 * @param {string} table - 表名
 * @param {string|number} id - 记录ID
 * @param {Object} data - 要更新的数据
 * @param {string} idField - ID字段名 (默认 'id')
 * @returns {Promise<{data: Object|null, error: Object}>}
 */
export async function update(table, id, data, idField = 'id') {
    try {
        // 自动更新时间戳
        const dataWithTimestamp = { ...data, updated_at: new Date().toISOString() };

        const { data: result, error } = await supabase
            .from(table)
            .update(dataWithTimestamp)
            .eq(idField, id)
            .select();

        if (error) {
            console.error(`[Supabase] 更新失败 (${table}):`, error);
            return { data: null, error };
        }

        return { data: result?.[0] || null, error: null };

    } catch (error) {
        console.error(`[Supabase] 更新异常 (${table}):`, error);
        return { data: null, error };
    }
}

/**
 * 删除数据
 * @param {string} table - 表名
 * @param {string|number} id - 记录ID
 * @param {string} idField - ID字段名 (默认 'id')
 * @returns {Promise<{data: Array, error: Object}>}
 */
export async function del(table, id, idField = 'id') {
    try {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq(idField, id)
            .select();

        if (error) {
            console.error(`[Supabase] 删除失败 (${table}):`, error);
            return { data: null, error };
        }

        return { data: data || [], error: null };

    } catch (error) {
        console.error(`[Supabase] 删除异常 (${table}):`, error);
        return { data: null, error };
    }
}

/**
 * 统计记录数
 * @param {string} table - 表名
 * @param {Object} filter - 过滤条件
 * @returns {Promise<number>}
 */
export async function count(table, filter = {}) {
    try {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });

        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query = query.eq(key, value);
            }
        });

        const { count, error } = await query;

        if (error) {
            console.error(`[Supabase] 统计失败 (${table}):`, error);
            return 0;
        }

        return count || 0;

    } catch (error) {
        console.error(`[Supabase] 统计异常 (${table}):`, error);
        return 0;
    }
}

// ============================================================
// 导出
// ============================================================

export default {
    supabase,
    query,
    getById,
    insert,
    update,
    del,
    count
};
// ============================================================
// 扩展工具函数
// ============================================================

/**
 * 根据用户ID获取用户信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户对象
 */


/**
 * 安全查询包装器 - 捕获异常并返回默认值
 * @param {Function} queryFn - 查询函数
 * @param {any} defaultValue - 默认返回值（默认为 null）
 * @returns {Promise<any>}
 */


// ============================================================
// 扩展工具函数
// ============================================================

/**
 * 根据用户ID获取用户信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户对象
 */


/**
 * 安全查询包装器 - 捕获异常并返回默认值
 * @param {Function} queryFn - 查询函数
 * @param {any} defaultValue - 默认返回值（默认为 null）
 * @returns {Promise<any>}
 */
// ============================================================
// 扩展工具函数
// ============================================================

export async function getUserById(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('[getUserById] Error:', error);
        throw error;
    }
    return data;
}

export async function safeQuery(queryFn, defaultValue = null) {
    try {
        const result = await queryFn();
        return result !== undefined && result !== null ? result : defaultValue;
    } catch (error) {
        console.error('[safeQuery] Error:', error);
        return defaultValue;
    }
}// ============================================================
// 分页工具函数
// ============================================================

export function getPagination(page = 1, pageSize = 20) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.max(1, parseInt(pageSize) || 20);
    const from = (pageNum - 1) * size;
    const to = from + size - 1;
    
    return {
        from,
        to,
        limit: size,
        offset: from
    };
}
