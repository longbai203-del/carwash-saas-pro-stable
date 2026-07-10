/**
 * @file init.js
 * @module init
 * @description 应用初始化 - 启动和配置
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from './store.js';
import { router } from './router.js';
import { apiClient } from './api-client.js';

/**
 * @typedef {Object} AppConfig
 * @property {string} name - 应用名称
 * @property {string} version - 版本号
 * @property {string} apiBaseURL - API基础URL
 * @property {Object} routes - 路由配置
 * @property {Object} [i18n] - 国际化配置
 * @property {Object} [features] - 功能开关
 */

/** @type {AppConfig} 应用配置 */
let appConfig = {};

/** @type {boolean} 是否已初始化 */
let isInitialized = false;

/**
 * @public
 * @description Toast提示
 * @param {string} message - 消息内容
 * @param {string} [type] - 类型 (info/success/warning/error)
 * @param {number} [duration] - 显示时长（毫秒）
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        display:flex;
        align-items:center;
        gap:8px;
        padding:12px 20px;
        margin-bottom:8px;
        border-radius:8px;
        color:white;
        font-size:14px;
        font-weight:500;
        box-shadow:0 4px 12px rgba(0,0,0,0.15);
        animation:slideIn 0.3s ease;
        max-width:400px;
    `;
    
    const colors = {
        info: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
    };
    
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    toast.style.background = colors[type] || colors.info;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" style="font-size:18px;"></i>
        <span>${message}</span>
        <i class="fas fa-times" style="margin-left:auto;cursor:pointer;opacity:0.7;" 
           onclick="this.parentElement.remove()"></i>
    `;
    
    toastContainer.appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    store.dispatch('SHOW_TOAST', { message, type, duration });
}

/**
 * @private
 * @description 创建Toast容器
 * @returns {HTMLElement} 容器元素
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
        position:fixed;
        top:20px;
        right:20px;
        z-index:9999;
        display:flex;
        flex-direction:column;
        align-items:flex-end;
    `;
    document.body.appendChild(container);
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    return container;
}

/**
 * @public
 * @description 显示加载状态
 * @param {boolean} show - 是否显示
 * @param {string} [message] - 加载消息
 */
export function showLoading(show, message = '加载中...') {
    const overlay = document.getElementById('loadingOverlay') || createLoadingOverlay();
    if (show) {
        overlay.style.display = 'flex';
        const msgEl = overlay.querySelector('.loading-message');
        if (msgEl) msgEl.textContent = message;
        store.dispatch('SET_LOADING', true);
    } else {
        overlay.style.display = 'none';
        store.dispatch('SET_LOADING', false);
    }
}

/**
 * @private
 * @description 创建加载遮罩
 * @returns {HTMLElement} 遮罩元素
 */
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        right:0;
        bottom:0;
        background:rgba(0,0,0,0.5);
        display:none;
        justify-content:center;
        align-items:center;
        z-index:9998;
        flex-direction:column;
        gap:16px;
    `;
    overlay.innerHTML = `
        <div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <span class="loading-message" style="color:white;font-size:16px;font-weight:500;">加载中...</span>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

/**
 * @public
 * @description 显示确认对话框
 * @param {string} title - 标题
 * @param {string} message - 消息
 * @param {string} [confirmText] - 确认按钮文字
 * @param {string} [cancelText] - 取消按钮文字
 * @returns {Promise<boolean>} 用户确认结果
 */
export function showConfirm(title, message, confirmText = '确认', cancelText = '取消') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position:fixed;
            top:0;
            left:0;
            right:0;
            bottom:0;
            background:rgba(0,0,0,0.5);
            display:flex;
            justify-content:center;
            align-items:center;
            z-index:9999;
        `;
        
        modal.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <h3 style="font-size:18px;font-weight:600;color:#1F2937;margin:0 0 8px;">${title}</h3>
                <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">${message}</p>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-outline" style="padding:8px 20px;cursor:pointer;">${cancelText}</button>
                    <button class="btn btn-primary" style="padding:8px 20px;cursor:pointer;">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const confirmBtn = modal.querySelector('.btn-primary');
        const cancelBtn = modal.querySelector('.btn-outline');
        
        const close = (result) => {
            modal.remove();
            resolve(result);
        };
        
        confirmBtn.addEventListener('click', () => close(true));
        cancelBtn.addEventListener('click', () => close(false));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close(false);
        });
    });
}

/**
 * @public
 * @description 初始化应用
 * @param {AppConfig} config - 应用配置
 * @returns {Promise<void>}
 */
export async function initApp(config) {
    if (isInitialized) {
        console.warn('应用已初始化');
        return;
    }
    
    appConfig = config;
    
    console.log(`🚀 ${config.name || 'App'} v${config.version || '1.0.0'} 启动中...`);
    
    // 设置API基础URL
    if (config.apiBaseURL) {
        apiClient.setBaseURL(config.apiBaseURL);
    }
    
    // 注册路由
    if (config.routes) {
        router.registerAll(config.routes);
    }
    
    // 初始化路由
    const container = document.getElementById('app');
    router.init(container);
    
    // 加载用户状态
    try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            store.dispatch('SET_USER', user);
        }
    } catch (e) {
        console.warn('加载用户状态失败:', e);
    }
    
    isInitialized = true;
    console.log(`✅ ${config.name || 'App'} 初始化完成`);
}

/**
 * @public
 * @description 检查是否已初始化
 * @returns {boolean} 是否已初始化
 */
export function isAppInitialized() {
    return isInitialized;
}

/**
 * @public
 * @description 获取应用配置
 * @returns {AppConfig} 应用配置
 */
export function getAppConfig() {
    return appConfig;
}

/**
 * @public
 * @description 初始化模块（单个模块）
 * @param {string} moduleName - 模块名称
 * @param {Function} initFn - 初始化函数
 * @param {Object} [options] - 初始化选项
 * @returns {Promise<void>}
 */
export async function initModule(moduleName, initFn, options = {}) {
    try {
        console.log(`📦 初始化模块: ${moduleName}`);
        await initFn(options);
        console.log(`✅ 模块 ${moduleName} 初始化完成`);
    } catch (error) {
        console.error(`❌ 模块 ${moduleName} 初始化失败:`, error);
        showToast(`模块 ${moduleName} 加载失败`, 'error');
        throw error;
    }
}

export default {
    showToast,
    showLoading,
    showConfirm,
    initApp,
    isAppInitialized,
    getAppConfig,
    initModule
};