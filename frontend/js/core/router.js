/**
 * core/router.js - 统一路由管理 (V2 增强版)
 * @module router
 * @description 负责解析URL、动态加载模块、管理页面切换
 * 支持从 module-map.json 读取配置，实现更灵活的路由映射。
 * 
 * @example
 * import { router } from './core/router.js';
 * // 初始化路由
 * router.init();
 * // 导航到指定路径
 * router.navigate('/pos/cashier');
 */

import { appStore } from './store.js';

/** @typedef {Object} ModuleConfig 模块配置 */
/** @property {string} key - 模块唯一标识 (如 'dashboard') */
/** @property {string} folder - 模块文件夹名 (如 '01-dashboard') */
/** @property {string} defaultPage - 默认页面 (如 'dashboard') */
/** @property {string} label - 显示名称 */
/** @property {string} icon - FontAwesome图标类名 */
/** @property {boolean} enabled - 是否启用 */

class Router {
    constructor() {
        /** @type {HTMLElement} 页面内容容器 */
        this.contentEl = null;
        /** @type {string} 当前路径 */
        this.currentPath = '';
        /** @type {boolean} 是否已初始化 */
        this.initialized = false;
        /** @type {Object.<string, ModuleConfig>} 模块配置映射表 */
        this.moduleMap = {};
        /** @type {boolean} 是否已加载模块配置 */
        this.moduleMapLoaded = false;
    }

