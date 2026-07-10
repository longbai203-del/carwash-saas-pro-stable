/**
 * @file ai.js
 * @module ai-analytics
 * @description AI智能分析 - 业务数据智能分析和预测
 * 
 * @example
 * import { init } from './ai.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast, showLoading } from '../../../js/core/init.js';
import { formatNumber, formatDate, getRelativeTime } from '../../../js/core/helpers.js';

/**
 * @typedef {Object} PredictionData
 * @property {string} id - 预测ID
 * @property {string} metric - 指标名称
 * @property {number} current - 当前值
 * @property {number} predicted - 预测值
 * @property {number} confidence - 置信度
 * @property {string} trend - 趋势 (up/down/stable)
 * @property {string} period - 预测周期
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} InsightData
 * @property {string} id - 洞察ID
 * @property {string} title - 标题
 * @property {string} description - 描述
 * @property {string} category - 类别 (sales/customer/inventory/operation)
 * @property {string} severity - 严重程度 (high/medium/low)
 * @property {string} recommendation - 建议
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} AIData
 * @property {PredictionData[]} predictions - 预测数据
 * @property {InsightData[]} insights - 洞察数据
 * @property {Object} summary - 摘要
 */

/** @type {{data: AIData, predictions: PredictionData[], insights: InsightData[], summary: Object, filters: Object, page: number, pageSize: number}} */
const state = {
    data: {
        predictions: [],
        insights: [],
        summary: {}
    },
    predictions: [],
    insights: [],
    summary: {},
    filters: { type: '', severity: '', search: '' },
    page: 1,
    pageSize: 10,
    activeTab: 'insights'
};

/**
 * @private
 * @returns {Promise<AIData>} AI数据
 */
async function fetchAIData() {
    try {
        const response = await apiClient.get('/ai/analytics');
        if (response && response.success) {
            return response.data;
        }
        return getMockAIData();
    } catch (error) {
        console.warn('API加载失败，使用模拟数据:', error);
        return getMockAIData();
    }
}

/**
 * @private
 * @returns {AIData} 模拟AI数据
 */
