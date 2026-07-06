/**
 * modules/05-customers/customers/customers.js - 客户管理
 * 使用真实数据服务 (Supabase)
 */

// ============================================================
// 1. 导入服务
// ============================================================

let customerService = null;
let formatCurrency = null;
let formatDate = null;
let showToast = null;

async function loadServices() {
    try {
        const services = await import('../../../js/services.js');
        customerService = services.customerService;
        formatCurrency = services.formatCurrency;
        formatDate = services.formatDate;
        showToast = window.showToast || function(msg) { alert(msg); };
        return true;
    } catch (error) {
        console.warn('⚠️ 服务加载失败，使用内置功能:', error.message);
        // 内置备用函数
        formatCurrency = (n) => Number(n || 0).toFixed(2);
        formatDate = (s) => s ? new Date(s).toLocaleDateString('zh-CN') : '-';
        showToast = (msg, type) => {
            const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;background:' + (colors[type] || '#4F46E5') + ';color:white;border-radius:8px;z-index:99999;font-size:14px;';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        };
        return false;
    }
}

// ============================================================
// 2. 状态管理
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
// 3. 核心功能
// ============================================================

export async function init() {
    if (state._initialized) {
        console.log('👥 客户管理已初始化，跳过');
        return;
    }

    console.log('👥 客户管理初始化...');
    state._initialized = true;

    // 加载服务
    await loadServices();

    // 绑定弹窗事件
    bindModalEvents();

    // 加载数据
    await loadCustomers();
    await loadStats();
    bindEvents();

    console.log('✅ 客户管理初始化完成');
}

// ============================================================
// 4. 数据加载
// ============================================================

async function loadCustomers() {
    state.loading = true;
    showLoading();

    try {
        const result = await customerService.getList({
            page: state.pagination.page,
            limit: state.pagination.limit,
            name: state.filters.name,
            phone: state.filters.phone,
            level: state.filters.level
        });

        state.customers = result.list || [];
        state.pagination.total = result.total || 0;

        renderTable();
        renderPagination();
        updateTotalCount();

    } catch (error) {
        console.error('❌ 加载客户失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

async function loadStats() {
    try {
        const stats = await customerService.getStats();
        renderStats(stats);
    } catch (error) {
        console.error('❌ 加载统计失败:', error);
    }
}

// ============================================================
// 5. 渲染函数
// ============================================================

function renderStats(stats) {
    document.getElementById('totalCustomers').textContent = stats.total || 0;
    document.getElementById('vipCount').textContent = stats.vip || 0;
    document.getElementById('goldCount').textContent = stats.gold || 0;
    document.getElementById('totalSpent').textContent = '¥' + formatCurrency(stats.totalSpent || 0);
}

function renderTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (!state.customers || state.customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:#6B7280;">暂无客户数据</td></tr>';
        return;
    }

    let html = '';
    for (let i = 0; i < state.customers.length; i++) {
        const c = state.customers[i];
        const lv = LEVEL_MAP[c.level] || LEVEL_MAP.bronze;
        const initial = c.name ? c.name.charAt(0) : '?';

        html += `<tr>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;background:#DBEAFE;color:#2563EB;">${initial}</div>
                    <div>
                        <div style="font-weight:500;">${c.name || '-'}</div>
                        <div style="font-size:12px;color:#6B7280;">${c.id || ''}</div>
                    </div>
                </div>
            </td>
            <td>${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>
                <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${lv.bg};color:${lv.color};">
                    <i class="fas ${lv.icon}"></i> ${lv.label}
                </span>
            </td>
            <td style="text-align:right;font-weight:600;">¥${formatCurrency(c.total_spent || c.totalSpent || 0)}</td>
            <td style="text-align:center;">${c.total_orders || c.orderCount || 0}</td>
            <td>${formatDate(c.last_visit || c.lastVisit)}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn-sm btn-primary" onclick="viewCustomer('${c.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm btn-warning" onclick="editCustomer('${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-danger" onclick="deleteCustomer('${c.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const page = state.pagination.page;
    const total = state.pagination.total;
    const limit = state.pagination.limit;
    const totalPages = Math.ceil(total / limit) || 1;

    let html = `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;">
        <div style="font-size:14px;color:#6B7280;">共 ${total} 位客户，第 ${page}/${totalPages} 页</div>
        <div style="display:flex;gap:4px;">
            <button class="btn-sm btn-secondary" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button class="btn-sm btn-secondary" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>`;
    container.innerHTML = html;
}

function updateTotalCount() {
    document.getElementById('totalCount').textContent = state.pagination.total || 0;
}

// ============================================================
// 6. 全局函数
// ============================================================

window.changePage = function(page) {
    const totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (page < 1 || page > totalPages) return;
    state.pagination.page = page;
    loadCustomers();
};

window.viewCustomer = function(id) {
    const c = state.customers.find(item => item.id === id);
    showToast('查看客户: ' + (c ? c.name : id), 'info');
};

window.editCustomer = function(id) {
    const c = state.customers.find(item => item.id === id);
    if (!c) { showToast('客户不存在', 'error'); return; }
    document.getElementById('customerId').value = c.id;
    document.getElementById('customerName').value = c.name || '';
    document.getElementById('customerPhone').value = c.phone || '';
    document.getElementById('customerEmail').value = c.email || '';
    document.getElementById('customerLevel').value = c.level || 'bronze';
    document.getElementById('customerAddress').value = c.address || '';
    document.getElementById('customerNotes').value = c.notes || '';
    document.getElementById('modalTitle').textContent = '编辑客户';
    document.getElementById('customerModal').style.display = 'flex';
};

window.deleteCustomer = function(id) {
    const c = state.customers.find(item => item.id === id);
    if (!c) { showToast('客户不存在', 'error'); return; }
    document.getElementById('deleteCustomerName').textContent = '客户: ' + c.name;
    document.getElementById('confirmDelete').dataset.id = id;
    document.getElementById('deleteModal').style.display = 'flex';
};

// ============================================================
// 7. 弹窗控制
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
// 8. 保存/删除
// ============================================================

async function handleSave() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    if (!name || !phone) { showToast('请填写姓名和手机号', 'warning'); return; }

    const id = document.getElementById('customerId').value;
    const data = {
        name: name,
        phone: phone,
        email: document.getElementById('customerEmail').value.trim() || null,
        level: document.getElementById('customerLevel').value,
        address: document.getElementById('customerAddress').value.trim() || null,
        notes: document.getElementById('customerNotes').value.trim() || null
    };

    try {
        if (id) {
            await customerService.update(id, data);
            showToast('客户更新成功', 'success');
        } else {
            await customerService.create(data);
            showToast('客户创建成功', 'success');
        }
        closeModal();
        await loadCustomers();
        await loadStats();
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    }
}

async function handleDelete() {
    const id = document.getElementById('confirmDelete').dataset.id;
    if (!id) return;

    try {
        await customerService.delete(id);
        showToast('删除成功', 'success');
        closeDeleteModal();
        await loadCustomers();
        await loadStats();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ============================================================
// 9. 搜索/重置
// ============================================================

function doSearch() {
    state.pagination.page = 1;
    state.filters.name = document.getElementById('searchName').value || '';
    state.filters.phone = document.getElementById('searchPhone').value || '';
    state.filters.level = document.getElementById('searchLevel').value || '';
    loadCustomers();
}

function doReset() {
    state.pagination.page = 1;
    state.filters = { name: '', phone: '', level: '' };
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchLevel').value = '';
    loadCustomers();
}

// ============================================================
// 10. 事件绑定
// ============================================================

function bindModalEvents() {
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelModal')?.addEventListener('click', closeModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
    document.getElementById('saveCustomer')?.addEventListener('click', handleSave);
    document.getElementById('confirmDelete')?.addEventListener('click', handleDelete);
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', doSearch);
    document.getElementById('resetBtn')?.addEventListener('click', doReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreate);
}

function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

// ============================================================
// 11. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ 客户管理模块加载完成');