    /**
     * 初始化路由器
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) return;

        this.contentEl = document.getElementById('content');
        if (!this.contentEl) {
            console.warn('[Router] ⚠️ 找不到 #content 元素，使用默认容器');
            this.contentEl = document.querySelector('.main-content') || document.body;
        }

        // 加载模块配置
        await this.loadModuleMap();

        // 监听hash变化
        window.addEventListener('hashchange', () => {
            this.handleRoute(window.location.hash);
        });

        // 监听路由激活事件 (兼容旧版)
        document.addEventListener('router:navigate', (e) => {
            if (e.detail && e.detail.path) {
                this.navigate(e.detail.path);
            }
        });

        this.initialized = true;
        console.log('[Router] ✅ 初始化完成，已加载模块数:', Object.keys(this.moduleMap).length);

        // 处理首次加载
        const hash = window.location.hash || '#/dashboard';
        await this.handleRoute(hash);
    }

    /**
     * 加载 module-map.json
     * @returns {Promise<void>}
     */
    async loadModuleMap() {
        if (this.moduleMapLoaded) return;

        try {
            const response = await fetch('/module-map.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            
            if (data && data.modules && Array.isArray(data.modules)) {
                data.modules.forEach(mod => {
                    if (mod.enabled !== false) {
                        this.moduleMap[mod.key] = mod;
                    }
                });
                console.log(`[Router] ✅ 从 module-map.json 加载了 ${Object.keys(this.moduleMap).length} 个模块`);
            }
            this.moduleMapLoaded = true;
        } catch (error) {
            console.warn('[Router] ⚠️ 加载 module-map.json 失败，使用硬编码备用配置:', error);
            // 备用硬编码配置
            this.useFallbackModuleMap();
            this.moduleMapLoaded = true;
        }
    }

    /**
     * 备用硬编码模块配置 (当 module-map.json 加载失败时使用)
     * @private
     */
    useFallbackModuleMap() {
        const fallbackModules = [
            { key: 'dashboard', folder: '01-dashboard', defaultPage: 'dashboard' },
            { key: 'pos', folder: '02-pos', defaultPage: 'quick-sale' },
            { key: 'orders', folder: '03-orders', defaultPage: 'list' },
            { key: 'products', folder: '04-products', defaultPage: 'products' },
            { key: 'crm', folder: '05-customers', defaultPage: 'customers' },
            { key: 'marketing', folder: '06-marketing', defaultPage: 'promotions' },
            { key: 'inventory', folder: '07-inventory', defaultPage: 'stock' },
            { key: 'purchasing', folder: '08-purchase', defaultPage: 'orders' },
            { key: 'finance', folder: '09-finance', defaultPage: 'income' },
            { key: 'hr', folder: '10-hr', defaultPage: 'employees' },
            { key: 'saas', folder: '11-saas', defaultPage: 'tenants' },
            { key: 'system', folder: '12-system', defaultPage: 'audit-logs' },
            { key: 'analytics', folder: '13-analytics', defaultPage: 'reports' },
            { key: 'settings', folder: '14-settings', defaultPage: 'company' }
        ];
        fallbackModules.forEach(mod => {
            this.moduleMap[mod.key] = mod;
        });
        console.log('[Router] 📦 使用备用硬编码模块配置');
    }

    /**
     * 处理路由
     * @param {string} hash - URL hash
     * @returns {Promise<void>}
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
            await this.loadModule(route.moduleKey, route.module, route.page);
            // 更新状态
            appStore.update({
                currentModule: route.module,
                currentPage: route.page,
                currentModuleKey: route.moduleKey
            });
            // 触发菜单激活事件 (与Sidebar保持一致)
            document.dispatchEvent(new CustomEvent('route:change', {
                detail: { 
                    path: path,
                    module: route.moduleKey,
                    page: route.page 
                }
            }));
        } catch (error) {
            console.error('[Router] ❌ 加载失败:', error);
            this.showError(`加载失败: ${error.message}`);
        }
    }

    /**
     * 解析路径
     * @param {string} path - 路径字符串
     * @returns {Object|null} 路由配置 { moduleKey, module, page }
     */
    parsePath(path) {
        const parts = path.split('/').filter(p => p && p.length > 0);
        let moduleKey = parts[0] || 'dashboard';
        let pageKey = parts[1] || '';

        const modConfig = this.moduleMap[moduleKey];
        if (!modConfig) {
            console.warn(`[Router] 未知模块: ${moduleKey}`);
            // 尝试模糊匹配
            for (const key in this.moduleMap) {
                if (key.includes(moduleKey) || moduleKey.includes(key)) {
                    console.log(`[Router] 模糊匹配到模块: ${key}`);
                    const fallbackMod = this.moduleMap[key];
                    return {
                        moduleKey: key,
                        module: fallbackMod.folder,
                        page: pageKey || fallbackMod.defaultPage || 'index'
                    };
                }
            }
            return null;
        }

        // 如果页面为空，使用默认页面
        if (!pageKey) {
            pageKey = modConfig.defaultPage || 'index';
        }

        return {
            moduleKey: moduleKey,
            module: modConfig.folder,
            page: pageKey
        };
    }

    /**
     * 加载模块
     * @param {string} moduleKey - 模块标识
     * @param {string} moduleFolder - 模块文件夹
     * @param {string} pageName - 页面名称
     * @returns {Promise<void>}
     */
    async loadModule(moduleKey, moduleFolder, pageName) {
        const basePath = `/modules/${moduleFolder}`;
        
        // 尝试多种可能的HTML路径
        const htmlPaths = [
            `${basePath}/${pageName}.html`,
            `${basePath}/${moduleFolder}.html`,
            `${basePath}/index.html`
        ];

        console.log(`[Router] 📄 加载模块: ${moduleKey} (${moduleFolder}) -> ${pageName}`);

        // 1. 加载HTML - 尝试多个路径
        let htmlContent = '';
        let loadedPath = '';
        for (const htmlPath of htmlPaths) {
            try {
                const response = await fetch(htmlPath);
                if (response.ok) {
                    htmlContent = await response.text();
                    loadedPath = htmlPath;
                    console.log(`[Router] ✅ HTML加载成功: ${htmlPath}`);
                    break;
                }
            } catch (e) {
                // 继续尝试下一个路径
            }
        }

        if (!htmlContent) {
            throw new Error(`页面 "${pageName}" 不存在于模块 "${moduleFolder}" (尝试了: ${htmlPaths.join(', ')})`);
        }

        // 渲染HTML
        if (this.contentEl) {
            this.contentEl.innerHTML = htmlContent;
        }

        // 2. 加载CSS (如果存在)
        const cssPaths = [
            `${basePath}/${pageName}.css`,
            `${basePath}/${moduleFolder}.css`,
            `${basePath}/style.css`
        ];
        for (const cssPath of cssPaths) {
            try {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                // 检查是否已存在
                const existing = document.querySelector(`link[href="${cssPath}"]`);
                if (!existing) {
                    document.head.appendChild(link);
                    console.log(`[Router] ✅ CSS加载: ${cssPath}`);
                }
                break; // 只加载第一个找到的CSS
            } catch (e) {
                // 忽略
            }
        }

        // 3. 加载JS - 尝试多个路径
        const jsPaths = [
            `${basePath}/${pageName}.js`,
            `${basePath}/${moduleFolder}.js`,
            `${basePath}/index.js`
        ];

        let jsLoaded = false;
        for (const jsPath of jsPaths) {
            try {
                console.log(`[Router] 🔄 尝试加载JS: ${jsPath}`);
                // 使用动态import
                const module = await import(/* @vite-ignore */ jsPath);
                if (module && typeof module.init === 'function') {
                    await module.init();
                    console.log(`[Router] ✅ JS初始化成功: ${jsPath}`);
                } else if (module && module.default && typeof module.default.init === 'function') {
                    await module.default.init();
                    console.log(`[Router] ✅ JS初始化成功 (default): ${jsPath}`);
                } else {
                    console.log(`[Router] ℹ️ 模块无需JS初始化: ${jsPath}`);
                }
                jsLoaded = true;
                break;
            } catch (jsError) {
                console.warn(`[Router] ⚠️ JS加载失败 (${jsPath}):`, jsError.message);
                // 继续尝试下一个JS路径
            }
        }

        if (!jsLoaded) {
            console.warn(`[Router] ⚠️ 所有JS路径均加载失败，模块可能无需JS或JS文件缺失`);
        }

        // 4. 更新页面标题
        const modConfig = this.moduleMap[moduleKey];
        const title = modConfig 
            ? `${modConfig.label} - ${pageName} - CarwashPro`
            : `${pageName} - CarwashPro`;
        document.title = title;

        // 5. 更新面包屑
        const breadcrumbSpan = document.getElementById('currentPageTitle');
        if (breadcrumbSpan) {
            breadcrumbSpan.textContent = modConfig ? modConfig.label : pageName;
        }

        // 6. 隐藏加载状态
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
        // 如果当前内容为空或只有加载提示，则显示加载动画
        const currentHtml = this.contentEl.innerHTML.trim();
        if (!currentHtml || currentHtml.includes('正在加载系统')) {
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
        }
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
                <button onclick="window.location.hash='/dashboard'" style="margin-top:16px;margin-left:8px;padding:8px 24px;background:#6B7280;color:white;border:none;border-radius:6px;cursor:pointer;">
                    返回仪表板
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

    /**
     * 获取模块配置
     * @param {string} moduleKey - 模块标识
     * @returns {ModuleConfig|null}
     */
    getModuleConfig(moduleKey) {
        return this.moduleMap[moduleKey] || null;
    }
}

// 导出单例
export const router = new Router();