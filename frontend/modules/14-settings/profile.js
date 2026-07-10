/**
 * @file profile.js
 * @module profile
 * @description 个人设置 - 用户个人信息管理
 * 
 * @example
 * import { init } from './profile.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} ProfileInfo
 * @property {string} username - 用户名
 * @property {string} email - 邮箱
 * @property {string} fullName - 全名
 * @property {string} phone - 电话
 * @property {string} role - 角色
 * @property {string} department - 部门
 * @property {string} avatar - 头像数据
 * @property {string} updatedAt - 更新时间
 */

/** @type {{profile: ProfileInfo, loading: boolean, saved: boolean}} 状态 */
const state = {
    profile: {
        username: 'admin',
        email: 'admin@carwashpro.com',
        fullName: '管理员',
        phone: '13800000000',
        role: '管理员',
        department: '管理部',
        avatar: '',
        updatedAt: new Date().toISOString()
    },
    loading: false,
    saved: true
};

/**
 * @private
 * @description 加载个人信息
 */
function loadProfile() {
    try {
        const saved = localStorage.getItem('user_profile');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.profile = { ...state.profile, ...parsed };
        }
        // 从store获取用户信息
        const user = store.get('user');
        if (user) {
            state.profile.fullName = user.name || user.full_name || state.profile.fullName;
            state.profile.email = user.email || state.profile.email;
            state.profile.role = user.role || state.profile.role;
        }
    } catch (e) {
        console.warn('加载个人信息失败:', e);
    }
}

/**
 * @private
 * @description 保存个人信息
 */
function saveProfile() {
    try {
        state.profile.updatedAt = new Date().toISOString();
        localStorage.setItem('user_profile', JSON.stringify(state.profile));
        state.saved = true;
        return true;
    } catch (e) {
        console.warn('保存个人信息失败:', e);
        return false;
    }
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
 * @description 渲染个人设置表单
 */
function renderForm() {
    const container = document.getElementById('profileForm');
    if (!container) return;

    const p = state.profile;

    container.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #E5E7EB;">
            <div id="avatarPreview" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#4F46E5,#818CF8);display:flex;align-items:center;justify-content:center;color:white;font-size:32px;font-weight:700;flex-shrink:0;">
                ${p.fullName ? p.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
                <div style="font-size:18px;font-weight:700;color:#1F2937;">${escapeHtml(p.fullName)}</div>
                <div style="font-size:13px;color:#6B7280;">${escapeHtml(p.role)} · ${escapeHtml(p.department)}</div>
                <button id="changeAvatarBtn" style="margin-top:4px;padding:4px 12px;background:#F3F4F6;border:1px solid #D1D5DB;border-radius:4px;cursor:pointer;font-size:12px;">
                    <i class="fas fa-camera"></i> 更换头像
                </button>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">用户名 <span style="color:#EF4444;">*</span></label>
                <input id="profUsername" type="text" value="${escapeHtml(p.username)}" readonly
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:#F9FAFB;color:#6B7280;" />
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">电子邮箱 <span style="color:#EF4444;">*</span></label>
                <input id="profEmail" type="email" value="${escapeHtml(p.email)}"
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">全名 <span style="color:#EF4444;">*</span></label>
                <input id="profFullName" type="text" value="${escapeHtml(p.fullName)}"
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">联系电话</label>
                <input id="profPhone" type="text" value="${escapeHtml(p.phone)}"
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;" />
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">角色</label>
                <input type="text" value="${escapeHtml(p.role)}" readonly
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:#F9FAFB;color:#6B7280;" />
            </div>
            <div class="form-group">
                <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">部门</label>
                <input type="text" value="${escapeHtml(p.department)}" readonly
                       style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;background:#F9FAFB;color:#6B7280;" />
            </div>
        </div>

        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E5E7EB;display:flex;gap:12px;">
            <button id="saveProfileBtn" style="padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">
                <i class="fas fa-save"></i> 保存个人信息
            </button>
            <button id="changePasswordBtn" style="padding:8px 24px;background:#FEF3C7;color:#92400E;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
                <i class="fas fa-key"></i> 修改密码
            </button>
        </div>
    `;

    // 绑定事件
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfileInfo);
    document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);

    // 更换头像
    document.getElementById('changeAvatarBtn')?.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    state.profile.avatar = ev.target.result;
                    saveProfile();
                    renderForm();
                    showToast('头像已更新', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // 输入变化标记
    container.querySelectorAll('input:not([readonly])').forEach(el => {
        el.addEventListener('input', () => { state.saved = false; });
    });
}

/**
 * @private
 * @description 保存个人信息
 */
function saveProfileInfo() {
    const email = document.getElementById('profEmail')?.value.trim();
    const fullName = document.getElementById('profFullName')?.value.trim();
    const phone = document.getElementById('profPhone')?.value.trim();

    if (!email) {
        showToast('请输入邮箱地址', 'warning');
        return;
    }
    if (!fullName) {
        showToast('请输入全名', 'warning');
        return;
    }

    state.profile.email = email;
    state.profile.fullName = fullName;
    state.profile.phone = phone || '';

    if (saveProfile()) {
        // 更新store中的用户信息
        const user = store.get('user');
        if (user) {
            user.name = fullName;
            user.email = email;
            store.set('user', user);
        }
        showToast('个人信息已保存', 'success');
    } else {
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * @private
 * @description 修改密码
 */
function changePassword() {
    const oldPassword = prompt('请输入当前密码：');
    if (oldPassword === null) return;
    if (!oldPassword) {
        showToast('请输入当前密码', 'warning');
        return;
    }

    const newPassword = prompt('请输入新密码（至少6位）：');
    if (newPassword === null) return;
    if (newPassword.length < 6) {
        showToast('新密码至少6位', 'warning');
        return;
    }

    const confirmPassword = prompt('请再次输入新密码：');
    if (confirmPassword === null) return;
    if (newPassword !== confirmPassword) {
        showToast('两次密码输入不一致', 'error');
        return;
    }

    // 模拟密码验证和修改
    if (oldPassword === 'admin123') {
        // 保存新密码（实际项目中应调用API）
        localStorage.setItem('user_password', newPassword);
        showToast('密码修改成功', 'success');
    } else {
        showToast('当前密码错误', 'error');
    }
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    // Ctrl+S 保存
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('profileForm')) {
                saveProfileInfo();
            }
        }
    });
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {ProfileInfo} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('👤 个人设置 初始化...');

    if (options?.data) {
        state.profile = { ...state.profile, ...options.data };
        saveProfile();
    }

    loadProfile();
    renderForm();
    bindEvents();

    window.ProfileModule = {
        state,
        loadProfile,
        saveProfile,
        saveProfileInfo,
        changePassword,
        renderForm
    };

    console.log('✅ 个人设置 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadProfile,
    saveProfile,
    saveProfileInfo,
    changePassword
};