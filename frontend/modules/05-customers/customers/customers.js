/**
 * modules/05-customers/customers/customers.js - 客户管理
 * 支持：列表、搜索、分页、新建、编辑、删除、查看详情
 */

// ============================================================
// 1. 状态管理
// ============================================================

const state = {
    customers: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0
    },
    filters: {
        name: '',
        phone: '',
        level: ''
    },
    selectedCustomer: null,
    isEditing: false,
    _initialized: false
};

const LEVEL_MAP = {
    vip: { label: 'VIP', color: 'vip', icon: 'fa-crown' },
    gold: { label: '黄金', color: 'gold', icon: 'fa-star' },
    silver: { label: '白银', color: 'silver', icon: 'fa-star-half-alt' },
    bronze: { label: '青铜', color: 'bronze', icon: 'fa-star' }
};

// ============================================================
// 2. 工具函数
// ============================================================

function getServices() {
    if (typeof window !== 'undefined' && window.Services) {
        return window.Services;
    }
    return null;
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return Number(amount).toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('zh-CN');
    } catch (e) {
        return '-';
    }
}

function showToast(message, type) {
    // 移除已有 toast
    var oldToasts = document.querySelectorAll('.crm-toast');
    for (var i = 0; i < oldToasts.length; i++) {
        oldToasts[i].remove();
    }

    var toast = document.createElement('div');
    toast.className = 'crm-toast';
    var colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 99999;
        font-size: 14px;
        max-width: 400px;
        animation: crmSlideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================================
// 3. Mock 数据（纯净版）
// ============================================================

function getMockCustomers() {
    var customers = [];
    var names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    var levels = ['gold', 'silver', 'bronze', 'vip'];
    var phones = ['13800001111', '13800002222', '13800003333', '13800004444', '13800005555'];

    for (var i = 0; i < 25; i++) {
        var level = levels[i % levels.length];
        var spent = Math.floor(Math.random() * 50000) + 1000;
        customers.push({
            id: 'CUS-' + String(i + 1).padStart(6, '0'),
            name: names[i % names.length] + (i > 9 ? '' : ''),
            phone: phones[i % phones.length],
            email: 'user' + (i + 1) + '@example.com',
            level: level,
            totalSpent: spent,
            orderCount: Math.floor(Math.random() * 50) + 1,
            lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            address: '中国' + ['上海', '北京', '深圳', '广州', '成都'][i % 5] + '市XX区XX路' + (i + 1) + '号',
            notes: '',
            createTime: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return customers;
}

// ============================================================
// 4. 核心功能
// ============================================================

export async function init() {
    // 防止重复初始化
    if (state._initialized) {
        console.log('👥 客户管理已初始化，跳过');
        return;
    }

    console.log('👥 客户管理初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    state._initialized = true;

    // 清除旧缓存
    try {
        var services = getServices();
        if (services && services.customer) {
            services.customer.clearCache();
        }
    } catch (e) {
        // 忽略
    }

    // 绑定弹窗事件
    bindModalEvents();

    // 加载数据
    await loadCustomers();
    await loadStats();
    bindEvents();

    console.log('✅ 客户管理初始化完成');
}

// ============================================================
// 5. 数据加载
// ============================================================

async function loadCustomers() {
    state.loading = true;
    showLoading();

    try {
        var services = getServices();
        var data = null;

        if (services && services.customer) {
            try {
                console.log('📦 使用数据服务加载客户...');
                var params = {
                    page: state.pagination.page,
                    limit: state.pagination.limit,
                    name: state.filters.name,
                    phone: state.filters.phone,
                    level: state.filters.level
                };
                data = await services.customer.getList(params);
                console.log('✅ 数据服务返回客户:', data);
            } catch (serviceError) {
                console.warn('⚠️ 数据服务加载失败，使用 Mock:', serviceError.message);
                data = getMockData();
            }
        } else {
            console.log('📦 使用 Mock 数据加载客户...');
            data = getMockData();
        }

        if (data) {
            state.customers = data.list || [];
            state.pagination.total = data.total || 0;
        }

        renderTable();
        renderPagination();
        updateTotalCount();

    } catch (error) {
        console.error('❌ 加载客户失败:', error);
        showToast('加载数据失败，使用备用数据', 'warning');
        var fallback = getMockData();
        state.customers = fallback.list || [];
        state.pagination.total = fallback.total || 0;
        renderTable();
        renderPagination();
        updateTotalCount();
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockData() {
    var allCustomers = getMockCustomers();
    var start = (state.pagination.page - 1) * state.pagination.limit;
    var end = start + state.pagination.limit;

    // 应用过滤
    var filtered = allCustomers;
    if (state.filters.name) {
        filtered = filtered.filter(function(c) {
            return c.name.includes(state.filters.name);
        });
    }
    if (state.filters.phone) {
        filtered = filtered.filter(function(c) {
            return c.phone.includes(state.filters.phone);
        });
    }
    if (state.filters.level) {
        filtered = filtered.filter(function(c) {
            return c.level === state.filters.level;
        });
    }

    return {
        list: filtered.slice(start, end),
        total: filtered.length
    };
}

async function loadStats() {
    try {
        var services = getServices();
        var stats = null;

        if (services && services.customer) {
            try {
                stats = await services.customer.getStats();
            } catch (e) {
                console.warn('⚠️ 统计加载失败:', e.message);
                stats = null;
            }
        }

        if (!stats) {
            // 使用 Mock 统计
            var all = getMockCustomers();
            stats = {
                total: all.length,
                vip: all.filter(function(c) { return c.level === 'vip'; }).length,
                gold: all.filter(function(c) { return c.level === 'gold'; }).length,
                silver: all.filter(function(c) { return c.level === 'silver'; }).length,
                bronze: all.filter(function(c) { return c.level === 'bronze'; }).length,
                totalSpent: all.reduce(function(sum, c) { return sum + c.totalSpent; }, 0)
            };
        }

        renderStats(stats);

    } catch (error) {
        console.error('❌ 加载统计失败:', error);
    }
}

// ============================================================
// 6. 渲染函数
// ============================================================

function renderStats(stats) {
    var totalEl = document.getElementById('totalCustomers');
    var vipEl = document.getElementById('vipCount');
    var goldEl = document.getElementById('goldCount');
    var spentEl = document.getElementById('totalSpent');

    if (totalEl) totalEl.textContent = stats.total || 0;
    if (vipEl) vipEl.textContent = stats.vip || 0;
    if (goldEl) goldEl.textContent = stats.gold || 0;
    if (spentEl) spentEl.textContent = '¥' + formatCurrency(stats.totalSpent || 0);
}

function renderTable() {
    var tbody = document.getElementById('customersTableBody');
    if (!tbody) {
        console.warn('⚠️ customersTableBody 不存在');
        return;
    }

    if (!state.customers || state.customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-gray-500">
                    <i class="fas fa-user-plus text-3xl"></i>
                    <p class="mt-2">暂无客户数据</p>
                    <p class="text-sm text-gray-400">点击"新建客户"添加</p>
                </td>
            </tr>
        `;
        return;
    }

    var html = '';
    for (var i = 0; i < state.customers.length; i++) {
        var c = state.customers[i];
        var levelInfo = LEVEL_MAP[c.level] || LEVEL_MAP.bronze;
        var initial = c.name ? c.name.charAt(0) : '?';

        html += `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div class="crm-avatar" style="background:#DBEAFE;color:#2563EB;">
                            ${initial}
                        </div>
                        <div>
                            <div style="font-weight:500;">${c.name || '-'}</div>
                            <div style="font-size:12px;color:#6B7280;">${c.id || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${c.phone || '-'}</td>
                <td style="font-size:14px;">${c.email || '-'}</td>
                <td>
                    <span class="crm-badge crm-badge-${levelInfo.color}">
                        <i class="fas ${levelInfo.icon}"></i>
                        ${levelInfo.label}
                    </span>
                </td>
                <td style="text-align:right;font-weight:600;">¥${formatCurrency(c.totalSpent || 0)}</td>
                <td style="text-align:center;">${c.orderCount || 0}</td>
                <td style="font-size:14px;">${formatDate(c.lastVisit)}</td>
                <td>
                    <div style="display:flex;gap:4px;">
                        <button class="btn-sm btn-primary" onclick="viewCustomer('${c.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-sm btn-warning" onclick="editCustomer('${c.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteCustomer('${c.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

function renderPagination() {
    var container = document.getElementById('paginationContainer');
    if (!container) return;

    var page = state.pagination.page || 1;
    var limit = state.pagination.limit || 10;
    var total = state.pagination.total || 0;
    var totalPages = Math.ceil(total / limit) || 1;

    var html = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;">
            <div style="font-size:14px;color:#6B7280;">
                共 ${total} 位客户，第 ${page}/${totalPages} 页
            </div>
            <div style="display:flex;gap:4px;">
                <button class="btn-sm btn-secondary" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
    `;

    var startPage = Math.max(1, page - 2);
    var endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
        html += `<button class="btn-sm btn-secondary" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<button class="btn-sm btn-secondary" disabled>...</button>`;
    }

    for (var i = startPage; i <= endPage; i++) {
        html += `<button class="btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="changePage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<button class="btn-sm btn-secondary" disabled>...</button>`;
        html += `<button class="btn-sm btn-secondary" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    html += `
                <button class="btn-sm btn-secondary" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function updateTotalCount() {
    var el = document.getElementById('totalCount');
    if (el) el.textContent = state.pagination.total || 0;
}

// ============================================================
// 7. 全局函数（供 HTML 调用）
// ============================================================

window.changePage = function(page) {
    if (page < 1) return;
    var totalPages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
    if (page > totalPages) return;
    state.pagination.page = page;
    loadCustomers();
};

window.viewCustomer = function(id) {
    var customer = state.customers.find(function(c) { return c.id === id; });
    if (!customer) {
        showToast('客户不存在', 'error');
        return;
    }
    showToast('查看客户: ' + customer.name, 'info');
};

window.editCustomer = function(id) {
    var customer = state.customers.find(function(c) { return c.id === id; });
    if (!customer) {
        showToast('客户不存在', 'error');
        return;
    }

    state.isEditing = true;
    state.selectedCustomer = customer;

    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name || '';
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerLevel').value = customer.level || 'bronze';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerNotes').value = customer.notes || '';

    document.getElementById('modalTitle').textContent = '编辑客户';
    openModal();
};

window.deleteCustomer = function(id) {
    var customer = state.customers.find(function(c) { return c.id === id; });
    if (!customer) {
        showToast('客户不存在', 'error');
        return;
    }

    document.getElementById('deleteCustomerName').textContent = '客户: ' + customer.name;
    document.getElementById('confirmDelete').dataset.id = id;
    openDeleteModal();
};

// ============================================================
// 8. 弹窗控制
// ============================================================

function openModal() {
    var modal = document.getElementById('customerModal');
    if (modal) modal.classList.remove('hidden');
}

function closeModal() {
    var modal = document.getElementById('customerModal');
    if (modal) modal.classList.add('hidden');
    resetForm();
}

function openDeleteModal() {
    var modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteModal() {
    var modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('hidden');
}

function resetForm() {
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerLevel').value = 'bronze';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    state.isEditing = false;
    state.selectedCustomer = null;
    document.getElementById('modalTitle').textContent = '新建客户';
}

// ============================================================
// 9. 保存/删除操作
// ============================================================

async function handleSaveCustomer() {
    var name = document.getElementById('customerName').value.trim();
    var phone = document.getElementById('customerPhone').value.trim();
    var email = document.getElementById('customerEmail').value.trim();
    var level = document.getElementById('customerLevel').value;
    var address = document.getElementById('customerAddress').value.trim();
    var notes = document.getElementById('customerNotes').value.trim();

    if (!name) {
        showToast('请输入客户姓名', 'warning');
        return;
    }
    if (!phone) {
        showToast('请输入手机号', 'warning');
        return;
    }

    var customerId = document.getElementById('customerId').value;
    var data = {
        name: name,
        phone: phone,
        email: email || null,
        level: level,
        address: address || null,
        notes: notes || null
    };

    try {
        var services = getServices();

        if (customerId) {
            if (services && services.customer) {
                await services.customer.update(customerId, data);
            }
            showToast('客户更新成功', 'success');
        } else {
            if (services && services.customer) {
                await services.customer.create(data);
            }
            showToast('客户创建成功', 'success');
        }

        closeModal();
        await loadCustomers();
        await loadStats();

    } catch (error) {
        console.error('❌ 保存失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

async function handleConfirmDelete() {
    var id = document.getElementById('confirmDelete').dataset.id;
    if (!id) return;

    try {
        var services = getServices();
        if (services && services.customer) {
            await services.customer.delete(id);
        }
        showToast('删除成功', 'success');
        closeDeleteModal();
        await loadCustomers();
        await loadStats();

    } catch (error) {
        console.error('❌ 删除失败:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ============================================================
// 10. 事件绑定
// ============================================================

function bindModalEvents() {
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelModal')?.addEventListener('click', closeModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);

    document.getElementById('customerModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    document.getElementById('deleteModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });

    document.getElementById('saveCustomer')?.addEventListener('click', handleSaveCustomer);
    document.getElementById('confirmDelete')?.addEventListener('click', handleConfirmDelete);

    document.getElementById('customerForm')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveCustomer();
        }
    });
}

function handleSearch() {
    state.pagination.page = 1;
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.phone = document.getElementById('searchPhone')?.value || '';
    state.filters.level = document.getElementById('searchLevel')?.value || '';
    loadCustomers();
}

function handleReset() {
    state.pagination.page = 1;
    state.filters = { name: '', phone: '', level: '' };
    var inputs = document.querySelectorAll('.crm-search-bar input, .crm-search-bar select');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    loadCustomers();
}

function showCreateCustomer() {
    resetForm();
    document.getElementById('modalTitle').textContent = '新建客户';
    openModal();
}

function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateCustomer);

    var inputs = document.querySelectorAll('.crm-search-bar input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

function showLoading() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoading() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('hidden');
}

// ============================================================
// 11. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // 延迟执行，确保 DOM 完全加载
    setTimeout(init, 100);
}

console.log('✅ 客户管理模块加载完成');