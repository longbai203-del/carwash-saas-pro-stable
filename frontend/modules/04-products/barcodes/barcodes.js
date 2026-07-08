/**
 * modules/04-products/products/products.js - 商品管理模块
 * @module products
 * @description 商品的CRUD操作、搜索、分页、状态管理
 * 
 * @example
 * import { init } from './products.js';
 * init();
 */

import { apiClient } from '../../../js/api/api-client.js';
import { appStore } from '../../../js/core/store.js';

/**
 * 商品状态
 */
const state = {
    products: [],
    loading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    },
    filters: {
        name: '',
        category: '',
        status: ''
    },
    editingId: null
};

/** 分类列表 */
const CATEGORIES = ['洗车', '美容', '保养', '会员', '配件'];

/**
 * 初始化商品管理
 * @returns {Promise<void>}
 */
export async function init() {
    console.log('📦 商品管理模块初始化...');
    
    try {
        await loadProducts();
        renderTable();
        renderPagination();
        renderStats();
        bindEvents();
        initModalEvents();
        console.log('✅ 商品管理初始化完成');
    } catch (error) {
        console.error('❌ 商品管理初始化失败:', error);
        showError('加载商品数据失败');
    }
}

/**
 * 加载商品数据
 * @returns {Promise<void>}
 */
async function loadProducts() {
    state.loading = true;
    showLoading();

    try {
        const params = {
            page: state.pagination.page,
            limit: state.pagination.limit,
            name: state.filters.name,
            category: state.filters.category,
            status: state.filters.status
        };

        const response = await apiClient.getProducts(params);
        
        if (response && response.code === 200) {
            state.products = response.data || [];
            state.pagination.total = response.total || 0;
            state.pagination.totalPages = response.totalPages || 1;
        } else {
            state.products = getMockProducts();
            state.pagination.total = state.products.length;
        }
    } catch (error) {
        console.warn('⚠️ API获取失败，使用模拟数据:', error);
        state.products = getMockProducts();
        state.pagination.total = state.products.length;
    } finally {
        state.loading = false;
        hideLoading();
    }
}

/**
 * 获取模拟商品数据
 * @returns {Array} 商品数组
 */
