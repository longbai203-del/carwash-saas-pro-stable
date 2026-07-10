/**
 * @file categories.js
 * @module categories
 * @description 分类管理 - 商品分类的CRUD操作
 * 
 * @example
 * import { init } from './categories.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Category
 * @property {string} id - 分类ID
 * @property {string} name - 分类名称
 * @property {string} [parent] - 父分类ID
 * @property {string} [description] - 分类描述
 * @property {string} [icon] - 图标
 * @property {string} [color] - 颜色
 * @property {number} [sortOrder] - 排序
 * @property {string} status - 状态 (active/inactive)
 * @property {number} productCount - 商品数量
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} CategoryState
 * @property {Category[]} categories - 分类列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} statusFilter - 状态筛选
 * @property {Category|null} selectedCategory - 选中的分类
 */

/** @type {CategoryState} 状态 */
const state = {
    categories: [],
    searchQuery: '',
    statusFilter: 'all',
    selectedCategory: null
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @private
 * @param {string} id - 分类ID
 * @returns {number} 商品数量
 */
function getProductCount(categoryId) {
    try {
        const products = JSON.parse(localStorage.getItem('product_data') || '[]');
        return products.filter(p => p.category === categoryId || p.category === categoryId).length;
    } catch (e) {
        return 0;
    }
}

/**
 * @private
 * @returns {Category[]} 模拟分类数据
 */
function getMockCategories() {
    const icons = ['fa-car', 'fa-spray-can', 'fa-wax', 'fa-couch', 'fa-engine', 'fa-snowflake', 'fa-gem', 'fa-id-card'];
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'];
    
    return [
        { id: 'CAT001', name: '洗车', icon: 'fa-car', color: '#4F46E5', description: '各类洗车服务', sortOrder: 1, status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'CAT002', name: '美容', icon: 'fa-spray-can', color: '#10B981', description: '汽车美容服务', sortOrder: 2, status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'CAT003', name: '保养', icon: 'fa-engine', color: '#F59E0B', description: '汽车保养服务', sortOrder: 3, status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'CAT004', name: '会员', icon: 'fa-id-card', color: '#EC4899', description: '会员卡服务', sortOrder: 4, status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载分类数据
 */
function loadCategories() {
    try {
        const saved = localStorage.getItem('category_data');
        if (saved) {
            state.categories = JSON.parse(saved);
        } else {
            state.categories = getMockCategories();
            localStorage.setItem('category_data', JSON.stringify(state.categories));
        }
    } catch (e) {
        console.warn('加载分类数据失败:', e);
        state.categories = getMockCategories();
    }
    // 更新商品数量
    state.categories.forEach(c => {
        c.productCount = getProductCount(c.id);
    });
    renderCategories();
    updateStats();
}

/**
 * @private
 * @description 保存分类数据
 */
function saveCategories() {
    try {
        localStorage.setItem('category_data', JSON.stringify(state.categories));
    } catch (e) {
        console.warn('保存分类数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染分类列表
 */
function renderCategories() {
    const container = document.getElementById('categoryListBody');
    if (!container) return;
    
    let filtered = state.categories;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(query) ||
            (c.description && c.description.toLowerCase().includes(query))
        );
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === state.statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-folder-open" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无分类数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(category => `
        <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
            onmouseover="this.style.background='#F9FAFB'"
            onmouseout="this.style.background=''">
            <td style="padding:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:${category.color}20;color:${category.color};display:flex;align-items:center;justify-content:center;font-size:16px;">
                        <i class="fas ${category.icon || 'fa-folder'}"></i>
                    </div>
                    <span style="font-weight:500;">${category.name}</span>
                </div>
            </td>
            <td style="padding:12px;color:#6B7280;font-size:13px;">${category.description || '-'}</td>
            <td style="padding:12px;text-align:center;">${category.sortOrder || 0}</td>
            <td style="padding:12px;text-align:center;">
                <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:#DBEAFE;color:#1E40AF;">
                    ${category.productCount || 0}
                </span>
            </td>
            <td style="padding:12px;">
                <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${category.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${category.status === 'active' ? '#065F46' : '#991B1B'};">
                    ${category.status === 'active' ? '启用' : '禁用'}
                </span>
            </td>
            <td style="padding:12px;text-align:center;">
                <button class="btn btn-sm btn-outline" onclick="window.CategoriesModule.editCategory('${category.id}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="window.CategoriesModule.viewCategory('${category.id}')" title="查看">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.CategoriesModule.deleteCategory('${category.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.categories.length;
    const active = state.categories.filter(c => c.status === 'active').length;
    const inactive = state.categories.filter(c => c.status === 'inactive').length;
    const totalProducts = state.categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statInactive': inactive,
        'statTotalProducts': totalProducts
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 分类ID
 * @description 查看分类详情
 */
function viewCategory(id) {
    const category = state.categories.find(c => c.id === id);
    if (!category) {
        showToast('分类不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('categoryDetailModal');
    if (modal) {
        const content = document.getElementById('categoryDetailContent');
        if (content) {
            content.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="grid-column:span 2;text-align:center;padding:16px 0;">
                        <div style="width:64px;height:64px;border-radius:50%;background:${category.color}20;color:${category.color};display:inline-flex;align-items:center;justify-content:center;font-size:28px;">
                            <i class="fas ${category.icon || 'fa-folder'}"></i>
                        </div>
                        <h3 style="margin:8px 0 0 0;">${category.name}</h3>
                    </div>
                    <div><span style="color:#6B7280;">分类ID</span><br><strong>${category.id}</strong></div>
                    <div><span style="color:#6B7280;">状态</span><br><span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${category.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${category.status === 'active' ? '#065F46' : '#991B1B'};">${category.status === 'active' ? '启用' : '禁用'}</span></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">描述</span><br><strong>${category.description || '无'}</strong></div>
                    <div><span style="color:#6B7280;">排序</span><br><strong>${category.sortOrder || 0}</strong></div>
                    <div><span style="color:#6B7280;">商品数量</span><br><strong>${category.productCount || 0}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">创建时间</span><br><strong>${formatDate(category.createdAt)}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">更新时间</span><br><strong>${formatDate(category.updatedAt)}</strong></div>
                </div>
            `;
        }
        modal.style.display = 'flex';
        return;
    }
    
    alert(`分类详情：
名称: ${category.name}
ID: ${category.id}
状态: ${category.status === 'active' ? '启用' : '禁用'}
描述: ${category.description || '无'}
排序: ${category.sortOrder || 0}
商品数量: ${category.productCount || 0}`);
}

/**
 * @private
 * @param {string} id - 分类ID
 * @description 编辑分类
 */
function editCategory(id) {
    const category = state.categories.find(c => c.id === id);
    if (!category) {
        showToast('分类不存在', 'error');
        return;
    }
    
    const name = prompt('分类名称：', category.name);
    if (name === null) return;
    if (!name.trim()) {
        showToast('分类名称不能为空', 'warning');
        return;
    }
    
    const description = prompt('分类描述：', category.description || '') || '';
    const sortOrder = parseInt(prompt('排序（数字越小越靠前）：', category.sortOrder || '0'));
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    category.name = name.trim();
    category.description = description;
    category.sortOrder = isNaN(sortOrder) ? 0 : sortOrder;
    category.status = status ? 'active' : 'inactive';
    category.updatedAt = new Date().toISOString();
    
    saveCategories();
    renderCategories();
    updateStats();
    showToast('分类已更新: ' + category.name, 'success');
}

/**
 * @private
 * @param {string} id - 分类ID
 * @description 删除分类
 */
function deleteCategory(id) {
    const category = state.categories.find(c => c.id === id);
    if (!category) {
        showToast('分类不存在', 'error');
        return;
    }
    
    if ((category.productCount || 0) > 0) {
        if (!confirm(`分类 "${category.name}" 下还有 ${category.productCount} 个商品，确定删除？`)) return;
    } else if (!confirm(`确认删除分类 "${category.name}"？`)) return;
    
    state.categories = state.categories.filter(c => c.id !== id);
    saveCategories();
    renderCategories();
    updateStats();
    showToast('分类已删除: ' + category.name, 'success');
}

/**
 * @private
 * @description 新增分类
 */
function newCategory() {
    const name = prompt('分类名称：');
    if (name === null) return;
    if (!name.trim()) {
        showToast('分类名称不能为空', 'warning');
        return;
    }
    
    const description = prompt('分类描述：') || '';
    const sortOrder = parseInt(prompt('排序（数字越小越靠前）：', '0'));
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    const newId = 'CAT' + String(state.categories.length + 1).padStart(3, '0');
    const category = {
        id: newId,
        name: name.trim(),
        description: description,
        icon: 'fa-folder',
        color: '#4F46E5',
        sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
        status: status ? 'active' : 'inactive',
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.categories.push(category);
    saveCategories();
    renderCategories();
    updateStats();
    showToast('分类已创建: ' + category.name, 'success');
}

/**
 * @private
 * @description 搜索分类
 */
function searchCategories(query) {
    state.searchQuery = query;
    renderCategories();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    renderCategories();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    state.statusFilter = 'all';
    state.searchQuery = '';
    renderCategories();
}

/**
 * @private
 * @description 关闭详情弹窗
 */
function closeDetail() {
    const modal = document.getElementById('categoryDetailModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadCategories();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchCategories(this.value);
            }, 300);
        });
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshCategories');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newCategory');
    if (newBtn) {
        newBtn.addEventListener('click', newCategory);
    }
    
    const modal = document.getElementById('categoryDetailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDetail();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDetail();
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📁 分类管理 初始化...');
    
    if (options?.data) {
        state.categories = options.data;
        saveCategories();
    } else {
        loadCategories();
    }
    
    updateStats();
    bindEvents();
    
    window.CategoriesModule = {
        state,
        loadCategories,
        renderCategories,
        updateStats,
        viewCategory,
        editCategory,
        deleteCategory,
        newCategory,
        searchCategories,
        applyFilters,
        resetFilters,
        closeDetail,
        refresh,
        saveCategories,
        getProductCount
    };
    
    console.log('✅ 分类管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCategories,
    viewCategory,
    editCategory,
    deleteCategory,
    newCategory,
    searchCategories,
    refresh,
    saveCategories
};