/**
 * @file brands.js
 * @module brands
 * @description 品牌管理 - 商品品牌的CRUD操作
 * 
 * @example
 * import { init } from './brands.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Brand
 * @property {string} id - 品牌ID
 * @property {string} name - 品牌名称
 * @property {string} [logo] - 品牌Logo URL
 * @property {string} [description] - 品牌描述
 * @property {string} [website] - 官网地址
 * @property {string} status - 状态 (active/inactive)
 * @property {number} productCount - 商品数量
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{brands: Brand[], searchQuery: string, statusFilter: string}} 状态 */
const state = {
    brands: [],
    searchQuery: '',
    statusFilter: 'all'
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
 * @param {string} brandId - 品牌ID
 * @returns {number} 商品数量
 */
function getProductCount(brandId) {
    try {
        const products = JSON.parse(localStorage.getItem('product_data') || '[]');
        return products.filter(p => p.brand === brandId).length;
    } catch (e) {
        return 0;
    }
}

/**
 * @private
 * @returns {Brand[]} 模拟品牌数据
 */
function getMockBrands() {
    return [
        { id: 'BRAND001', name: '3M', description: '3M汽车护理产品', website: 'https://www.3m.com', status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'BRAND002', name: 'Turtle Wax', description: '龟牌汽车护理', website: 'https://www.turtlewax.com', status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'BRAND003', name: 'Meguiars', description: '美光汽车护理', website: 'https://www.meguiars.com', status: 'active', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'BRAND004', name: 'SONAX', description: '德国索纳克斯', website: 'https://www.sonax.com', status: 'inactive', productCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
}

/**
 * @private
 * @description 加载品牌数据
 */
function loadBrands() {
    try {
        const saved = localStorage.getItem('brand_data');
        if (saved) {
            state.brands = JSON.parse(saved);
        } else {
            state.brands = getMockBrands();
            localStorage.setItem('brand_data', JSON.stringify(state.brands));
        }
    } catch (e) {
        console.warn('加载品牌数据失败:', e);
        state.brands = getMockBrands();
    }
    state.brands.forEach(b => {
        b.productCount = getProductCount(b.id);
    });
    renderBrands();
    updateStats();
}

/**
 * @private
 * @description 保存品牌数据
 */
function saveBrands() {
    try {
        localStorage.setItem('brand_data', JSON.stringify(state.brands));
    } catch (e) {
        console.warn('保存品牌数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染品牌列表
 */
function renderBrands() {
    const container = document.getElementById('brandListBody');
    if (!container) return;
    
    let filtered = state.brands;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(b => 
            b.name.toLowerCase().includes(query) ||
            (b.description && b.description.toLowerCase().includes(query))
        );
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === state.statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-tag" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无品牌数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(brand => `
        <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
            onmouseover="this.style.background='#F9FAFB'"
            onmouseout="this.style.background=''">
            <td style="padding:12px;font-weight:500;">${brand.name}</td>
            <td style="padding:12px;color:#6B7280;font-size:13px;">${brand.description || '-'}</td>
            <td style="padding:12px;font-size:13px;color:#3B82F6;">
                ${brand.website ? `<a href="${brand.website}" target="_blank" style="color:#3B82F6;text-decoration:none;">${brand.website}</a>` : '-'}
            </td>
            <td style="padding:12px;text-align:center;">
                <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:#DBEAFE;color:#1E40AF;">
                    ${brand.productCount || 0}
                </span>
            </td>
            <td style="padding:12px;">
                <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${brand.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${brand.status === 'active' ? '#065F46' : '#991B1B'};">
                    ${brand.status === 'active' ? '启用' : '禁用'}
                </span>
            </td>
            <td style="padding:12px;text-align:center;">
                <button class="btn btn-sm btn-outline" onclick="window.BrandsModule.editBrand('${brand.id}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="window.BrandsModule.viewBrand('${brand.id}')" title="查看">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.BrandsModule.deleteBrand('${brand.id}')" title="删除">
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
    const total = state.brands.length;
    const active = state.brands.filter(b => b.status === 'active').length;
    const inactive = state.brands.filter(b => b.status === 'inactive').length;
    const totalProducts = state.brands.reduce((sum, b) => sum + (b.productCount || 0), 0);
    
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
 * @param {string} id - 品牌ID
 * @description 查看品牌详情
 */
function viewBrand(id) {
    const brand = state.brands.find(b => b.id === id);
    if (!brand) {
        showToast('品牌不存在', 'error');
        return;
    }
    
    alert(`品牌详情：
名称: ${brand.name}
ID: ${brand.id}
状态: ${brand.status === 'active' ? '启用' : '禁用'}
描述: ${brand.description || '无'}
官网: ${brand.website || '无'}
商品数量: ${brand.productCount || 0}`);
}

/**
 * @private
 * @param {string} id - 品牌ID
 * @description 编辑品牌
 */
function editBrand(id) {
    const brand = state.brands.find(b => b.id === id);
    if (!brand) {
        showToast('品牌不存在', 'error');
        return;
    }
    
    const name = prompt('品牌名称：', brand.name);
    if (name === null) return;
    if (!name.trim()) {
        showToast('品牌名称不能为空', 'warning');
        return;
    }
    
    const description = prompt('品牌描述：', brand.description || '') || '';
    const website = prompt('官网地址：', brand.website || '') || '';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    brand.name = name.trim();
    brand.description = description;
    brand.website = website;
    brand.status = status ? 'active' : 'inactive';
    brand.updatedAt = new Date().toISOString();
    
    saveBrands();
    renderBrands();
    updateStats();
    showToast('品牌已更新: ' + brand.name, 'success');
}

/**
 * @private
 * @param {string} id - 品牌ID
 * @description 删除品牌
 */
function deleteBrand(id) {
    const brand = state.brands.find(b => b.id === id);
    if (!brand) {
        showToast('品牌不存在', 'error');
        return;
    }
    
    if ((brand.productCount || 0) > 0) {
        if (!confirm(`品牌 "${brand.name}" 下还有 ${brand.productCount} 个商品，确定删除？`)) return;
    } else if (!confirm(`确认删除品牌 "${brand.name}"？`)) return;
    
    state.brands = state.brands.filter(b => b.id !== id);
    saveBrands();
    renderBrands();
    updateStats();
    showToast('品牌已删除: ' + brand.name, 'success');
}

/**
 * @private
 * @description 新增品牌
 */
function newBrand() {
    const name = prompt('品牌名称：');
    if (name === null) return;
    if (!name.trim()) {
        showToast('品牌名称不能为空', 'warning');
        return;
    }
    
    const description = prompt('品牌描述：') || '';
    const website = prompt('官网地址：') || '';
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    const newId = 'BRAND' + String(state.brands.length + 1).padStart(3, '0');
    const brand = {
        id: newId,
        name: name.trim(),
        description: description,
        website: website,
        status: status ? 'active' : 'inactive',
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.brands.push(brand);
    saveBrands();
    renderBrands();
    updateStats();
    showToast('品牌已创建: ' + brand.name, 'success');
}

/**
 * @private
 * @description 搜索品牌
 */
function searchBrands(query) {
    state.searchQuery = query;
    renderBrands();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    renderBrands();
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
    renderBrands();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadBrands();
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
                searchBrands(this.value);
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
    
    const refreshBtn = document.getElementById('refreshBrands');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newBrand');
    if (newBtn) {
        newBtn.addEventListener('click', newBrand);
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🏷️ 品牌管理 初始化...');
    
    if (options?.data) {
        state.brands = options.data;
        saveBrands();
    } else {
        loadBrands();
    }
    
    updateStats();
    bindEvents();
    
    window.BrandsModule = {
        state,
        loadBrands,
        renderBrands,
        updateStats,
        viewBrand,
        editBrand,
        deleteBrand,
        newBrand,
        searchBrands,
        applyFilters,
        resetFilters,
        refresh,
        saveBrands
    };
    
    console.log('✅ 品牌管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadBrands,
    viewBrand,
    editBrand,
    deleteBrand,
    newBrand,
    searchBrands,
    refresh,
    saveBrands
};