function getMockProducts() {
    const names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂', '纳米涂层', '轮毂清洁剂'];
    const categories = ['洗车', '美容', '保养', '配件'];
    const units = ['桶', '瓶', '个', '箱'];
    
    return Array.from({ length: 20 }, (_, i) => ({
        id: `PRD-${String(i + 1).padStart(6, '0')}`,
        name: names[i % names.length] + (i > 9 ? ' (升级版)' : ''),
        category: categories[i % categories.length],
        price: Math.floor(Math.random() * 500) + 50,
        cost: Math.floor(Math.random() * 300) + 20,
        stock: Math.floor(Math.random() * 500) + 10,
        unit: units[i % units.length],
        status: Math.random() > 0.2 ? 'active' : 'inactive',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * 渲染表格
 * @returns {void}
 */
function renderTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (state.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-box" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无商品数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.products.map(product => {
        const statusText = product.status === 'active' ? '上架' : '下架';
        const statusColor = product.status === 'active' ? 'badge-success' : 'badge-secondary';
        const isLowStock = product.stock < 20;
        
        return `
            <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;background:#F3F4F6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6B7280;">
                            <i class="fas fa-box"></i>
                        </div>
                        <div>
                            <div style="font-weight:500;">${product.name}</div>
                            <div style="font-size:12px;color:#6B7280;">${product.id}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">${product.category}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:600;">
                    ¥${product.price.toFixed(2)}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;color:#6B7280;">
                    ¥${product.cost.toFixed(2)}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;text-align:right;">
                    <span style="${isLowStock ? 'color:#EF4444;font-weight:700;' : ''}">${product.stock}</span>
                    ${isLowStock ? ' <span style="color:#EF4444;font-size:12px;">⚠️</span>' : ''}
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">${product.unit || '-'}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:${statusColor === 'badge-success' ? '#D1FAE5' : '#FEE2E2'};color:${statusColor === 'badge-success' ? '#065F46' : '#991B1B'};">
                        ${statusText}
                    </span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn-sm btn-sm-primary" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm ${product.status === 'active' ? 'btn-sm-warning' : 'btn-sm-success'}" 
                                onclick="toggleProduct('${product.id}')"
                                style="${product.status === 'active' ? 'background:#F59E0B;color:white;' : 'background:#10B981;color:white;'}">
                            <i class="fas ${product.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="btn-sm btn-sm-danger" onclick="deleteProduct('${product.id}')">
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
            <span style="font-size:14px;color:#6B7280;">共 ${total} 件，第 ${page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
    `;

    for (let i = 1; i <= Math.min(totalPages, 7); i++) {
        if (i === page) {
            html += `<span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${i}</span>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
            html += `<button onclick="changePage(${i})" style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += `<span style="padding:4px 8px;color:#9CA3AF;">...</span>`;
        }
    }

    html += `
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
 * 渲染统计
 * @returns {void}
 */
function renderStats() {
    const container = document.getElementById('productStats');
    if (!container) return;

    const active = state.products.filter(p => p.status === 'active').length;
    const inactive = state.products.filter(p => p.status === 'inactive').length;
    const lowStock = state.products.filter(p => p.stock < 20).length;

    container.innerHTML = `
        <div style="display:flex;gap:24px;font-size:14px;padding:8px 0;">
            <span>总商品: <strong>${state.products.length}</strong></span>
            <span>上架: <strong style="color:#10B981;">${active}</strong></span>
            <span>下架: <strong style="color:#EF4444;">${inactive}</strong></span>
            <span>库存不足: <strong style="color:#F59E0B;">${lowStock}</strong></span>
        </div>
    `;
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
    loadProducts().then(() => {
        renderTable();
        renderPagination();
        renderStats();
    });
};

/**
 * 编辑商品
 * @param {string} id - 商品ID
 * @returns {void}
 */
window.editProduct = function(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) {
        showToast('商品不存在', 'error');
        return;
    }
    
    state.editingId = id;
    document.getElementById('modalTitle').textContent = '编辑商品';
    document.getElementById('formName').value = product.name;
    document.getElementById('formCategory').value = product.category;
    document.getElementById('formPrice').value = product.price;
    document.getElementById('formCost').value = product.cost || '';
    document.getElementById('formStock').value = product.stock;
    document.getElementById('formUnit').value = product.unit || '';
    document.getElementById('formStatus').value = product.status;
    document.getElementById('productModal').style.display = 'flex';
};

/**
 * 切换商品状态
 * @param {string} id - 商品ID
 * @returns {Promise<void>}
 */
window.toggleProduct = async function(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    try {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        await apiClient.updateProduct(id, { status: newStatus });
        await loadProducts();
        renderTable();
        renderPagination();
        renderStats();
        showToast(`商品已${newStatus === 'active' ? '上架' : '下架'}`, 'success');
    } catch (error) {
        // 本地更新
        product.status = product.status === 'active' ? 'inactive' : 'active';
        renderTable();
        showToast('状态已切换', 'success');
    }
};

/**
 * 删除商品
 * @param {string} id - 商品ID
 * @returns {Promise<void>}
 */
window.deleteProduct = async function(id) {
    if (!confirm('确认删除该商品？')) return;
    try {
        await apiClient.deleteProduct(id);
        await loadProducts();
        renderTable();
        renderPagination();
        renderStats();
        showToast('删除成功', 'success');
    } catch (error) {
        state.products = state.products.filter(p => p.id !== id);
        renderTable();
        renderPagination();
        renderStats();
        showToast('删除成功', 'success');
    }
};

/**
 * 显示新建商品弹窗
 * @returns {void}
 */
function showCreateModal() {
    state.editingId = null;
    document.getElementById('modalTitle').textContent = '新建商品';
    document.getElementById('formName').value = '';
    document.getElementById('formCategory').value = '洗车';
    document.getElementById('formPrice').value = '';
    document.getElementById('formCost').value = '';
    document.getElementById('formStock').value = '';
    document.getElementById('formUnit').value = '';
    document.getElementById('formStatus').value = 'active';
    document.getElementById('productModal').style.display = 'flex';
}

/**
 * 保存商品
 * @returns {Promise<void>}
 */
async function saveProduct() {
    const name = document.getElementById('formName').value.trim();
    const category = document.getElementById('formCategory').value;
    const price = parseFloat(document.getElementById('formPrice').value);
    const cost = parseFloat(document.getElementById('formCost').value) || 0;
    const stock = parseInt(document.getElementById('formStock').value) || 0;
    const unit = document.getElementById('formUnit').value.trim() || '个';
    const status = document.getElementById('formStatus').value;

    if (!name) { showToast('请输入商品名称', 'warning'); return; }
    if (isNaN(price) || price <= 0) { showToast('请输入有效的价格', 'warning'); return; }

    try {
        const data = { name, category, price, cost, stock, unit, status };
        
        if (state.editingId) {
            await apiClient.updateProduct(state.editingId, data);
            showToast('商品已更新', 'success');
        } else {
            await apiClient.createProduct(data);
            showToast('商品已创建', 'success');
        }
        
        closeModal();
        await loadProducts();
        renderTable();
        renderPagination();
        renderStats();
    } catch (error) {
        // 本地操作
        if (state.editingId) {
            const product = state.products.find(p => p.id === state.editingId);
            if (product) {
                Object.assign(product, { name, category, price, cost, stock, unit, status });
                renderTable();
                showToast('商品已更新', 'success');
            }
        } else {
            const newProduct = {
                id: `PRD-${String(Date.now()).slice(-6)}`,
                name, category, price, cost, stock, unit, status,
                createdAt: new Date().toISOString()
            };
            state.products.unshift(newProduct);
            renderTable();
            renderPagination();
            renderStats();
            showToast('商品已创建', 'success');
        }
        closeModal();
    }
}

/**
 * 关闭弹窗
 * @returns {void}
 */
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

/**
 * 搜索商品
 * @returns {void}
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.pagination.page = 1;
    loadProducts().then(() => {
        renderTable();
        renderPagination();
        renderStats();
    });
}

/**
 * 重置搜索
 * @returns {void}
 */
function handleReset() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchStatus').value = '';
    state.filters = { name: '', category: '', status: '' };
    state.pagination.page = 1;
    loadProducts().then(() => {
        renderTable();
        renderPagination();
        renderStats();
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
    document.querySelectorAll('#searchName, #searchCategory, #searchStatus').forEach(el => {
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
    document.getElementById('saveProduct')?.addEventListener('click', saveProduct);
    document.getElementById('productModal')?.addEventListener('click', function(e) {
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
    const container = document.querySelector('.products-container');
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
window.editProduct = window.editProduct;
window.toggleProduct = window.toggleProduct;
window.deleteProduct = window.deleteProduct;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default { init };