/**
 * @file marketplace.js
 * @module marketplace
 * @description 应用市场 - 扩展应用和插件管理
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} App
 * @property {string} id - 应用ID
 * @property {string} name - 应用名称
 * @property {string} description - 描述
 * @property {string} category - 分类
 * @property {string} icon - 图标
 * @property {string} version - 版本
 * @property {string} developer - 开发者
 * @property {number} price - 价格
 * @property {string} status - 状态 (available/installed/updating)
 * @property {string} installedAt - 安装时间
 * @property {number} downloads - 下载次数
 * @property {number} rating - 评分
 * @property {string} website - 网站
 */

/** @type {{apps: App[], filteredApps: App[], filters: {name: string, category: string, status: string}, page: number, pageSize: number}} */
const state = {
    apps: [],
    filteredApps: [],
    filters: { name: '', category: '', status: '' },
    page: 1,
    pageSize: 12
};

/**
 * @private
 */
function getMockApps() {
    const categories = ['payment', 'marketing', 'analytics', 'crm', 'automation', 'reporting'];
    const appTemplates = [
        { name: 'Stripe Connect', description: '集成Stripe支付网关，支持信用卡和借记卡支付', icon: 'fa-credit-card', category: 'payment', developer: 'Stripe Inc.', price: 0, downloads: 4523, rating: 4.8 },
        { name: '微信支付', description: '微信支付集成，支持扫码支付和H5支付', icon: 'fa-weixin', category: 'payment', developer: 'Tencent', price: 0, downloads: 3210, rating: 4.7 },
        { name: '支付宝支付', description: '支付宝支付集成，支持快捷支付和扫码支付', icon: 'fa-alipay', category: 'payment', developer: 'Alibaba', price: 0, downloads: 2987, rating: 4.6 },
        { name: '营销自动化', description: '自动营销工具，支持邮件营销和短信营销', icon: 'fa-bullhorn', category: 'marketing', developer: 'MarTech Pro', price: 499, downloads: 876, rating: 4.4 },
        { name: 'Google Analytics', description: 'Google Analytics集成，实时数据分析和报表', icon: 'fa-chart-bar', category: 'analytics', developer: 'Google', price: 0, downloads: 5432, rating: 4.9 },
        { name: '客户管理系统', description: '完整的客户管理功能，支持标签、分群和自动化', icon: 'fa-users', category: 'crm', developer: 'CRM Pro', price: 799, downloads: 654, rating: 4.3 },
        { name: '报表生成器', description: '可视化报表生成，支持自定义指标和图表', icon: 'fa-file-alt', category: 'reporting', developer: 'DataViz', price: 299, downloads: 987, rating: 4.5 },
        { name: '短信服务', description: '阿里云短信服务集成，支持验证码和通知短信', icon: 'fa-sms', category: 'automation', developer: 'Aliyun', price: 0, downloads: 1876, rating: 4.5 },
        { name: '库存优化', description: 'AI驱动的库存优化，自动预测和补货建议', icon: 'fa-cubes', category: 'automation', developer: 'AI Solutions', price: 999, downloads: 432, rating: 4.2 },
        { name: '客户反馈', description: '客户满意度调查和反馈收集工具', icon: 'fa-comment-dots', category: 'crm', developer: 'Feedback Pro', price: 199, downloads: 765, rating: 4.3 },
        { name: 'BI分析', description: '商业智能分析平台，支持多维数据分析和可视化', icon: 'fa-chart-pie', category: 'analytics', developer: 'BI Tech', price: 599, downloads: 543, rating: 4.4 },
        { name: '邮件服务', description: 'SendGrid邮件服务集成，支持事务邮件和营销邮件', icon: 'fa-envelope', category: 'automation', developer: 'SendGrid', price: 0, downloads: 1234, rating: 4.6 }
    ];
    
    const statuses = ['available', 'available', 'available', 'installed', 'available', 'available', 'installed', 'available', 'available', 'available', 'installed', 'available'];
    
    return appTemplates.map((app, i) => ({
        id: `APP-${String(i + 1).padStart(6, '0')}`,
        ...app,
        version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        status: statuses[i],
        installedAt: statuses[i] === 'installed' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : '',
        website: `https://example.com/apps/${app.name.toLowerCase().replace(/\s/g, '-')}`
    }));
}

/**
 * @private
 */
function loadApps() {
    try {
        const saved = localStorage.getItem('system_marketplace');
        if (saved) {
            state.apps = JSON.parse(saved);
        } else {
            state.apps = getMockApps();
            localStorage.setItem('system_marketplace', JSON.stringify(state.apps));
        }
    } catch (e) {
        state.apps = getMockApps();
    }
    applyFilters();
}

