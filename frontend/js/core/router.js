/**
 * core/router.js - 统一路由管理
 * @module router
 * @description 负责解析URL、动态加载模块、管理页面切换
 * 
 * @example
 * import { router } from './core/router.js';
 * // 初始化路由
 * router.init();
 * // 导航到指定路径
 * router.navigate('/pos/cashier');
 */

import { appStore } from './store.js';

/** @typedef {Object} RouteConfig 路由配置 */
/** @property {string} module - 模块文件夹名 (如 '02-pos') */
/** @property {string} page - 页面名 (如 'cashier') */

/** @type {Object<string, string>} URL路径到模块文件夹的映射 */
const MODULE_MAP = {
    'dashboard': '01-dashboard',
    'pos': '02-pos',
    'orders': '03-orders',
    'products': '04-products',
    'crm': '05-customers',
    'marketing': '06-marketing',
    'inventory': '07-inventory',
    'purchasing': '08-purchase',
    'finance': '09-finance',
    'hr': '10-hr',
    'saas': '11-saas',
    'system': '12-system',
    'analytics': '13-analytics',
    'settings': '14-settings'
};

/** @type {Object<string, string>} 模块到默认页面的映射 */
const DEFAULT_PAGES = {
    '01-dashboard': 'dashboard',
    '02-pos': 'quick-sale',
    '03-orders': 'list',
    '04-products': 'products',
    '05-customers': 'customers',
    '06-marketing': 'promotions',
    '07-inventory': 'stock',
    '08-purchase': 'orders',
    '09-finance': 'income',
    '10-hr': 'employees',
    '11-saas': 'tenants',
    '12-system': 'audit-logs',
    '13-analytics': 'reports',
    '14-settings': 'company'
};

/**
 * 路由管理器
 */
class Router {
    constructor() {
        /** @type {HTMLElement} 页面内容容器 */
        this.contentEl = null;
        /** @type {string} 当前路径 */
        this.currentPath = '';
        /** @type {boolean} 是否已初始化 */
        this.initialized = false;
    }

    /**
     * 初始化路由器
     * @returns {void}
     */
    init() {
        if (this.initialized) return;

        this.contentEl = document.getElementById('page-content');
        if (!this.contentEl) {
            console.warn('[Router] ⚠️ 找不到 #page-content 元素，使用默认容器');
            this.contentEl = document.querySelector('.main-content') || document.body;
        }

        // 监听hash变化
        window.addEventListener('hashchange', () => {
            this.handleRoute(window.location.hash);
        });

        // 监听路由激活事件
        document.addEventListener('router:navigate', (e) => {
            if (e.detail && e.detail.path) {
                this.navigate(e.detail.path);
            }
        });

        this.initialized = true;
        console.log('[Router] ✅ 初始化完成');

        // 处理首次加载
        const hash = window.location.hash || '#/dashboard';
        this.handleRoute(hash);
    }

    /**
     * 处理路由
     * @param {string} hash - URL hash
     * @returns {void}
     */
    async handleRoute(hash) {
        const path = hash.replace('#', '') || '/dashboard';
        await this.navigate(path);
    }

    /**
     * 导航到指定路径
     * @param {string} path - 路径 (如 '/pos/cashier')
     * @returns {Promise<void>}
     */
    async navigate(path) {
        if (this.currentPath === path) {
            console.log(`[Router] 已在 ${path}，跳过加载`);
            return;
        }

        console.log(`[Router] 🧭 导航到: ${path}`);
        this.currentPath = path;
        appStore.set('currentPath', path);

        // 解析路径
        const route = this.parsePath(path);
        if (!route) {
            this.showError(`无效路径: ${path}`);
            return;
        }

        // 显示加载状态
        this.showLoading();

        try {
            // 加载模块
            await this.loadModule(route.module, route.page);
            // 更新状态
            appStore.update({
                currentModule: route.module,
                currentPage: route.page
            });
            // 触发菜单激活事件
            document.dispatchEvent(new CustomEvent('menu:activate', {
                detail: { module: route.module, page: route.page, path }
            }));
        } catch (error) {
            console.error('[Router] ❌ 加载失败:', error);
            this.showError(`加载失败: ${error.message}`);
        }
    }

