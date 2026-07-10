/**
 * @file dashboard.js
 * @module ai
 * @description AI智能助手 - AI功能模块主页面
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast, showLoading } from '../../js/core/init.js';
import { apiClient } from '../../js/core/api-client.js';
import { formatNumber, formatDate, getRelativeTime } from '../../js/core/helpers.js';

/**
 * @typedef {Object} AIIntelligence
 * @property {string} id - ID
 * @property {string} type - 类型 (prediction/recommendation/insight/automation)
 * @property {string} title - 标题
 * @property {string} description - 描述
 * @property {number} confidence - 置信度
 * @property {string} status - 状态
 * @property {string} createdAt - 创建时间
 * @property {Object} data - 数据
 */

/** @type {{intelligences: AIIntelligence[], filteredIntelligences: AIIntelligence[], filters: {type: string, status: string}, page: number, pageSize: number, stats: Object}} */
const state = {
    intelligences: [],
    filteredIntelligences: [],
    filters: { type: '', status: '' },
    page: 1,
    pageSize: 10,
    stats: {
        total: 0,
        predictions: 0,
        recommendations: 0,
        insights: 0,
        automations: 0,
        highConfidence: 0
    }
};

/**
 * @private
 */
function getMockAI() {
    const types = ['prediction', 'recommendation', 'insight', 'automation'];
    const statuses = ['active', 'processing', 'completed', 'pending'];
    const titles = {
        prediction: ['销量预测', '客户流失预测', '库存需求预测', '收入预测'],
        recommendation: ['个性化推荐', '营销策略建议', '定价优化建议', '产品组合推荐'],
        insight: ['客户行为洞察', '市场趋势分析', '运营效率分析', '竞争分析'],
        automation: ['智能排班', '自动补货', '智能定价', '自动营销']
    };
    const descriptions = {
        prediction: '基于历史数据预测未来趋势',
        recommendation: '根据数据分析提供优化建议',
        insight: '深度分析发现业务洞察',
        automation: '自动化流程优化'
    };
    
    const result = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
        const type = types[i % types.length];
        const status = statuses[i % statuses.length];
        const typeTitles = titles[type] || ['分析'];
        const title = typeTitles[i % typeTitles.length];
        
        result.push({
            id: `AI-${String(i + 1).padStart(6, '0')}`,
            type: type,
            title: title,
            description: descriptions[type] || 'AI智能分析',
            confidence: Math.random() * 40 + 60,
            status: status,
            createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            data: {
                value: Math.floor(Math.random() * 10000),
                change: (Math.random() - 0.5) * 20,
                items: ['数据点1', '数据点2', '数据点3'].slice(0, Math.floor(Math.random() * 3) + 1)
            }
        });
    }
    
    return result;
}

/**
 * @private
 */
function loadAI() {
    try {
        const saved = localStorage.getItem('ai_intelligences');
        if (saved) {
            state.intelligences = JSON.parse(saved);
        } else {
            state.intelligences = getMockAI();
            localStorage.setItem('ai_intelligences', JSON.stringify(state.intelligences));
        }
    } catch (e) {
        state.intelligences = getMockAI();
    }
    applyFilters();
    calculateStats();
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.intelligences;
    if (state.filters.type) {
        filtered = filtered.filter(i => i.type === state.filters.type);
    }
    if (state.filters.status) {
        filtered = filtered.filter(i => i.status === state.filters.status);
    }
    state.filteredIntelligences = filtered;
}

/**
 * @private
 */
function calculateStats() {
    const total = state.intelligences.length;
    const predictions = state.intelligences.filter(i => i.type === 'prediction').length;
    const recommendations = state.intelligences.filter(i => i.type === 'recommendation').length;
    const insights = state.intelligences.filter(i => i.type === 'insight').length;
    const automations = state.intelligences.filter(i => i.type === 'automation').length;
    const highConfidence = state.intelligences.filter(i => i.confidence >= 80).length;
    
    state.stats = { total, predictions, recommendations, insights, automations, highConfidence };
}

/**
 * @private
 * @param {string} type - 类型
 * @returns {object} 类型样式
 */
