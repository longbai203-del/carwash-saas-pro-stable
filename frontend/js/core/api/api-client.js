/**
 * @file api-client.js
 * @module core/api/api-client
 * @description HTTP客户端 - 统一处理API请求，支持拦截器、重试、超时
 * 
 * @example
 * import { apiClient } from './api/api-client.js';
 * 
 * // GET请求
 * const data = await apiClient.get('/users');
 * 
 * // POST请求
 * const result = await apiClient.post('/users', { name: '张三' });
 * 
 * // 带拦截器
 * apiClient.addRequestInterceptor((config) => {
 *   config.options.headers['X-Custom'] = 'value';
 *   return config;
 * });
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../store.js';

/**
 * @typedef {Object} ApiErrorData
 * @property {string} [message] - 错误消息
 * @property {any} [data] - 额外数据
 */

/**
 * @typedef {Object} ApiRequestConfig
 * @property {string} url - 请求URL
 * @property {string} [method='GET'] - 请求方法
 * @property {any} [data] - 请求体数据
 * @property {Object} [params] - URL查询参数
 * @property {Object} [headers] - 自定义请求头
 * @property {number} [timeout=30000] - 超时时间(ms)
 * @property {number} [retries=3] - 重试次数
 */

/**
 * @typedef {function(ApiRequestConfig): Promise<ApiRequestConfig>} RequestInterceptor
 * @typedef {function(any, Response): Promise<any>} ResponseInterceptor
 * @typedef {function(Error): Promise<Error>} ErrorInterceptor
 */

/**
 * @class ApiError
 * @extends Error
 * @description API错误类
 */
export class ApiError extends Error {
    /**
     * @param {number} status - HTTP状态码
     * @param {ApiErrorData} data - 错误数据
     * @param {Response|null} response - 响应对象
     * @param {string} [type='api'] - 错误类型
     */
    constructor(status, data, response = null, type = 'api') {
        super(data?.message || data || `HTTP ${status}`);
        
        /** @type {number} HTTP状态码 */
        this.status = status;
        
        /** @type {ApiErrorData} 错误数据 */
        this.data = data;
        
        /** @type {Response|null} 响应对象 */
        this.response = response;
        
        /** @type {string} 错误类型 */
        this.type = type;
        
        /** @type {string} 错误名称 */
        this.name = 'ApiError';
        
        /** @type {string} 错误类别 */
        this.category = this.getCategory(status, type);
    }

    /**
     * @private
     * @param {number} status - HTTP状态码
     * @param {string} type - 错误类型
     * @returns {string} 错误类别
     */
    getCategory(status, type) {
        if (status === 401) return 'unauthorized';
        if (status === 403) return 'forbidden';
        if (status === 404) return 'notfound';
        if (status >= 400 && status < 500) return 'client';
        if (status >= 500) return 'server';
        if (type === 'timeout') return 'timeout';
        if (type === 'network') return 'network';
        return 'unknown';
    }

    /**
     * @returns {boolean} 是否是认证错误
     */
    isUnauthorized() {
        return this.category === 'unauthorized';
    }

    /**
     * @returns {boolean} 是否是权限错误
     */
    isForbidden() {
        return this.category === 'forbidden';
    }

    /**
     * @returns {boolean} 是否是网络错误
     */
    isNetwork() {
        return this.category === 'network' || this.category === 'timeout';
    }

    /**
     * @returns {boolean} 是否是服务器错误
     */
    isServer() {
        return this.category === 'server';
    }
}

/**
 * @class ApiClient
 * @description API客户端类
 */
class ApiClient {
    constructor() {
        /** @type {string} 基础URL */
        this.baseURL = this.getBaseURL();
        
        /** @type {number} 默认超时时间(ms) */
        this.timeout = 30000;
        
        /** @type {number} 默认重试次数 */
        this.retryCount = 3;
        
        /** @type {number} 重试延迟(ms) */
        this.retryDelay = 1000;
        
        /** @type {Object} 拦截器 */
        this.interceptors = {
            /** @type {RequestInterceptor[]} 请求拦截器 */
            request: [],
            /** @type {ResponseInterceptor[]} 响应拦截器 */
            response: [],
            /** @type {ErrorInterceptor[]} 错误拦截器 */
            error: []
        };

        // 绑定方法
        this.request = this.request.bind(this);
        this.get = this.get.bind(this);
        this.post = this.post.bind(this);
        this.put = this.put.bind(this);
        this.delete = this.delete.bind(this);
        this.patch = this.patch.bind(this);
        this.upload = this.upload.bind(this);
    }