    /**
     * 解析路径
     * @param {string} path - 路径字符串
     * @returns {RouteConfig|null} 路由配置
     */
    parsePath(path) {
        const parts = path.split('/').filter(p => p && p.length > 0);
        let moduleKey = parts[0] || 'dashboard';
        let pageKey = parts[1] || '';

        const moduleFolder = MODULE_MAP[moduleKey];
        if (!moduleFolder) {
            console.warn(`[Router] 未知模块: ${moduleKey}`);
            return null;
        }

        // 如果页面为空，使用默认页面
        if (!pageKey) {
            pageKey = DEFAULT_PAGES[moduleFolder] || 'index';
        }

        return {
            module: moduleFolder,
            page: pageKey,
            moduleKey: moduleKey
        };
    }

    /**
     * 加载模块
     * @param {string} moduleFolder - 模块文件夹
     * @param {string} pageName - 页面名称
     * @returns {Promise<void>}
     */
    async loadModule(moduleFolder, pageName) {
        const basePath = `/modules/${moduleFolder}/${pageName}`;
        const htmlPath = `${basePath}.html`;
        const jsPath = `${basePath}.js`;

        console.log(`[Router] 📄 加载模块: ${moduleFolder}/${pageName}`);

        // 1. 加载HTML
        let htmlContent = '';
        try {
            htmlContent = await this.fetchContent(htmlPath);
        } catch (htmlError) {
            console.warn(`[Router] HTML加载失败 (${htmlPath}):`, htmlError);
            // 尝试加载同目录下的 index.html
            try {
                const indexPath = `/modules/${moduleFolder}/${moduleFolder}.html`;
                htmlContent = await this.fetchContent(indexPath);
            } catch (indexError) {
                // 如果都失败，显示错误
                throw new Error(`页面 "${pageName}" 不存在于模块 "${moduleFolder}"`);
            }
        }

        // 渲染HTML
        if (this.contentEl) {
            this.contentEl.innerHTML = htmlContent;
        }

        // 2. 加载JS
        try {
            // 使用动态import
            const module = await import(/* @vite-ignore */ jsPath);
            if (module && typeof module.init === 'function') {
                await module.init();
                console.log(`[Router] ✅ JS初始化成功: ${moduleFolder}/${pageName}`);
            } else if (module && module.default && typeof module.default.init === 'function') {
                await module.default.init();
                console.log(`[Router] ✅ JS初始化成功 (default): ${moduleFolder}/${pageName}`);
            } else {
                console.log(`[Router] ℹ️ 模块无需JS初始化: ${moduleFolder}/${pageName}`);
            }
        } catch (jsError) {
            console.warn(`[Router] ⚠️ JS加载失败 (${jsPath}):`, jsError);
            // 如果页面有HTML但JS加载失败，不影响显示
        }

        // 3. 更新页面标题
        const title = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - CarwashPro`;
        document.title = title;

        // 4. 隐藏加载状态
        this.hideLoading();
    }

    /**
     * 获取内容
     * @param {string} path - 资源路径
     * @returns {Promise<string>} 内容字符串
     */
    async fetchContent(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${path}`);
        }
        return response.text();
    }

    /**
     * 显示加载状态
     * @returns {void}
     */
    showLoading() {
        if (!this.contentEl) return;
        this.contentEl.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;height:400px;">
                <div style="text-align:center;">
                    <div style="width:48px;height:48px;border:4px solid #E5E7EB;border-top-color:#4F46E5;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto;"></div>
                    <p style="margin-top:16px;color:#6B7280;">加载中...</p>
                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
        `;
        appStore.set('isLoading', true);
    }

    /**
     * 隐藏加载状态
     * @returns {void}
     */
    hideLoading() {
        appStore.set('isLoading', false);
    }

    /**
     * 显示错误页面
     * @param {string} message - 错误信息
     * @returns {void}
     */
    showError(message) {
        if (!this.contentEl) return;
        this.contentEl.innerHTML = `
            <div style="padding:60px 20px;text-align:center;">
                <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#EF4444;margin-bottom:16px;"></i>
                <h2 style="color:#374151;">页面加载失败</h2>
                <p style="color:#6B7280;">${message}</p>
                <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                    重新加载
                </button>
            </div>
        `;
    }

    /**
     * 刷新当前路由
     * @returns {void}
     */
    refresh() {
        if (this.currentPath) {
            this.navigate(this.currentPath);
        }
    }

    /**
     * 获取当前路径
     * @returns {string}
     */
    getCurrentPath() {
        return this.currentPath;
    }
}

// 导出单例
export const router = new Router();