function getTypeStyle(type) {
    const map = {
        prediction: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-chart-line', label: '预测' },
        recommendation: { color: '#D1FAE5', textColor: '#065F46', icon: 'fa-lightbulb', label: '推荐' },
        insight: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-brain', label: '洞察' },
        automation: { color: '#E0E7FF', textColor: '#3730A3', icon: 'fa-robot', label: '自动化' }
    };
    return map[type] || map.insight;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        active: { color: '#D1FAE5', textColor: '#065F46', label: '活跃' },
        processing: { color: '#FEF3C7', textColor: '#92400E', label: '处理中' },
        completed: { color: '#DBEAFE', textColor: '#1E40AF', label: '已完成' },
        pending: { color: '#F3F4F6', textColor: '#6B7280', label: '待处理' }
    };
    return map[status] || map.pending;
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('aiContainer');
    if (!container) return;

    // 渲染统计卡片
    const statsHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#4F46E5;">${state.stats.total}</div>
                <div style="font-size:12px;color:#6B7280;">总计</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#1E40AF;">${state.stats.predictions}</div>
                <div style="font-size:12px;color:#6B7280;">📊 预测</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#065F46;">${state.stats.recommendations}</div>
                <div style="font-size:12px;color:#6B7280;">💡 推荐</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#92400E;">${state.stats.insights}</div>
                <div style="font-size:12px;color:#6B7280;">🧠 洞察</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#3730A3;">${state.stats.automations}</div>
                <div style="font-size:12px;color:#6B7280;">🤖 自动化</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#10B981;">${state.stats.highConfidence}</div>
                <div style="font-size:12px;color:#6B7280;">⭐ 高置信度</div>
            </div>
        </div>
    `;

    // 渲染列表
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredIntelligences.slice(start, end);

    let listHtml = '';
    if (pageData.length === 0) {
        listHtml = `
            <div style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-robot" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                暂无AI分析数据
            </div>
        `;
    } else {
        listHtml = pageData.map(item => {
            const type = getTypeStyle(item.type);
            const status = getStatusStyle(item.status);
            
            return `
                <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:12px;transition:all 0.2s;"
                     onmouseover="this.style.borderColor='#4F46E5';this.style.boxShadow='0 2px 8px rgba(79,70,229,0.1)';"
                     onmouseout="this.style.borderColor='#E5E7EB';this.style.boxShadow='none';">
                    <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                                    <i class="fas ${type.icon}"></i>
                                    ${type.label}
                                </span>
                                <span style="font-weight:600;font-size:16px;color:#1F2937;">${item.title}</span>
                                <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:${status.color};color:${status.textColor};">
                                    ${status.label}
                                </span>
                            </div>
                            <div style="font-size:13px;color:#6B7280;margin-top:4px;">${item.description}</div>
                            <div style="display:flex;gap:16px;margin-top:6px;font-size:12px;color:#9CA3AF;">
                                <span>📅 ${getRelativeTime(item.createdAt)}</span>
                                <span>🎯 置信度: ${Math.round(item.confidence)}%</span>
                                ${item.data.value ? `<span>📊 ${formatNumber(item.data.value)}</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:4px;flex-shrink:0;">
                            <button class="btn btn-sm btn-outline" onclick="window.AIModule.viewDetail('${item.id}')" title="查看详情">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="window.AIModule.applyAI('${item.id}')" title="应用">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.AIModule.deleteAI('${item.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${item.data.change !== undefined ? `
                        <div style="margin-top:8px;font-size:13px;color:${item.data.change > 0 ? '#10B981' : '#EF4444'};">
                            ${item.data.change > 0 ? '📈 +' : '📉 '}${item.data.change.toFixed(1)}%
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // 分页
    const total = state.filteredIntelligences.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    const paginationHtml = totalPages > 1 ? `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.AIModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.AIModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    ` : '';

    // 搜索栏
    const searchHtml = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <select id="aiTypeFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                <option value="">全部类型</option>
                <option value="prediction">📊 预测</option>
                <option value="recommendation">💡 推荐</option>
                <option value="insight">🧠 洞察</option>
                <option value="automation">🤖 自动化</option>
            </select>
            <select id="aiStatusFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                <option value="">全部状态</option>
                <option value="active">活跃</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="pending">待处理</option>
            </select>
            <button class="btn btn-primary" onclick="window.AIModule.searchAI()">
                <i class="fas fa-search"></i> 搜索
            </button>
            <button class="btn btn-outline" onclick="window.AIModule.resetFilter()">
                <i class="fas fa-undo"></i> 重置
            </button>
            <button class="btn btn-success" onclick="window.AIModule.generateAI()" style="margin-left:auto;">
                <i class="fas fa-plus"></i> 生成分析
            </button>
        </div>
    `;

    container.innerHTML = statsHtml + searchHtml + listHtml + paginationHtml;
}

/**
 * @private
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredIntelligences.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function searchAI() {
    state.filters.type = document.getElementById('aiTypeFilter')?.value || '';
    state.filters.status = document.getElementById('aiStatusFilter')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function resetFilter() {
    document.getElementById('aiTypeFilter').value = '';
    document.getElementById('aiStatusFilter').value = '';
    state.filters = { type: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function viewDetail(id) {
    const item = state.intelligences.find(i => i.id === id);
    if (!item) { showToast('数据不存在', 'error'); return; }
    
    const type = getTypeStyle(item.type);
    alert(`🤖 AI分析详情

标题: ${item.title}
类型: ${type.label}
描述: ${item.description}
置信度: ${Math.round(item.confidence)}%
状态: ${item.status}
创建时间: ${formatDate(item.createdAt)}

数据:
${JSON.stringify(item.data, null, 2)}`);
}

/**
 * @private
 */
function applyAI(id) {
    const item = state.intelligences.find(i => i.id === id);
    if (!item) { showToast('数据不存在', 'error'); return; }
    
    showToast(`✅ 已应用: ${item.title}`, 'success');
    // 实际应用中会触发相应的业务逻辑
}

/**
 * @private
 */
function deleteAI(id) {
    const item = state.intelligences.find(i => i.id === id);
    if (!item) { showToast('数据不存在', 'error'); return; }
    if (!confirm(`确认删除 "${item.title}"？`)) return;
    
    state.intelligences = state.intelligences.filter(i => i.id !== id);
    localStorage.setItem('ai_intelligences', JSON.stringify(state.intelligences));
    applyFilters();
    calculateStats();
    render();
    showToast('已删除', 'success');
}

/**
 * @private
 */
function generateAI() {
    const typeOptions = ['prediction (预测)', 'recommendation (推荐)', 'insight (洞察)', 'automation (自动化)'];
    const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.map((t, i) => `${i+1}. ${t}`).join('\n')}`, '1'));
    const types = ['prediction', 'recommendation', 'insight', 'automation'];
    const type = types[typeIdx - 1] || 'prediction';
    
    const title = prompt('标题：', `${type}分析 ${new Date().toLocaleDateString()}`);
    if (!title) return;
    
    const description = prompt('描述：', 'AI自动生成的分析报告');
    
    const newItem = {
        id: `AI-${Date.now().toString().slice(-6)}`,
        type: type,
        title: title.trim(),
        description: description || 'AI自动生成',
        confidence: Math.random() * 40 + 60,
        status: 'processing',
        createdAt: new Date().toISOString(),
        data: {
            value: Math.floor(Math.random() * 10000),
            change: (Math.random() - 0.5) * 20,
            generated: true
        }
    };
    
    state.intelligences.unshift(newItem);
    localStorage.setItem('ai_intelligences', JSON.stringify(state.intelligences));
    
    // 模拟处理完成
    setTimeout(() => {
        newItem.status = 'completed';
        localStorage.setItem('ai_intelligences', JSON.stringify(state.intelligences));
        applyFilters();
        calculateStats();
        render();
        showToast(`✅ ${newItem.title} 分析完成`, 'success');
    }, 2000);
    
    applyFilters();
    calculateStats();
    render();
    showToast('⏳ 正在生成分析...', 'info');
}

/**
 * @public
 */
export async function init(options) {
    console.log('🤖 AI智能助手 初始化...');
    loadAI();
    
    // 绑定搜索事件
    document.getElementById('aiTypeFilter')?.addEventListener('change', searchAI);
    document.getElementById('aiStatusFilter')?.addEventListener('change', searchAI);
    
    render();
    
    window.AIModule = {
        state,
        loadAI,
        render,
        goToPage,
        searchAI,
        resetFilter,
        viewDetail,
        applyAI,
        deleteAI,
        generateAI,
        applyFilters,
        calculateStats
    };
    
    console.log('✅ AI智能助手 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadAI,
    render,
    goToPage,
    searchAI,
    resetFilter,
    viewDetail,
    applyAI,
    deleteAI,
    generateAI
};