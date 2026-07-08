/**
 * app.js - Carwash Pro 统一应用入口 (V2 规范)
 */

import { appStore } from './core/store.js';
import { router } from './core/router.js';
import { apiClient } from './api/api-client.js';
import { SidebarComponent } from '../components/sidebar.js';

class App {
    constructor() {
        this.initialized = false;
        this.sidebarContainer = null;
        this.contentContainer = null;
        this.version = '2.0.0';
    }

    async init() {
        if (this.initialized) {
            console.log('[App] 已初始化');
            return;
        }

        console.log('🚀 Carwash Pro V2 启动...');

        try {
            appStore.init();
            this.setupContainers();
            router.init();
            this.initSidebar();
            await this.loadUser();
            this.setupErrorHandler();
            this.setupResponsive();
            this.initialized = true;
            console.log('✅ Carwash Pro 应用启动完成');
        } catch (error) {
            console.error('[App] ❌ 初始化失败:', error);
            this.showFatalError(error.message);
        }
    }

    setupContainers() {
        this.sidebarContainer = document.getElementById('sidebar');
        this.contentContainer = document.getElementById('content');

        if (!this.sidebarContainer) {
            this.sidebarContainer = document.createElement('div');
            this.sidebarContainer.id = 'sidebar';
            const app = document.getElementById('app');
            if (app) app.prepend(this.sidebarContainer);
            else document.body.prepend(this.sidebarContainer);
        }

        if (!this.contentContainer) {
            this.contentContainer = document.createElement('main');
            this.contentContainer.id = 'content';
            const mainWrap = document.querySelector('.main-wrap');
            if (mainWrap) mainWrap.appendChild(this.contentContainer);
            else document.body.appendChild(this.contentContainer);
        }
    }

    initSidebar() {
        if (this.sidebarContainer) {
            SidebarComponent.init(this.sidebarContainer);
        }
    }

    async loadUser() {
        try {
            let user = appStore.get('user');
            if (!user) {
                user = {
                    id: 'U001',
                    name: '管理员',
                    role: 'admin',
                    email: 'admin@carwash.com',
                    status: 'active'
                };
                appStore.set('user', user);
            }
            const userSpan = document.getElementById('currentUserSpan');
            if (userSpan) userSpan.textContent = user.name || '未登录';
            return user;
        } catch (error) {
            console.warn('[App] 加载用户失败:', error);
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

    setupErrorHandler() {
        window.addEventListener('error', (e) => {
            console.error('[App] 全局错误:', e.error || e.message);
            this.showErrorToast('发生未知错误');
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('[App] Promise错误:', e.reason);
            this.showErrorToast('操作失败，请重试');
        });
    }

    setupResponsive() {
        const toggleBtn = document.getElementById('menuToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const sidebar = this.sidebarContainer;
                if (sidebar) sidebar.classList.toggle('open');
            });
        }
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.sidebarContainer) {
                this.sidebarContainer.classList.remove('open');
            }
        });
    }

    showErrorToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#EF4444;color:white;border-radius:8px;font-size:14px;z-index:99999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showFatalError(message) {
        const container = document.getElementById('app') || document.body;
        container.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;padding:20px;"><div style="text-align:center;max-width:400px;"><i class="fas fa-exclamation-triangle" style="font-size:48px;color:#EF4444;margin-bottom:16px;"></i><h2 style="color:#374151;">应用启动失败</h2><p style="color:#6B7280;">' + message + '</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">重新加载</button></div></div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    window.__APP__ = app;
});

console.log('📦 Carwash Pro V2 已加载');

export { App };
export default App;
