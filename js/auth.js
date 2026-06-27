// ================================================================
//  auth.js - 认证模块
// ================================================================

function showLogin() {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('registerView').classList.add('hidden');
    document.getElementById('forgotPasswordView').classList.add('hidden');
    document.getElementById('changePasswordView').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('registerView').classList.remove('hidden');
    document.getElementById('forgotPasswordView').classList.add('hidden');
    document.getElementById('changePasswordView').classList.add('hidden');
}

function showForgotPassword() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('registerView').classList.add('hidden');
    document.getElementById('forgotPasswordView').classList.remove('hidden');
    document.getElementById('changePasswordView').classList.add('hidden');
}

function showChangePassword() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('registerView').classList.add('hidden');
    document.getElementById('forgotPasswordView').classList.add('hidden');
    document.getElementById('changePasswordView').classList.remove('hidden');
    const old = document.getElementById('changeOldPassword');
    const newP = document.getElementById('changeNewPassword');
    const confirm = document.getElementById('changeConfirmPassword');
    if (old) old.value = '';
    if (newP) newP.value = '';
    if (confirm) confirm.value = '';
}

async function registerUser() {
    const username = document.getElementById('regUsername').value.trim();
    const name = document.getElementById('regName').value.trim() || username;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regPasswordConfirm').value;
    const role = document.getElementById('regRole').value;

    if (!username || !password) { showToast('请填写用户名和密码'); return; }
    if (password.length < 6) { showToast('密码至少6位'); return; }
    if (password !== confirm) { showToast('两次密码不一致'); return; }
    if (role === 'owner') { showToast('❌ 老板账号不能通过注册创建'); return; }

    try {
        const { data: existing } = await supabaseClient.from('users').select('username').eq('username', username);
        if (existing && existing.length > 0) { showToast('❌ 用户名已存在'); return; }

        const passwordHash = CryptoJS.SHA256(password).toString();
        const { error } = await supabaseClient.from('users').insert([{
            username, password_hash: passwordHash, role: role, name: name,
            status: 'pending', registered_at: new Date().toISOString()
        }]);

        if (error) throw new Error(error.message);
        showToast('✅ 注册申请已提交！请等待管理员审核');
        ['regUsername', 'regName', 'regPassword', 'regPasswordConfirm'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        showLogin();
    } catch (error) {
        showToast('❌ 注册失败: ' + error.message);
    }
}

async function authLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) { showToast('请输入用户名和密码'); return; }

    try {
        const { data: users, error } = await supabaseClient.from('users').select('*');
        if (error) throw new Error(error.message);
        if (!users || users.length === 0) { showToast('⚠️ 系统暂无用户，请先注册'); return; }

        allUsers = users;
        const user = users.find(u => u.username === username);
        if (!user) { showToast('❌ 用户不存在'); return; }

        if (user.status === 'pending') { showToast('⏳ 账号正在审核中'); return; }
        if (user.status === 'rejected') { showToast('❌ 账号已被拒绝'); return; }
        if (user.status !== 'approved') { showToast('❌ 账号状态异常'); return; }

        const hash = CryptoJS.SHA256(password).toString();
        if (user.password_hash !== hash) { showToast('❌ 密码错误'); return; }

        currentUser = {
            id: user.id, username: user.username, password_hash: user.password_hash,
            role: user.role || 'employee', name: user.name || user.username,
            status: user.status, registered_at: user.registered_at,
            approved_by: user.approved_by, approved_at: user.approved_at
        };

        localStorage.setItem('cw_session', JSON.stringify({
            id: user.id, username: user.username, role: user.role || 'employee'
        }));

        await loadAllData();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('appContainer').classList.remove('hidden');
        updateUIAfterLogin();
        showToast('👋 欢迎 ' + (user.name || user.username));
    } catch (error) {
        showToast('❌ 登录失败: ' + error.message);
    }
}

async function resetPassword() {
    const username = document.getElementById('forgotUsername').value.trim();
    const newPassword = document.getElementById('forgotNewPassword').value;
    const confirm = document.getElementById('forgotConfirmPassword').value;

    if (!username || !newPassword) { showToast('请填写用户名和新密码'); return; }
    if (newPassword.length < 6) { showToast('密码至少6位'); return; }
    if (newPassword !== confirm) { showToast('两次密码不一致'); return; }

    try {
        const { data: user } = await supabaseClient.from('users').select('id, status').eq('username', username).single();
        if (!user) { showToast('❌ 用户不存在'); return; }
        if (user.status !== 'approved') { showToast('❌ 账号未审核通过'); return; }

        const passwordHash = CryptoJS.SHA256(newPassword).toString();
        await supabaseClient.from('users').update({ password_hash: passwordHash }).eq('username', username);

        showToast('✅ 密码已重置，请登录');
        const loginUsername = document.getElementById('loginUsername');
        if (loginUsername) loginUsername.value = username;
        showLogin();
    } catch (error) {
        showToast('❌ 重置失败: ' + error.message);
    }
}

