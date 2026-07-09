/**
 * feedback.js - 全局反馈和错误处理模块
 * @module feedback
 * @description 提供统一的错误提示、加载状态和用户反馈功能
 * 
 * @example
 * import { showError, showSuccess, showLoading } from './feedback.js';
 * showSuccess('操作成功');
 * showError('操作失败，请重试');
 */

/**
 * 显示成功提示
 * @param {string} message - 提示消息
 * @param {number} [duration=3000] - 显示时间(毫秒)
 * @returns {void}
 */
export function showSuccess(message, duration = 3000) {
    showToast(message, 'success', duration);
}

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 * @param {number} [duration=5000] - 显示时间(毫秒)
 * @returns {void}
 */
export function showError(message, duration = 5000) {
    showToast(message, 'error', duration);
}

/**
 * 显示警告提示
 * @param {string} message - 警告消息
 * @param {number} [duration=4000] - 显示时间(毫秒)
 * @returns {void}
 */
export function showWarning(message, duration = 4000) {
    showToast(message, 'warning', duration);
}

/**
 * 显示信息提示
 * @param {string} message - 信息消息
 * @param {number} [duration=3000] - 显示时间(毫秒)
 * @returns {void}
 */
export function showInfo(message, duration = 3000) {
    showToast(message, 'info', duration);
}

/**
 * 显示 Toast 提示
 * @param {string} message - 提示消息
 * @param {string} type - 类型 (success, error, warning, info)
 * @param {number} duration - 显示时间(毫秒)
 * @returns {void}
 */
function showToast(message, type = 'info', duration = 3000) {
    // 颜色配置
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };

    // 图标配置
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    // 移除已存在的 Toast
    const existing = document.querySelector('.global-toast');
    if (existing) {
        existing.remove();
    }

    // 创建 Toast 元素
    const toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 14px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        z-index: 99999;
        max-width: 420px;
        min-width: 200px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        font-family: 'Inter', sans-serif;
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    // 添加图标
    const icon = document.createElement('i');
    icon.className = `fas ${icons[type] || 'fa-info-circle'}`;
    icon.style.fontSize = '18px';
    toast.appendChild(icon);

    // 添加消息文本
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.7);
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
        margin-left: auto;
        transition: color 0.2s;
    `;
    closeBtn.onmouseover = () => { closeBtn.style.color = 'white'; };
    closeBtn.onmouseout = () => { closeBtn.style.color = 'rgba(255,255,255,0.7)'; };
    closeBtn.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 300);
    };
    toast.appendChild(closeBtn);

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(40px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 自动消失
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
    }, duration);
}

/**
 * 显示加载状态
 * @param {string} [message='加载中...'] - 加载提示消息
 * @returns {HTMLElement} 加载容器元素
 */
export function showLoading(message = '加载中...') {
    const existing = document.querySelector('.global-loading-overlay');
    if (existing) return existing;

    const overlay = document.createElement('div');
    overlay.className = 'global-loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99998;
        animation: fadeIn 0.2s ease;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background: white;
        padding: 32px 48px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 16px 48px rgba(0,0,0,0.2);
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 48px;
        height: 48px;
        border: 4px solid #E5E7EB;
        border-top-color: #4F46E5;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
    `;

    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        font-family: 'Inter', sans-serif;
        margin: 0;
    `;

    // 添加动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    box.appendChild(spinner);
    box.appendChild(text);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    return overlay;
}

/**
 * 隐藏加载状态
 * @returns {void}
 */
export function hideLoading() {
    const overlay = document.querySelector('.global-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 300);
    }
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {string} [confirmText='确认'] - 确认按钮文字
 * @param {string} [cancelText='取消'] - 取消按钮文字
 * @returns {Promise<boolean>} 用户是否确认
 */
export function showConfirm(message, confirmText = '确认', cancelText = '取消') {
    return new Promise((resolve) => {
        const existing = document.querySelector('.global-confirm-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'global-confirm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99997;
            animation: fadeIn 0.2s ease;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: white;
            padding: 32px 40px;
            border-radius: 16px;
            max-width: 420px;
            width: 90%;
            box-shadow: 0 16px 48px rgba(0,0,0,0.2);
            font-family: 'Inter', sans-serif;
        `;

        const icon = document.createElement('div');
        icon.style.cssText = `
            text-align: center;
            font-size: 48px;
            color: #F59E0B;
            margin-bottom: 16px;
        `;
        icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        box.appendChild(icon);

        const msg = document.createElement('p');
        msg.textContent = message;
        msg.style.cssText = `
            text-align: center;
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
        `;
        box.appendChild(msg);

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = `
            padding: 10px 24px;
            background: #F3F4F6;
            color: #374151;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            font-family: 'Inter', sans-serif;
        `;
        cancelBtn.onmouseover = () => { cancelBtn.style.background = '#E5E7EB'; };
        cancelBtn.onmouseout = () => { cancelBtn.style.background = '#F3F4F6'; };
        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(false);
        };

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmText;
        confirmBtn.style.cssText = `
            padding: 10px 24px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            font-family: 'Inter', sans-serif;
        `;
        confirmBtn.onmouseover = () => { confirmBtn.style.background = '#4338CA'; };
        confirmBtn.onmouseout = () => { confirmBtn.style.background = '#4F46E5'; };
        confirmBtn.onclick = () => {
            overlay.remove();
            resolve(true);
        };

        btnGroup.appendChild(cancelBtn);
        btnGroup.appendChild(confirmBtn);
        box.appendChild(btnGroup);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // 点击遮罩层取消
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        };
    });
}

// 如果页面加载时检测到错误，自动显示
document.addEventListener('DOMContentLoaded', () => {
    // 捕获未处理的错误
    window.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
            console.warn('[Feedback] 资源加载失败:', e.target.src || e.target.href);
        }
    });

    // 捕获 fetch 错误
    window.addEventListener('unhandledrejection', (e) => {
        if (e.reason && e.reason.message && e.reason.message.includes('404')) {
            console.warn('[Feedback] API 请求失败 (404):', e.reason.message);
        }
    });
});

// 全局导出
window.Feedback = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    hideLoading,
    showConfirm
};

console.log('✅ Feedback 模块已加载');