/**
 * @private
 */
function saveApps() {
    try {
        localStorage.setItem('system_marketplace', JSON.stringify(state.apps));
    } catch (e) {}
}

/**
 * @private
 */
function applyFilters() {
    let filtered = state.apps;
    const f = state.filters;
    
    if (f.name) {
        filtered = filtered.filter(a => a.name.toLowerCase().includes(f.name.toLowerCase()) || a.description.toLowerCase().includes(f.name.toLowerCase()));
    }
    if (f.category) {
        filtered = filtered.filter(a => a.category === f.category);
    }
    if (f.status) {
        filtered = filtered.filter(a => a.status === f.status);
    }
    
    state.filteredApps = filtered;
}

/**
 * @private
 * @param {string} category - 分类
 * @returns {string} 分类中文名
 */
function getCategoryLabel(category) {
    const map = {
        payment: '支付',
        marketing: '营销',
        analytics: '分析',
        crm: '客户管理',
        automation: '自动化',
        reporting: '报表'
    };
    return map[category] || category;
}

/**
 * @private
 * @param {string} status - 状态
 * @returns {object} 状态样式
 */
function getStatusStyle(status) {
    const map = {
        available: { color: '#DBEAFE', textColor: '#1E40AF', label: '📦 可安装' },
        installed: { color: '#D1FAE5', textColor: '#065F46', label: '✅ 已安装' },
        updating: { color: '#FEF3C7', textColor: '#92400E', label: '🔄 更新中' }
    };
    return map[status] || map.available;
}

/**
 * @private
 */
