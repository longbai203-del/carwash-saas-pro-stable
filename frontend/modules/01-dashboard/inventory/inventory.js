/**
 * modules/01-dashboard/inventory/inventory.js
 * 库存概览
 */

export function init() {
    console.log('📦 Inventory Dashboard 初始化...');
    
    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    const refreshBtn = document.querySelector('.page-header .btn-secondary');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                    showToast('库存数据已刷新', 'success');
                }, 1000);
            }
        });
    }

    console.log('✅ Inventory Dashboard 初始化完成');
}

function showToast(message, type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-size: 14px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ Inventory 模块加载完成');