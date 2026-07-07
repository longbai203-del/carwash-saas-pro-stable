// 02-pos/customer-display.js
console.log('📄 02-pos/customer-display page loaded');

// 状态管理
const state = {
    customers: [],
    selectedCustomer: null,
    searchQuery: '',
    loading: false
};

// 工具函数
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        padding: 12px 24px; border-radius: 8px; 
        color: white; font-size: 14px; z-index: 10000;
        background: ${type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : type === 'success' ? '#10B981' : '#007aff'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeInUp 0.3s ease;
        max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 模拟客户数据
function getMockCustomers() {
    return [
        { id: 'C001', name: '张伟', phone: '13800001111', level: 'gold', visits: 45, totalSpent: 5680 },
        { id: 'C002', name: '李娜', phone: '13800002222', level: 'vip', visits: 82, totalSpent: 12890 },
        { id: 'C003', name: '王强', phone: '13800003333', level: 'silver', visits: 23, totalSpent: 2450 },
        { id: 'C004', name: '刘洋', phone: '13800004444', level: 'bronze', visits: 12, totalSpent: 890 },
        { id: 'C005', name: '陈静', phone: '13800005555', level: 'vip', visits: 67, totalSpent: 15680 }
    ];
}

// 渲染客户列表
function renderCustomers() {
    const container = document.getElementById('customerList');
    if (!container) return;

    const filtered = state.customers.filter(c => 
        c.name.includes(state.searchQuery) ||
        c.phone.includes(state.searchQuery)
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:#8e8e93;">
                <i class="fas fa-users" style="font-size:48px;margin-bottom:12px;display:block;"></i>
                <p>暂无客户数据</p>
            </div>
        `;
        return;
    }

    const levelColors = {
        vip: { bg: '#ede9fe', color: '#6d28d9' },
        gold: { bg: '#fef3c7', color: '#92400e' },
        silver: { bg: '#f3f4f6', color: '#4b5563' },
        bronze: { bg: '#fde68a', color: '#92400e' }
    };

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
            ${filtered.map(c => `
                <div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb;cursor:pointer;" 
                     onclick="window.selectCustomer('${c.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <div>
                            <h4 style="margin:0 0 4px 0;font-size:16px;font-weight:600;">${c.name}</h4>
                            <p style="margin:0;font-size:13px;color:#6b7280;">📱 ${c.phone}</p>
                        </div>
                        <span style="padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500;background:${levelColors[c.level]?.bg || '#f3f4f6'};color:${levelColors[c.level]?.color || '#4b5563'};">
                            ${c.level.toUpperCase()}
                        </span>
                    </div>
                    <div style="display:flex;gap:16px;margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6;">
                        <div>
                            <div style="font-size:12px;color:#6b7280;">到店次数</div>
                            <div style="font-size:18px;font-weight:600;">${c.visits}</div>
                        </div>
                        <div>
                            <div style="font-size:12px;color:#6b7280;">累计消费</div>
                            <div style="font-size:18px;font-weight:600;color:#007aff;">¥${c.totalSpent.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 选择客户
window.selectCustomer = function(id) {
    const customer = state.customers.find(c => c.id === id);
    if (!customer) return;
    state.selectedCustomer = customer;
    showToast(`已选择: ${customer.name}`, 'success');
    
    // 更新选中状态
    document.querySelectorAll('[onclick^="window.selectCustomer"]').forEach(el => {
        el.style.borderColor = '#e5e7eb';
    });
    const items = document.querySelectorAll('[onclick*="selectCustomer"]');
    items.forEach(el => {
        if (el.getAttribute('onclick').includes(id)) {
            el.style.borderColor = '#007aff';
            el.style.borderWidth = '2px';
        }
    });
};

// 搜索客户
function searchCustomers(query) {
    state.searchQuery = query;
    renderCustomers();
}

// 显示客户统计
function showStats() {
    const total = state.customers.length;
    const vip = state.customers.filter(c => c.level === 'vip').length;
    const totalSpent = state.customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpent = total > 0 ? totalSpent / total : 0;

    document.getElementById('statTotal')?.textContent = total;
    document.getElementById('statVip')?.textContent = vip;
    document.getElementById('statTotalSpent')?.textContent = `¥${totalSpent.toFixed(2)}`;
    document.getElementById('statAvgSpent')?.textContent = `¥${avgSpent.toFixed(2)}`;
}

// 初始化
export function init() {
    console.log('02-pos/customer-display initialized');
    state.customers = getMockCustomers();
    renderCustomers();
    showStats();

    // 绑定事件
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchCustomers(this.value);
        });
    }

    // 刷新按钮
    document.querySelector('[onclick="location.reload()"]')?.addEventListener('click', function(e) {
        e.preventDefault();
        state.customers = getMockCustomers();
        renderCustomers();
        showStats();
        showToast('已刷新', 'success');
    });

    // 绑定全局函数
    window.selectCustomer = selectCustomer;
}

export default {
    init
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/customer-display DOM ready');
    init();
});