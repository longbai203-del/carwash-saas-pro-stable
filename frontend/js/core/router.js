/**
 * @file router.js
 * @module core/router
 * @description 路由系统 - 支持动态模块加载、权限控制、页面切换
 * 
 * @example
 * import { router } from './router.js';
 * 
 * // 导航到指定路径
 * router.navigate('/dashboard');
 * 
 * // 监听路由事件
 * router.on('routeLoaded', ({ moduleName, pageName }) => {
 *   console.log('加载了', moduleName, pageName);
 * });
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from './store.js';
import { apiClient } from './api/api-client.js';
import { loadModule } from './services.js';

/**
 * @typedef {Object} RouteConfig
 * @property {string} module - 模块名称
 * @property {string} page - 页面名称
 * @property {string} title - 页面标题
 * @property {string[]} [permissions] - 所需权限
 * @property {boolean} [public] - 是否公开页面
 * @property {string} [template] - HTML模板
 */

/**
 * @typedef {Object} RouteParams
 * @property {string} moduleName - 模块名称
 * @property {string} pageName - 页面名称
 * @property {Object} params - 路径参数
 */

/**
 * @class Router
 * @description 路由管理器
 */
class Router {
    constructor() {
        /** @type {Object<string, RouteConfig>} 路由映射表 */
        this.routes = [];

        /** @type {RouteParams|null} 当前路由 */
        this.currentRoute = null;

        /** @type {HTMLElement|null} 内容容器 */
        this.container = document.getElementById('app-content');

        /** @type {HTMLElement|null} 加载容器 */
        this.loadingContainer = document.getElementById('app-loading');

        /** @type {boolean} 是否已初始化 */
        this.initialized = false;

        /** @type {Map<string, any>} 模块缓存 */
        this.moduleCache = new Map();

        // 绑定方法
        this.navigate = this.navigate.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        this.loadRoute = this.loadRoute.bind(this);

        // 监听浏览器后退/前进
        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', this.handlePopState);
            window.addEventListener('DOMContentLoaded', () => {
                this.init();
            });

            // 如果DOM已经加载，立即初始化
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                this.init();
            }
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 初始化路由
     */
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            // 加载模块映射
            await this.loadModuleMap();

            // 检查用户认证状态
            const isAuthenticated = await this.checkAuth();

            if (!isAuthenticated) {
                this.navigate('/login');
                return;
            }

