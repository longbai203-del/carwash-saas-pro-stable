/**
 * app.js - Carwash Pro 应用入口 (重构版 V2)
 * @module app
 * @description 应用主入口，负责初始化所有核心模块
 * 
 * 职责：
 * 1. 初始化状态管理 (Store)
 * 2. 初始化路由 (Router)
 * 3. 初始化侧边栏 (Sidebar)
 * 4. 初始化API客户端
 * 5. 加载用户信息
 * 6. 监听全局事件
 */

import { appStore } from './core/store.js';
import { router } from './core/router.js';
import { apiClient } from './api/api-client.js';
import { SidebarComponent } from '../components/sidebar.js';

/**
 * 应用主类
 * @class App
 * @description 应用主类，负责初始化所有核心模块
 */
class App {
    constructor() {
        /** @type {boolean} 是否已初始化 */
        this.initialized = false;
        /** @type {HTMLElement} 侧边栏容器 */
        this.sidebarContainer = null;
        /** @type {HTMLElement} 内容容器 */
        this.contentContainer = null;
    }

    /**
     * 初始化应用
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) {
            console.log('[App] 已初始化，跳过');
            return;
        }

        console.log('🚀 Carwash Pro 应用启动...');

        try {
            // 1. 初始化Store
            appStore.init();
            console.log('[App] ✅ Store 初始化完成');

            // 2. 设置全局容器
            this.setupContainers();

            // 3. 初始化路由
            router.init();
            console.log('[App] ✅ Router 初始化完成');

            // 4. 渲染侧边栏
            this.initSidebar();
            console.log('[App] ✅ Sidebar 初始化完成');

            // 5. 加载用户信息
            await this.loadUser();
            console.log('[App] ✅ 用户信息加载完成');

            // 6. 设置全局错误处理
            this.setupErrorHandler();

            // 7. 监听窗口大小变化
            this.setupResponsive();

            // 8. 加载默认页面
            const hash = window.location.hash || '#/dashboard';
            router.navigate(hash.replace('#', '') || '/dashboard');

            this.initialized = true;
            console.log('✅ Carwash Pro 应用启动完成');

        } catch (error) {
            console.error('[App] ❌ 初始化失败:', error);
            this.showFatalError(error.message);
        }
    }

    /**
     * 设置容器元素
     * @returns {void}
     */
    setupContainers() {
        this.sidebarContainer = document.getElementById('sidebar');
        this.contentContainer = document.getElementById('content');

        if (!this.sidebarContainer) {
            console.warn('[App] ⚠️ 找不到 #sidebar 元素，创建默认容器');
            this.sidebarContainer = document.createElement('div');
            this.sidebarContainer.id = 'sidebar';
            document.body.prepend(this.sidebarContainer);
        }

        if (!this.contentContainer) {
            console.warn('[App] ⚠️ 找不到 #content 元素，创建默认容器');
            this.contentContainer = document.createElement('div');
            this.contentContainer.id = 'content';
            const mainWrap = document.querySelector('.main-wrap');
            if (mainWrap) {
                mainWrap.appendChild(this.contentContainer);
            } else {
                document.body.appendChild(this.contentContainer);
            }
        }
    }

    /**
     * 初始化侧边栏
     * @returns {void}
     */
    initSidebar() {
        if (this.sidebarContainer) {
            SidebarComponent.init(this.sidebarContainer);
        }
    }

    /**
     * 加载用户信息
     * @returns {Promise<Object>}
     */
    async loadUser() {
        try {
            // 从Store获取用户
            let user = appStore.get('user');

            // 如果没有用户，尝试从API获取
            if (!user) {
                try {
                    const response = await apiClient.getCurrentUser();
                    if (response && response.code === 200) {
                        user = response.data;
                        appStore.set('user', user);
                    }
                } catch (apiError) {
                    console.warn('[App] API获取用户失败:', apiError);
                }
            }

            // 如果还是没有用户，使用默认用户（开发阶段）
            if (!user) {
                user = {
                    id: 'U001',
                    name: '管理员',
                    role: 'admin',
                    email: 'admin@carwash.com',
                    status: 'active'
                };
                appStore.set('user', user);
                console.log('[App] ℹ️ 使用默认用户 (开发模式)');
            }

            // 更新UI中的用户名
            const userSpan = document.getElementById('currentUserSpan');
            if (userSpan) {
                userSpan.textContent = user.name || '未登录';
            }

            return user;

        } catch (error) {
            console.warn('[App] ⚠️ 加载用户失败:', error);
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
        // 全局未捕获错误
        window.addEventListener('error', (e) => {
            console.error('[App] 全局错误:', e.error || e.message);
            this.showErrorToast('发生未知错误，请查看控制台');
        });

        // 全局Promise错误
        window.addEventListener('unhandledrejection', (e) => {
            console.error('[App] 未处理的Promise错误:', e.reason);
            this.showErrorToast('操作失败，请重试');
        });
    }

    /**
     * 设置响应式
     * @returns {void}
     */
    setupResponsive() {
        // 移动端侧边栏切换
        const toggleBtn = document.getElementById('menuToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const sidebar = this.sidebarContainer;
                if (sidebar) {
                    sidebar.classList.toggle('open');
                }
            });
        }

        // 窗口大小变化时处理
        window.addEventListener('resize', () => {
            const isMobile = window.innerWidth <= 768;
            if (!isMobile && this.sidebarContainer) {
                this.sidebarContainer.classList.remove('open');
            }
        });
    }

    /**
     * 显示错误提示
     * @param {string} message - 错误信息
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
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * 显示致命错误
     * @param {string} message - 错误信息
     * @returns {void}
     */
    showFatalError(message) {
        const container = document.getElementById('app') || document.body;
        container.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;padding:20px;">
                <div style="text-align:center;max-width:400px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:48px;color:#EF4444;margin-bottom:16px;"></i>
                    <h2 style="color:#374151;">应用启动失败</h2>
                    <p style="color:#6B7280;">${message}</p>
                    <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                        重新加载
                    </button>
                </div>
            </div>
        `;
    }
}

// ============================================================
// 启动应用
// ============================================================

/**
 * 页面加载完成后启动应用
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    // 暴露到全局便于调试
    window.__APP__ = app;
});

console.log('📦 app.js 已加载 (重构版 V2)');

// ============================================================
// 导出
// ============================================================

export default App;