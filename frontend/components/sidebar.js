/**
 * components/sidebar.js - 侧边栏组件
 * 支持移动端滑动菜单和桌面端折叠
 */
window.SidebarComponent = {
    _menuItems: [
        { module: 'dashboard', icon: 'fa-chart-line', label: '仪表板' },
        { module: 'cashier', icon: 'fa-cash-register', label: 'POS收银' },
        { module: 'orders', icon: 'fa-clipboard-list', label: '订单管理' },
        { module: 'products', icon: 'fa-box', label: '商品管理' },
        { module: 'customers', icon: 'fa-users', label: '客户管理' },
        { module: 'promotions', icon: 'fa-bullhorn', label: '促销管理' },
        { module: 'inventory', icon: 'fa-boxes', label: '库存管理' },
        { module: 'purchase-orders', icon: 'fa-file-invoice', label: '采购订单' },
        { module: 'receiving', icon: 'fa-boxes', label: '采购收货' },
        { module: 'suppliers', icon: 'fa-truck', label: '供应商管理' },
        { module: 'income', icon: 'fa-coins', label: '收入管理' },
        { module: 'employees', icon: 'fa-user-tie', label: '员工管理' },
        { module: 'tenants', icon: 'fa-building', label: '租户管理' },
        { module: 'audit-logs', icon: 'fa-history', label: '审计日志' },
        { module: 'reports', icon: 'fa-chart-bar', label: '报表管理' },
        { module: 'company', icon: 'fa-building', label: '公司设置' },
        { module: 'attendance', icon: 'fa-clock', label: '考勤管理' },
        { module: 'reports', icon: 'fa-chart-bar', label: '财务管理' },
        { module: 'employees', icon: 'fa-user-tie', label: '员工审核' },
        { module: 'audit', icon: 'fa-history', label: '审计日志' },
        { module: 'vehicle-monitor', icon: 'fa-camera', label: '🚗 车辆监控' },
        { module: 'plate-recognize', icon: 'fa-id-card', label: '🚗 车牌识别' },
        { module: 'permission', icon: 'fa-shield-alt', label: '🔐 权限中心' },
        { module: 'settings', icon: 'fa-cog', label: '系统设置' }
    ],

    render: function(container) {
        var user = AppStore.get('currentUser');
        var perms = user ? AppConfig.permissions[user.role] || [] : [];

        // 检查是否为移动端
        var isMobile = window.innerWidth <= 768;

        var html = '<aside class="w-64 bg-white shadow-xl z-20 flex flex-col border-r border-gray-100 h-full">' +
            '<div class="p-5 border-b border-gray-100 flex items-center gap-3">' +
            '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">' +
            '<i class="fas fa-car-wash text-white text-xl"></i>' +
            '</div>' +
            '<div>' +
            '<h1 class="text-xl font-bold text-blue-600">CarWash Pro</h1>' +
            '<p class="text-xs text-gray-400 sidebar-text">云端版 v2.0</p>' +
            '</div>' +
            '</div>' +
            '<div class="px-4 py-3 border-b border-gray-100">' +
            '<label class="text-xs text-gray-400 block mb-1 sidebar-text">当前门店</label>' +
            '<select id="branchSelector" class="w-full p-2 border rounded-lg text-sm bg-gray-50">' +
            '<option value="all">全部门店</option>' +
            '</select>' +
            '</div>' +
            '<nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">';

        for (var i = 0; i < this._menuItems.length; i++) {
            var item = this._menuItems[i];
            var show = perms.indexOf(item.module) !== -1 || perms.length === 0;
            if (show) {
                var activeClass = (item.module === 'dashboard') ? ' nav-item-active' : '';
                // 点击菜单项后，移动端自动关闭侧边栏
                var onClickAttr = '';
                if (isMobile) {
                    onClickAttr = ' onclick="setTimeout(function(){ if(window.closeSidebar) window.closeSidebar(); }, 300);"';
                }
                html += '<a href="#" data-module="' + item.module + '" class="sidebar-link' + activeClass + '"' + onClickAttr + '>' +    
                    '<i class="fas ' + item.icon + ' w-5"></i>' +
                    '<span class="menu-label">' + item.label + '</span>' +
                    '</a>';
            }
        }

        html += '</nav>' +
            '<div class="p-4 border-t border-gray-100">' +
            '<div class="flex items-center justify-between">' +
            '<div class="flex items-center gap-3">' +
            '<i class="fas fa-cloud text-blue-500 text-xl"></i>' +
            '<div>' +
            '<p class="text-xs text-gray-400 sidebar-text">同步状态</p>' +
            '<p class="text-sm font-semibold text-green-600">在线</p>' +
            '</div>' +
            '</div>' +
            '<span class="real-time-badge"><i class="fas fa-bolt"></i> 实时</span>' +
            '</div>' +
            '<div class="mt-2 text-xs text-gray-400">' +
            '<span id="currentUserSpan">' + (user && user.name ? user.name : user && user.username ? user.username : '未登录') + '</span>' +
            '<span class="mx-1">·</span>' +
            '<span id="currentRoleSpan" class="text-gray-500"></span>' +
            '</div>' +
            '</div>' +
            '</aside>';

        if (container) {
            container.innerHTML = html;
            this.bindEvents(container);

            // 恢复桌面端折叠状态
            if (window.innerWidth > 768) {
                var saved = localStorage.getItem('sidebar_expanded');
                if (saved === 'true') {
                    container.classList.add('expanded');
                } else {
                    container.classList.remove('expanded');
                }
                // 调整主内容区宽度
                var mainContent = document.getElementById('mainContentArea');
                if (mainContent) {
                    var isExpanded = container.classList.contains('expanded');
                    mainContent.style.width = isExpanded ? 'calc(100% - 280px)' : 'calc(100% - 64px)';
                }
            }
        }
        return html;
    },

    bindEvents: function(container) {
        var links = container.querySelectorAll('[data-module]');
        for (var i = 0; i < links.length; i++) {
            var el = links[i];
            el.addEventListener('click', function(e) {
                e.preventDefault();
                var module = this.dataset.module;
                AppStore.set('currentModule', module);
                
                // 使用 ModuleLoader 加载模块
                if (window.ModuleLoader) {
                    ModuleLoader.load(module);
                } else if (window.ModuleLoader) {
                    ModuleLoader.load(module);
                }
                
                var allLinks = container.querySelectorAll('[data-module]');
                for (var j = 0; j < allLinks.length; j++) {
                    allLinks[j].classList.remove('nav-item-active');
                }
                this.classList.add('nav-item-active');

                // 移动端点击后关闭侧边栏
                if (window.innerWidth <= 768 && window.closeSidebar) {
                    setTimeout(function() {
                        window.closeSidebar();
                    }, 300);
                }
            });
        }

        var branchSel = container.querySelector('#branchSelector');
        if (branchSel) {
            branchSel.addEventListener('change', function() {
                AppStore.set('currentBranch', this.value);
                var currentModule = AppStore.get('currentModule');
                if (currentModule && window.ModuleLoader) {
                    ModuleLoader.load(currentModule);
                }
                if (window.AppUtils) {
                    AppUtils.toast('已切换门店', 'info');
                }
            });
        }
    },

    /**
     * 设置当前激活的菜单项
     * @param {string} moduleName - 模块名称
     */
    setActive: function(moduleName) {
        var allLinks = document.querySelectorAll('[data-module]');
        for (var i = 0; i < allLinks.length; i++) {
            var el = allLinks[i];
            el.classList.remove('nav-item-active');
            if (el.dataset.module === moduleName) {
                el.classList.add('nav-item-active');
            }
        }
    }
};

console.log('[SidebarComponent] 加载完成');