            // 加载当前路径对应的页面
            const path = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
            this.navigate(path);

        } catch (error) {
            console.error('路由初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 加载模块映射表
     */
    async loadModuleMap() {
        try {
            // 首先尝试从服务器加载
            const response = await fetch('/module-map.json');
            if (response.ok) {
                const moduleMap = await response.json();
                store.set('moduleMap', moduleMap);
                return;
            }
        } catch (error) {
            console.warn('从服务器加载模块映射失败，尝试使用缓存');
        }

        // 如果服务器加载失败，尝试从缓存或默认配置加载
        const cached = store.get('moduleMap');
        if (cached) {
            return;
        }

        // 硬编码的核心模块映射（作为后备）
        const defaultModuleMap = {
            '/': { module: 'dashboard', page: 'dashboard', title: '仪表板' },
            '/dashboard': { module: 'dashboard', page: 'dashboard', title: '仪表板' },
            '/pos': { module: 'pos', page: 'pos', title: 'POS收银' },
            '/orders': { module: 'orders', page: 'list', title: '订单管理' },
            '/orders/detail/:id': { module: 'orders', page: 'detail', title: '订单详情' },
            '/products': { module: 'products', page: 'products', title: '商品管理' },
            '/customers': { module: 'customers', page: 'customers', title: '客户管理' },
            '/inventory': { module: 'inventory', page: 'inventory', title: '库存管理' },
            '/finance': { module: 'finance', page: 'finance', title: '财务管理' },
            '/hr': { module: 'hr', page: 'hr', title: '人力资源管理' },
            '/attendance': { module: 'hr', page: 'attendance', title: '考勤管理' },
            '/employees': { module: 'hr', page: 'employees', title: '员工管理' },
            '/marketing': { module: 'marketing', page: 'marketing', title: '营销管理' },
            '/analytics': { module: 'analytics', page: 'reports', title: '数据分析' },
            '/settings': { module: 'settings', page: 'settings', title: '系统设置' },
            '/login': { module: 'auth', page: 'login', title: '登录' },
            '/logout': { module: 'auth', page: 'logout', title: '退出' }
        };

        store.set('moduleMap', defaultModuleMap);
    }

    /**
     * @private
     * @returns {Promise<boolean>} 是否已认证
     * @description 检查认证状态
     */
    async checkAuth() {
        try {
            const token = apiClient.getToken();
            if (!token) {
                return false;
            }

            // 验证token是否有效
            const result = await apiClient.get('/auth/verify');
            if (result.success) {
                store.set('user', result.data);
                return true;
            }
            return false;
        } catch (error) {
            console.warn('认证检查失败:', error);
            return false;
        }
    }

    /**
     * @public
     * @param {string} path - 目标路径
     * @param {Object} [params={}] - 路径参数
     * @returns {Promise<void>}
     * @description 导航到指定路径
     * 
     * @example
     * router.navigate('/dashboard');
     * router.navigate('/orders/detail/123');
     */
    async navigate(path, params = {}) {
        // 处理特殊路径
        if (path === '/logout') {
            this.logout();
            return;
        }

        // 如果路径以 / 开头，去掉开头的 /
        if (path.startsWith('/')) {
            path = path.substring(1);
        }

        // 解析路径和参数
        const pathParts = path.split('/');
        const moduleName = pathParts[0] || 'dashboard';
        const pageName = pathParts[1] || 'index';

        // 更新URL（不刷新页面）
        const newPath = `/${path}`;
        if (typeof window !== 'undefined' && window.location.pathname !== newPath) {
            window.history.pushState({ path: newPath, params }, '', newPath);
        }

        // 加载路由
        await this.loadRoute(moduleName, pageName, params);
    }

    /**
     * @public
     * @param {string} moduleName - 模块名称
     * @param {string} pageName - 页面名称
     * @param {Object} params - 参数
     * @returns {Promise<void>}
     * @description 加载路由
     */
    async loadRoute(moduleName, pageName, params = {}) {
        try {
            // 显示加载状态
            this.showLoading();

            // 检查权限
            const hasPermission = await this.checkPermission(moduleName, pageName);
            if (!hasPermission) {
                this.showError('您没有权限访问此页面');
                return;
            }

            // 检查模块是否已加载，如果没有则动态加载
            const module = await loadModule(moduleName);
            if (!module) {
                this.showError(`模块 "${moduleName}" 加载失败`);
                return;
            }

            // 获取页面内容
            let pageContent = await this.getPageContent(moduleName, pageName);
            if (!pageContent) {
                this.showError(`页面 "${pageName}" 不存在`);
                return;
            }

            // 渲染页面
            this.renderPage(module, pageContent, params);

            // 更新当前路由
            this.currentRoute = { moduleName, pageName, params };

            // 隐藏加载状态
            this.hideLoading();

            // 触发页面加载完成事件
            this.emit('routeLoaded', { moduleName, pageName, params });

        } catch (error) {
            console.error('加载路由失败:', error);
            this.hideLoading();
            this.showError('页面加载失败，请刷新重试');
        }
    }

    /**
     * @private
     * @param {string} moduleName - 模块名称
     * @param {string} pageName - 页面名称
     * @returns {Promise<boolean>} 是否有权限
     * @description 检查用户权限
     */
    async checkPermission(moduleName, pageName) {
        const user = store.get('user');
        if (!user) return false;

        // admin拥有所有权限
        if (user.role === 'admin') return true;

        // 检查用户的权限列表
        const permissions = store.get('permissions') || [];
        const required = `${moduleName}:${pageName}`;

        // 检查是否有通配符权限
        if (permissions.includes('*')) return true;
        if (permissions.includes(`${moduleName}:*`)) return true;
        if (permissions.includes(required)) return true;

        // 未登录用户可以访问的页面
        const publicPages = ['login', 'register', 'forgot-password'];
        if (publicPages.includes(pageName)) return true;

        return false;
    }

    /**
     * @private
     * @param {string} moduleName - 模块名称
     * @param {string} pageName - 页面名称
     * @returns {Promise<string|null>} 页面HTML内容
     * @description 获取页面内容
     */
    async getPageContent(moduleName, pageName) {
        const cacheKey = `${moduleName}:${pageName}`;

        // 检查缓存
        if (this.moduleCache.has(cacheKey)) {
            return this.moduleCache.get(cacheKey);
        }

        // 尝试从服务器加载
        try {
            const response = await fetch(`/modules/${moduleName}/${pageName}.html`);
            if (response.ok) {
                const html = await response.text();
                this.moduleCache.set(cacheKey, html);
                return html;
            }
        } catch (error) {
            console.warn(`加载页面 HTML 失败: /modules/${moduleName}/${pageName}.html`, error);
        }

        // 如果HTML不存在，尝试使用模块内置模板
        const moduleMap = store.get('moduleMap') || {};
        const routeKey = `/${moduleName}/${pageName}`;
        const routeConfig = moduleMap[routeKey] || {};

        if (routeConfig.template) {
            const html = routeConfig.template;
            this.moduleCache.set(cacheKey, html);
            return html;
        }

        // 返回默认的页面框架
        const defaultHtml = this.getDefaultPageHtml(moduleName, pageName);
        this.moduleCache.set(cacheKey, defaultHtml);
        return defaultHtml;
    }

    /**
     * @private
     * @param {string} moduleName - 模块名称
     * @param {string} pageName - 页面名称
     * @returns {string} 默认页面HTML
     * @description 获取默认页面HTML框架
     */
    getDefaultPageHtml(moduleName, pageName) {
        const title = this.getPageTitle(moduleName, pageName);
        return `
            <div class="page-container">
                <div class="page-header">
                    <h1>${title}</h1>
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="window.router.refresh()">
                            <i class="fas fa-sync"></i> 刷新
                        </button>
                    </div>
                </div>
                <div class="page-content" id="page-content">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>加载 ${title}...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * @private
     * @param {string} moduleName - 模块名称
     * @param {string} pageName - 页面名称
     * @returns {string} 页面标题
     * @description 获取页面标题
     */
    getPageTitle(moduleName, pageName) {
        const titles = {
            'dashboard': { 'dashboard': '仪表板' },
            'pos': { 'pos': 'POS收银', 'cash-register': '收银台', 'quick-sale': '快捷销售' },
            'orders': { 'list': '订单列表', 'detail': '订单详情', 'refunds': '退款管理' },
            'products': { 'products': '商品管理', 'categories': '分类管理', 'brands': '品牌管理' },
            'customers': { 'customers': '客户管理', 'vehicles': '车辆管理', 'wallet': '钱包管理' },
            'inventory': { 'inventory': '库存管理', 'stock': '库存盘点', 'warehouses': '仓库管理' },
            'finance': { 'finance': '财务管理', 'income': '收入管理', 'expenses': '支出管理' },
            'hr': { 'hr': '人力资源管理', 'attendance': '考勤管理', 'employees': '员工管理' },
            'marketing': { 'marketing': '营销管理', 'campaigns': '营销活动', 'promotions': '促销管理' },
            'analytics': { 'reports': '数据报表', 'forecast': '预测分析', 'business-health': '经营健康' },
            'settings': { 'settings': '系统设置', 'profile': '个人设置', 'company': '公司信息' },
            'auth': { 'login': '登录', 'register': '注册', 'logout': '退出登录' }
        };

        return titles[moduleName]?.[pageName] || `${moduleName} - ${pageName}`;
    }

    /**
     * @private
     * @param {any} module - 模块对象
     * @param {string} content - 页面HTML内容
     * @param {Object} params - 参数
     * @description 渲染页面
     */
    renderPage(module, content, params) {
        const container = document.getElementById('app-content');
        if (!container) return;

        // 渲染内容
        container.innerHTML = content;

        // 执行模块的脚本
        if (module && typeof module.render === 'function') {
            try {
                module.render(params);
            } catch (error) {
                console.error('模块渲染失败:', error);
            }
        }

        // 初始化页面中的脚本
        this.initPageScripts(container);

        // 更新侧边栏高亮
        this.updateSidebarActive();
    }

    /**
     * @private
     * @param {HTMLElement} container - 容器元素
     * @description 初始化页面中的脚本
     */
    initPageScripts(container) {
        // 查找并执行页面中的script标签
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    }

    /**
     * @private
     * @description 更新侧边栏高亮
     */
    updateSidebarActive() {
        if (typeof window === 'undefined') return;
        const currentPath = window.location.pathname;
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.startsWith(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * @private
     * @description 显示加载状态
     */
    showLoading() {
        const loading = document.getElementById('app-loading');
        const content = document.getElementById('app-content');
        if (loading) loading.style.display = 'flex';
        if (content) content.style.display = 'none';
    }

    /**
     * @private
     * @description 隐藏加载状态
     */
    hideLoading() {
        const loading = document.getElementById('app-loading');
        const content = document.getElementById('app-content');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'block';
    }

    /**
     * @private
     * @param {string} message - 错误信息
     * @description 显示错误信息
     */
    showError(message) {
        const container = document.getElementById('app-content');
        if (!container) return;

        this.hideLoading();
        container.innerHTML = `
            <div class="error-page">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>出错了</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-sync"></i> 刷新页面
                </button>
                <button class="btn btn-secondary" onclick="window.router.navigate('/')">
                    <i class="fas fa-home"></i> 返回首页
                </button>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .error-page {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 60vh;
                text-align: center;
                padding: 2rem;
            }
            .error-icon {
                font-size: 4rem;
                color: #f59e0b;
                margin-bottom: 1rem;
            }
            .error-page h2 {
                font-size: 2rem;
                color: #1f2937;
                margin-bottom: 0.5rem;
            }
            .error-page p {
                color: #6b7280;
                margin-bottom: 2rem;
            }
            .error-page .btn {
                margin: 0.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * @private
     * @param {PopStateEvent} event - 浏览器事件
     * @description 处理浏览器后退/前进
     */
    handlePopState(event) {
        if (event.state && event.state.path) {
            const path = event.state.path;
            const params = event.state.params || {};
            this.navigate(path, params);
        } else {
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                this.navigate(path);
            }
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 登出
     */
    async logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.warn('登出请求失败:', error);
        }

        apiClient.setToken(null);
        store.clear(['theme', 'language']);
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 刷新当前页面
     */
    refresh() {
        if (this.currentRoute) {
            const { moduleName, pageName, params } = this.currentRoute;
            this.loadRoute(moduleName, pageName, params);
        } else {
            if (typeof window !== 'undefined') {
                this.navigate(window.location.pathname);
            }
        }
    }

    /**
     * @public
     * @param {string} event - 事件名称
     * @param {any} data - 事件数据
     * @description 触发自定义事件
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`router:${event}`, { detail: data });
        document.dispatchEvent(customEvent);
    }

    /**
     * @public
     * @param {string} event - 事件名称
     * @param {function(any): void} callback - 回调函数
     * @description 监听路由事件
     * 
     * @example
     * router.on('routeLoaded', ({ moduleName, pageName }) => {
     *   console.log('页面加载完成', moduleName, pageName);
     * });
     */
    on(event, callback) {
        document.addEventListener(`router:${event}`, (e) => {
            callback(e.detail);
        });
    }

    /**
     * @public
     * @param {string} path - 路径
     * @param {RouteConfig} config - 路由配置
     * @description 注册路由（用于预注册）
     * 
     * @example
     * router.register('/custom-page', {
     *   module: 'custom',
     *   page: 'page',
     *   title: '自定义页面'
     * });
     */
    register(path, config) {
        const moduleMap = store.get('moduleMap') || {};
        moduleMap[path] = config;
        store.set('moduleMap', moduleMap);
    }
}

// 创建单例实例
/**
 * @global
 * @type {Router}
 * @description 全局Router实例
 */
export const router = new Router();

// 全局暴露，方便调试
if (typeof window !== 'undefined') {
    window.router = router;
}

export default router;