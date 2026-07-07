// 02-pos/touch-pos.js
console.log('📄 02-pos/touch-pos page loaded');

export function init() {
    console.log('02-pos/touch-pos initialized');
    
    // 初始化触屏POS
    const touchData = localStorage.getItem('touch_pos_data');
    if (touchData) {
        try {
            const data = JSON.parse(touchData);
            console.log('已加载触屏POS数据:', data);
        } catch (e) {
            console.warn('加载触屏POS数据失败');
        }
    }
    
    // 恢复购物车
    const cart = getCart();
    if (cart.length > 0 && typeof window.TouchPOSModule !== 'undefined') {
        window.TouchPOSModule.cart = cart;
        window.TouchPOSModule.updateCart();
    }
    
    // 检测触摸设备
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        console.log('触摸设备检测到，优化触屏体验');
        document.body.classList.add('touch-device');
        // 增加按钮大小反馈
        const style = document.createElement('style');
        style.textContent = `
            .touch-device .touch-product { min-height: 80px; }
            .touch-device .btn { min-height: 44px; }
        `;
        document.head.appendChild(style);
    }
}

export function saveCart(cart) {
    try {
        localStorage.setItem('touch_pos_cart', JSON.stringify(cart));
        return true;
    } catch (e) {
        return false;
    }
}

export function getCart() {
    try {
        const data = localStorage.getItem('touch_pos_cart');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function clearCart() {
    try {
        localStorage.removeItem('touch_pos_cart');
        return true;
    } catch (e) {
        return false;
    }
}

export function getTouchSettings() {
    try {
        const data = localStorage.getItem('touch_pos_settings');
        return data ? JSON.parse(data) : { fullscreen: false, layout: 'default' };
    } catch (e) {
        return { fullscreen: false, layout: 'default' };
    }
}

export function saveTouchSettings(settings) {
    try {
        localStorage.setItem('touch_pos_settings', JSON.stringify(settings));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    saveCart,
    getCart,
    clearCart,
    getTouchSettings,
    saveTouchSettings
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/touch-pos DOM ready');
    init();
});