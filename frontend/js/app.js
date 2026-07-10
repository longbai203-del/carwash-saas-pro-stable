// frontend/app.js
/**
 * 应用主入口 - 应用初始化和启动
 * @module app
 */

import { store } from './core/store.js';
import { router } from './core/router.js';
import { apiClient } from './core/api/api-client.js';
import { loadModule, loadAllModules, initServices } from './services/services.js';
import { initSidebar } from './core/sidebar.js';
import { initTheme, initLanguage, initNotifications } from './core/init.js';

/**
 * 应用类
 */
class App {
    constructor() {
        this.initialized = false;
        this.startTime = Date.now();
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.ready = this.ready.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * 初始化应用
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
     * 加载应用配置
     */
    async loadConfig() {
        try {
            // 尝试从服务器加载配置
            const response = await fetch('/config.json');
            if (response.ok) {
                const config = await response.json();
                window.APP_CONFIG = config;
                store.setMultiple({
                    appConfig: config,
                    appName: config.appName || 'Carwash Pro',
                    appVersion: config.version || '1.0.0'
                });
            }
        } catch (error) {
            console.warn('加载应用配置失败，使用默认配置');
            // 使用默认配置
            window.APP_CONFIG = {
                appName: 'Carwash Pro',
                version: '1.0.0',
                apiBaseUrl: apiClient.getBaseURL()
            };
        }
        
        // 加载Supabase配置
        if (window.SUPABASE_CONFIG) {
            store.set('supabaseConfig', window.SUPABASE_CONFIG);
        }
    }

    /**
     * 初始化核心服务
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
     * 设置API拦截器
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
                if (window.location.pathname !== '/login') {
                    store.remove('authToken');
                    store.remove('user');
                    window.location.href = '/login';
                }
            } else if (error.isForbidden()) {
                // 权限不足
                this.showNotification('您没有权限执行此操作', 'error');
            } else if (error.isNetwork()) {
                // 网络错误
                this.showNotification('网络连接失败，请检查网络', 'error');
            }
            return error;
        });
    }

    /**
     * 恢复用户会话
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
                    const permResult = await apiClient.get('/permissions/me');
                    if (permResult.success) {
                        store.set('permissions', permResult.data.permissions || []);
                        store.set('role', permResult.data.role);
                    }
                    
                    console.log('✅ 用户会话已恢复:', result.data.name || result.data.email);
                    return;
                }
            }
            
            // 没有有效token
            store.set('isAuthenticated', false);
            store.set('user', null);
            
            // 如果在受保护的页面，跳转到登录
            const publicPages = ['/login', '/register', '/forgot-password'];
            const currentPath = window.location.pathname;
            if (!publicPages.includes(currentPath) && currentPath !== '/') {
                window.location.href = '/login';
            }
            
        } catch (error) {
            console.warn('恢复会话失败:', error);
            store.set('isAuthenticated', false);
            store.set('user', null);
        }
    }

    /**
     * 加载模块
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
     * 初始化UI组件
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
     * 初始化路由
     */
    initRouter() {
        // 路由已经自动初始化
        console.log('✅ 路由系统已启动');
    }

    /**
     * 应用就绪
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
            detail: { loadTime, version: window.APP_CONFIG?.version }
        });
        document.dispatchEvent(event);
        
        // 检查是否自动跳转到首页
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '') {
            router.navigate('/dashboard');
        }
    }

    /**
     * 处理启动错误
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
     * 重置应用
     */
    async reset() {
        store.reset();
        localStorage.clear();
        location.reload();
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        const event = new CustomEvent('notification:show', {
            detail: { message, type, duration }
        });
        document.dispatchEvent(event);
        
        // 如果通知系统还未初始化，使用alert
        if (!window.notificationSystem) {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 获取应用状态
     */
    getStatus() {
        return {
            initialized: this.initialized,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime,
            version: window.APP_CONFIG?.version,
            user: store.get('user'),
            isAuthenticated: store.get('isAuthenticated'),
            modules: store.get('loadedModules') || []
        };
    }
}

// 创建应用实例
export const app = new App();

// 全局暴露
window.app = app;

// DOM加载完成后启动应用
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    app.init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
}

export default app;