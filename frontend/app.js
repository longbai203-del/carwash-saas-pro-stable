/**
 * @file app.js
 * @module app
 * @description 应用主入口 - 应用初始化和启动
 * 
 * @example
 * // 应用自动初始化，无需手动调用
 * // 如需手动控制：
 * import { app } from './app.js';
 * await app.init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from './core/store.js';
import { router } from './core/router.js';
import { apiClient } from './core/api/api-client.js';
import { loadModule, loadAllModules, initServices } from './core/services.js';
import { initSidebar } from './core/sidebar.js';
import { initTheme, initLanguage, initNotifications, showToast } from './core/init.js';

/**
 * @typedef {Object} AppConfig
 * @property {string} appName - 应用名称
 * @property {string} version - 版本号
 * @property {string} apiBaseUrl - API基础URL
 */

/**
 * @typedef {Object} AppStatus
 * @property {boolean} initialized - 是否已初始化
 * @property {number} startTime - 启动时间戳
 * @property {number} uptime - 运行时间(ms)
 * @property {string} version - 版本号
 * @property {Object|null} user - 当前用户
 * @property {boolean} isAuthenticated - 是否已认证
 * @property {string[]} modules - 已加载模块列表
 */

/**
 * @class App
 * @description 应用主类
 */
class App {
    constructor() {
        /** @type {boolean} 是否已初始化 */
        this.initialized = false;
        
        /** @type {number} 启动时间戳 */
        this.startTime = Date.now();
        
        /** @type {AppConfig} 应用配置 */
        this.config = null;

        // 绑定方法
        this.init = this.init.bind(this);
        this.ready = this.ready.bind(this);
        this.handleError = this.handleError.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.reset = this.reset.bind(this);
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 初始化应用
     * 
     * @example
     * await app.init();
     */
    async init() {
        try {
            console.log('🚀 Carwash Pro 应用启动中...');
            
            // 1. 加载应用配置
            await this.loadConfig();
            
            // 2. 初始化核心服务
            await this.initCoreServices();
            
            // 3. 恢复用户会话
            await this.restoreSession();
            
            // 4. 加载模块
            await this.loadModules();
            
            // 5. 初始化UI组件
            await this.initUI();
            
            // 6. 启动路由
            this.initRouter();
            
            // 7. 应用就绪
            this.ready();
            
        } catch (error) {
            console.error('应用启动失败:', error);
            this.handleError(error);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 加载应用配置
     */
    async loadConfig() {
        try {
            // 尝试从服务器加载配置
            const response = await fetch('/config.json');
            if (response.ok) {
                const config = await response.json();
                window.APP_CONFIG = config;
                this.config = config;
                store.setMultiple({
                    appConfig: config,
                    appName: config.appName || 'Carwash Pro',
                    appVersion: config.version || '1.0.0'
                });
            }
        } catch (error) {
            console.warn('加载应用配置失败，使用默认配置');
            // 使用默认配置
            this.config = {
                appName: 'Carwash Pro',
                version: '1.0.0',
                apiBaseUrl: apiClient.baseURL
            };
            window.APP_CONFIG = this.config;
        }
        
        // 加载Supabase配置
        if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
            store.set('supabaseConfig', window.SUPABASE_CONFIG);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 初始化核心服务
     */
    async initCoreServices() {
        try {
            // 初始化服务
            await initServices();
            
            // 设置API客户端的拦截器
            this.setupApiInterceptors();
            
            console.log('✅ 核心服务初始化完成');
        } catch (error) {
            console.error('核心服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * @private
     * @description 设置API拦截器
     */
    setupApiInterceptors() {
        // 请求拦截器 - 添加通用参数
        apiClient.addRequestInterceptor(async (config) => {
            // 可以在这里添加请求日志或通用处理
            return config;
        });
        
        // 响应拦截器 - 处理通用响应
        apiClient.addResponseInterceptor(async (data) => {
            // 如果响应包含token，保存它
            if (data && data.token) {
                apiClient.setToken(data.token);
            }
            return data;
        });
        
        // 错误拦截器 - 统一错误处理
        apiClient.addErrorInterceptor(async (error) => {
            if (error.isUnauthorized()) {
                // 未认证，跳转到登录页
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    apiClient.setToken(null);
                    store.remove('user');
                    window.location.href = '/login';
                }
            } else if (error.isForbidden()) {
                // 权限不足
                showToast('您没有权限执行此操作', 'error');
            } else if (error.isNetwork()) {
                // 网络错误
                showToast('网络连接失败，请检查网络', 'error');
            } else if (error.isServer()) {
                showToast('服务器错误，请稍后重试', 'error');
            }
            return error;
        });
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 恢复用户会话
     */
    async restoreSession() {
        try {
            const token = apiClient.getToken();
            if (token) {
                // 验证token是否有效
                const result = await apiClient.get('/auth/verify');
                if (result.success && result.data) {
                    store.set('user', result.data);
                    store.set('isAuthenticated', true);
                    
                    // 加载用户权限
                    try {
                        const permResult = await apiClient.get('/permissions/me');
                        if (permResult.success) {
                            store.set('permissions', permResult.data.permissions || []);
                            store.set('role', permResult.data.role);
                        }
                    } catch (permError) {
                        console.warn('加载权限失败:', permError);
                    }
                    
                    console.log('✅ 用户会话已恢复:', result.data.name || result.data.email);
                    return;
                }
            }
            
            // 没有有效token
            store.set('isAuthenticated', false);
            store.set('user', null);
            
            // 如果在受保护的页面，跳转到登录
            if (typeof window !== 'undefined') {
                const publicPages = ['/login', '/register', '/forgot-password'];
                const currentPath = window.location.pathname;
                if (!publicPages.includes(currentPath) && currentPath !== '/') {
                    window.location.href = '/login';
                }
            }
            
        } catch (error) {
            console.warn('恢复会话失败:', error);
            store.set('isAuthenticated', false);
            store.set('user', null);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 加载模块
     */
    async loadModules() {
        try {
            // 加载所有模块（并行加载核心模块）
            await loadAllModules();
            
            // 预加载常用模块
            const commonModules = ['dashboard', 'pos', 'orders', 'products', 'customers'];
            const loadPromises = commonModules.map(name => 
                loadModule(name).catch(() => null)
            );
            await Promise.all(loadPromises);
            
            console.log('✅ 模块加载完成');
        } catch (error) {
            console.warn('模块加载部分失败:', error);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 初始化UI组件
     */
    async initUI() {
        try {
            // 初始化侧边栏
            await initSidebar();
            
            // 初始化主题
            initTheme();
            
            // 初始化语言
            initLanguage();
            
            // 初始化通知系统
            initNotifications();
            
            console.log('✅ UI初始化完成');
        } catch (error) {
            console.warn('UI初始化部分失败:', error);
        }
    }

    /**
     * @private
     * @description 初始化路由
     */
    initRouter() {
        // 路由已经自动初始化
        console.log('✅ 路由系统已启动');
    }

    /**
     * @private
     * @description 应用就绪
     */
    ready() {
        this.initialized = true;
        const loadTime = Date.now() - this.startTime;
        
        // 隐藏加载界面
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        // 显示内容
        const contentEl = document.getElementById('app-content');
        if (contentEl) {
            contentEl.style.display = 'block';
        }
        
        console.log(`✅ 应用启动完成 (${loadTime}ms)`);
        
        // 触发应用就绪事件
        const event = new CustomEvent('app:ready', {
            detail: { 
                loadTime, 
                version: this.config?.version,
                appName: this.config?.appName
            }
        });
        document.dispatchEvent(event);
        
        // 检查是否自动跳转到首页
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath === '/' || currentPath === '') {
                router.navigate('/dashboard');
            }
        }
    }

    /**
     * @private
     * @param {Error} error - 错误对象
     * @description 处理启动错误
     */
    handleError(error) {
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="app-error">
                    <div class="error-icon">⚠️</div>
                    <h2>应用启动失败</h2>
                    <p>${error.message || '未知错误'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        重新加载
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.reset()">
                        重置应用
                    </button>
                    <details>
                        <summary>详细信息</summary>
                        <pre>${error.stack || error}</pre>
                    </details>
                </div>
            `;
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 重置应用
     * 
     * @example
     * await app.reset();
     */
    async reset() {
        store.clear();
        if (typeof localStorage !== 'undefined') {
            // 保留一些关键设置
            const theme = store.get('theme');
            const language = store.get('language');
            localStorage.clear();
            if (theme) store.set('theme', theme);
            if (language) store.set('language', language);
        }
        if (typeof location !== 'undefined') {
            location.reload();
        }
    }

    /**
     * @public
     * @param {string} message - 通知消息
     * @param {string} [type='info'] - 通知类型
     * @param {number} [duration=3000] - 显示时长
     * @description 显示通知（快捷方法）
     */
    showNotification(message, type = 'info', duration = 3000) {
        showToast(message, type, duration);
    }

    /**
     * @public
     * @returns {AppStatus} 应用状态
     * @description 获取应用状态
     * 
     * @example
     * const status = app.getStatus();
     * console.log('运行时间:', status.uptime, 'ms');
     */
    getStatus() {
        return {
            initialized: this.initialized,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime,
            version: this.config?.version || '1.0.0',
            user: store.get('user'),
            isAuthenticated: store.get('isAuthenticated') || false,
            modules: store.get('loadedModules') || []
        };
    }
}

// 创建应用实例
/**
 * @global
 * @type {App}
 * @description 全局App实例
 */
export const app = new App();

// 全局暴露
if (typeof window !== 'undefined') {
    window.app = app;
}

// DOM加载完成后启动应用
if (typeof document !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        app.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            app.init();
        });
    }
}

export default app;