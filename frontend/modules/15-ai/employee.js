/**
 * @file employee.js
 * @module ai-employee
 * @description AI员工分析 - 员工绩效智能分析和预测
 * 
 * @example
 * import { init } from './employee.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api-client.js';
import { showToast, showLoading } from '../../../js/core/init.js';
import { formatNumber, formatDate, getRelativeTime } from '../../../js/core/helpers.js';

/**
 * @typedef {Object} EmployeeStats
 * @property {number} total - 总员工数
 * @property {number} active - 在职人数
 * @property {number} onLeave - 休假人数
 * @property {number} turnover - 离职率
 * @property {number} avgPerformance - 平均绩效
 * @property {number} avgAttendance - 平均出勤率
 */

/**
 * @typedef {Object} EmployeePrediction
 * @property {string} id - ID
 * @property {string} employeeId - 员工ID
 * @property {string} employeeName - 员工姓名
 * @property {string} department - 部门
 * @property {string} position - 职位
 * @property {number} currentScore - 当前评分
 * @property {number} predictedScore - 预测评分
 * @property {number} confidence - 置信度
 * @property {string} trend - 趋势 (up/down/stable)
 * @property {string} risk - 风险 (high/medium/low)
 * @property {string} createdAt - 创建时间
 */

/**
 * @typedef {Object} EmployeeInsight
 * @property {string} id - ID
 * @property {string} title - 标题
 * @property {string} description - 描述
 * @property {string} category - 类别 (performance/attendance/productivity/retention)
 * @property {string} severity - 严重程度 (high/medium/low)
 * @property {string} recommendation - 建议
 * @property {string} createdAt - 创建时间
 */

/** @type {{stats: EmployeeStats, predictions: EmployeePrediction[], insights: EmployeeInsight[], filters: Object, page: number, pageSize: number}} */
const state = {
    stats: {
        total: 0,
        active: 0,
        onLeave: 0,
        turnover: 0,
        avgPerformance: 0,
        avgAttendance: 0
    },
    predictions: [],
    insights: [],
    filters: { department: '', risk: '', search: '' },
    page: 1,
    pageSize: 8,
    activeTab: 'overview'
};

/**
 * @private
 * @returns {Object} 模拟AI员工数据
 */