async function changePassword() {
    const username = document.getElementById('changeUsername').value.trim();
    const oldPassword = document.getElementById('changeOldPassword').value;
    const newPassword = document.getElementById('changeNewPassword').value;
    const confirm = document.getElementById('changeConfirmPassword').value;

    if (!username || !oldPassword || !newPassword) { showToast('请填写完整信息'); return; }
    if (newPassword.length < 6) { showToast('新密码至少6位'); return; }
    if (newPassword !== confirm) { showToast('两次密码不一致'); return; }

    try {
        const { data: user } = await supabaseClient.from('users').select('id, password_hash, status').eq('username', username).single();
        if (!user) { showToast('❌ 用户不存在'); return; }
        if (user.status !== 'approved') { showToast('❌ 账号未审核通过'); return; }

        const oldHash = CryptoJS.SHA256(oldPassword).toString();
        if (user.password_hash !== oldHash) { showToast('❌ 当前密码错误'); return; }

        const newHash = CryptoJS.SHA256(newPassword).toString();
        await supabaseClient.from('users').update({ password_hash: newHash }).eq('username', username);

        showToast('✅ 密码修改成功，请重新登录');
        const loginUsername = document.getElementById('loginUsername');
        if (loginUsername) loginUsername.value = username;
        showLogin();
    } catch (error) {
        showToast('❌ 修改失败: ' + error.message);
    }
}

function showChangePasswordFromMenu() {
    if (!currentUser) {
        showToast('请先登录');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }
    document.getElementById('loginModal').style.display = 'flex';
    showChangePassword();
    const usernameInput = document.getElementById('changeUsername');
    if (usernameInput) usernameInput.value = currentUser.username || '';
    showToast('请输入当前密码和新密码');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('cw_session');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('loginModal').style.display = 'flex';
    showToast('已退出');
}

function updateUIAfterLogin() {
    const role = currentUser?.role || 'employee';
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee;

    const navMap = {
        navCashier: 'cashier', navOrders: 'orders', navInventory: 'inventory',
        navCustomers: 'customers', navAttendance: 'attendance', navReports: 'reports',
        navEmployees: 'employees', navAudit: 'audit', navSettings: 'settings'
    };
    Object.entries(navMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.style.display = permissions[key] ? 'flex' : 'none';
    });

    const roleDisplay = document.getElementById('userRoleDisplay');
    if (roleDisplay) roleDisplay.textContent = (ROLE_PERMISSIONS[role]?.icon || '') + ' ' + (ROLE_PERMISSIONS[role]?.label || role);
    const currentRole = document.getElementById('currentRoleSpan');
    if (currentRole) currentRole.textContent = ROLE_PERMISSIONS[role]?.label || role;
    const currentUserSpan = document.getElementById('currentUserSpan');
    if (currentUserSpan) currentUserSpan.textContent = currentUser?.name || currentUser?.username || 'Admin';
    const headerUsername = document.getElementById('headerUsername');
    if (headerUsername) headerUsername.textContent = currentUser?.name || currentUser?.username || 'Admin';

    updateBranchSelector();
    refreshAll();

    // 使用 ModuleLoader 切换到仪表板
    if (window.ModuleLoader) {
        setTimeout(() => {
            ModuleLoader.switchTo('dashboard');
        }, 400);
    } else {
        console.warn('⚠️ ModuleLoader 未加载');
        switchTab('dashboard');
    }
}

function switchTab(tab) {
    if (window.ModuleLoader) {
        ModuleLoader.switchTo(tab);
        return;
    }
    // 兼容旧版
    console.warn('⚠️ 使用兼容模式切换:', tab);
    const container = document.getElementById('moduleContainer');
    if (!container) return;
    fetch(`modules/${tab}.html`).then(r => r.text()).then(html => {
        container.innerHTML = html;
        setTimeout(() => {
            const funcMap = {
                dashboard: 'refreshDashboard', cashier: 'refreshPOS',
                orders: 'loadOrders', inventory: 'refreshInventory',
                members: 'refreshCustomers', reports: 'loadDailyReport',
                attendance: 'refreshAttendance', employees: 'loadUsersForReview',
                audit: 'loadAuditLog', settings: 'loadSettings'
            };
            const fn = funcMap[tab];
            if (fn && typeof window[fn] === 'function') window[fn]();
        }, 300);
    });
}

function getFilteredOrders() {
    let orders = allOrders || [];
    const role = currentUser?.role || 'employee';
    if (role === 'owner' || role === 'manager') return orders;
    const username = currentUser?.name || currentUser?.username || '';
    return orders.filter(o => o.staff_name === username || o.employee_id === currentUser?.id);
}

function updateBranchSelector() {
    const sel = document.getElementById('branchSelector');
    if (!sel) return;
    sel.innerHTML = '<option value="all">🏪 全部门店</option>' + (allBranches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    if (currentBranch && currentBranch !== 'all') sel.value = currentBranch;
}

function switchBranch() {
    currentBranch = document.getElementById('branchSelector').value;
    refreshAll();
    const branchName = currentBranch === 'all' ? '全部门店' : (allBranches || []).find(b => b.id === currentBranch)?.name || '未知';
    showToast('已切换到: ' + branchName);
}

function refreshAll() {
    if (window.ModuleLoader) {
        ModuleLoader.refresh();
        return;
    }
    const currentTab = document.querySelector('[data-nav].nav-item-active')?.dataset?.nav || 'dashboard';
    const funcMap = {
        dashboard: 'refreshDashboard', cashier: 'refreshPOS',
        orders: 'loadOrders', inventory: 'refreshInventory',
        members: 'refreshCustomers', reports: 'loadDailyReport',
        attendance: 'refreshAttendance', employees: 'loadUsersForReview',
        audit: 'loadAuditLog', settings: 'loadSettings'
    };
    const fn = funcMap[currentTab];
    if (fn && typeof window[fn] === 'function') window[fn]();
}

console.log('✅ auth.js 已加载');