    /**
     * @private
     * @returns {string} 基础URL
     * @description 根据环境自动获取基础URL
     */
    getBaseURL() {
        // 优先使用环境变量
        if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
            return window.APP_CONFIG.API_BASE_URL;
        }

        // 根据环境自动判断
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;

            // 开发环境
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'http://localhost:3000/api';
            }

            // Vercel部署
            if (hostname.includes('vercel.app')) {
                return 'https://carwash-saas-pro-stable.vercel.app/api';
            }

            // Render部署
            if (hostname.includes('onrender.com')) {
                return 'https://carwash-saas-pro-stable.onrender.com/api';
            }
        }

        // 生产环境
        return '/api';
    }

    /**
     * @public
     * @returns {string|null} JWT令牌
     * @description 获取当前认证Token
     */
    getToken() {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('auth_token') || store.get('authToken');
        }
        return null;
    }

    /**
     * @public
     * @param {string|null} token - JWT令牌
     * @description 设置认证Token
     */
    setToken(token) {
        if (token) {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('auth_token', token);
            }
            store.set('authToken', token);
        } else {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('auth_token');
            }
            store.remove('authToken');
        }
    }

    /**
     * @private
     * @returns {Object} 请求头
     * @description 获取标准请求头
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 添加租户ID（多租户支持）
        const tenantId = store.get('tenantId');
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        // 添加业务ID
        const businessId = store.get('businessId');
        if (businessId) {
            headers['X-Business-ID'] = businessId;
        }

        return headers;
    }

    /**
     * @public
     * @param {RequestInterceptor} interceptor - 请求拦截器
     * @description 添加请求拦截器
     */
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }

    /**
     * @public
     * @param {ResponseInterceptor} interceptor - 响应拦截器
     * @description 添加响应拦截器
     */
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }

    /**
     * @public
     * @param {ErrorInterceptor} interceptor - 错误拦截器
     * @description 添加错误拦截器
     */
    addErrorInterceptor(interceptor) {
        this.interceptors.error.push(interceptor);
    }

    /**
     * @private
     * @param {string} url - 请求URL
     * @param {RequestInit} options - fetch选项
     * @param {number} timeout - 超时时间
     * @returns {Promise<Response>} 响应对象
     * @description 带超时的fetch请求
     */
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new ApiError(408, { message: '请求超时' }, null, 'timeout');
            }
            throw new ApiError(0, { message: error.message }, null, 'network');
        }
    }

    /**
     * @private
     * @param {number} ms - 延迟时间(ms)
     * @returns {Promise<void>}
     * @description 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @public
     * @param {ApiRequestConfig} config - 请求配置
     * @returns {Promise<any>} 响应数据
     * @description 执行HTTP请求
     * 
     * @example
     * const data = await apiClient.request({
     *   url: '/users',
     *   method: 'POST',
     *   data: { name: '张三' }
     * });
     */
    async request(config) {
        const {
            url,
            method = 'GET',
            data = null,
            params = null,
            headers = {},
            timeout = this.timeout,
            retries = this.retryCount
        } = config;

        // 构建完整URL
        let fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

        // 添加查询参数
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            fullUrl += `?${queryString}`;
        }

        // 合并请求头
        const finalHeaders = {
            ...this.getHeaders(),
            ...headers
        };

        // 构建请求选项
        const options = {
            method,
            headers: finalHeaders,
            credentials: 'include'
        };

        if (data && method !== 'GET' && method !== 'DELETE') {
            if (headers['Content-Type'] === 'multipart/form-data') {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
            }
        }

        // 执行请求拦截器
        let interceptedConfig = { ...config, url: fullUrl, options };
        for (const interceptor of this.interceptors.request) {
            interceptedConfig = await interceptor(interceptedConfig);
        }

        // 执行请求（带重试）
        let lastError = null;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await this.fetchWithTimeout(
                    interceptedConfig.url, 
                    interceptedConfig.options, 
                    timeout
                );

                // 解析响应
                let responseData;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else {
                    responseData = await response.text();
                }

                // 检查响应状态
                if (!response.ok) {
                    throw new ApiError(response.status, responseData, response);
                }

                // 处理响应拦截器
                let finalData = responseData;
                for (const interceptor of this.interceptors.response) {
                    finalData = await interceptor(finalData, response);
                }

                return finalData;

            } catch (error) {
                lastError = error;

                // 如果是网络错误且还有重试次数
                if (attempt < retries - 1 && 
                    (error.type === 'network' || error.type === 'timeout' || error.status === 0)) {
                    await this.delay(this.retryDelay * (attempt + 1));
                    continue;
                }

                break;
            }
        }

        // 处理错误拦截器
        let finalError = lastError;
        for (const interceptor of this.interceptors.error) {
            finalError = await interceptor(finalError);
        }

        throw finalError;
    }

    /**
     * @public
     * @param {string} url - 请求URL
     * @param {Object} [params={}] - 查询参数
     * @param {Object} [config={}] - 额外配置
     * @returns {Promise<any>} 响应数据
     * @description GET请求
     * 
     * @example
     * const users = await apiClient.get('/users', { page: 1, limit: 10 });
     */
    async get(url, params = {}, config = {}) {
        return this.request({
            ...config,
            url,
            method: 'GET',
            params
        });
    }

    /**
     * @public
     * @param {string} url - 请求URL
     * @param {any} [data={}] - 请求体数据
     * @param {Object} [config={}] - 额外配置
     * @returns {Promise<any>} 响应数据
     * @description POST请求
     * 
     * @example
     * const result = await apiClient.post('/users', { name: '张三' });
     */
    async post(url, data = {}, config = {}) {
        return this.request({
            ...config,
            url,
            method: 'POST',
            data
        });
    }

    /**
     * @public
     * @param {string} url - 请求URL
     * @param {any} [data={}] - 请求体数据
     * @param {Object} [config={}] - 额外配置
     * @returns {Promise<any>} 响应数据
     * @description PUT请求
     */
    async put(url, data = {}, config = {}) {
        return this.request({
            ...config,
            url,
            method: 'PUT',
            data
        });
    }

    /**
     * @public
     * @param {string} url - 请求URL
     * @param {Object} [config={}] - 额外配置
     * @returns {Promise<any>} 响应数据
     * @description DELETE请求
     */
    async delete(url, config = {}) {
        return this.request({
            ...config,
            url,
            method: 'DELETE'
        });
    }

    /**
     * @public
     * @param {string} url - 请求URL
     * @param {any} [data={}] - 请求体数据
     * @param {Object} [config={}] - 额外配置
     * @returns {Promise<any>} 响应数据
     * @description PATCH请求
     */
    async patch(url, data = {}, config = {}) {
        return this.request({
            ...config,
            url,
            method: 'PATCH',
            data
        });
    }

    /**
     * @public
     * @param {string} url - 请求URL
     * @param {File} file - 要上传的文件
     * @param {Object} [config={}] - 额外配置
     * @returns {Promise<any>} 响应数据
     * @description 文件上传
     * 
     * @example
     * const file = document.querySelector('input[type=file]').files[0];
     * const result = await apiClient.upload('/upload', file);
     */
    async upload(url, file, config = {}) {
        const formData = new FormData();
        formData.append('file', file);

        const headers = {
            ...config.headers,
            'Content-Type': 'multipart/form-data'
        };

        return this.request({
            ...config,
            url,
            method: 'POST',
            data: formData,
            headers
        });
    }

    /**
     * @public
     * @param {ApiRequestConfig[]} requests - 请求配置数组
     * @returns {Promise<any[]>} 所有响应数据
     * @description 批量请求
     * 
     * @example
     * const results = await apiClient.batch([
     *   { url: '/users', method: 'GET' },
     *   { url: '/orders', method: 'GET' }
     * ]);
     */
    async batch(requests) {
        return Promise.all(requests.map(req => this.request(req)));
    }

    /**
     * @public
     * @description 取消所有请求（如果有AbortController）
     */
    cancelAll() {
        // 实现取消逻辑
        console.warn('cancelAll() 尚未实现');
    }
}

// 创建单例实例
/**
 * @global
 * @type {ApiClient}
 * @description 全局API客户端实例
 */
export const apiClient = new ApiClient();

// 全局暴露
if (typeof window !== 'undefined') {
    window.apiClient = apiClient;
}

export default apiClient;