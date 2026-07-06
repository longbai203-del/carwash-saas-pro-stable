// modules/14-settings/company/company.js
import { getCompanySettings, updateCompanySettings } from '../../../api/settings.js';
import { showToast } from '../../../js/utils.js';

const state = {
    settings: {
        name: '',
        logo: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        businessLicense: '',
        description: ''
    },
    loading: false
};

export async function init() {
    console.log('公司设置已加载');
    await loadSettings();
    bindEvents();
}

async function loadSettings() {
    state.loading = true;
    showLoading();

    try {
        const data = await getMockSettings();
        state.settings = data;
        renderForm();
    } catch (error) {
        console.error('加载设置失败:', error);
        showToast('加载数据失败', 'error');
    } finally {
        state.loading = false;
        hideLoading();
    }
}

function getMockSettings() {
    return {
        name: 'CarwashPro 洗车管理系统',
        logo: 'https://via.placeholder.com/150x50/4F46E5/FFFFFF?text=CARWASH',
        address: '中国广东省深圳市南山区科技园路88号',
        phone: '400-888-9999',
        email: 'info@carwashpro.com',
        website: 'https://www.carwashpro.com',
        taxId: '91440300MA5XXXXX',
        businessLicense: '91440300MA5XXXXX',
        description: '专业的洗车店管理系统，提供收银、会员、库存、财务等一站式解决方案'
    };
}

function renderForm() {
    const form = document.getElementById('companyForm');
    if (!form) return;

    const fields = [
        { id: 'companyName', label: '公司名称', value: state.settings.name, type: 'text' },
        { id: 'companyAddress', label: '公司地址', value: state.settings.address, type: 'text' },
        { id: 'companyPhone', label: '联系电话', value: state.settings.phone, type: 'text' },
        { id: 'companyEmail', label: '电子邮箱', value: state.settings.email, type: 'email' },
        { id: 'companyWebsite', label: '公司网站', value: state.settings.website, type: 'url' },
        { id: 'companyTaxId', label: '税号', value: state.settings.taxId, type: 'text' },
        { id: 'companyLicense', label: '营业执照', value: state.settings.businessLicense, type: 'text' },
        { id: 'companyDescription', label: '公司简介', value: state.settings.description, type: 'textarea' }
    ];

    form.innerHTML = fields.map(field => `
        <div class="form-group">
            <label for="${field.id}">${field.label}</label>
            ${field.type === 'textarea' ? 
                `<textarea id="${field.id}" class="form-control" rows="3">${field.value}</textarea>` :
                `<input id="${field.id}" type="${field.type}" class="form-control" value="${field.value}" />`
            }
        </div>
    `).join('');

    // 如果有logo，显示预览
    if (state.settings.logo) {
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
            logoPreview.innerHTML = `
                <img src="${state.settings.logo}" alt="Logo" style="max-height:60px;" />
                <button class="btn btn-secondary btn-sm" onclick="changeLogo()">更换Logo</button>
            `;
        }
    }
}

async function saveSettings() {
    const formData = {
        name: document.getElementById('companyName').value,
        address: document.getElementById('companyAddress').value,
        phone: document.getElementById('companyPhone').value,
        email: document.getElementById('companyEmail').value,
        website: document.getElementById('companyWebsite').value,
        taxId: document.getElementById('companyTaxId').value,
        businessLicense: document.getElementById('companyLicense').value,
        description: document.getElementById('companyDescription').value
    };

    try {
        // await updateCompanySettings(formData);
        state.settings = { ...state.settings, ...formData };
        showToast('保存成功！', 'success');
        // 模拟保存
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        showToast('保存失败', 'error');
    }
}

function changeLogo() {
    showToast('上传Logo功能开发中', 'info');
    // 触发文件上传
}

function resetSettings() {
    if (!confirm('确认恢复默认设置吗？')) return;
    loadSettings();
    showToast('已恢复默认设置', 'info');
}

function bindEvents() {
    document.getElementById('saveBtn')?.addEventListener('click', saveSettings);
    document.getElementById('resetBtn')?.addEventListener('click', resetSettings);
    document.getElementById('changeLogoBtn')?.addEventListener('click', changeLogo);
}

function showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}