/**
 * app.js - Carwash Pro 统一应用入口 (V2 规范)
 * @module app
 * @description 应用程序主入口，负责初始化所有核心模块
 * 
 * @example
 * // 在 DOM 加载完成后自动初始化
 * // 或手动调用
 * const app = new App();
 * await app.init();
 */

import { appStore } from './core/store.js';
import { router } from './core/router.js';
import { apiClient } from '../../backend/api/api-client.js';
import { SidebarComponent } from '../components/sidebar.js';

/**
 * 应用程序主类
 * @class App
 * @description 负责协调 Store、Router、Sidebar 等核心组件的初始化
 */
class App {
    constructor() {
        /** @type {boolean} 是否已初始化 */
        this.initialized = false;
        /** @type {HTMLElement|null} 侧边栏容器 */
        this.sidebarContainer = null;
        /** @type {HTMLElement|null} 内容容器 */
        this.contentContainer = null;
        /** @type {string} 应用版本号 */
        this.version = '2.0.0';
    }

    /**
     * 初始化应用
     * @async
     * @returns {Promise<void>}
     * @throws {Error} 初始化失败时抛出错误
     */
    async init() {
        if (this.initialized) {
            console.log('[App] 已初始化，跳过重复初始化');
            return;
        }

        console.log('🚀 Carwash Pro V2 启动...');

        try {
            // 1. 初始化 Store (同步)
            appStore.init();
            console.log('[App] ✅ Store 初始化完成');

            // 2. 设置 DOM 容器 (同步)
            this.setupContainers();
            console.log('[App] ✅ 容器设置完成');

            // 3. 初始化 Router (异步 - 关键修复：添加 await)
            await router.init();
            console.log('[App] ✅ Router 初始化完成，当前路径:', router.getCurrentPath());

            // 4. 初始化 Sidebar (同步，但依赖 Router 完成)
            this.initSidebar();
            console.log('[App] ✅ Sidebar 初始化完成');

            // 5. 加载用户信息 (异步)
            await this.loadUser();
            console.log('[App] ✅ 用户信息加载完成');

            // 6. 设置全局错误处理 (同步)
            this.setupErrorHandler();
            this.setupResponsive();

            this.initialized = true;
            console.log('✅ Carwash Pro 应用启动完成 (v' + this.version + ')');
        } catch (error) {
            console.error('[App] ❌ 初始化失败:', error);
            this.showFatalError(error.message);
        }
    }

    /**
     * 设置 DOM 容器
     * @description 确保 #sidebar 和 #content 元素存在
     * @returns {void}
     */
    setupContainers() {
        this.sidebarContainer = document.getElementById('sidebar');
        this.contentContainer = document.getElementById('content');

        if (!this.sidebarContainer) {
            this.sidebarContainer = document.createElement('div');
            this.sidebarContainer.id = 'sidebar';
            const app = document.getElementById('app');
            if (app) {
                app.prepend(this.sidebarContainer);
            } else {
                document.body.prepend(this.sidebarContainer);
            }
            console.log('[App] ✅ 自动创建 sidebar 容器');
        }

        if (!this.contentContainer) {
            this.contentContainer = document.createElement('main');
            this.contentContainer.id = 'content';
            const mainWrap = document.querySelector('.main-wrap');
            if (mainWrap) {
                mainWrap.appendChild(this.contentContainer);
            } else {
                document.body.appendChild(this.contentContainer);
            }
            console.log('[App] ✅ 自动创建 content 容器');
        }
    }

    /**
     * 初始化侧边栏
     * @returns {void}
     */
    initSidebar() {
        if (this.sidebarContainer) {
            try {
                SidebarComponent.init(this.sidebarContainer);
                console.log('[App] ✅ SidebarComponent 初始化成功');
            } catch (error) {
                console.warn('[App] ⚠️ SidebarComponent 初始化失败 (不影响核心功能):', error.message);
            }
        }
    }

