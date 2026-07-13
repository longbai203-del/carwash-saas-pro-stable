/**
 * @file variants.js
 * @module variants
 * @description 产品变体管理 - 商品规格、SKU管理
 * 
 * @example
 * import { init } from './variants.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Variant
 * @property {string} id - 变体ID
 * @property {string} productId - 商品ID
 * @property {string} productName - 商品名称
 * @property {string} sku - SKU编码
 * @property {Object} attributes - 属性 (如: {color: '红色', size: 'L'})
 * @property {number} price - 价格
 * @property {number} stock - 库存
 * @property {string} status - 状态 (active/inactive)
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/** @type {{variants: Variant[], searchQuery: string, statusFilter: string}} 状态 */
const state = {
    variants: [],
    searchQuery: '',
    statusFilter: 'all'
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

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
 * @returns {Variant[]} 模拟变体数据
 */
function getMockVariants() {
    const products = ['精致洗车', '深度清洁', '抛光打蜡'];
    const colors = ['红色', '蓝色', '黑色', '白色'];
    const sizes = ['S', 'M', 'L', 'XL'];
    
    const variants = [];
    for (let i = 0; i < 8; i++) {
        const idx = i % products.length;
        variants.push({
            id: 'VAR' + String(i + 1).padStart(4, '0'),
            productId: 'P' + String(idx + 1).padStart(3, '0'),
            productName: products[idx],
            sku: 'SKU-' + String(Math.floor(Math.random() * 10000)).padStart(6, '0'),
            attributes: {
                color: colors[Math.floor(Math.random() * colors.length)],
                size: sizes[Math.floor(Math.random() * sizes.length)]
            },
            price: 68 + Math.floor(Math.random() * 200),
            stock: Math.floor(Math.random() * 50) + 5,
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return variants;
}

/**
 * @private
 * @description 加载变体数据
 */
function loadVariants() {
    try {
        const saved = localStorage.getItem('variant_data');
        if (saved) {
            state.variants = JSON.parse(saved);
        } else {
            state.variants = getMockVariants();
            localStorage.setItem('variant_data', JSON.stringify(state.variants));
        }
    } catch (e) {
        console.warn('加载变体数据失败:', e);
        state.variants = getMockVariants();
    }
    renderVariants();
    updateStats();
}

/**
 * @private
 * @description 保存变体数据
 */
function saveVariants() {
    try {
        localStorage.setItem('variant_data', JSON.stringify(state.variants));
    } catch (e) {
        console.warn('保存变体数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染变体列表
 */
function renderVariants() {
    const container = document.getElementById('variantListBody');
    if (!container) return;
    
    let filtered = state.variants;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
            v.productName.toLowerCase().includes(query) ||
            v.sku.toLowerCase().includes(query) ||
            Object.values(v.attributes).some(attr => String(attr).toLowerCase().includes(query))
        );
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(v => v.status === state.statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-code-branch" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无变体数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(variant => {
        const attrStr = Object.entries(variant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:12px;font-weight:500;">${variant.productName}</td>
                <td style="padding:12px;font-family:monospace;font-size:13px;">${variant.sku}</td>
                <td style="padding:12px;font-size:13px;color:#6B7280;">${attrStr}</td>
                <td style="padding:12px;text-align:right;font-weight:600;">¥${formatCurrency(variant.price)}</td>
                <td style="padding:12px;text-align:center;">${variant.stock}</td>
                <td style="padding:12px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${variant.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${variant.status === 'active' ? '#065F46' : '#991B1B'};">
                        ${variant.status === 'active' ? '启用' : '禁用'}
                    </span>
                </td>
                <td style="padding:12px;text-align:center;">
                    <button class="btn btn-sm btn-outline" onclick="window.VariantsModule.editVariant('${variant.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.VariantsModule.deleteVariant('${variant.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.variants.length;
    const active = state.variants.filter(v => v.status === 'active').length;
    const inactive = state.variants.filter(v => v.status === 'inactive').length;
    const totalStock = state.variants.reduce((sum, v) => sum + v.stock, 0);
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statInactive': inactive,
        'statTotalStock': totalStock
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 变体ID
 * @description 编辑变体
 */
function editVariant(id) {
    const variant = state.variants.find(v => v.id === id);
    if (!variant) {
        showToast('变体不存在', 'error');
        return;
    }
    
    const price = parseFloat(prompt('价格：', variant.price));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    
    const stock = parseInt(prompt('库存数量：', variant.stock));
    if (isNaN(stock) || stock < 0) {
        showToast('请输入有效库存', 'error');
        return;
    }
    
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    variant.price = price;
    variant.stock = stock;
    variant.status = status ? 'active' : 'inactive';
    variant.updatedAt = new Date().toISOString();
    
    saveVariants();
    renderVariants();
    updateStats();
    showToast('变体已更新', 'success');
}

/**
 * @private
 * @param {string} id - 变体ID
 * @description 删除变体
 */
function deleteVariant(id) {
    const variant = state.variants.find(v => v.id === id);
    if (!variant) {
        showToast('变体不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除变体 "${variant.productName} - ${variant.sku}"？`)) return;
    
    state.variants = state.variants.filter(v => v.id !== id);
    saveVariants();
    renderVariants();
    updateStats();
    showToast('变体已删除', 'success');
}

/**
 * @private
 * @description 新增变体
 */
function newVariant() {
    const productName = prompt('商品名称：');
    if (!productName) return;
    
    const sku = prompt('SKU编码：', 'SKU-' + String(Math.floor(Math.random() * 10000)).padStart(6, '0'));
    if (!sku) return;
    
    const price = parseFloat(prompt('价格：', '68'));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    
    const stock = parseInt(prompt('库存数量：', '10'));
    if (isNaN(stock) || stock < 0) {
        showToast('请输入有效库存', 'error');
        return;
    }
    
    const attrKeys = prompt('属性名称（用逗号分隔，如：颜色,尺寸）：', '颜色,尺寸');
    const attrValues = prompt('属性值（用逗号分隔，如：红色,L）：', '红色,L');
    
    const attributes = {};
    if (attrKeys && attrValues) {
        const keys = attrKeys.split(',').map(k => k.trim());
        const values = attrValues.split(',').map(v => v.trim());
        keys.forEach((key, i) => {
            if (i < values.length) {
                attributes[key] = values[i];
            }
        });
    }
    
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    const variant = {
        id: 'VAR' + String(state.variants.length + 1).padStart(4, '0'),
        productId: 'P' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
        productName: productName,
        sku: sku,
        attributes: attributes,
        price: price,
        stock: stock,
        status: status ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.variants.push(variant);
    saveVariants();
    renderVariants();
    updateStats();
    showToast('变体已创建', 'success');
}

/**
 * @private
 * @description 搜索变体
 */
function searchVariants(query) {
    state.searchQuery = query;
    renderVariants();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    renderVariants();
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
    renderVariants();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadVariants();
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
                searchVariants(this.value);
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
    
    const refreshBtn = document.getElementById('refreshVariants');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newVariant');
    if (newBtn) {
        newBtn.addEventListener('click', newVariant);
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🔀 产品变体 初始化...');
    
    if (options?.data) {
        state.variants = options.data;
        saveVariants();
    } else {
        loadVariants();
    }
    
    updateStats();
    bindEvents();
    
    window.VariantsModule = {
        state,
        loadVariants,
        renderVariants,
        updateStats,
        editVariant,
        deleteVariant,
        newVariant,
        searchVariants,
        applyFilters,
        resetFilters,
        refresh,
        saveVariants
    };
    
    console.log('✅ 产品变体 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadVariants,
    editVariant,
    deleteVariant,
    newVariant,
    searchVariants,
    refresh,
    saveVariants
};