function render() {
    const container = document.getElementById('marketplaceContainer');
    if (!container) return;

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageData = state.filteredApps.slice(start, end);

    if (pageData.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px;color:#9CA3AF;">
                <i class="fas fa-store" style="font-size:48px;display:block;margin-bottom:16px;color:#D1D5DB;"></i>
                <p style="font-size:16px;">暂无应用</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
            ${pageData.map(app => {
                const status = getStatusStyle(app.status);
                const isInstalled = app.status === 'installed';
                
                return `
                    <div style="background:white;border:1px solid #E5E7EB;border-radius:8px;padding:20px;transition:all 0.2s;"
                         onmouseover="this.style.borderColor='#4F46E5';this.style.boxShadow='0 4px 12px rgba(79,70,229,0.15)';"
                         onmouseout="this.style.borderColor='#E5E7EB';this.style.boxShadow='none';">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                            <div style="width:48px;height:48px;border-radius:8px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:24px;color:#4F46E5;">
                                <i class="fas ${app.icon}"></i>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:16px;color:#1F2937;">${app.name}</div>
                                <div style="font-size:12px;color:#6B7280;">${app.developer}</div>
                            </div>
                            <div style="font-size:14px;font-weight:700;color:#4F46E5;">
                                ${app.price === 0 ? '免费' : `¥${app.price}`}
                            </div>
                        </div>
                        
                        <div style="font-size:13px;color:#6B7280;margin-bottom:12px;line-height:1.5;min-height:40px;">
                            ${app.description}
                        </div>
                        
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:#F3F4F6;color:#4B5563;">
                                ${getCategoryLabel(app.category)}
                            </span>
                            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:#F3F4F6;color:#4B5563;">
                                v${app.version}
                            </span>
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:11px;background:#FEF3C7;color:#92400E;">
                                ⭐ ${app.rating}
                            </span>
                        </div>
                        
                        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #F3F4F6;padding-top:12px;">
                            <span style="font-size:11px;color:#9CA3AF;">
                                📥 ${app.downloads} 次下载
                                ${isInstalled ? ` | 📅 ${new Date(app.installedAt).toLocaleDateString()}` : ''}
                            </span>
                            <div style="display:flex;gap:4px;">
                                ${isInstalled ? `
                                    <button class="btn btn-sm btn-success" onclick="window.SystemMarketplaceModule.uninstallApp('${app.id}')">
                                        <i class="fas fa-check"></i> 已安装
                                    </button>
                                    <button class="btn btn-sm btn-outline" onclick="window.SystemMarketplaceModule.updateApp('${app.id}')" title="更新">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-primary" onclick="window.SystemMarketplaceModule.installApp('${app.id}')">
                                        <i class="fas fa-download"></i> 安装
                                    </button>
                                `}
                                <button class="btn btn-sm btn-outline" onclick="window.SystemMarketplaceModule.viewDetails('${app.id}')" title="详情">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        ${renderPagination()}
    `;
}

/**
 * @private
 */
function renderPagination() {
    const total = state.filteredApps.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;

    if (totalPages <= 1) return '';

    return `
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;padding:16px 0;margin-top:8px;">
            <button onclick="window.SystemMarketplaceModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                    style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span style="padding:4px 12px;background:#4F46E5;color:white;border-radius:4px;">${state.page} / ${totalPages}</span>
            <button onclick="window.SystemMarketplaceModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                    style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/**
 * @private
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredApps.length / state.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    state.page = page;
    render();
}

/**
 * @private
 * @param {string} id - 应用ID
 */
function installApp(id) {
    const app = state.apps.find(a => a.id === id);
    if (!app) { showToast('应用不存在', 'error'); return; }
    
    if (app.status === 'installed') {
        showToast('应用已安装', 'info');
        return;
    }
    
    showToast(`⏳ 正在安装 ${app.name}...`, 'info');
    
    setTimeout(() => {
        app.status = 'installed';
        app.installedAt = new Date().toISOString();
        app.downloads += 1;
        saveApps();
        applyFilters();
        render();
        showToast(`✅ ${app.name} 安装成功`, 'success');
    }, 2000);
}

/**
 * @private
 * @param {string} id - 应用ID
 */
function uninstallApp(id) {
    const app = state.apps.find(a => a.id === id);
    if (!app) { showToast('应用不存在', 'error'); return; }
    
    if (!confirm(`确认卸载 "${app.name}"？`)) return;
    
    app.status = 'available';
    app.installedAt = '';
    saveApps();
    applyFilters();
    render();
    showToast(`已卸载 ${app.name}`, 'info');
}

/**
 * @private
 * @param {string} id - 应用ID
 */
function updateApp(id) {
    const app = state.apps.find(a => a.id === id);
    if (!app) { showToast('应用不存在', 'error'); return; }
    
    if (app.status !== 'installed') {
        showToast('只有已安装的应用才能更新', 'warning');
        return;
    }
    
    showToast(`⏳ 正在更新 ${app.name}...`, 'info');
    
    setTimeout(() => {
        const versionParts = app.version.split('.');
        versionParts[1] = parseInt(versionParts[1]) + 1;
        app.version = versionParts.join('.');
        app.installedAt = new Date().toISOString();
        saveApps();
        applyFilters();
        render();
        showToast(`✅ ${app.name} 已更新到 v${app.version}`, 'success');
    }, 2000);
}

/**
 * @private
 * @param {string} id - 应用ID
 */
function viewDetails(id) {
    const app = state.apps.find(a => a.id === id);
    if (!app) { showToast('应用不存在', 'error'); return; }
    
    alert(`📱 ${app.name} 详情

名称: ${app.name}
描述: ${app.description}
分类: ${getCategoryLabel(app.category)}
开发者: ${app.developer}
版本: ${app.version}
价格: ${app.price === 0 ? '免费' : `¥${app.price}`}
评分: ⭐ ${app.rating}
下载量: ${app.downloads}
状态: ${app.status === 'installed' ? '✅ 已安装' : '📦 可安装'}
${app.installedAt ? '安装时间: ' + new Date(app.installedAt).toLocaleString() : ''}
网站: ${app.website}`);
}

/**
 * @private
 */
function handleSearch() {
    state.filters.name = document.getElementById('searchName')?.value || '';
    state.filters.category = document.getElementById('searchCategory')?.value || '';
    state.filters.status = document.getElementById('searchStatus')?.value || '';
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function handleReset() {
    ['searchName', 'searchCategory', 'searchStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    state.filters = { name: '', category: '', status: '' };
    state.page = 1;
    applyFilters();
    render();
}

/**
 * @private
 */
function bindEvents() {
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('resetBtn')?.addEventListener('click', handleReset);
    
    document.querySelectorAll('#searchName, #searchCategory, #searchStatus').forEach(el => {
        el?.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    });
}

/**
 * @public
 */
export async function init(options) {
    console.log('🏪 应用市场 初始化...');
    loadApps();
    bindEvents();
    render();
    
    window.SystemMarketplaceModule = {
        state,
        loadApps,
        saveApps,
        render,
        renderPagination,
        goToPage,
        installApp,
        uninstallApp,
        updateApp,
        viewDetails,
        handleSearch,
        handleReset,
        applyFilters
    };
    
    console.log('✅ 应用市场 初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadApps,
    saveApps,
    installApp,
    uninstallApp,
    updateApp,
    viewDetails,
    goToPage
};