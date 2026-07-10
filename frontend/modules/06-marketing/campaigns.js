/**
 * @file campaigns.js
 * @module campaigns
 * @description 营销活动管理模块 - 营销活动的CRUD操作和数据管理
 * 
 * @example
 * import { init } from './campaigns.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Campaign
 * @property {string} id - 活动ID
 * @property {string} name - 活动名称
 * @property {string} type - 类型 (promotion/event/seasonal)
 * @property {string} desc - 活动描述
 * @property {string} status - 状态 (active/pending/ended/draft)
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {number} budget - 预算
 * @property {number} spent - 已花费
 * @property {number} reach - 触达人数
 * @property {number} conversion - 转化率
 * @property {string} targetAudience - 目标受众
 * @property {string} channel - 渠道 (email/sms/social/offline)
 * @property {string} [notes] - 备注
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} CampaignState
 * @property {Campaign[]} campaigns - 活动列表
 * @property {Campaign[]} filteredCampaigns - 过滤后的活动列表
 * @property {Object} filters - 筛选条件
 * @property {number} page - 页码
 * @property {number} pageSize - 每页数量
 * @property {string|null} editingId - 编辑中的活动ID
 */

/** @type {CampaignState} 状态 */
const state = {
    campaigns: [],
    filteredCampaigns: [],
    filters: {
        name: '',
        type: '',
        status: '',
        channel: ''
    },
    page: 1,
    pageSize: 10,
    editingId: null
};

/**
 * 类型配置
 */