function getMockData() {
    const now = new Date();
    const departments = ['销售部', '运营部', '技术部', '财务部', '人力资源部', '客服部'];
    const positions = ['经理', '主管', '专员', '助理', '实习生'];
    const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊', '黄丽', '周敏', '吴刚', '徐芳', '孙悦', '马明', '朱红', '胡军', '郭慧'];
    
    const predictions = [];
    for (let i = 0; i < 12; i++) {
        const dept = departments[i % departments.length];
        const name = names[i % names.length];
        const trend = ['up', 'up', 'down', 'stable', 'up', 'down', 'stable', 'up'][i % 8];
        const risk = ['low', 'low', 'medium', 'high', 'low', 'medium', 'low', 'low'][i % 8];
        predictions.push({
            id: `emp-pred-${String(i + 1).padStart(4, '0')}`,
            employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
            employeeName: name,
            department: dept,
            position: positions[i % positions.length],
            currentScore: Math.floor(Math.random() * 30) + 70,
            predictedScore: Math.floor(Math.random() * 25) + 70,
            confidence: 0.75 + Math.random() * 0.2,
            trend: trend,
            risk: risk,
            createdAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000).toISOString()
        });
    }
    
    const insights = [
        {
            id: 'emp-ins-001',
            title: '销售部绩效提升显著',
            description: '销售部近3个月平均绩效提升15%，主要得益于新培训体系的实施。',
            category: 'performance',
            severity: 'low',
            recommendation: '建议将培训体系推广到其他部门',
            createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'emp-ins-002',
            title: '技术部离职风险较高',
            description: '技术部近6个月离职率达18%，高于公司平均水平，需关注员工满意度。',
            category: 'retention',
            severity: 'high',
            recommendation: '建议进行员工满意度调查，评估薪酬福利竞争力',
            createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'emp-ins-003',
            title: '出勤率优化建议',
            description: '客服部出勤率略低于标准，建议优化排班制度。',
            category: 'attendance',
            severity: 'medium',
            recommendation: '建议调整排班方案，增加弹性工作时间',
            createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    return {
        stats: {
            total: 156,
            active: 142,
            onLeave: 8,
            turnover: 6,
            avgPerformance: 82.5,
            avgAttendance: 94.3
        },
        predictions,
        insights
    };
}

/**
 * @private
 * @param {string} risk - 风险等级
 * @returns {object} 风险样式
 */
function getRiskStyle(risk) {
    const map = {
        high: { color: '#FEE2E2', textColor: '#991B1B', icon: '🔴', label: '高风险' },
        medium: { color: '#FEF3C7', textColor: '#92400E', icon: '🟡', label: '中风险' },
        low: { color: '#D1FAE5', textColor: '#065F46', icon: '🟢', label: '低风险' }
    };
    return map[risk] || map.low;
}

/**
 * @private
 * @param {string} trend - 趋势
 * @returns {object} 趋势样式
 */
function getTrendStyle(trend) {
    const map = {
        up: { color: '#10B981', icon: '📈', label: '上升' },
        down: { color: '#EF4444', icon: '📉', label: '下降' },
        stable: { color: '#6B7280', icon: '➡️', label: '稳定' }
    };
    return map[trend] || map.stable;
}

/**
 * @private
 * @param {string} category - 类别
 * @returns {object} 类别样式
 */
function getCategoryStyle(category) {
    const map = {
        performance: { color: '#D1FAE5', textColor: '#065F46', icon: '⭐', label: '绩效' },
        attendance: { color: '#DBEAFE', textColor: '#1E40AF', icon: '📋', label: '出勤' },
        productivity: { color: '#FEF3C7', textColor: '#92400E', icon: '⚡', label: '效率' },
        retention: { color: '#FEE2E2', textColor: '#991B1B', icon: '🔒', label: '留任' }
    };
    return map[category] || map.performance;
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('aiEmployeeContainer');
    if (!container) return;
    
    // 统计卡片
    const stats = state.stats;
    const statsHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#4F46E5;">${stats.total}</div>
                <div style="font-size:11px;color:#6B7280;">👥 总员工</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#10B981;">${stats.active}</div>
                <div style="font-size:11px;color:#6B7280;">🟢 在职</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#F59E0B;">${stats.onLeave}</div>
                <div style="font-size:11px;color:#6B7280;">🏖️ 休假</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#EF4444;">${stats.turnover}%</div>
                <div style="font-size:11px;color:#6B7280;">📉 离职率</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#8B5CF6;">${stats.avgPerformance}</div>
                <div style="font-size:11px;color:#6B7280;">📊 平均绩效</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#3B82F6;">${stats.avgAttendance}%</div>
                <div style="font-size:11px;color:#6B7280;">📋 出勤率</div>
            </div>
        </div>
    `;
    
    // 标签导航
    const tabsHtml = `
        <div style="display:flex;gap:4px;border-bottom:2px solid #E5E7EB;margin-bottom:16px;">
            <button class="btn ${state.activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}" 
                    onclick="window.AIEmployeeModule.switchTab('overview')"
                    style="padding:8px 16px;border-radius:8px 8px 0 0;${state.activeTab === 'overview' ? 'border-bottom:2px solid #4F46E5;' : ''}">
                📊 总览
            </button>
            <button class="btn ${state.activeTab === 'predictions' ? 'btn-primary' : 'btn-ghost'}" 
                    onclick="window.AIEmployeeModule.switchTab('predictions')"
                    style="padding:8px 16px;border-radius:8px 8px 0 0;${state.activeTab === 'predictions' ? 'border-bottom:2px solid #4F46E5;' : ''}">
                🔮 绩效预测
            </button>
            <button class="btn ${state.activeTab === 'insights' ? 'btn-primary' : 'btn-ghost'}" 
                    onclick="window.AIEmployeeModule.switchTab('insights')"
                    style="padding:8px 16px;border-radius:8px 8px 0 0;${state.activeTab === 'insights' ? 'border-bottom:2px solid #4F46E5;' : ''}">
                💡 人才洞察
            </button>
        </div>
    `;
    
    // 筛选
    const filterHtml = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
            <input type="text" id="aiEmpSearch" placeholder="搜索员工..." style="flex:1;min-width:140px;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <select id="aiEmpDept" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;background:white;">
                <option value="">全部部门</option>
                <option value="销售部">销售部</option>
                <option value="运营部">运营部</option>
                <option value="技术部">技术部</option>
                <option value="财务部">财务部</option>
                <option value="人力资源部">人力资源部</option>
                <option value="客服部">客服部</option>
            </select>
            ${state.activeTab === 'predictions' ? `
                <select id="aiEmpRisk" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;background:white;">
                    <option value="">全部风险</option>
                    <option value="high">🔴 高风险</option>
                    <option value="medium">🟡 中风险</option>
                    <option value="low">🟢 低风险</option>
                </select>
            ` : ''}
            <button class="btn btn-primary" onclick="window.AIEmployeeModule.search()">
                <i class="fas fa-search"></i> 搜索
            </button>
            <button class="btn btn-outline" onclick="window.AIEmployeeModule.resetFilter()">
                <i class="fas fa-undo"></i> 重置
            </button>
            <button class="btn btn-success" onclick="window.AIEmployeeModule.refreshData()" style="margin-left:auto;">
                <i class="fas fa-sync"></i> AI刷新
            </button>
        </div>
    `;
    
    // 内容
    let contentHtml = '';
    if (state.activeTab === 'overview') {
        contentHtml = renderOverview();
    } else if (state.activeTab === 'predictions') {
        contentHtml = renderPredictions();
    } else {
        contentHtml = renderInsights();
    }
    
    container.innerHTML = statsHtml + tabsHtml + filterHtml + contentHtml;
}

/**
 * @private
 * @returns {string} 总览HTML
 */
function renderOverview() {
    const stats = state.stats;
    const highRisk = state.predictions.filter(p => p.risk === 'high').length;
    const upTrend = state.predictions.filter(p => p.trend === 'up').length;
    
    return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;color:#1F2937;margin-bottom:8px;">🔮 AI预测摘要</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <div style="background:#F9FAFB;border-radius:6px;padding:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:700;color:#4F46E5;">${state.predictions.length}</div>
                        <div style="font-size:11px;color:#6B7280;">预测员工数</div>
                    </div>
                    <div style="background:#F9FAFB;border-radius:6px;padding:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:700;color:#10B981;">${upTrend}</div>
                        <div style="font-size:11px;color:#6B7280;">📈 上升趋势</div>
                    </div>
                    <div style="background:#F9FAFB;border-radius:6px;padding:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:700;color:#EF4444;">${highRisk}</div>
                        <div style="font-size:11px;color:#6B7280;">⚠️ 高风险</div>
                    </div>
                    <div style="background:#F9FAFB;border-radius:6px;padding:10px;text-align:center;">
                        <div style="font-size:18px;font-weight:700;color:#8B5CF6;">${state.insights.length}</div>
                        <div style="font-size:11px;color:#6B7280;">💡 洞察建议</div>
                    </div>
                </div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;">
                <div style="font-weight:600;color:#1F2937;margin-bottom:8px;">📊 部门分布</div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${['销售部', '运营部', '技术部', '财务部', '人力资源部', '客服部'].map(dept => {
                        const count = state.predictions.filter(p => p.department === dept).length;
                        const pct = state.predictions.length > 0 ? Math.round(count / state.predictions.length * 100) : 0;
                        return `
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-size:12px;min-width:50px;color:#6B7280;">${dept}</span>
                                <div style="flex:1;height:6px;background:#F3F4F6;border-radius:3px;overflow:hidden;">
                                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4F46E5,#818CF8);border-radius:3px;"></div>
                                </div>
                                <span style="font-size:11px;color:#4F46E5;font-weight:500;">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * @private
 * @returns {string} 预测列表HTML
 */
function renderPredictions() {
    const filtered = filterPredictions();
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = filtered.slice(start, end);
    
    if (pageData.length === 0) {
        return `<div style="text-align:center;padding:40px;color:#9CA3AF;">暂无预测数据</div>`;
    }
    
    let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
    `;
    
    for (const p of pageData) {
        const risk = getRiskStyle(p.risk);
        const trend = getTrendStyle(p.trend);
        const confPct = Math.round(p.confidence * 100);
        const confColor = confPct >= 85 ? '#10B981' : confPct >= 70 ? '#F59E0B' : '#EF4444';
        const scoreDiff = p.predictedScore - p.currentScore;
        
        html += `
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:14px;border-left:4px solid ${risk.color};transition:all 0.2s;"
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';"
                 onmouseout="this.style.boxShadow='none';">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div>
                        <div style="font-weight:600;font-size:15px;color:#1F2937;">${p.employeeName}</div>
                        <div style="font-size:12px;color:#6B7280;">${p.department} · ${p.position}</div>
                    </div>
                    <span style="font-size:12px;font-weight:500;background:${risk.color};color:${risk.textColor};padding:2px 10px;border-radius:9999px;">
                        ${risk.icon} ${risk.label}
                    </span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:10px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:11px;color:#6B7280;">当前评分</div>
                        <div style="font-size:18px;font-weight:700;color:#1F2937;">${p.currentScore}</div>
                    </div>
                    <div style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                        <span style="color:${scoreDiff > 0 ? '#10B981' : scoreDiff < 0 ? '#EF4444' : '#6B7280'};font-weight:700;">
                            ${scoreDiff > 0 ? '↑' : scoreDiff < 0 ? '↓' : '→'} ${Math.abs(scoreDiff)}
                        </span>
                        <span style="font-size:11px;color:${trend.color};">${trend.icon} ${trend.label}</span>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:11px;color:#6B7280;">预测评分</div>
                        <div style="font-size:18px;font-weight:700;color:#4F46E5;">${p.predictedScore}</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;border-top:1px solid #F3F4F6;padding-top:8px;">
                    <span>🎯 置信度: <span style="color:${confColor};font-weight:600;">${confPct}%</span></span>
                    <span>📅 ${getRelativeTime(p.createdAt)}</span>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    const total = filtered.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (totalPages > 1) {
        html += `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;flex-wrap:wrap;gap:8px;">
                <span style="font-size:13px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
                <div style="display:flex;gap:4px;">
                    <button onclick="window.AIEmployeeModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                            style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span style="padding:4px 10px;background:#4F46E5;color:white;border-radius:4px;">${state.page}</span>
                    <button onclick="window.AIEmployeeModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                            style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    return html;
}

/**
 * @private
 * @returns {string} 洞察列表HTML
 */
function renderInsights() {
    const insights = state.insights;
    if (insights.length === 0) {
        return `<div style="text-align:center;padding:40px;color:#9CA3AF;">暂无洞察数据</div>`;
    }
    
    return insights.map(insight => {
        const severity = getRiskStyle(insight.severity);
        const category = getCategoryStyle(insight.category);
        return `
            <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${severity.color};transition:all 0.2s;"
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';"
                 onmouseout="this.style.boxShadow='none';">
                <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px;">
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${severity.color};color:${severity.textColor};">
                                ${severity.icon} ${severity.label}
                            </span>
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${category.color};color:${category.textColor};">
                                ${category.icon} ${category.label}
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
    }).join('');
}

/**
 * @private
 * @returns {EmployeePrediction[]} 筛选后的预测
 */
function filterPredictions() {
    let filtered = state.predictions;
    const search = state.filters.search || '';
    const dept = state.filters.department || '';
    const risk = state.filters.risk || '';
    
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p => p.employeeName.includes(s) || p.employeeId.includes(s));
    }
    if (dept) {
        filtered = filtered.filter(p => p.department === dept);
    }
    if (risk) {
        filtered = filtered.filter(p => p.risk === risk);
    }
    return filtered;
}

/**
 * @private
 */
function switchTab(tab) {
    state.activeTab = tab;
    state.page = 1;
    render();
}

/**
 * @private
 */
function goToPage(page) {
    const total = filterPredictions().length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 */
function search() {
    state.filters.search = document.getElementById('aiEmpSearch')?.value || '';
    state.filters.department = document.getElementById('aiEmpDept')?.value || '';
    state.filters.risk = document.getElementById('aiEmpRisk')?.value || '';
    state.page = 1;
    render();
}

/**
 * @private
 */
function resetFilter() {
    document.getElementById('aiEmpSearch').value = '';
    document.getElementById('aiEmpDept').value = '';
    const riskSel = document.getElementById('aiEmpRisk');
    if (riskSel) riskSel.value = '';
    state.filters = { search: '', department: '', risk: '' };
    state.page = 1;
    render();
}

/**
 * @private
 */
async function refreshData() {
    showLoading(true, 'AI重新分析员工数据...');
    try {
        const data = getMockData();
        state.stats = data.stats;
        state.predictions = data.predictions;
        state.insights = data.insights;
        render();
        showToast('✅ AI员工数据已刷新', 'success');
    } catch (e) {
        showToast('❌ 刷新失败: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * @public
 */
export async function init(options) {
    console.log('🤖 AI员工分析 初始化...');
    const data = getMockData();
    state.stats = data.stats;
    state.predictions = data.predictions;
    state.insights = data.insights;
    
    render();
    
    window.AIEmployeeModule = {
        state,
        render,
        switchTab,
        goToPage,
        search,
        resetFilter,
        refreshData,
        filterPredictions
    };
    
    console.log('✅ AI员工分析 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    render,
    switchTab,
    goToPage,
    search,
    resetFilter,
    refreshData
};