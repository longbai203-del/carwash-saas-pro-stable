// frontend/js/api/api-client.js
// 新增文件：全局API单例，包含完整的 JSDoc 类型注释

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * 前端全局环境配置 (在 index.html 的 window 对象中挂载)
 * @typedef {Object} AppEnv
 * @property {string} SUPABASE_URL - Supabase 项目地址
 * @property {string} SUPABASE_ANON_KEY - Supabase 匿名密钥
 */

/**
 * 前端应用 API 核心客户端
 * @class AppApi
 * @description 封装 Supabase SDK，用于统一处理所有数据请求和错误拦截，支持多租户自动注入
 */
class AppApi {
    /**
     * @constructs AppApi
     */
    constructor() {
        /** @type {string} */
        this.url = window.ENV?.SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL || '';
        /** @type {string} */
        this.anonKey = window.ENV?.SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
        
        if (!this.url || !this.anonKey) {
            console.warn('[AppApi] 警告: Supabase 配置缺失，请检查 .env 文件或 window.ENV');
        }

        /** @type {import('@supabase/supabase-js').SupabaseClient} */
        this._supabase = createClient(this.url, this.anonKey);
        /** @type {Object|null} */
        this._currentUser = null;
    }

    /**
     * 直接获取底层的 Supabase 客户端（用于复杂的高级查询）
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get raw() {
        return this._supabase;
    }

    /**
     * 获取当前登录用户信息
     * @returns {Object|null}
     */
    get user() {
        return this._currentUser;
    }

    /**
     * 执行数据表查询（修复 fix-modules.ps1 中替换的入口）
     * @param {string} table - 数据库表名
     * @returns {import('@supabase/supabase-js').PostgrestQueryBuilder}
     */
    query(table) {
        return this._supabase.from(table);
    }

    /**
     * 用户登录
     * @param {string} email - 用户邮箱
     * @param {string} password - 用户密码
     * @returns {Promise<Object>} 登录返回的数据
     * @throws {Error} 登录失败时抛出异常
     */
    async login(email, password) {
        try {
            const { data, error } = await this._supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            this._currentUser = data.user;
            return data;
        } catch (error) {
            console.error('[AppApi] 登录失败:', error.message);
            throw error;
        }
    }

    /**
     * 用户登出
     * @returns {Promise<Object>}
     * @throws {Error} 登出失败时抛出异常
     */
    async logout() {
        try {
            const { error } = await this._supabase.auth.signOut();
            if (error) throw error;
            this._currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('[AppApi] 登出失败:', error.message);
            throw error;
        }
    }

    /**
     * 通用 Fetch 请求封装，用于非 CRUD 的自定义后端 API 调用
     * @param {string} endpoint - 后端 API 路径 (例如 '/api/orders')
     * @param {Object} options - Fetch 配置项
     * @param {string} [options.method='GET'] - HTTP 方法
     * @param {Object} [options.body] - POST/PUT 请求体
     * @param {Object} [options.headers] - 自定义请求头
     * @returns {Promise<Object>} 解析后的 JSON 数据
     * @throws {Error} 请求失败或返回非 2xx 状态码时抛出
     */
    async request(endpoint, options = {}) {
        const baseUrl = `${window.location.origin}/api`;
        const url = `${baseUrl}${endpoint}`;
        const token = this._currentUser?.access_token;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers
                }
            });

            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.message || `请求失败 (${response.status})`);
            }
            return json;
        } catch (error) {
            console.error(`[AppApi] API请求错误: ${endpoint}`, error);
            throw error;
        }
    }
}

// 全局单例导出
export const appApi = new AppApi();