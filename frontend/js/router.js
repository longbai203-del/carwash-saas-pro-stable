/**
 * router.js - 路由管理器
 */
(function() {
    window.AppRouter = {
        currentRoute: null,
        defaultRoute: 'dashboard',

        init: function() {
            console.log('[Router] 初始化...');
            var self = this;
            window.addEventListener('hashchange', function() {
                self.handleRoute();
            });
            this.handleRoute();
        },

        navigate: function(moduleName, updateHash) {
            if (updateHash === undefined) updateHash = true;
            if (this.currentRoute === moduleName) return;

            var user = AppStore.get('currentUser');
            if (user) {
                var perms = AppConfig.permissions[user.role] || [];
                if (perms.indexOf(moduleName) === -1) {
                    if (window.AppUtils) {
                        AppUtils.toast('您没有权限访问此页面', 'warning');
                    }
                    return;
                }
            }

            this.currentRoute = moduleName;
            AppStore.set('currentModule', moduleName);

            if (updateHash) {
                window.location.hash = moduleName;
            }

            if (window.ModuleLoader) {
                ModuleLoader.load(moduleName);
            }

            var titleEl = document.getElementById('currentPageTitle');
            if (titleEl) {
                var titles = {
                    dashboard: '仪表板',
                    cashier: '收银台',
                    orders: '订单管理',
                    inventory: '库存',
                    customers: '客户',
                    attendance: '考勤',
                    reports: '财务',
                    employees: '员工审核',
                    audit: '审计日志',
                    'vehicle-monitor': '车辆监控',
                    settings: '设置'
                };
                titleEl.textContent = titles[moduleName] || moduleName;
            }
        },

        handleRoute: function() {
            var hash = window.location.hash.replace('#', '') || this.defaultRoute;
            this.navigate(hash, false);
        },

        getCurrentRoute: function() {
            return this.currentRoute;
        },

        back: function() {
            window.history.back();
        }
    };
    console.log('[Router] 加载完成');
})();