    /**
     * 加载当前用户信息
     * @async
     * @returns {Promise<Object>} 用户对象
     */
    async loadUser() {
        try {
            let user = appStore.get('user');
            
            if (!user) {
                // 尝试从 API 获取
                try {
                    console.log('[App] 🔄 尝试从 API 获取用户信息...');
                    const response = await apiClient.getCurrentUser();
                    if (response && response.data) {
                        user = response.data;
                        appStore.set('user', user);
                        console.log('[App] ✅ 从 API 加载用户:', user.name || user.username);
                    }
                } catch (apiError) {
                    console.warn('[App] ⚠️ API 获取用户失败，使用默认用户:', apiError.message);
                }
                
                // 如果没有用户，使用默认用户
                if (!user) {
                    user = {
                        id: 'U001',
                        name: '管理员',
                        role: 'admin',
                        email: 'admin@carwash.com',
                        status: 'active',
                        avatar: null
                    };
                    appStore.set('user', user);
                    console.log('[App] ✅ 使用默认用户:', user.name);
                }
            }

            // 更新 UI
            const userSpan = document.getElementById('currentUserSpan');
            if (userSpan) {
                userSpan.textContent = user.name || user.username || '未登录';
            }
            
            return user;
        } catch (error) {
            console.warn('[App] ❌ 加载用户失败:', error);
            // 使用默认用户
            const defaultUser = {
                id: 'U001',
                name: '管理员',
                role: 'admin',
                email: 'admin@carwash.com',
                status: 'active'
            };
            appStore.set('user', defaultUser);
            return defaultUser;
        }
    }

    /**
     * 设置全局错误处理
     * @returns {void}
     */
    setupErrorHandler() {
        // 捕获全局 JavaScript 错误
        window.addEventListener('error', (e) => {
            console.error('[App] 全局错误:', e.error || e.message);
            if (e.error?.stack) {
                console.error('[App] 错误堆栈:', e.error.stack);
            }
            this.showErrorToast('发生未知错误，请查看控制台');
        });

        // 捕获未处理的 Promise 拒绝
        window.addEventListener('unhandledrejection', (e) => {
            console.error('[App] 未处理的 Promise 错误:', e.reason);
            if (e.reason?.stack) {
                console.error('[App] 错误堆栈:', e.reason.stack);
            }
            this.showErrorToast('操作失败，请重试');
        });
    }

    /**
     * 设置响应式支持
     * @returns {void}
     */
    setupResponsive() {
        // 移动端菜单切换
        const toggleBtn = document.getElementById('menuToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sidebar = this.sidebarContainer;
                if (sidebar) {
                    sidebar.classList.toggle('open');
                }
            });
        }

        // 点击内容区域关闭侧边栏（移动端）
        const contentEl = this.contentContainer || document.getElementById('content');
        if (contentEl) {
            contentEl.addEventListener('click', () => {
                if (window.innerWidth <= 768 && this.sidebarContainer) {
                    this.sidebarContainer.classList.remove('open');
                }
            });
        }

        // 窗口大小变化时关闭侧边栏
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.sidebarContainer) {
                this.sidebarContainer.classList.remove('open');
            }
        });
    }

    /**
     * 显示错误提示
     * @param {string} message - 错误消息
     * @returns {void}
     */
    showErrorToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #EF4444;
            color: white;
            border-radius: 8px;
            font-size: 14px;
            z-index: 99999;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: opacity 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, 3000);
    }

    /**
     * 显示致命错误页面
     * @param {string} message - 错误消息
     * @returns {void}
     */
    showFatalError(message) {
        const container = document.getElementById('app') || document.body;
        container.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;padding:20px;background:#f1f5f9;">
                <div style="text-align:center;max-width:400px;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                    <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#EF4444;margin-bottom:16px;"></i>
                    <h2 style="color:#374151;margin-bottom:8px;">应用启动失败</h2>
                    <p style="color:#6B7280;word-break:break-all;font-size:14px;">${message}</p>
                    <div style="margin-top:20px;display:flex;gap:8px;justify-content:center;">
                        <button onclick="location.reload()" style="padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                            <i class="fas fa-redo"></i> 重新加载
                        </button>
                        <button onclick="window.location.hash='/dashboard'" style="padding:8px 24px;background:#6B7280;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                            <i class="fas fa-home"></i> 返回首页
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态信息
     */
    getStatus() {
        return {
            initialized: this.initialized,
            version: this.version,
            currentPath: router.getCurrentPath(),
            user: appStore.get('user'),
            moduleCount: Object.keys(router.moduleMap || {}).length
        };
    }
}

// ============================================================
// 自动启动
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    // 暴露到全局，方便调试
    window.__APP__ = app;
    console.log('📦 Carwash Pro V2 已加载 (调试: window.__APP__)');
});

export { App };
export default App;