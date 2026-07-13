/**
 * @file company.js
 * @module company
 * @description 公司设置 - 公司信息管理
 * 
 * @example
 * import { init } from './company.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} CompanyInfo
 * @property {string} name - 公司名称
 * @property {string} phone - 联系电话
 * @property {string} email - 电子邮箱
 * @property {string} address - 公司地址
 * @property {string} taxId - 税号
 * @property {string} website - 公司网站
 * @property {string} description - 公司简介
 * @property {string} logo - Logo数据
 * @property {string} updatedAt - 更新时间
 */

/** @type {{info: CompanyInfo, loading: boolean, saved: boolean}} 状态 */
const state = {
    info: {
        name: 'CarwashPro 洗车管理系统',
        phone: '400-888-9999',
        email: 'info@carwashpro.com',
        address: '中国广东省深圳市南山区科技园路88号',
        taxId: '91440300MA5XXXXX',
        website: 'https://www.carwashpro.com',
        description: '专业的洗车店管理系统，提供收银、会员、库存、财务等一站式解决方案',
        logo: '',
        updatedAt: new Date().toISOString()
    },
    loading: false,
    saved: true
};

/**
 * @private
 * @description 加载公司信息
 */
function loadCompanyInfo() {
    try {
        const saved = localStorage.getItem('company_info');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.info = { ...state.info, ...parsed };
        }
    } catch (e) {
        console.warn('加载公司信息失败:', e);
    }
}

/**
 * @private
 * @description 保存公司信息
 */
function saveCompanyInfo() {
    try {
        state.info.updatedAt = new Date().toISOString();
        localStorage.setItem('company_info', JSON.stringify(state.info));
        state.saved = true;
        return true;
    } catch (e) {
        console.warn('保存公司信息失败:', e);
        return false;
    }
}

/**
 * @private
 * @description 渲染表单
 */
function renderForm() {
    const form = document.getElementById('companyForm');
    if (!form) return;

    const info = state.info;

    form.innerHTML = `
        <div class="form-group">
            <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">公司名称 <span style="color:#EF4444;">*</span></label>
            <input id="compName" type="text" class="form-control" value="${escapeHtml(info.name)}" 
                   style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">联系电话 <span style="color:#EF4444;">*</span></label>
                <input id="compPhone" type="text" class="form-control" value="${escapeHtml(info.phone)}" 
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">电子邮箱</label>
                <input id="compEmail" type="email" class="form-control" value="${escapeHtml(info.email)}" 
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
        </div>
        <div class="form-group" style="margin-top:12px;">
            <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">公司地址</label>
            <input id="compAddress" type="text" class="form-control" value="${escapeHtml(info.address)}" 
                   style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">税号</label>
                <input id="compTaxId" type="text" class="form-control" value="${escapeHtml(info.taxId)}" 
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">公司网站</label>
                <input id"compWebsite" type="url" class="form-control" value="${escapeHtml(info.website)}" 
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
        </div>
        <div class="form-group" style="margin-top:12px;">
            <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">公司简介</label>
            <textarea id="compDescription" class="form-control" rows="3" 
                      style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;font-family:inherit;resize:vertical;">${escapeHtml(info.description)}</textarea>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E5E7EB;display:flex;gap:12px;">
            <button id="saveCompanyBtn" style="padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">
                <i class="fas fa-save"></i> 保存公司信息
            </button>
            <button id="resetCompanyBtn" style="padding:8px 24px;background:#F3F4F6;color:#374151;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                <i class="fas fa-undo"></i> 重置
            </button>
        </div>
    `;

    // 绑定事件
    document.getElementById('saveCompanyBtn')?.addEventListener('click', saveCompany);
    document.getElementById('resetCompanyBtn')?.addEventListener('click', resetCompany);

    // 输入变化标记
    form.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => { state.saved = false; });
    });
}

/**
 * @private
 * @param {string} str - 字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * @private
 * @description 保存公司信息
 */
function saveCompany() {
    const name = document.getElementById('compName')?.value.trim();
    const phone = document.getElementById('compPhone')?.value.trim();
    const email = document.getElementById('compEmail')?.value.trim();
    const address = document.getElementById('compAddress')?.value.trim();
    const taxId = document.getElementById('compTaxId')?.value.trim();
    const website = document.getElementById('compWebsite')?.value.trim();
    const description = document.getElementById('compDescription')?.value.trim();

    if (!name) {
        showToast('请输入公司名称', 'warning');
        return;
    }
    if (!phone) {
        showToast('请输入联系电话', 'warning');
        return;
    }

    state.info = {
        ...state.info,
        name,
        phone,
        email: email || '',
        address: address || '',
        taxId: taxId || '',
        website: website || '',
        description: description || '',
        updatedAt: new Date().toISOString()
    };

    if (saveCompanyInfo()) {
        showToast('公司信息已保存', 'success');
        renderLogoPreview();
    } else {
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * @private
 * @description 重置公司信息
 */
function resetCompany() {
    if (!confirm('确认重置公司信息为默认值？')) return;

    const defaultInfo = {
        name: 'CarwashPro 洗车管理系统',
        phone: '400-888-9999',
        email: 'info@carwashpro.com',
        address: '中国广东省深圳市南山区科技园路88号',
        taxId: '91440300MA5XXXXX',
        website: 'https://www.carwashpro.com',
        description: '专业的洗车店管理系统，提供收银、会员、库存、财务等一站式解决方案',
        logo: '',
        updatedAt: new Date().toISOString()
    };

    state.info = defaultInfo;
    saveCompanyInfo();
    renderForm();
    renderLogoPreview();
    showToast('已重置为默认值', 'info');
}

/**
 * @private
 * @description 渲染Logo预览
 */
function renderLogoPreview() {
    const container = document.getElementById('logoPreview');
    if (!container) return;

    const name = state.info.name || 'CarwashPro';
    const initial = name.charAt(0).toUpperCase() || 'C';

    container.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;">
            <div style="width:64px;height:64px;background:linear-gradient(135deg,#4F46E5,#818CF8);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:700;flex-shrink:0;">
                ${initial}
            </div>
            <div>
                <div style="font-size:18px;font-weight:700;color:#1F2937;">${escapeHtml(name)}</div>
                <div style="font-size:13px;color:#6B7280;">${escapeHtml(state.info.phone || '')}</div>
                <button id="uploadLogoBtn" style="margin-top:4px;padding:4px 12px;background:#F3F4F6;border:1px solid #D1D5DB;border-radius:4px;cursor:pointer;font-size:12px;">
                    <i class="fas fa-upload"></i> 上传Logo
                </button>
            </div>
        </div>
    `;

    document.getElementById('uploadLogoBtn')?.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    state.info.logo = ev.target.result;
                    saveCompanyInfo();
                    renderLogoPreview();
                    showToast('Logo已上传', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const form = document.getElementById('companyForm');
    if (form) {
        form.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('change', () => { state.saved = false; });
        });
    }

    // 快捷键 Ctrl+S 保存
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('companyForm')) {
                saveCompany();
            }
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {CompanyInfo} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🏢 公司设置 初始化...');

    if (options?.data) {
        state.info = { ...state.info, ...options.data };
        saveCompanyInfo();
    }

    loadCompanyInfo();
    renderForm();
    renderLogoPreview();
    bindEvents();

    window.CompanyModule = {
        state,
        loadCompanyInfo,
        saveCompanyInfo,
        saveCompany,
        resetCompany,
        renderForm,
        renderLogoPreview
    };

    console.log('✅ 公司设置 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadCompanyInfo,
    saveCompanyInfo,
    saveCompany,
    resetCompany
};