/**
 * modules/05-customers/customers/customers.js - 客户管理模块
 * @module customers
 * @description 客户的CRUD操作、搜索、分页、等级管理
 * 
 * @example
 * import { init } from './customers.js';
 * init();
 */

import { apiClient } from '../../../js/api/api-client.js/index.js';
import { appStore } from '../../../js/core/store.js';

/**
 * 客户状态
 */
const state = {
    customers: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    },
    filters: {
        name: '',
        phone: '',
        level: ''
    },
    editingId: null
};

const LEVEL_MAP = {
    vip: { label: 'VIP', color: '#8B5CF6', bg: '#EDE9FE', icon: 'fa-crown' },
    gold: { label: '黄金', color: '#F59E0B', bg: '#FEF3C7', icon: 'fa-star' },
    silver: { label: '白银', color: '#6B7280', bg: '#F3F4F6', icon: 'fa-star-half-alt' },
    bronze: { label: '青铜', color: '#92400E', bg: '#FDE68A', icon: 'fa-star' }
};

/**
 * 初始化客户管理
 * @returns {Promise<void>}
 */
export async function init() {
    console.log('👥 客户管理模块初始化...');
    
    try {
        await loadCustomers();
        await loadStats();
        renderTable();
        renderPagination();
        bindEvents();
        initModalEvents();
        console.log('✅ 客户管理初始化完成');
    } catch (error) {
        console.error('❌ 客户管理初始化失败:', error);
        showError('加载客户数据失败');
    }
}

/**
 * 加载客户数据
 * @returns {Promise<void>}
 */
async function loadCustomers() {
    state.loading = true;
    showLoading();

    try {
        const params = {
            page: state.pagination.page,
            limit: state.pagination.limit,
            name: state.filters.name,
            phone: state.filters.phone,
            level: state.filters.level
        };

        const response = await apiClient.getCustomers(params);
        
        if (response && response.code === 200) {
            state.customers = response.data || [];
            state.pagination.total = response.total || 0;
            state.pagination.totalPages = response.totalPages || 1;
        } else {
            state.customers = getMockCustomers();
            state.pagination.total = state.customers.length;
        }
    } catch (error) {
        console.warn('⚠️ API获取失败，使用模拟数据:', error);
        state.customers = getMockCustomers();
        state.pagination.total = state.customers.length;
    } finally {
        state.loading = false;
        hideLoading();
    }
}

/**
 * 获取模拟客户数据
 * @returns {Array} 客户数组
 */
function getMockCustomers() {
    const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
    const levels = ['vip', 'gold', 'silver', 'bronze'];
    
    return Array.from({ length: 20 }, (_, i) => ({
        id: `CUS-${String(i + 1).padStart(6, '0')}`,
        name: names[i % names.length],
        phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        email: `user${i + 1}@example.com`,
        level: levels[i % levels.length],
        totalSpent: Math.floor(Math.random() * 50000) + 1000,
        orderCount: Math.floor(Math.random() * 50) + 1,
        lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        address: `${['北京','上海','广州','深圳','杭州'][i % 5]}市${['朝阳','浦东','天河','南山','西湖'][i % 5]}区路${i + 1}号`
    }));
}

/**
 * 加载统计
 * @returns {Promise<void>}
 */
async function loadStats() {
    try {
        // 从API获取统计
        const stats = {
            total: state.customers.length,
            vip: state.customers.filter(c => c.level === 'vip').length,
            gold: state.customers.filter(c => c.level === 'gold').length,
            totalSpent: state.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
        };
        renderStats(stats);
    } catch (error) {
        console.warn('⚠️ 加载统计失败:', error);
    }
}

/**
 * 渲染统计
 * @param {Object} stats - 统计数据
 * @returns {void}
 */
function renderStats(stats) {
    const elements = {
        total: document.getElementById('totalCustomers'),
        vip: document.getElementById('vipCount'),
        gold: document.getElementById('goldCount'),
        spent: document.getElementById('totalSpent')
    };
    
    if (elements.total) elements.total.textContent = stats.total || 0;
    if (elements.vip) elements.vip.textContent = stats.vip || 0;
    if (elements.gold) elements.gold.textContent = stats.gold || 0;
    if (elements.spent) elements.spent.textContent = '¥' + (stats.totalSpent || 0).toFixed(2);
}

/**
 * 渲染表格
 * @returns {void}
 */
function renderTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (state.customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-users" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无客户数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.customers.map(customer => {
        const lv = LEVEL_MAP[customer.level] || LEVEL_MAP.bronze;
        const initial = customer.name ? customer.name.charAt(0) : '?';
        const spent = customer.totalSpent || 0;
        const orders = customer.orderCount || 0;
        const visit = customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '-';
        
        return `
            <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;background:#DBEAFE;color:#2563EB;">
                            ${initial}
                        </div>
                        <div>
                            <div style="font-weight:500;">${customer.name}</div>
                            <div style="font-size:12px;color:#6B7280;">${customer.id}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">${customer.phone}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">${customer.email || '-'}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${lv.bg};color:${lv.color};">
                        <i class="fas ${lv.icon}"></i> ${lv.label}
                    </span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:600;">
                    ¥${spent.toFixed(2)}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:center;">${orders}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">${visit}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn-sm btn-sm-primary" onclick="editCustomer('${customer.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-sm-danger" onclick="deleteCustomer('${customer.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 渲染分页
 * @returns {void}
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const { page, total, totalPages } = state.pagination;

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 位客户，第 ${page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${page}</span>
                <button onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * 切换页面
 * @param {number} page - 页码
 * @returns {void}
 */
window.changePage = function(page) {
    const { totalPages } = state.pagination;
    if (page < 1 || page > totalPages) return;
    state.pagination.page = page;
    loadCustomers().then(() => {
        renderTable();
        renderPagination();
        loadStats();
    });
};

/**
 * 编辑客户
 * @param {string} id - 客户ID
 * @returns {void}
 */
window.editCustomer = function(id) {
    const customer = state.customers.find(c => c.id === id);
    if (!customer) {
        showToast('客户不存在', 'error');
        return;
    }
    
    state.editingId = id;
    document.getElementById('modalTitle').textContent = '编辑客户';
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerLevel').value = customer.level || 'bronze';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerNotes').value = customer.notes || '';
    document.getElementById('customerModal').style.display = 'flex';
};

/**
 * 删除客户
 * @param {string} id - 客户ID
 * @returns {Promise<void>}
 */
window.deleteCustomer = async function(id) {
    if (!confirm('确认删除该客户？')) return;
    try {
        state.customers = state.customers.filter(c => c.id !== id);
        localStorage.setItem('customers_data', JSON.stringify(state.customers));
        renderTable();
        renderPagination();
        loadStats();
        showToast('删除成功', 'success');
    } catch (error) {
        showToast('删除失败', 'error');
    }
};

/**
 * 保存客户
 * @returns {Promise<void>}
 */
async function saveCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const level = document.getElementById('customerLevel').value;
    const address = document.getElementById('customerAddress').value.trim();
    const notes = document.getElementById('customerNotes').value.trim();

    if (!name) { showToast('请输入客户姓名', 'warning'); return; }
    if (!phone) { showToast('请输入手机号', 'warning'); return; }

    try {
        const data = { name, phone, email, level, address, notes };
        
        if (state.editingId) {
            const customer = state.customers.find(c => c.id === state.editingId);
            if (customer) {
                Object.assign(customer, data);
                localStorage.setItem('customers_data', JSON.stringify(state.customers));
                showToast('客户已更新', 'success');
            }
        } else {
            const newCustomer = {
                id: `CUS-${String(Date.now()).slice(-6)}`,
                ...data,
                totalSpent: 0,
                orderCount: 0,
                lastVisit: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            state.customers.unshift(newCustomer);
            localStorage.setItem('customers_data', JSON.stringify(state.customers));
            showToast('客户已创建', 'success');
        }
        
        closeModal();
        await loadCustomers();
        renderTable();
        renderPagination();
        loadStats();
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    }
}

/**
 * 显示新建客户弹窗
 * @returns {void}
 */
function showCreateModal() {
    state.editingId = null;
    document.getElementById('modalTitle').textContent = '新建客户';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerLevel').value = 'bronze';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerNotes').value = '';
    document.getElementById('customerModal').style.display = 'flex';
}

/**
 * 关闭弹窗
 * @returns {void}
 */
function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
}

/**
 * 搜索客户
 * @returns {void}
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.phone = document.getElementById('searchPhone')?.value || '';
    state.filters.level = document.getElementById('searchLevel')?.value || '';
    state.pagination.page = 1;
    loadCustomers().then(() => {
        renderTable();
        renderPagination();
        loadStats();
    });
}

/**
 * 重置搜索
 * @returns {void}
 */
function handleReset() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchLevel').value = '';
    state.filters = { name: '', phone: '', level: '' };
    state.pagination.page = 1;
    loadCustomers().then(() => {
        renderTable();
        renderPagination();
        loadStats();
    });
}

/**
 * 绑定事件
 * @returns {void}
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    document.getElementById('createBtn')?.addEventListener('click', showCreateModal);
    document.querySelectorAll('#searchName, #searchPhone, #searchLevel').forEach(el => {
        el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * 初始化弹窗事件
 * @returns {void}
 */
function initModalEvents() {
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelModal')?.addEventListener('click', closeModal);
    document.getElementById('saveCustomer')?.addEventListener('click', saveCustomer);
    document.getElementById('customerModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

/**
 * 显示加载状态
 * @returns {void}
 */
function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

/**
 * 隐藏加载状态
 * @returns {void}
 */
function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 * @returns {void}
 */
function showError(message) {
    const container = document.querySelector('.customers-container');
    if (!container) return;
    container.innerHTML = `
        <div style="padding:40px;text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:48px;color:#EF4444;"></i>
            <p style="color:#6B7280;">${message}</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                重新加载
            </button>
        </div>
    `;
}

/**
 * 显示Toast提示
 * @param {string} message - 消息内容
 * @param {string} type - 类型
 * @returns {void}
 */
function showToast(message, type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#4F46E5'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        background: ${colors[type] || '#4F46E5'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

// 暴露全局函数
window.changePage = window.changePage;
window.editCustomer = window.editCustomer;
window.deleteCustomer = window.deleteCustomer;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default { init };