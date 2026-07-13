/**
 * @file customer-display.js
 * @module customer-display
 * @description 客户显示屏 - 面向客户的实时信息展示
 * 
 * @example
 * import { init } from './customer-display.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} DisplayItem
 * @property {string} name - 商品名称
 * @property {number} price - 单价
 * @property {number} qty - 数量
 */

/**
 * @typedef {Object} DisplayState
 * @property {boolean} isOn - 是否开启
 * @property {string} mode - 显示模式 (full/compact/minimal)
 * @property {DisplayItem[]} items - 当前显示的商品列表
 * @property {number} total - 总计
 * @property {number} brightness - 亮度 (0-100)
 * @property {string} fontSize - 字体大小 (small/medium/large)
 * @property {string[]} messages - 消息列表
 */

/** @type {DisplayState} 状态 */
const state = {
    isOn: true,
    mode: 'full',
    items: [],
    total: 0,
    brightness: 80,
    fontSize: 'medium',
    messages: []
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @param {string} text - 消息文本
 * @param {string} type - 消息类型 (success/info/warning/error)
 * @description 添加消息到消息列表
 */
function addMessage(text, type = 'info') {
    const container = document.getElementById('displayMessages');
    if (!container) return;
    
    const icons = { 
        success: 'fa-check-circle', 
        info: 'fa-info-circle', 
        warning: 'fa-exclamation-triangle', 
        error: 'fa-times-circle' 
    };
    
    const msg = document.createElement('div');
    msg.className = 'message-item ' + type;
    msg.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i> ${text}`;
    container.prepend(msg);
    
    // 限制消息数量
    while (container.children.length > 20) {
        container.removeChild(container.lastChild);
    }
    
    // 添加到状态
    state.messages.unshift({ text, type, time: new Date().toISOString() });
}

/**
 * @private
 * @description 更新预览
 */
function updatePreview() {
    const container = document.getElementById('previewItems');
    const totalEl = document.getElementById('previewTotal');
    const timeEl = document.getElementById('displayTime');
    
    // 更新时间
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    if (!container || !totalEl) return;
    
    if (state.items.length === 0) {
        container.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-receipt"></i>
                <p>等待商品扫描...</p>
            </div>
        `;
        totalEl.textContent = '¥0.00';
        return;
    }
    
    let html = '';
    state.items.forEach(item => {
        html += `
            <div class="preview-item">
                <span>${item.name} × ${item.qty}</span>
                <span>¥${formatCurrency(item.price * item.qty)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
    totalEl.textContent = '¥' + formatCurrency(state.total);
}

/**
 * @private
 * @description 切换显示
 */
function toggleDisplay() {
    state.isOn = !state.isOn;
    const preview = document.getElementById('displayPreview');
    if (preview) {
        preview.style.opacity = state.isOn ? '1' : '0.3';
    }
    addMessage(state.isOn ? '显示屏已开启' : '显示屏已关闭', 'info');
}

/**
 * @private
 * @description 测试显示
 */
function testDisplay() {
    addMessage('测试模式 - 显示所有功能', 'info');
    // 添加测试数据
    state.items = [
        { name: '标准洗车', price: 68, qty: 1 },
        { name: '抛光打蜡', price: 388, qty: 1 },
        { name: '内饰清洗', price: 328, qty: 1 }
    ];
    state.total = 784;
    updatePreview();
    
    setTimeout(() => {
        state.items = [];
        state.total = 0;
        updatePreview();
        addMessage('测试完成', 'success');
    }, 5000);
}

/**
 * @private
 * @param {string} mode - 显示模式
 * @description 设置显示模式
 */
function setMode(mode) {
    state.mode = mode;
    const preview = document.getElementById('displayPreview');
    if (preview) {
        preview.className = 'display-preview ' + mode;
    }
    addMessage('显示模式: ' + mode, 'info');
}

/**
 * @private
 * @param {string} value - 亮度值
 * @description 设置亮度
 */
function setBrightness(value) {
    state.brightness = parseInt(value);
    const preview = document.getElementById('displayPreview');
    if (preview) {
        preview.style.opacity = (state.brightness / 100).toString();
    }
}

/**
 * @private
 * @param {string} size - 字体大小
 * @description 设置字体大小
 */
function setFontSize(size) {
    state.fontSize = size;
    const preview = document.getElementById('displayPreview');
    if (preview) {
        const sizeMap = { small: '14px', medium: '16px', large: '20px' };
        preview.style.fontSize = sizeMap[size] || '16px';
    }
    addMessage('字体大小: ' + size, 'info');
}

/**
 * @private
 * @param {string} name - 商品名称
 * @param {number} price - 商品价格
 * @description 添加商品到显示
 */
function addItem(name, price) {
    const existing = state.items.find(item => item.name === name);
    if (existing) {
        existing.qty += 1;
    } else {
        state.items.push({ name, price, qty: 1 });
    }
    state.total += price;
    updatePreview();
    addMessage('已添加: ' + name + ' ¥' + formatCurrency(price), 'success');
}

/**
 * @private
 * @description 清空商品列表
 */
function clearItems() {
    state.items = [];
    state.total = 0;
    updatePreview();
    addMessage('已清空商品列表', 'warning');
}

/**
 * @private
 * @description 清空消息
 */
function clearMessages() {
    const container = document.getElementById('displayMessages');
    if (container) {
        container.innerHTML = '';
    }
    state.messages = [];
}

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化客户显示屏
 */
export async function init() {
    console.log('🖥️ 客户显示屏 初始化...');
    
    // 从存储恢复状态
    const savedState = store.get('customerDisplay');
    if (savedState) {
        state.isOn = savedState.isOn !== undefined ? savedState.isOn : true;
        state.mode = savedState.mode || 'full';
        state.brightness = savedState.brightness || 80;
        state.fontSize = savedState.fontSize || 'medium';
    }
    
    // 应用状态
    const preview = document.getElementById('displayPreview');
    if (preview) {
        preview.className = 'display-preview ' + state.mode;
        preview.style.opacity = state.isOn ? '1' : '0.3';
        const sizeMap = { small: '14px', medium: '16px', large: '20px' };
        preview.style.fontSize = sizeMap[state.fontSize] || '16px';
    }
    
    const brightnessInput = document.getElementById('displayBrightness');
    if (brightnessInput) {
        brightnessInput.value = state.brightness;
    }
    
    addMessage('系统已启动，等待连接', 'info');
    
    // 暴露全局方法
    window.CustomerDisplayModule = {
        state,
        toggleDisplay,
        testDisplay,
        setMode,
        setBrightness,
        setFontSize,
        addItem,
        clearItems,
        clearMessages,
        addMessage,
        updatePreview
    };
    
    // 定时更新时间
    setInterval(() => {
        const timeEl = document.getElementById('displayTime');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
    }, 10000);
    
    console.log('✅ 客户显示屏 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    toggleDisplay,
    testDisplay,
    setMode,
    setBrightness,
    setFontSize,
    addItem,
    clearItems
};