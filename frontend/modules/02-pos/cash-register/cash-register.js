// 02-pos/cash-register.js
console.log('📄 02-pos/cash-register page loaded');

// 状态管理
const state = {
    transactions: [],
    currentTransaction: null,
    loading: false,
    searchQuery: '',
    dateRange: { start: '', end: '' }
};

// 工具函数
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

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

// 模拟数据
function getMockTransactions() {
    return [
        { id: 'T001', date: '2026-07-07 10:30:00', amount: 68, method: 'cash', customer: '张伟', status: 'completed' },
        { id: 'T002', date: '2026-07-07 11:15:00', amount: 128, method: 'wechat', customer: '李娜', status: 'completed' },
        { id: 'T003', date: '2026-07-07 13:45:00', amount: 268, method: 'card', customer: '王强', status: 'completed' },
        { id: 'T004', date: '2026-07-07 14:20:00', amount: 388, method: 'alipay', customer: '刘洋', status: 'refunded' },
        { id: 'T005', date: '2026-07-07 15:00:00', amount: 188, method: 'cash', customer: '陈静', status: 'completed' }
    ];
}

// 渲染交易列表
function renderTransactions() {
    const container = document.getElementById('transactionList');
    if (!container) return;

    const filtered = state.transactions.filter(t => 
        t.customer.includes(state.searchQuery) ||
        t.id.includes(state.searchQuery)
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:#8e8e93;">
                <i class="fas fa-receipt" style="font-size:48px;margin-bottom:12px;display:block;"></i>
                <p>暂无交易记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr style="border-bottom:2px solid #e5e7eb;">
                        <th style="padding:10px 12px;text-align:left;">订单号</th>
                        <th style="padding:10px 12px;text-align:left;">时间</th>
                        <th style="padding:10px 12px;text-align:left;">客户</th>
                        <th style="padding:10px 12px;text-align:right;">金额</th>
                        <th style="padding:10px 12px;text-align:left;">支付方式</th>
                        <th style="padding:10px 12px;text-align:left;">状态</th>
                        <th style="padding:10px 12px;text-align:center;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(t => `
                        <tr style="border-bottom:1px solid #f3f4f6;">
                            <td style="padding:10px 12px;">${t.id}</td>
                            <td style="padding:10px 12px;">${t.date}</td>
                            <td style="padding:10px 12px;">${t.customer}</td>
                            <td style="padding:10px 12px;text-align:right;font-weight:600;">¥${formatCurrency(t.amount)}</td>
                            <td style="padding:10px 12px;">
                                <span style="padding:2px 10px;border-radius:12px;font-size:12px;background:#f3f4f6;">
                                    ${t.method === 'cash' ? '现金' : t.method === 'wechat' ? '微信' : t.method === 'alipay' ? '支付宝' : '刷卡'}
                                </span>
                            </td>
                            <td style="padding:10px 12px;">
                                <span style="padding:2px 10px;border-radius:12px;font-size:12px;background:${t.status === 'completed' ? '#d1fae5' : '#fee2e2'};color:${t.status === 'completed' ? '#065f46' : '#991b1b'};">
                                    ${t.status === 'completed' ? '已完成' : '已退款'}
                                </span>
                            </td>
                            <td style="padding:10px 12px;text-align:center;">
                                <button onclick="window.viewTransaction('${t.id}')" style="padding:4px 12px;border:none;border-radius:4px;background:#007aff;color:white;cursor:pointer;font-size:12px;">
                                    查看
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 查看交易详情
window.viewTransaction = function(id) {
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) {
        showToast('交易不存在', 'error');
        return;
    }
    alert(`交易详情：
订单号: ${transaction.id}
时间: ${transaction.date}
客户: ${transaction.customer}
金额: ¥${formatCurrency(transaction.amount)}
支付方式: ${transaction.method}
状态: ${transaction.status === 'completed' ? '已完成' : '已退款'}`);
};

// 计算统计数据
function updateStats() {
    const total = state.transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = state.transactions.length;
    const completed = state.transactions.filter(t => t.status === 'completed').length;
    const avg = count > 0 ? total / count : 0;

    document.getElementById('statTotal')?.textContent = `¥${formatCurrency(total)}`;
    document.getElementById('statCount')?.textContent = count;
    document.getElementById('statCompleted')?.textContent = completed;
    document.getElementById('statAvg')?.textContent = `¥${formatCurrency(avg)}`;
}

// 搜索
function searchTransactions(query) {
    state.searchQuery = query;
    renderTransactions();
}

// 初始化
export function init() {
    console.log('02-pos/cash-register initialized');
    state.transactions = getMockTransactions();
    renderTransactions();
    updateStats();

    // 绑定事件
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTransactions(this.value);
        });
    }

    // 刷新按钮
    document.querySelector('[onclick="location.reload()"]')?.addEventListener('click', function(e) {
        e.preventDefault();
        state.transactions = getMockTransactions();
        renderTransactions();
        updateStats();
        showToast('已刷新', 'success');
    });

    // 新建按钮
    document.querySelector('.btn-primary')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '#/pos/quick-sale';
    });

    // 绑定全局函数
    window.viewTransaction = viewTransaction;
}

export default {
    init
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('02-pos/cash-register DOM ready');
    init();
});