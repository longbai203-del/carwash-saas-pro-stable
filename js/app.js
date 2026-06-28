/**
 * app.js - 应用主入口
 */
(function() {
    'use strict';

    window.App = {
        _initialized: false,

        // ===== 初始化 =====
        async init() {
            if (this._initialized) return;
            console.log('[App] 初始化...');

            try {
                const saved = localStorage.getItem('cw_config');
                if (saved) {
                    const config = JSON.parse(saved);
                    AppStore.set('config', { ...AppStore.get('config'), ...config });
                }
            } catch(e) {}

            // 先加载数据，再初始化UI
            await this.loadData();
            this.updateUI();
            this.bindEvents();
            this.setupRealtime();

            this._initialized = true;
            console.log('[App] 初始化完成');
        },

        // ===== 加载所有数据 =====
        async loadData() {
            try {
                AppStore.set('isLoading', true);
                console.log('[App] 开始加载数据...');

                const [users, orders, customers, inventory, attendance, branches, auditLogs] = await Promise.all([
                    AppApi.getUsers(),
                    AppApi.getOrders(),
                    AppApi.getCustomers(),
                    AppApi.getInventory(),
                    AppApi.getAttendance(),
                    AppApi.getBranches(),
                    AppApi.query('audit_logs', { order: { by: 'created_at', ascending: false }, limit: 100 })
                ]);

                console.log('[App] 数据加载完成:', {
                    users: users?.length || 0,
                    orders: orders?.length || 0,
                    customers: customers?.length || 0,
                    inventory: inventory?.length || 0,
                    attendance: attendance?.length || 0,
                    branches: branches?.length || 0,
                    auditLogs: auditLogs?.length || 0
                });

                AppStore.update({
                    allUsers: users || [],
                    allOrders: orders || [],
                    allCustomers: customers || [],
                    allInventory: inventory || [],
                    allAttendance: attendance || [],
                    allBranches: branches || [],
                    allAuditLogs: auditLogs || [],
                    isLoading: false
                });

                // 强制通知所有模块数据已更新
                this._notifyModules();

            } catch (error) {
                console.error('[App] 加载数据失败:', error);
                AppStore.set('isLoading', false);
                AppUtils.toast('⚠️ 加载数据失败: ' + error.message, 'error');
            }
        },

        // ===== 通知所有模块数据已更新 =====
        _notifyModules: function() {
            // 如果有激活的模块，重新加载它
            const activeModule = ModuleLoader.getActive();
            if (activeModule) {
                const module = ModuleLoader.getModule(activeModule);
                if (module && typeof module.loadData === 'function') {
                    console.log('[App] 通知模块刷新: ' + activeModule);
                    module.loadData();
                }
            }
        },

        // ===== 更新UI =====
        updateUI() {
            const user = AppStore.get('currentUser');
            if (!user) return;

            const role = user.role || 'employee';
            const perms = AppConfig.permissions[role] || [];

            document.querySelectorAll('[data-module]').forEach(el => {
                const module = el.dataset.module;
                el.style.display = perms.includes(module) ? 'flex' : 'none';
            });

            const roleLabels = { owner: '老板', manager: '店长', cashier: '收银员', employee: '员工' };
            document.getElementById('userRoleDisplay').textContent = (roleLabels[role] || role);
            document.getElementById('currentRoleSpan').textContent = roleLabels[role] || role;
            document.getElementById('currentUserSpan').textContent = user.name || user.username || 'Admin';
            document.getElementById('headerUsername').textContent = user.name || user.username || 'Admin';

            this.updateBranchSelector();
        },

        // ===== 更新门店选择器 =====
        updateBranchSelector() {
            const sel = document.getElementById('branchSelector');
            if (!sel) return;
            const branches = AppStore.get('allBranches') || [];
            sel.innerHTML = '<option value="all">🏪 全部门店</option>' +
                branches.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');
        },

        // ===== 绑定事件 =====
        bindEvents() {
            const self = this;

            // 模块切换
            document.querySelectorAll('[data-module]').forEach(el => {
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    const module = this.dataset.module;
                    AppRouter.navigate(module);
                });
            });

            // 门店切换
            document.getElementById('branchSelector')?.addEventListener('change', function() {
                AppStore.set('currentBranch', this.value);
                const currentModule = AppStore.get('currentModule');
                if (currentModule) AppRouter.navigate(currentModule);
                AppUtils.toast('已切换门店', 'info');
            });
        },

        // ===== 实时同步 =====
        setupRealtime() {
            if (window._realtimeSubscription) {
                window._realtimeSubscription.unsubscribe();
            }

            const client = window.SupabaseService ? window.SupabaseService.getClient() : null;
            if (!client) return;

            window._realtimeSubscription = client
                .channel('app-realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                    const orders = AppStore.get('allOrders') || [];
                    orders.unshift(payload.new);
                    AppStore.set('allOrders', orders);
                    AppUtils.toast('🔔 新订单: ' + payload.new.plate_number + ' ' + payload.new.total + ' SAR', 'success');
                    this._notifyModules();
                })
                .subscribe();
        },

        // ===== 切换模块 =====
        switchModule(moduleName) {
            AppRouter.navigate(moduleName);
        },

        // ===== 刷新数据 =====
        async refreshData() {
            await this.loadData();
        }
    };

    // 暴露刷新方法到全局
    window.refreshAppData = function() {
        App.loadData();
    };

    console.log('[App] 加载完成');
})();