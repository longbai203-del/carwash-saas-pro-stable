/**
 * @file modifiers.js
 * @module modifiers
 * @description 附加项管理 - 商品附加项/选项的CRUD操作（如：洗车附加服务、增值选项）
 * 
 * @example
 * import { init } from './modifiers.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ModifierOption
 * @property {string} id - 选项ID
 * @property {string} name - 选项名称
 * @property {number} price - 附加价格
 * @property {number} [sortOrder] - 排序
 */

/**
 * @typedef {Object} Modifier
 * @property {string} id - 附加项ID
 * @property {string} name - 附加项名称
 * @property {string} [description] - 附加项描述
 * @property {string} type - 类型 (single/multiple/required)
 * @property {ModifierOption[]} options - 选项列表
 * @property {string} status - 状态 (active/inactive)
 * @property {number} [minSelect] - 最少选择数
 * @property {number} [maxSelect] - 最多选择数
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} ModifierState
 * @property {Modifier[]} modifiers - 附加项列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} typeFilter - 类型筛选
 * @property {string} statusFilter - 状态筛选
 */

/** @type {ModifierState} 状态 */
const state = {
    modifiers: [],
    searchQuery: '',
    typeFilter: 'all',
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
 * @returns {Modifier[]} 模拟附加项数据
 */
function getMockModifiers() {
    return [
        {
            id: 'MOD001',
            name: '洗车附加服务',
            description: '洗车时可选的附加服务',
            type: 'multiple',
            options: [
                { id: 'OPT001', name: '臭氧消毒', price: 68, sortOrder: 1 },
                { id: 'OPT002', name: '真皮护理', price: 88, sortOrder: 2 },
                { id: 'OPT003', name: '轮毂清洗', price: 48, sortOrder: 3 }
            ],
            minSelect: 0,
            maxSelect: 3,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'MOD002',
            name: '美容套餐选择',
            description: '美容服务套餐选择',
            type: 'single',
            options: [
                { id: 'OPT004', name: '基础美容', price: 128, sortOrder: 1 },
                { id: 'OPT005', name: '高级美容', price: 228, sortOrder: 2 },
                { id: 'OPT006', name: '至尊美容', price: 388, sortOrder: 3 }
            ],
            minSelect: 1,
            maxSelect: 1,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'MOD003',
            name: '保养附加项',
            description: '保养服务的附加项目',
            type: 'required',
            options: [
                { id: 'OPT007', name: '机油更换', price: 158, sortOrder: 1 },
                { id: 'OPT008', name: '三滤更换', price: 98, sortOrder: 2 }
            ],
            minSelect: 1,
            maxSelect: 2,
            status: 'inactive',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
}

/**
 * @private
 * @description 加载附加项数据
 */
function loadModifiers() {
    try {
        const saved = localStorage.getItem('modifier_data');
        if (saved) {
            state.modifiers = JSON.parse(saved);
        } else {
            state.modifiers = getMockModifiers();
            localStorage.setItem('modifier_data', JSON.stringify(state.modifiers));
        }
    } catch (e) {
        console.warn('加载附加项数据失败:', e);
        state.modifiers = getMockModifiers();
    }
    renderModifiers();
    updateStats();
}

/**
 * @private
 * @description 保存附加项数据
 */
function saveModifiers() {
    try {
        localStorage.setItem('modifier_data', JSON.stringify(state.modifiers));
    } catch (e) {
        console.warn('保存附加项数据失败:', e);
    }
}

/**
 * @private
 * @param {string} type - 类型代码
 * @returns {string} 类型标签
 */
function getTypeLabel(type) {
    const map = {
        'single': '单选',
        'multiple': '多选',
        'required': '必选'
    };
    return map[type] || type;
}

/**
 * @private
 * @param {string} type - 类型代码
 * @returns {string} 类型颜色
 */
function getTypeColor(type) {
    const map = {
        'single': '#3B82F6',
        'multiple': '#10B981',
        'required': '#F59E0B'
    };
    return map[type] || '#6B7280';
}

/**
 * @private
 * @param {string} type - 类型代码
 * @returns {string} 类型背景色
 */
function getTypeBg(type) {
    const map = {
        'single': '#DBEAFE',
        'multiple': '#D1FAE5',
        'required': '#FEF3C7'
    };
    return map[type] || '#F3F4F6';
}

/**
 * @private
 * @description 渲染附加项列表
 */
function renderModifiers() {
    const container = document.getElementById('modifierListBody');
    if (!container) return;
    
    let filtered = state.modifiers;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(m => 
            m.name.toLowerCase().includes(query) ||
            (m.description && m.description.toLowerCase().includes(query))
        );
    }
    
    if (state.typeFilter !== 'all') {
        filtered = filtered.filter(m => m.type === state.typeFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(m => m.status === state.statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-plus-circle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无附加项数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(modifier => {
        const typeLabel = getTypeLabel(modifier.type);
        const typeColor = getTypeColor(modifier.type);
        const typeBg = getTypeBg(modifier.type);
        const optionsCount = modifier.options ? modifier.options.length : 0;
        const priceRange = modifier.options && modifier.options.length > 0
            ? '¥' + formatCurrency(Math.min(...modifier.options.map(o => o.price))) + 
              ' ~ ¥' + formatCurrency(Math.max(...modifier.options.map(o => o.price)))
            : '-';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:12px;">
                    <div style="font-weight:500;">${modifier.name}</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">${modifier.description || '-'}</div>
                </td>
                <td style="padding:12px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${typeBg};color:${typeColor};">
                        ${typeLabel}
                    </span>
                </td>
                <td style="padding:12px;text-align:center;font-size:13px;">${optionsCount}</td>
                <td style="padding:12px;font-size:13px;color:#4F46E5;">${priceRange}</td>
                <td style="padding:12px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${modifier.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${modifier.status === 'active' ? '#065F46' : '#991B1B'};">
                        ${modifier.status === 'active' ? '启用' : '禁用'}
                    </span>
                </td>
                <td style="padding:12px;text-align:center;">
                    <button class="btn btn-sm btn-outline" onclick="window.ModifiersModule.viewModifier('${modifier.id}')" title="查看">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.ModifiersModule.editModifier('${modifier.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.ModifiersModule.deleteModifier('${modifier.id}')" title="删除">
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
    const total = state.modifiers.length;
    const active = state.modifiers.filter(m => m.status === 'active').length;
    const inactive = state.modifiers.filter(m => m.status === 'inactive').length;
    const single = state.modifiers.filter(m => m.type === 'single').length;
    const multiple = state.modifiers.filter(m => m.type === 'multiple').length;
    const required = state.modifiers.filter(m => m.type === 'required').length;
    const totalOptions = state.modifiers.reduce((sum, m) => sum + (m.options ? m.options.length : 0), 0);
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statInactive': inactive,
        'statSingle': single,
        'statMultiple': multiple,
        'statRequired': required,
        'statTotalOptions': totalOptions
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 附加项ID
 * @description 查看附加项详情
 */
function viewModifier(id) {
    const modifier = state.modifiers.find(m => m.id === id);
    if (!modifier) {
        showToast('附加项不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('modifierDetailModal');
    if (modal) {
        const content = document.getElementById('modifierDetailContent');
        if (content) {
            const typeLabel = getTypeLabel(modifier.type);
            const optionsHtml = modifier.options && modifier.options.length > 0
                ? modifier.options.map(o => 
                    `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F3F4F6;font-size:13px;">
                        <span>${o.name}</span>
                        <span style="color:#4F46E5;">¥${formatCurrency(o.price)}</span>
                    </div>`
                ).join('')
                : '<div style="color:#9CA3AF;font-size:13px;">暂无选项</div>';
            
            content.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="grid-column:span 2;">
                        <h3 style="margin:0 0 4px 0;">${modifier.name}</h3>
                        <div style="color:#6B7280;font-size:14px;">${modifier.description || '无描述'}</div>
                    </div>
                    <div><span style="color:#6B7280;">附加项ID</span><br><strong>${modifier.id}</strong></div>
                    <div><span style="color:#6B7280;">类型</span><br><span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${getTypeBg(modifier.type)};color:${getTypeColor(modifier.type)};">${typeLabel}</span></div>
                    <div><span style="color:#6B7280;">最少选择</span><br><strong>${modifier.minSelect || 0}</strong></div>
                    <div><span style="color:#6B7280;">最多选择</span><br><strong>${modifier.maxSelect || '不限'}</strong></div>
                    <div><span style="color:#6B7280;">状态</span><br><span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${modifier.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${modifier.status === 'active' ? '#065F46' : '#991B1B'};">${modifier.status === 'active' ? '启用' : '禁用'}</span></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">创建时间</span><br><strong>${formatDate(modifier.createdAt)}</strong></div>
                    <div style="grid-column:span 2;">
                        <span style="color:#6B7280;">选项列表</span>
                        <div style="margin-top:4px;background:#F9FAFB;border-radius:6px;padding:8px 12px;">
                            ${optionsHtml}
                        </div>
                    </div>
                </div>
            `;
        }
        modal.style.display = 'flex';
        return;
    }
    
    // 降级方案
    const typeLabel = getTypeLabel(modifier.type);
    const optionsStr = modifier.options && modifier.options.length > 0
        ? modifier.options.map(o => `${o.name} (+¥${formatCurrency(o.price)})`).join(' | ')
        : '无选项';
    
    alert(`附加项详情：
名称: ${modifier.name}
ID: ${modifier.id}
类型: ${typeLabel}
状态: ${modifier.status === 'active' ? '启用' : '禁用'}
描述: ${modifier.description || '无'}
最少选择: ${modifier.minSelect || 0}
最多选择: ${modifier.maxSelect || '不限'}
选项: ${optionsStr}`);
}

/**
 * @private
 * @param {string} id - 附加项ID
 * @description 编辑附加项
 */
function editModifier(id) {
    const modifier = state.modifiers.find(m => m.id === id);
    if (!modifier) {
        showToast('附加项不存在', 'error');
        return;
    }
    
    const name = prompt('附加项名称：', modifier.name);
    if (name === null) return;
    if (!name.trim()) {
        showToast('附加项名称不能为空', 'warning');
        return;
    }
    
    const description = prompt('附加项描述：', modifier.description || '') || '';
    const typeOptions = ['1. single (单选)', '2. multiple (多选)', '3. required (必选)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, 
        modifier.type === 'single' ? '1' : modifier.type === 'multiple' ? '2' : '3'));
    const types = ['single', 'multiple', 'required'];
    const type = types[typeIdx - 1] || modifier.type;
    
    const minSelect = parseInt(prompt('最少选择数：', modifier.minSelect || '0'));
    const maxSelect = prompt('最多选择数（空为不限）：', modifier.maxSelect || '') || '';
    
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    modifier.name = name.trim();
    modifier.description = description;
    modifier.type = type;
    modifier.minSelect = isNaN(minSelect) ? 0 : minSelect;
    modifier.maxSelect = maxSelect === '' ? null : parseInt(maxSelect);
    modifier.status = status ? 'active' : 'inactive';
    modifier.updatedAt = new Date().toISOString();
    
    saveModifiers();
    renderModifiers();
    updateStats();
    showToast('附加项已更新: ' + modifier.name, 'success');
}

/**
 * @private
 * @param {string} id - 附加项ID
 * @description 删除附加项
 */
function deleteModifier(id) {
    const modifier = state.modifiers.find(m => m.id === id);
    if (!modifier) {
        showToast('附加项不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除附加项 "${modifier.name}"？\n将同时删除 ${modifier.options ? modifier.options.length : 0} 个选项。`)) return;
    
    state.modifiers = state.modifiers.filter(m => m.id !== id);
    saveModifiers();
    renderModifiers();
    updateStats();
    showToast('附加项已删除: ' + modifier.name, 'success');
}

/**
 * @private
 * @description 新增附加项
 */
function newModifier() {
    const name = prompt('附加项名称：');
    if (name === null) return;
    if (!name.trim()) {
        showToast('附加项名称不能为空', 'warning');
        return;
    }
    
    const description = prompt('附加项描述：') || '';
    const typeOptions = ['1. single (单选)', '2. multiple (多选)', '3. required (必选)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
    const types = ['single', 'multiple', 'required'];
    const type = types[typeIdx - 1] || 'single';
    
    const minSelect = parseInt(prompt('最少选择数：', '0'));
    const maxSelect = prompt('最多选择数（空为不限）：', '') || '';
    
    // 添加选项
    const options = [];
    while (true) {
        const optName = prompt('选项名称（输入空结束）：');
        if (!optName) break;
        const optPrice = parseFloat(prompt('选项价格：', '0'));
        if (isNaN(optPrice) || optPrice < 0) {
            showToast('请输入有效价格', 'warning');
            continue;
        }
        options.push({
            id: 'OPT' + String(Date.now()).slice(-6) + String(options.length + 1).padStart(2, '0'),
            name: optName,
            price: optPrice,
            sortOrder: options.length + 1
        });
    }
    
    if (options.length === 0) {
        showToast('至少需要一个选项', 'error');
        return;
    }
    
    const status = confirm('是否启用？\n点击"确定"启用，点击"取消"禁用');
    
    const modifier = {
        id: 'MOD' + String(state.modifiers.length + 1).padStart(3, '0'),
        name: name.trim(),
        description: description,
        type: type,
        options: options,
        minSelect: isNaN(minSelect) ? 0 : minSelect,
        maxSelect: maxSelect === '' ? null : parseInt(maxSelect),
        status: status ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.modifiers.push(modifier);
    saveModifiers();
    renderModifiers();
    updateStats();
    showToast('附加项已创建: ' + modifier.name, 'success');
}

/**
 * @private
 * @description 搜索附加项
 */
function searchModifiers(query) {
    state.searchQuery = query;
    renderModifiers();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    state.typeFilter = typeFilter ? typeFilter.value : 'all';
    state.statusFilter = statusFilter ? statusFilter.value : 'all';
    renderModifiers();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    state.typeFilter = 'all';
    state.statusFilter = 'all';
    state.searchQuery = '';
    renderModifiers();
}

/**
 * @private
 * @description 关闭详情弹窗
 */
function closeDetail() {
    const modal = document.getElementById('modifierDetailModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadModifiers();
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
                searchModifiers(this.value);
            }, 300);
        });
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshModifiers');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const newBtn = document.getElementById('newModifier');
    if (newBtn) {
        newBtn.addEventListener('click', newModifier);
    }
    
    const modal = document.getElementById('modifierDetailModal');
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
 * @param {Modifier[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('➕ 附加项管理 初始化...');
    
    if (options?.data) {
        state.modifiers = options.data;
        saveModifiers();
    } else {
        loadModifiers();
    }
    
    updateStats();
    bindEvents();
    
    window.ModifiersModule = {
        state,
        loadModifiers,
        renderModifiers,
        updateStats,
        viewModifier,
        editModifier,
        deleteModifier,
        newModifier,
        searchModifiers,
        applyFilters,
        resetFilters,
        closeDetail,
        refresh,
        saveModifiers,
        getTypeLabel
    };
    
    console.log('✅ 附加项管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadModifiers,
    viewModifier,
    editModifier,
    deleteModifier,
    newModifier,
    searchModifiers,
    refresh,
    saveModifiers
};