/**
 * modules/05-customers/customers/customers.js - 客户管理
 * 简化版 - 直接使用 Mock 数据
 */

// ============================================================
// 1. 状态管理
// ============================================================

const state = {
    customers: [],
    loading: false,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: { name: '', phone: '', level: '' },
    _initialized: false
};

const LEVEL_MAP = {
    vip: { label: 'VIP', color: '#6D28D9', bg: '#EDE9FE', icon: 'fa-crown' },
    gold: { label: '黄金', color: '#92400E', bg: '#FEF3C7', icon: 'fa-star' },
    silver: { label: '白银', color: '#4B5563', bg: '#F3F4F6', icon: 'fa-star-half-alt' },
    bronze: { label: '青铜', color: '#92400E', bg: '#FDE68A', icon: 'fa-star' }
};

// ============================================================
// 2. Mock 数据
// ============================================================

function getMockCustomers() {
    var customers = [];
    var names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    var levels = ['gold', 'silver', 'bronze', 'vip'];
    var phones = ['13800001111', '13800002222', '13800003333', '13800004444', '13800005555'];

    for (var i = 0; i < 25; i++) {
        customers.push({
            id: 'CUS-' + String(i + 1).padStart(6, '0'),
            name: names[i % names.length],
            phone: phones[i % phones.length],
            email: 'user' + (i + 1) + '@example.com',
            level: levels[i % levels.length],
            totalSpent: Math.floor(Math.random() * 50000) + 1000,
            orderCount: Math.floor(Math.random() * 50) + 1,
            lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return customers;
}

// ============================================================
// 3. 工具函数
// ============================================================

function formatCurrency(n) { return Number(n || 0).toFixed(2); }

function formatDate(s) {
    if (!s) return '-';
    try { var d = new Date(s); return d.toLocaleDateString('zh-CN'); } catch(e) { return '-'; }
}

function showToast(msg, type) {
    var t = document.createElement('div');
    var colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };
    t.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;background:' + (colors[type] || '#4F46E5') + ';color:white;border-radius:8px;z-index:99999;font-size:14px;max-width:400px;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
}

// ============================================================
// 4. 核心功能
// ============================================================

export function init() {
    if (state._initialized) return;
    console.log('👥 客户管理初始化...');
    state._initialized = true;

    // 绑定弹窗事件
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelModal')?.addEventListener('click', closeModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
    document.getElementById('saveCustomer')?.addEventListener('click', handleSave);
    document.getElementById('confirmDelete')?.addEventListener('click', handleDelete);
    document.getElementById('searchBtn')?.addEventListener('click', doSearch);
    document.getElementById('resetBtn')?.addEventListener('click', doReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreate);

    // 加载数据
    loadData();
    loadStats();
}

function loadData() {
    state.loading = true;
    document.getElementById('loadingSpinner')?.classList.remove('hidden');

    try {
        var all = getMockCustomers();
        var filtered = all;
        if (state.filters.name) filtered = filtered.filter(function(c) { return c.name.includes(state.filters.name); });
        if (state.filters.phone) filtered = filtered.filter(function(c) { return c.phone.includes(state.filters.phone); });
        if (state.filters.level) filtered = filtered.filter(function(c) { return c.level === state.filters.level; });

        var start = (state.pagination.page - 1) * state.pagination.limit;
        state.customers = filtered.slice(start, start + state.pagination.limit);
        state.pagination.total = filtered.length;

        renderTable();
        renderPagination();
        document.getElementById('totalCount').textContent = state.pagination.total;

    } catch(e) { console.error(e); showToast('加载失败', 'error'); }

    state.loading = false;
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

function loadStats() {
    try {
        var all = getMockCustomers();
        var stats = {
            total: all.length,
            vip: all.filter(function(c) { return c.level === 'vip'; }).length,
            gold: all.filter(function(c) { return c.level === 'gold'; }).length,
            totalSpent: all.reduce(function(s, c) { return s + c.totalSpent; }, 0)
        };
        document.getElementById('totalCustomers').textContent = stats.total;
        document.getElementById('vipCount').textContent = stats.vip;
        document.getElementById('goldCount').textContent = stats.gold;
        document.getElementById('totalSpent').textContent = '¥' + formatCurrency(stats.totalSpent);
    } catch(e) { console.error(e); }
}

function renderTable() {
    var tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (!state.customers || state.customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500"><i class="fas fa-user-plus text-3xl"></i><p class="mt-2">暂无客户数据</p></td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < state.customers.length; i++) {
        var c = state.customers[i];
        var lv = LEVEL_MAP[c.level] || LEVEL_MAP.bronze;
        html += '<tr>' +
            '<td><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;background:#DBEAFE;color:#2563EB;">' + c.name.charAt(0) + '</div><div><div style="font-weight:500;">' + c.name + '</div><div style="font-size:12px;color:#6B7280;">' + c.id + '</div></div></div></td>' +
            '<td>' + c.phone + '</td>' +
            '<td>' + c.email + '</td>' +
            '<td><span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:' + lv.bg + ';color:' + lv.color + ';"><i class="fas ' + lv.icon + '"></i>' + lv.label + '</span></td>' +
            '<td class="text-right" style="font-weight:600;">¥' + formatCurrency(c.totalSpent) + '</td>' +
            '<td class="text-center">' + c.orderCount + '</td>' +
            '<td>' + formatDate(c.lastVisit) + '</td>' +
            '<td><div style="display:flex;gap:4px;"><button class="btn-sm btn-primary" onclick="viewCustomer(\'' + c.id + '\')"><i class="fas fa-eye"></i></button><button class="btn-sm btn-warning" onclick="editCustomer(\'' + c.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-sm btn-danger" onclick="deleteCustomer(\'' + c.id + '\')"><i class="fas fa-trash"></i></button></div></td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

function renderPagination() {
    var container = document.getElementById('paginationContainer');
    if (!container) return;

    var page = state.pagination.page, total = state.pagination.total, limit = state.pagination.limit;
    var totalPages = Math.ceil(total / limit) || 1;

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;"><div style="font-size:14px;color:#6B7280;">共 ' + total + ' 位客户，第 ' + page + '/' + totalPages + ' 页</div><div style="display:flex;gap:4px;">';
    html += '<button class="btn-sm btn-secondary" onclick="changePage(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
    for (var i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += '<button class="btn-sm ' + (i === page ? 'btn-primary' : 'btn-secondary') + '" onclick="changePage(' + i + ')">' + i + '</button>';
    }
    html += '<button class="btn-sm btn-secondary" onclick="changePage(' + (page + 1) + ')" ' + (page >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
    html += '</div></div>';
    container.innerHTML = html;
}

// ============================================================
// 5. 全局函数
// ============================================================

window.changePage = function(p) {
    var totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (p < 1 || p > totalPages) return;
    state.pagination.page = p;
    loadData();
};

window.viewCustomer = function(id) {
    var c = state.customers.find(function(item) { return item.id === id; });
    showToast('查看客户: ' + (c ? c.name : id), 'info');
};

window.editCustomer = function(id) {
    var c = state.customers.find(function(item) { return item.id === id; });
    if (!c) { showToast('客户不存在', 'error'); return; }
    document.getElementById('customerId').value = c.id;
    document.getElementById('customerName').value = c.name;
    document.getElementById('customerPhone').value = c.phone;
    document.getElementById('customerEmail').value = c.email || '';
    document.getElementById('customerLevel').value = c.level;
    document.getElementById('customerAddress').value = c.address || '';
    document.getElementById('customerNotes').value = c.notes || '';
    document.getElementById('modalTitle').textContent = '编辑客户';
    document.getElementById('customerModal').style.display = 'flex';
};

window.deleteCustomer = function(id) {
    var c = state.customers.find(function(item) { return item.id === id; });
    if (!c) { showToast('客户不存在', 'error'); return; }
    document.getElementById('deleteCustomerName').textContent = '客户: ' + c.name;
    document.getElementById('confirmDelete').dataset.id = id;
    document.getElementById('deleteModal').style.display = 'flex';
};

// ============================================================
// 6. 弹窗控制
// ============================================================

function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function showCreate() {
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerLevel').value = 'bronze';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    document.getElementById('modalTitle').textContent = '新建客户';
    document.getElementById('customerModal').style.display = 'flex';
}

// ============================================================
// 7. 保存/删除
// ============================================================

function handleSave() {
    var name = document.getElementById('customerName').value.trim();
    var phone = document.getElementById('customerPhone').value.trim();
    if (!name || !phone) { showToast('请填写姓名和手机号', 'warning'); return; }
    var id = document.getElementById('customerId').value;
    showToast(id ? '客户更新成功' : '客户创建成功', 'success');
    closeModal();
    loadData();
    loadStats();
}

function handleDelete() {
    var id = document.getElementById('confirmDelete').dataset.id;
    showToast('删除成功', 'success');
    closeDeleteModal();
    loadData();
    loadStats();
}

// ============================================================
// 8. 搜索/重置
// ============================================================

function doSearch() {
    state.pagination.page = 1;
    state.filters.name = document.getElementById('searchName').value || '';
    state.filters.phone = document.getElementById('searchPhone').value || '';
    state.filters.level = document.getElementById('searchLevel').value || '';
    loadData();
}

function doReset() {
    state.pagination.page = 1;
    state.filters = { name: '', phone: '', level: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchLevel').value = '';
    loadData();
}

// ============================================================
// 9. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ 客户管理模块已加载');