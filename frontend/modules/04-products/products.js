/**
 * @file products.js
 * @module products
 * @description 商品管理 - 商品列表、新增、编辑、删除
 * 
 * @example
 * import { init } from './products.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Product
 * @property {string} id - 商品ID
 * @property {string} name - 商品名称
 * @property {number} price - 商品价格
 * @property {string} category - 分类
 * @property {number} stock - 库存数量
 * @property {string} status - 状态 (active/inactive)
 * @property {string} [description] - 商品描述
 * @property {string} [icon] - 图标
 * @property {string} [color] - 颜色
 * @property {string} [brand] - 品牌
 * @property {string} [sku] - SKU编码
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} ProductState
 * @property {Product[]} products - 商品列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} categoryFilter - 分类筛选
 * @property {string} statusFilter - 状态筛选
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 * @property {number} total - 总数
 * @property {boolean} loading - 加载状态
 */

/** @type {ProductState} 状态 */
const state = {
    products: [],
    searchQuery: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 20,
    total: 0,
    loading: false
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
 * @returns {Product[]} 模拟商品数据
 * @description 获取模拟商品数据
 */
function getMockProducts() {
    const categories = ['洗车', '美容', '保养', '会员'];
    const statuses = ['active', 'active', 'active', 'active', 'inactive'];
    const icons = ['fa-car', 'fa-spray-can', 'fa-wax', 'fa-couch', 'fa-engine', 'fa-snowflake', 'fa-circle', 'fa-gem', 'fa-id-card'];
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#6B7280', '#EC4899', '#14B8A6'];
    const brands = ['3M', 'Turtle Wax', 'Meguiars', 'SONAX', 'CarPro'];
    
    const names = ['标准洗车', '精致洗车', '深度清洁', '抛光打蜡', '内饰清洗', '发动机清洗', '空调清洗', '轮胎养护', '玻璃镀膜', '漆面镀晶', '洗车月卡', '洗车季卡'];
    const prices = [68, 128, 268, 388, 328, 188, 158, 88, 228, 688, 398, 998];
    const stocks = [50, 30, 20, 15, 25, 40, 35, 60, 10, 5, 100, 80];
    
    const products = [];
    for (let i = 0; i < names.length; i++) {
        const catIdx = Math.floor(Math.random() * categories.length);
        const statusIdx = Math.floor(Math.random() * statuses.length);
        const brandIdx = Math.floor(Math.random() * brands.length);
        products.push({
            id: 'P' + String(i + 1).padStart(3, '0'),
            name: names[i],
            price: prices[i],
            category: categories[catIdx],
            stock: stocks[i % stocks.length],
            status: statuses[statusIdx],
            description: names[i] + '服务，专业技师操作',
            icon: icons[i % icons.length],
            color: colors[i % colors.length],
            brand: brands[brandIdx],
            sku: 'SKU-' + String(1000 + i),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return products;
}

/**
 * @private
 * @description 从API加载商品数据
 */
async function loadFromAPI() {
    try {
        const params = {
            search: state.searchQuery,
            category: state.categoryFilter !== 'all' ? state.categoryFilter : '',
            status: state.statusFilter !== 'all' ? state.statusFilter : '',
            page: state.page,
            limit: state.limit
        };
        const response = await apiClient.get('/products', params);
        if (response && response.success) {
            state.products = response.data || [];
            state.total = response.total || 0;
            return true;
        }
        return false;
    } catch (error) {
        console.warn('API加载失败:', error);
        return false;
    }
}

/**
 * @private
 * @description 加载商品数据
 */
function loadProducts() {
    state.loading = true;
    
    // 尝试从API加载
    loadFromAPI().then(success => {
        if (!success) {
            // 降级到本地存储
            try {
                const saved = localStorage.getItem('product_data');
                if (saved) {
                    state.products = JSON.parse(saved);
                } else {
                    state.products = getMockProducts();
                    localStorage.setItem('product_data', JSON.stringify(state.products));
                }
                state.total = state.products.length;
            } catch (e) {
                console.warn('加载商品数据失败:', e);
                state.products = getMockProducts();
                state.total = state.products.length;
            }
        }
        state.loading = false;
        renderProducts();
        updateStats();
    });
}

/**
 * @private
 * @description 保存商品数据到本地
 */
function saveProducts() {
    try {
        localStorage.setItem('product_data', JSON.stringify(state.products));
    } catch (e) {
        console.warn('保存商品数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染商品列表
 */
function renderProducts() {
    const container = document.getElementById('productListBody');
    if (!container) return;
    
    let filtered = state.products;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.sku && p.sku.toLowerCase().includes(query))
        );
    }
    
    if (state.categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === state.categoryFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === state.statusFilter);
    }
    
    // 分页
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = filtered.slice(start, end);
    state.total = filtered.length;
    state.totalPages = Math.ceil(state.total / state.limit);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-box-open" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    ${state.loading ? '加载中...' : '暂无商品数据'}
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = paginated.map(product => `
        <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
            onmouseover="this.style.background='#F9FAFB'"
            onmouseout="this.style.background=''">
            <td style="padding:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:${product.color}20;color:${product.color};display:flex;align-items:center;justify-content:center;font-size:16px;">
                        <i class="fas ${product.icon || 'fa-box'}"></i>
                    </div>
                    <div>
                        <div style="font-weight:500;">${product.name}</div>
                        <div style="font-size:11px;color:#9CA3AF;">${product.sku || ''}</div>
                    </div>
                </div>
            </td>
            <td style="padding:12px;">
                <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;background:#F3F4F6;color:#4B5563;">
                    ${product.category}
                </span>
            </td>
            <td style="padding:12px;font-size:12px;color:#6B7280;">${product.brand || '-'}</td>
            <td style="padding:12px;text-align:right;font-weight:600;color:#4F46E5;">¥${formatCurrency(product.price)}</td>
            <td style="padding:12px;text-align:center;">
                <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${product.stock > 20 ? '#D1FAE5' : product.stock > 5 ? '#FEF3C7' : '#FEE2E2'};color:${product.stock > 20 ? '#065F46' : product.stock > 5 ? '#92400E' : '#991B1B'};">
                    ${product.stock}
                </span>
            </td>
            <td style="padding:12px;">
                <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${product.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${product.status === 'active' ? '#065F46' : '#991B1B'};">
                    ${product.status === 'active' ? '上架' : '下架'}
                </span>
            </td>
            <td style="padding:12px;font-size:12px;color:#6B7280;">${formatDate(product.createdAt)}</td>
            <td style="padding:12px;text-align:center;">
                <button class="btn btn-sm btn-outline" onclick="window.ProductsModule.editProduct('${product.id}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="window.ProductsModule.viewProduct('${product.id}')" title="查看">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.ProductsModule.deleteProduct('${product.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const totalPages = Math.ceil(state.total / state.limit);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div style="display:flex;gap:4px;align-items:center;justify-content:center;flex-wrap:wrap;">';
    
    html += `
        <button class="btn btn-sm btn-outline" onclick="window.ProductsModule.goToPage(${state.page - 1})" 
                ${state.page <= 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button class="btn btn-sm btn-outline" onclick="window.ProductsModule.goToPage(1)">1</button>`;
        if (startPage > 2) html += '<span style="color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}" 
                    onclick="window.ProductsModule.goToPage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="color:#9CA3AF;">...</span>';
        html += `<button class="btn btn-sm btn-outline" onclick="window.ProductsModule.goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    html += `
        <button class="btn btn-sm btn-outline" onclick="window.ProductsModule.goToPage(${state.page + 1})" 
                ${state.page >= totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += `<span style="font-size:12px;color:#6B7280;margin-left:8px;">共 ${state.total} 条</span>`;
    html += '</div>';
    container.innerHTML = html;
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.products.length;
    const active = state.products.filter(p => p.status === 'active').length;
    const inactive = state.products.filter(p => p.status === 'inactive').length;
    const lowStock = state.products.filter(p => p.stock < 10 && p.status === 'active').length;
    const totalValue = state.products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const avgPrice = total > 0 ? state.products.reduce((sum, p) => sum + p.price, 0) / total : 0;
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statInactive': inactive,
        'statLowStock': lowStock,
        'statTotalValue': '¥' + formatCurrency(totalValue),
        'statAvgPrice': '¥' + formatCurrency(avgPrice)
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 商品ID
 * @description 查看商品详情
 */
function viewProduct(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) {
        showToast('商品不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        const content = document.getElementById('productDetailContent');
        if (content) {
            content.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="grid-column:span 2;text-align:center;padding:16px 0;">
                        <div style="width:64px;height:64px;border-radius:50%;background:${product.color}20;color:${product.color};display:inline-flex;align-items:center;justify-content:center;font-size:28px;">
                            <i class="fas ${product.icon || 'fa-box'}"></i>
                        </div>
                        <h3 style="margin:8px 0 0 0;">${product.name}</h3>
                        <div style="font-size:13px;color:#6B7280;">${product.sku || ''}</div>
                    </div>
                    <div><span style="color:#6B7280;">商品ID</span><br><strong>${product.id}</strong></div>
                    <div><span style="color:#6B7280;">分类</span><br><strong>${product.category}</strong></div>
                    <div><span style="color:#6B7280;">品牌</span><br><strong>${product.brand || '-'}</strong></div>
                    <div><span style="color:#6B7280;">价格</span><br><strong style="color:#4F46E5;">¥${formatCurrency(product.price)}</strong></div>
                    <div><span style="color:#6B7280;">库存</span><br><strong>${product.stock}</strong></div>
                    <div><span style="color:#6B7280;">状态</span><br><span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${product.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${product.status === 'active' ? '#065F46' : '#991B1B'};">${product.status === 'active' ? '上架' : '下架'}</span></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">描述</span><br><strong>${product.description || '无'}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">创建时间</span><br><strong>${formatDate(product.createdAt)}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">更新时间</span><br><strong>${formatDate(product.updatedAt)}</strong></div>
                </div>
            `;
        }
        modal.style.display = 'flex';
        return;
    }
    
    alert(`商品详情：
名称: ${product.name}
ID: ${product.id}
分类: ${product.category}
品牌: ${product.brand || '-'}
SKU: ${product.sku || '-'}
价格: ¥${formatCurrency(product.price)}
库存: ${product.stock}
状态: ${product.status === 'active' ? '上架' : '下架'}
描述: ${product.description || '无'}`);
}

/**
 * @private
 * @param {string} id - 商品ID
 * @description 编辑商品
 */
function editProduct(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) {
        showToast('商品不存在', 'error');
        return;
    }
    
    const name = prompt('商品名称：', product.name);
    if (name === null) return;
    if (!name.trim()) {
        showToast('商品名称不能为空', 'warning');
        return;
    }
    
    const price = parseFloat(prompt('商品价格：', product.price));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    
    const stock = parseInt(prompt('库存数量：', product.stock));
    if (isNaN(stock) || stock < 0) {
        showToast('请输入有效库存', 'error');
        return;
    }
    
    const category = prompt('分类（洗车/美容/保养/会员）：', product.category) || product.category;
    const brand = prompt('品牌：', product.brand || '') || '';
    const description = prompt('描述：', product.description || '') || '';
    const status = confirm('是否上架？\n点击"确定"上架，点击"取消"下架');
    
    product.name = name.trim();
    product.price = price;
    product.stock = stock;
    product.category = category;
    product.brand = brand;
    product.description = description;
    product.status = status ? 'active' : 'inactive';
    product.updatedAt = new Date().toISOString();
    
    saveProducts();
    renderProducts();
    updateStats();
    showToast('商品已更新: ' + product.name, 'success');
}

/**
 * @private
 * @param {string} id - 商品ID
 * @description 删除商品
 */
function deleteProduct(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) {
        showToast('商品不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除商品 "${product.name}"？`)) return;
    
    state.products = state.products.filter(p => p.id !== id);
    saveProducts();
    renderProducts();
    updateStats();
    showToast('商品已删除: ' + product.name, 'success');
}

/**
 * @private
 * @description 新增商品
 */
function newProduct() {
    const name = prompt('商品名称：');
    if (name === null) return;
    if (!name.trim()) {
        showToast('商品名称不能为空', 'warning');
        return;
    }
    
    const price = parseFloat(prompt('商品价格：', '68'));
    if (isNaN(price) || price < 0) {
        showToast('请输入有效价格', 'error');
        return;
    }
    
    const stock = parseInt(prompt('库存数量：', '10'));
    if (isNaN(stock) || stock < 0) {
        showToast('请输入有效库存', 'error');
        return;
    }
    
    const categories = ['洗车', '美容', '保养', '会员'];
    const categoryOptions = categories.map((c, i) => `${i+1}. ${c}`).join('\n');
    const categoryIdx = parseInt(prompt(`选择分类：\n${categoryOptions}`, '1'));
    const category = categories[categoryIdx - 1] || '洗车';
    
    const brand = prompt('品牌：', '') || '';
    const description = prompt('描述：', '') || '';
    const sku = prompt('SKU编码：', 'SKU-' + String(Math.floor(Math.random() * 10000)).padStart(6, '0'));
    const status = confirm('是否上架？\n点击"确定"上架，点击"取消"下架');
    
    const newId = 'P' + String(state.products.length + 1).padStart(3, '0');
    const product = {
        id: newId,
        name: name.trim(),
        price: price,
        stock: stock,
        category: category,
        brand: brand,
        sku: sku || 'SKU-' + String(1000 + state.products.length + 1),
        status: status ? 'active' : 'inactive',
        description: description,
        icon: 'fa-box',
        color: '#4F46E5',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.products.push(product);
    saveProducts();
    renderProducts();
    updateStats();
    renderPagination();
    showToast('商品已创建: ' + product.name, 'success');
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.total / state.limit);
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderProducts();
    renderPagination();
}

/**
 * @private
 * @description 搜索商品
 */
function searchProducts(query) {
    state.searchQuery = query;
    state.page = 1;
    loadProducts();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    state.categoryFilter = categoryFilter ? categoryFilter.value : 'all';
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    state.page = 1;
    loadProducts();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) categoryFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    state.categoryFilter = 'all';
    state.statusFilter = 'all';
    state.searchQuery = '';
    state.page = 1;
    loadProducts();
}

/**
 * @private
 * @description 关闭详情弹窗
 */
function closeDetail() {
    const modal = document.getElementById('productDetailModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadProducts();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 导出商品数据
 */
function exportData() {
    if (state.products.length === 0) {
        showToast('暂无数据可导出', 'warning');
        return;
    }
    
    const headers = ['商品ID', '名称', '分类', '品牌', 'SKU', '价格', '库存', '状态', '创建时间'];
    const rows = state.products.map(p => [
        p.id,
        p.name,
        p.category,
        p.brand || '',
        p.sku || '',
        p.price.toFixed(2),
        p.stock,
        p.status === 'active' ? '上架' : '下架',
        formatDate(p.createdAt)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '商品数据_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    showToast('数据已导出', 'success');
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
                searchProducts(this.value);
            }, 300);
        });
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshProducts');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newProduct');
    if (newBtn) {
        newBtn.addEventListener('click', newProduct);
    }
    
    const exportBtn = document.getElementById('exportProducts');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const modal = document.getElementById('productDetailModal');
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
 * @param {Product[]} options.data - 初始数据
 * @returns {Promise<void>}
 * @description 初始化商品管理
 */
export async function init(options) {
    console.log('📦 商品管理 初始化...');
    
    if (options?.data) {
        state.products = options.data;
        state.total = state.products.length;
        saveProducts();
    } else {
        loadProducts();
    }
    
    updateStats();
    bindEvents();
    renderPagination();
    
    window.ProductsModule = {
        state,
        loadProducts,
        renderProducts,
        renderPagination,
        updateStats,
        viewProduct,
        editProduct,
        deleteProduct,
        newProduct,
        goToPage,
        searchProducts,
        applyFilters,
        resetFilters,
        closeDetail,
        refresh,
        exportData,
        saveProducts
    };
    
    console.log('✅ 商品管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadProducts,
    viewProduct,
    editProduct,
    deleteProduct,
    newProduct,
    searchProducts,
    refresh,
    exportData,
    saveProducts
};