function getMockAIData() {
    const now = new Date();
    
    const predictions = [
        {
            id: 'pred-001',
            metric: '今日收入预测',
            current: 18500,
            predicted: 21200,
            confidence: 0.92,
            trend: 'up',
            period: '今日',
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'pred-002',
            metric: '周订单量预测',
            current: 342,
            predicted: 380,
            confidence: 0.85,
            trend: 'up',
            period: '本周',
            createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'pred-003',
            metric: '客户流失预测',
            current: 12,
            predicted: 8,
            confidence: 0.78,
            trend: 'down',
            period: '本月',
            createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'pred-004',
            metric: '库存需求预测',
            current: 450,
            predicted: 520,
            confidence: 0.88,
            trend: 'up',
            period: '下周',
            createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'pred-005',
            metric: '净利润预测',
            current: 3200,
            predicted: 3800,
            confidence: 0.82,
            trend: 'up',
            period: '本月',
            createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    const insights = [
        {
            id: 'ins-001',
            title: '周末销售高峰',
            description: '数据分析显示，周末（周六、周日）的销售额平均比工作日高出35%，建议增加周末值班人员。',
            category: 'sales',
            severity: 'medium',
            recommendation: '建议在周末增加1-2名员工，并推出周末专属促销活动。',
            createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ins-002',
            title: '客户复购率下降',
            description: '近30天客户复购率从42%下降至31%，下降了11个百分点，需要关注客户满意度。',
            category: 'customer',
            severity: 'high',
            recommendation: '建议开展客户回访活动，收集反馈，并推出会员专属优惠。',
            createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ins-003',
            title: '库存周转优化',
            description: '部分商品库存周转天数超过90天，存在积压风险，建议进行清理或促销。',
            category: 'inventory',
            severity: 'medium',
            recommendation: '建议对积压商品进行折扣促销，同时调整采购计划。',
            createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ins-004',
            title: '员工效率提升',
            description: '新员工培训后效率提升27%，达到平均水平的85%，培训效果显著。',
            category: 'operation',
            severity: 'low',
            recommendation: '建议继续加强新员工培训体系，并建立导师制度。',
            createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ins-005',
            title: '季节性需求变化',
            description: '洗车服务需求呈现明显的季节性特征，夏季需求比冬季高出45%。',
            category: 'sales',
            severity: 'medium',
            recommendation: '建议夏季增加服务项目，冬季推出取暖洗车套餐。',
            createdAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ins-006',
            title: '支付方式偏好',
            description: '移动支付占比已达73%，其中微信支付45%，支付宝28%，建议优化支付流程。',
            category: 'operation',
            severity: 'low',
            recommendation: '建议推出移动支付专属优惠，提升支付效率。',
            createdAt: new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    return {
        predictions,
        insights,
        summary: {
            totalPredictions: predictions.length,
            totalInsights: insights.length,
            highSeverity: insights.filter(i => i.severity === 'high').length,
            avgConfidence: predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length
        }
    };
}

/**
 * @private
 * @param {AIData} data - AI数据
 * @description 加载AI数据
 */
function loadAIData(data) {
    state.data = data || getMockAIData();
    state.predictions = state.data.predictions || [];
    state.insights = state.data.insights || [];
    state.summary = state.data.summary || {};
    
    // 缓存数据
    try {
        localStorage.setItem('ai_analytics_data', JSON.stringify(state.data));
    } catch (e) {}
}

/**
 * @private
 * @description 加载缓存数据
 */
function loadCachedData() {
    try {
        const cached = localStorage.getItem('ai_analytics_data');
        if (cached) {
            const data = JSON.parse(cached);
            state.data = data;
            state.predictions = data.predictions || [];
            state.insights = data.insights || [];
            state.summary = data.summary || {};
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * @private
 * @param {string} severity - 严重程度
 * @returns {object} 严重程度样式
 */
function getSeverityStyle(severity) {
    const map = {
        high: { color: '#FEE2E2', textColor: '#991B1B', icon: 'fa-exclamation-circle', label: '🔴 高' },
        medium: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-exclamation-triangle', label: '🟡 中' },
        low: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-info-circle', label: '🔵 低' }
    };
    return map[severity] || map.low;
}

/**
 * @private
 * @param {string} category - 类别
 * @returns {object} 类别样式
 */
function getCategoryStyle(category) {
    const map = {
        sales: { color: '#D1FAE5', textColor: '#065F46', icon: 'fa-chart-bar', label: '销售' },
        customer: { color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-users', label: '客户' },
        inventory: { color: '#FEF3C7', textColor: '#92400E', icon: 'fa-boxes', label: '库存' },
        operation: { color: '#E0E7FF', textColor: '#3730A3', icon: 'fa-cogs', label: '运营' }
    };
    return map[category] || map.sales;
}

/**
 * @private
 * @param {string} trend - 趋势
 * @returns {object} 趋势样式
 */
function getTrendStyle(trend) {
    const map = {
        up: { color: '#10B981', icon: 'fa-arrow-up', label: '上涨' },
        down: { color: '#EF4444', icon: 'fa-arrow-down', label: '下跌' },
        stable: { color: '#6B7280', icon: 'fa-minus', label: '稳定' }
    };
    return map[trend] || map.stable;
}

/**
 * @private
 * @param {number} confidence - 置信度
 * @returns {string} 置信度颜色
 */
function getConfidenceColor(confidence) {
    if (confidence >= 0.85) return '#10B981';
    if (confidence >= 0.7) return '#F59E0B';
    return '#EF4444';
}

/**
 * @private
 * @param {string} tab - 标签
 * @description 切换标签
 */
function switchTab(tab) {
    state.activeTab = tab;
    state.page = 1;
    render();
}

/**
 * @private
 * @description 渲染AI分析
 */
function render() {
    const container = document.getElementById('aiAnalyticsContainer');
    if (!container) return;
    
    // 摘要卡片
    const summaryHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#4F46E5;">${state.summary.totalPredictions || 0}</div>
                <div style="font-size:12px;color:#6B7280;">📊 预测总数</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#10B981;">${state.summary.totalInsights || 0}</div>
                <div style="font-size:12px;color:#6B7280;">💡 洞察总数</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#EF4444;">${state.summary.highSeverity || 0}</div>
                <div style="font-size:12px;color:#6B7280;">⚠️ 高优先级</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#8B5CF6;">${Math.round((state.summary.avgConfidence || 0) * 100)}%</div>
                <div style="font-size:12px;color:#6B7280;">🎯 平均置信度</div>
            </div>
        </div>
    `;
    
    // 标签导航
    const tabsHtml = `
        <div style="display:flex;gap:4px;border-bottom:2px solid #E5E7EB;margin-bottom:16px;">
            <button class="btn ${state.activeTab === 'insights' ? 'btn-primary' : 'btn-ghost'}" 
                    onclick="window.AIAnalyticsModule.switchTab('insights')"
                    style="padding:8px 20px;border-radius:8px 8px 0 0;${state.activeTab === 'insights' ? 'border-bottom:2px solid #4F46E5;' : ''}">
                💡 智能洞察
            </button>
            <button class="btn ${state.activeTab === 'predictions' ? 'btn-primary' : 'btn-ghost'}" 
                    onclick="window.AIAnalyticsModule.switchTab('predictions')"
                    style="padding:8px 20px;border-radius:8px 8px 0 0;${state.activeTab === 'predictions' ? 'border-bottom:2px solid #4F46E5;' : ''}">
                📊 预测分析
            </button>
        </div>
    `;
    
    // 搜索和筛选
    const filterHtml = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <input type="text" id="aiSearch" placeholder="搜索..." style="flex:1;min-width:150px;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
            ${state.activeTab === 'insights' ? `
                <select id="aiSeverityFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                    <option value="">全部严重程度</option>
                    <option value="high">🔴 高</option>
                    <option value="medium">🟡 中</option>
                    <option value="low">🔵 低</option>
                </select>
                <select id="aiCategoryFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                    <option value="">全部分类</option>
                    <option value="sales">销售</option>
                    <option value="customer">客户</option>
                    <option value="inventory">库存</option>
                    <option value="operation">运营</option>
                </select>
            ` : `
                <select id="aiTrendFilter" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:white;">
                    <option value="">全部趋势</option>
                    <option value="up">📈 上涨</option>
                    <option value="down">📉 下跌</option>
                    <option value="stable">➡️ 稳定</option>
                </select>
            `}
            <button class="btn btn-primary" onclick="window.AIAnalyticsModule.search()">
                <i class="fas fa-search"></i> 搜索
            </button>
            <button class="btn btn-outline" onclick="window.AIAnalyticsModule.resetFilter()">
                <i class="fas fa-undo"></i> 重置
            </button>
            <button class="btn btn-success" onclick="window.AIAnalyticsModule.refreshAI()" style="margin-left:auto;">
                <i class="fas fa-sync"></i> AI刷新
            </button>
        </div>
    `;
    
    // 内容
    let contentHtml = '';
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    
    if (state.activeTab === 'insights') {
        const filtered = filterInsights();
        const pageData = filtered.slice(start, end);
        contentHtml = renderInsights(pageData, filtered.length);
    } else {
        const filtered = filterPredictions();
        const pageData = filtered.slice(start, end);
        contentHtml = renderPredictions(pageData, filtered.length);
    }
    
    container.innerHTML = summaryHtml + tabsHtml + filterHtml + contentHtml;
}

/**
 * @private
 * @param {InsightData[]} insights - 洞察列表
 * @param {number} total - 总数
 * @returns {string} HTML
 */
function renderInsights(insights, total) {
    if (insights.length === 0) {
        return `
            <div style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-lightbulb" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                暂无洞察数据
            </div>
        `;
    }
    
    let html = '';
    for (const insight of insights) {
        const severity = getSeverityStyle(insight.severity);
        const category = getCategoryStyle(insight.category);
        
        html += `
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${severity.color};transition:all 0.2s;"
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';"
                 onmouseout="this.style.boxShadow='none';">
                <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px;">
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${severity.color};color:${severity.textColor};">
                                ${severity.label}
                            </span>
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${category.color};color:${category.textColor};">
                                <i class="fas ${category.icon}"></i> ${category.label}
                            </span>
                            <span style="font-weight:600;font-size:15px;color:#1F2937;">${insight.title}</span>
                        </div>
                        <div style="font-size:13px;color:#6B7280;margin-top:6px;">${insight.description}</div>
                        <div style="font-size:13px;color:#4F46E5;margin-top:4px;">
                            💡 建议: ${insight.recommendation}
                        </div>
                        <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">
                            📅 ${getRelativeTime(insight.createdAt)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return html + renderPagination(total);
}

/**
 * @private
 * @param {PredictionData[]} predictions - 预测列表
 * @param {number} total - 总数
 * @returns {string} HTML
 */
function renderPredictions(predictions, total) {
    if (predictions.length === 0) {
        return `
            <div style="text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-chart-line" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                暂无预测数据
            </div>
        `;
    }
    
    let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
    `;
    
    for (const pred of predictions) {
        const trend = getTrendStyle(pred.trend);
        const confColor = getConfidenceColor(pred.confidence);
        const confPercent = Math.round(pred.confidence * 100);
        
        html += `
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;transition:all 0.2s;"
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';"
                 onmouseout="this.style.boxShadow='none';">
                <div style="font-weight:600;font-size:14px;color:#1F2937;">${pred.metric}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;">
                    <div>
                        <div style="font-size:11px;color:#6B7280;">当前</div>
                        <div style="font-size:18px;font-weight:700;color:#1F2937;">${formatNumber(pred.current)}</div>
                    </div>
                    <div style="text-align:center;">
                        <i class="fas ${trend.icon}" style="color:${trend.color};font-size:20px;"></i>
                        <div style="font-size:11px;color:${trend.color};">${trend.label}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:11px;color:#6B7280;">预测</div>
                        <div style="font-size:18px;font-weight:700;color:#4F46E5;">${formatNumber(pred.predicted)}</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;border-top:1px solid #F3F4F6;padding-top:8px;">
                    <span>📅 ${pred.period}</span>
                    <span>🎯 置信度: <span style="color:${confColor};font-weight:600;">${confPercent}%</span></span>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html + renderPagination(total);
}

/**
 * @private
 * @param {number} total - 总数
 * @returns {string} 分页HTML
 */
function renderPagination(total) {
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (totalPages <= 1) return '';
    
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.AIAnalyticsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                <button onclick="window.AIAnalyticsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                        style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * @private
 * @returns {InsightData[]} 筛选后的洞察
 */
function filterInsights() {
    let filtered = state.insights;
    const search = state.filters.search || '';
    const severity = state.filters.severity || '';
    const category = state.filters.category || '';
    
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(i => 
            i.title.toLowerCase().includes(s) || 
            i.description.toLowerCase().includes(s)
        );
    }
    if (severity) {
        filtered = filtered.filter(i => i.severity === severity);
    }
    if (category) {
        filtered = filtered.filter(i => i.category === category);
    }
    return filtered;
}

/**
 * @private
 * @returns {PredictionData[]} 筛选后的预测
 */
function filterPredictions() {
    let filtered = state.predictions;
    const search = state.filters.search || '';
    const trend = state.filters.trend || '';
    
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p => p.metric.toLowerCase().includes(s));
    }
    if (trend) {
        filtered = filtered.filter(p => p.trend === trend);
    }
    return filtered;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const total = state.activeTab === 'insights' 
        ? filterInsights().length 
        : filterPredictions().length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function search() {
    state.filters.search = document.getElementById('aiSearch')?.value || '';
    if (state.activeTab === 'insights') {
        state.filters.severity = document.getElementById('aiSeverityFilter')?.value || '';
        state.filters.category = document.getElementById('aiCategoryFilter')?.value || '';
    } else {
        state.filters.trend = document.getElementById('aiTrendFilter')?.value || '';
    }
    state.page = 1;
    render();
}

/**
 * @private
 */
function resetFilter() {
    document.getElementById('aiSearch').value = '';
    if (state.activeTab === 'insights') {
        const sev = document.getElementById('aiSeverityFilter');
        const cat = document.getElementById('aiCategoryFilter');
        if (sev) sev.value = '';
        if (cat) cat.value = '';
        state.filters.severity = '';
        state.filters.category = '';
    } else {
        const trend = document.getElementById('aiTrendFilter');
        if (trend) trend.value = '';
        state.filters.trend = '';
    }
    state.filters.search = '';
    state.page = 1;
    render();
}

/**
 * @private
 */
async function refreshAI() {
    showLoading(true, 'AI正在重新分析数据...');
    try {
        const data = await fetchAIData();
        loadAIData(data);
        render();
        showToast('✅ AI数据已刷新', 'success');
    } catch (error) {
        showToast('❌ AI刷新失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    document.getElementById('aiSearch')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') search();
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @returns {Promise<void>}
 * @description 初始化AI分析
 */
export async function init(options) {
    console.log('🤖 AI智能分析 初始化...');
    
    // 尝试加载缓存
    const hasCache = loadCachedData();
    
    if (options?.data) {
        loadAIData(options.data);
    } else if (!hasCache) {
        const data = await fetchAIData();
        loadAIData(data);
    }
    
    bindEvents();
    render();
    
    window.AIAnalyticsModule = {
        state,
        loadAIData,
        fetchAIData,
        render,
        switchTab,
        goToPage,
        search,
        resetFilter,
        refreshAI,
        filterInsights,
        filterPredictions
    };
    
    console.log('✅ AI智能分析 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadAIData,
    fetchAIData,
    render,
    switchTab,
    goToPage,
    search,
    resetFilter,
    refreshAI
};