const TYPE_MAP = {
    promotion: { label: '促销活动', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-tags' },
    event: { label: '主题活动', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-calendar-check' },
    seasonal: { label: '季节性活动', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-seedling' }
};

/**
 * 状态配置
 */
const STATUS_MAP = {
    active: { label: '进行中', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-play' },
    pending: { label: '待开始', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-clock' },
    ended: { label: '已结束', color: '#F3F4F6', textColor: '#4B5563', icon: 'fa-stop' },
    draft: { label: '草稿', color: '#E5E7EB', textColor: '#6B7280', icon: 'fa-pen-fancy' }
};

/**
 * 渠道配置
 */
const CHANNEL_MAP = {
    email: { label: '邮件', color: '#DBEAFE', textColor: '#1E40AF', icon: 'fa-envelope' },
    sms: { label: '短信', color: '#FEF3C7', textColor: '#92400E', icon: 'fa-sms' },
    social: { label: '社交媒体', color: '#EDE9FE', textColor: '#6D28D9', icon: 'fa-share-alt' },
    offline: { label: '线下活动', color: '#D1FAE5', textColor: '#065F46', icon: 'fa-store' }
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    return date;
}

/**
 * @private
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

/**
 * @private
 * @returns {Campaign[]} 模拟活动数据
 */
function getMockCampaigns() {
    const names = ['夏日洗车节', '会员月活动', '国庆促销', '冬至洗车优惠', '新客欢迎活动', '季度回馈'];
    const types = ['promotion', 'event', 'seasonal', 'promotion', 'event', 'seasonal'];
    const statuses = ['active', 'pending', 'ended', 'active', 'draft', 'active'];
    const channels = ['email', 'sms', 'social', 'offline', 'email', 'social'];
    const audiences = ['全部客户', '会员', '新客户', '全部客户', '新客户', '会员'];
    
    return names.map((name, i) => ({
        id: `CAMP-${String(i + 1).padStart(4, '0')}`,
        name: name,
        type: types[i % types.length],
        desc: `${name} - 限时优惠活动`,
        status: statuses[i % statuses.length],
        startDate: new Date(Date.now() + (i - 2) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + (i + 2) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: [10000, 20000, 15000, 30000, 8000, 25000][i],
        spent: [3000, 0, 15000, 5000, 0, 8000][i],
        reach: [1250, 0, 3000, 800, 0, 1500][i],
        conversion: [12.5, 0, 8.3, 15.2, 0, 10.8][i],
        targetAudience: audiences[i % audiences.length],
        channel: channels[i % channels.length],
        notes: Math.random() > 0.7 ? '需要提前准备物料' : '',
        createdAt: new Date(Date.now() - (30 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * @private
 * @description 加载活动数据
 */
function loadCampaigns() {
    try {
        const saved = localStorage.getItem('campaign_data');
        if (saved) {
            state.campaigns = JSON.parse(saved);
        } else {
            state.campaigns = getMockCampaigns();
            localStorage.setItem('campaign_data', JSON.stringify(state.campaigns));
        }
    } catch (e) {
        console.warn('加载活动数据失败:', e);
        state.campaigns = getMockCampaigns();
    }
    applyFilters();
}

/**
 * @private
 * @description 保存活动数据
 */
function saveCampaigns() {
    try {
        localStorage.setItem('campaign_data', JSON.stringify(state.campaigns));
    } catch (e) {
        console.warn('保存活动数据失败:', e);
    }
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.campaigns;
    
    if (state.filters.name) {
        const name = state.filters.name.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(name));
    }
    
    if (state.filters.type) {
        filtered = filtered.filter(c => c.type === state.filters.type);
    }
    
    if (state.filters.status) {
        filtered = filtered.filter(c => c.status === state.filters.status);
    }
    
    if (state.filters.channel) {
        filtered = filtered.filter(c => c.channel === state.filters.channel);
    }
    
    state.filteredCampaigns = filtered;
}

/**
 * @private
 * @description 渲染活动列表
 */
function render() {
    const tbody = document.getElementById('campaignListBody');
    if (!tbody) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredCampaigns.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-bullhorn" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无营销活动数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.map(c => {
        const type = TYPE_MAP[c.type] || TYPE_MAP.promotion;
        const status = STATUS_MAP[c.status] || STATUS_MAP.draft;
        const channel = CHANNEL_MAP[c.channel] || CHANNEL_MAP.email;
        const progress = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${c.name}</div>
                    <div style="font-size:12px;color:#6B7280;">${c.desc || ''}</div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${type.color};color:${type.textColor};">
                        <i class="fas ${type.icon}" style="margin-right:4px;"></i>
                        ${type.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;background:${channel.color};color:${channel.textColor};">
                        <i class="fas ${channel.icon}" style="margin-right:4px;"></i>
                        ${channel.label}
                    </span>
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#6B7280;">
                    ${formatDate(c.startDate)} ~ ${formatDate(c.endDate)}
                </td>
                <td style="padding:10px 16px;text-align:center;">
                    <div style="font-weight:600;">${formatNumber(c.reach)}</div>
                    <div style="font-size:12px;color:#6B7280;">${c.conversion || 0}%</div>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;background:#F3F4F6;border-radius:9999px;overflow:hidden;">
                            <div style="height:100%;background:${progress > 80 ? '#EF4444' : progress > 50 ? '#F59E0B' : '#10B981'};border-radius:9999px;width:${Math.min(progress, 100)}%;transition:width 0.3s;"></div>
                        </div>
                        <span style="font-size:12px;color:#6B7280;">${progress}%</span>
                    </div>
                </td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${status.color};color:${status.textColor};">
                        <i class="fas ${status.icon}" style="margin-right:4px;"></i>
                        ${status.label}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.CampaignsModule.editCampaign('${c.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.CampaignsModule.toggleCampaign('${c.id}')" title="切换状态"
                                style="${c.status === 'active' ? 'color:#F59E0B;' : c.status === 'draft' ? 'color:#10B981;' : 'color:#3B82F6;'}">
                            <i class="fas ${c.status === 'active' ? 'fa-pause' : c.status === 'draft' ? 'fa-play' : 'fa-undo'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.CampaignsModule.deleteCampaign('${c.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 更新统计
 */
function updateStats() {
    const total = state.campaigns.length;
    const active = state.campaigns.filter(c => c.status === 'active').length;
    const pending = state.campaigns.filter(c => c.status === 'pending').length;
    const ended = state.campaigns.filter(c => c.status === 'ended').length;
    const draft = state.campaigns.filter(c => c.status === 'draft').length;
    const totalBudget = state.campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = state.campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const avgConversion = state.campaigns.length > 0 
        ? state.campaigns.reduce((sum, c) => sum + (c.conversion || 0), 0) / state.campaigns.length 
        : 0;
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statPending': pending,
        'statEnded': ended,
        'statDraft': draft,
        'statTotalBudget': '¥' + totalBudget.toFixed(2),
        'statTotalSpent': '¥' + totalSpent.toFixed(2),
        'statAvgConversion': avgConversion.toFixed(1) + '%'
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const total = state.filteredCampaigns.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 条活动
            </div>
        `;
        return;
    }

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 条，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.CampaignsModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.CampaignsModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.CampaignsModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.CampaignsModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.CampaignsModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @param {number} page - 页码
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredCampaigns.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 活动ID
 */
function editCampaign(id) {
    const campaign = state.campaigns.find(c => c.id === id);
    if (!campaign) {
        showToast('活动不存在', 'error');
        return;
    }
    
    state.editingId = id;
    const modal = document.getElementById('campaignModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '编辑活动';
        document.getElementById('formName').value = campaign.name;
        document.getElementById('formType').value = campaign.type || 'promotion';
        document.getElementById('formChannel').value = campaign.channel || 'email';
        document.getElementById('formStatus').value = campaign.status || 'draft';
        document.getElementById('formStartDate').value = campaign.startDate || '';
        document.getElementById('formEndDate').value = campaign.endDate || '';
        document.getElementById('formBudget').value = campaign.budget || 0;
        document.getElementById('formDesc').value = campaign.desc || '';
        document.getElementById('formAudience').value = campaign.targetAudience || '';
        document.getElementById('formNotes').value = campaign.notes || '';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('活动名称：', campaign.name);
        if (name === null) return;
        const desc = prompt('活动描述：', campaign.desc || '') || '';
        const statusOptions = ['1. active (进行中)', '2. pending (待开始)', '3. ended (已结束)', '4. draft (草稿)'];
        const statusIdx = parseInt(prompt(`选择状态：\n${statusOptions.join('\n')}`, 
            campaign.status === 'active' ? '1' : campaign.status === 'pending' ? '2' : campaign.status === 'ended' ? '3' : '4'));
        const statuses = ['active', 'pending', 'ended', 'draft'];
        
        campaign.name = name.trim() || campaign.name;
        campaign.desc = desc || campaign.desc;
        campaign.status = statuses[statusIdx - 1] || campaign.status;
        campaign.updatedAt = new Date().toISOString();
        
        saveCampaigns();
        applyFilters();
        render();
        showToast('活动已更新', 'success');
    }
}

/**
 * @private
 * @param {string} id - 活动ID
 */
function toggleCampaign(id) {
    const campaign = state.campaigns.find(c => c.id === id);
    if (!campaign) {
        showToast('活动不存在', 'error');
        return;
    }
    
    const statusMap = { 
        active: 'ended', 
        pending: 'active', 
        ended: 'draft',
        draft: 'pending'
    };
    const newStatus = statusMap[campaign.status] || 'draft';
    const statusLabels = { active: '进行中', pending: '待开始', ended: '已结束', draft: '草稿' };
    
    campaign.status = newStatus;
    campaign.updatedAt = new Date().toISOString();
    saveCampaigns();
    applyFilters();
    render();
    showToast(`状态已切换为: ${statusLabels[newStatus]}`, 'success');
}

/**
 * @private
 * @param {string} id - 活动ID
 */
function deleteCampaign(id) {
    const campaign = state.campaigns.find(c => c.id === id);
    if (!campaign) {
        showToast('活动不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除活动 "${campaign.name}"？`)) return;
    
    state.campaigns = state.campaigns.filter(c => c.id !== id);
    saveCampaigns();
    applyFilters();
    render();
    showToast('活动已删除', 'success');
}

/**
 * @private
 */
function saveCampaign() {
    const name = document.getElementById('formName').value.trim();
    const type = document.getElementById('formType').value;
    const channel = document.getElementById('formChannel').value;
    const status = document.getElementById('formStatus').value;
    const startDate = document.getElementById('formStartDate').value;
    const endDate = document.getElementById('formEndDate').value;
    const budget = parseFloat(document.getElementById('formBudget').value) || 0;
    const desc = document.getElementById('formDesc').value.trim();
    const targetAudience = document.getElementById('formAudience').value.trim();
    const notes = document.getElementById('formNotes').value.trim();

    if (!name) { showToast('请输入活动名称', 'warning'); return; }

    const data = { name, type, channel, status, startDate, endDate, budget, desc, targetAudience, notes };

    if (state.editingId) {
        const campaign = state.campaigns.find(c => c.id === state.editingId);
        if (campaign) {
            Object.assign(campaign, data);
            campaign.updatedAt = new Date().toISOString();
            showToast('活动已更新', 'success');
        }
    } else {
        const newCampaign = {
            id: 'CAMP-' + Date.now().toString().slice(-6),
            ...data,
            spent: 0,
            reach: 0,
            conversion: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.campaigns.push(newCampaign);
        showToast('活动已创建', 'success');
    }

    saveCampaigns();
    applyFilters();
    closeModal();
    render();
}

/**
 * @private
 */
function showCreateModal() {
    state.editingId = null;
    const modal = document.getElementById('campaignModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '新建营销活动';
        document.getElementById('formName').value = '';
        document.getElementById('formType').value = 'promotion';
        document.getElementById('formChannel').value = 'email';
        document.getElementById('formStatus').value = 'draft';
        document.getElementById('formStartDate').value = '';
        document.getElementById('formEndDate').value = '';
        document.getElementById('formBudget').value = '';
        document.getElementById('formDesc').value = '';
        document.getElementById('formAudience').value = '';
        document.getElementById('formNotes').value = '';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const name = prompt('活动名称：');
        if (!name) return;
        const typeOptions = ['1. promotion (促销活动)', '2. event (主题活动)', '3. seasonal (季节性活动)'];
        const typeIdx = parseInt(prompt(`选择类型：\n${typeOptions.join('\n')}`, '1'));
        const types = ['promotion', 'event', 'seasonal'];
        const type = types[typeIdx - 1] || 'promotion';
        const channelOptions = ['1. email (邮件)', '2. sms (短信)', '3. social (社交媒体)', '4. offline (线下活动)'];
        const channelIdx = parseInt(prompt(`选择渠道：\n${channelOptions.join('\n')}`, '1'));
        const channels = ['email', 'sms', 'social', 'offline'];
        const channel = channels[channelIdx - 1] || 'email';
        
        const newCampaign = {
            id: 'CAMP-' + Date.now().toString().slice(-6),
            name: name.trim(),
            type: type,
            channel: channel,
            status: 'draft',
            startDate: '',
            endDate: '',
            budget: 0,
            spent: 0,
            reach: 0,
            conversion: 0,
            desc: '',
            targetAudience: '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.campaigns.push(newCampaign);
        saveCampaigns();
        applyFilters();
        render();
        showToast('活动已创建', 'success');
    }
}

/**
 * @private
 */
function closeModal() {
    const modal = document.getElementById('campaignModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.type = document.getElementById('searchType')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.filters.channel = document.getElementById('searchChannel')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    const nameInput = document.getElementById('searchName');
    const typeInput = document.getElementById('searchType');
    const statusInput = document.getElementById('searchStatus');
    const channelInput = document.getElementById('searchChannel');
    
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = '';
    if (statusInput) statusInput.value = '';
    if (channelInput) channelInput.value = '';
    
    state.filters = { name: '', type: '', status: '', channel: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);
    
    document.querySelectorAll('#searchName, #searchType, #searchStatus, #searchChannel').forEach(el => {
        if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @private
 */
function initModalEvents() {
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const cancelBtn = document.getElementById('cancelModal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('saveCampaign');
    if (saveBtn) saveBtn.addEventListener('click', saveCampaign);
    
    const modal = document.getElementById('campaignModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Campaign[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('📢 营销活动管理 初始化...');
    
    if (options?.data) {
        state.campaigns = options.data;
        localStorage.setItem('campaign_data', JSON.stringify(state.campaigns));
    }
    
    loadCampaigns();
    bindEvents();
    initModalEvents();
    render();
    
    window.CampaignsModule = {
        state,
        loadCampaigns,
        render,
        renderPagination,
        updateStats,
        editCampaign,
        toggleCampaign,
        deleteCampaign,
        goToPage,
        showCreateModal,
        closeModal,
        handleSearch,
        handleReset,
        saveCampaigns,
        applyFilters
    };
    
    console.log('✅ 营销活动管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCampaigns,
    editCampaign,
    toggleCampaign,
    deleteCampaign,
    goToPage,
    showCreateModal,
    saveCampaign,
    saveCampaigns
};