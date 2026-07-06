/**
 * components/sidebar.js - 侧边栏组件
 * 支持移动端滑动菜单和桌面端折叠
 */
window.SidebarComponent = {
    _menuItems: [
        // Dashboard 模块
        { module: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
        { module: 'pos', icon: 'fa-cash-register', label: 'POS' },
        { module: 'orders', icon: 'fa-clipboard-list', label: 'Orders' },
        { module: 'products', icon: 'fa-box', label: 'Products' },
        { module: 'crm', icon: 'fa-users', label: 'CRM' },
        { module: 'marketing', icon: 'fa-bullhorn', label: 'Marketing' },
        { module: 'inventory', icon: 'fa-warehouse', label: 'Inventory' },
        { module: 'purchasing', icon: 'fa-truck', label: 'Purchasing' },
        { module: 'finance', icon: 'fa-coins', label: 'Finance' },
        { module: 'hr', icon: 'fa-user-tie', label: 'HR' },
        { module: 'saas', icon: 'fa-cloud', label: 'SaaS' },
        { module: 'system', icon: 'fa-cog', label: 'System' },
        { module: 'analytics', icon: 'fa-chart-bar', label: 'Analytics' },
        { module: 'settings', icon: 'fa-sliders-h', label: 'Settings' }
    ],

    // Dashboard 子菜单
    _dashboardSubMenu: [
        { module: 'sales', label: 'Sales', defaultPage: 'sales' },
        { module: 'executive', label: 'Executive', defaultPage: 'executive' },
        { module: 'ai', label: '🤖 AI', defaultPage: 'ai' },
        { module: 'crm', label: 'CRM', defaultPage: 'crm' },
        { module: 'finance', label: 'Finance', defaultPage: 'finance' },
        { module: 'inventory', label: 'Inventory', defaultPage: 'inventory' },
        { module: 'marketing', label: 'Marketing', defaultPage: 'marketing' },
        { module: 'employee', label: 'Employee', defaultPage: 'employee' },
        { module: 'vehicle-monitor', label: 'Vehicle Monitor', defaultPage: 'vehicle-monitor' }
    ],

    render: function(container) {
        var user = AppStore.get('currentUser');
        var perms = user ? AppConfig.permissions[user.role] || [] : [];
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

        // 渲染主菜单
        for (var i = 0; i < this._menuItems.length; i++) {
            var item = this._menuItems[i];
            var show = perms.indexOf(item.module) !== -1 || perms.length === 0;

            if (show) {
                var activeClass = '';
                var currentModule = AppStore.get('currentModule') || '';
                if (item.module === 'dashboard') {
                    activeClass = currentModule === 'dashboard' || currentModule === 'sales' || 
                                  currentModule === 'executive' || currentModule === 'ai' ||
                                  currentModule === 'crm' || currentModule === 'finance' ||
                                  currentModule === 'inventory' || currentModule === 'marketing' ||
                                  currentModule === 'employee' || currentModule === 'vehicle-monitor' ? ' nav-item-active' : '';
                } else {
                    activeClass = (item.module === currentModule) ? ' nav-item-active' : '';
                }

                // 判断是否是 Dashboard（有子菜单）
                if (item.module === 'dashboard') {
                    var isExpanded = currentModule === 'dashboard' || currentModule === 'sales' || 
                                     currentModule === 'executive' || currentModule === 'ai' ||
                                     currentModule === 'crm' || currentModule === 'finance' ||
                                     currentModule === 'inventory' || currentModule === 'marketing' ||
                                     currentModule === 'employee' || currentModule === 'vehicle-monitor';
                    
                    html += '<div class="sidebar-group' + (isExpanded ? ' open' : '') + '">';
                    html += '<div class="sidebar-group-label" onclick="this.parentElement.classList.toggle(\'open\')">';
                    html += '<i class="fas ' + item.icon + ' w-5"></i>';
                    html += '<span class="menu-label">' + item.label + '</span>';
                    html += '<i class="fas fa-chevron-down toggle-icon ml-auto"></i>';
                    html += '</div>';
                    html += '<div class="sidebar-group-items">';

                    // 渲染 Dashboard 子菜单
                    for (var j = 0; j < this._dashboardSubMenu.length; j++) {
                        var sub = this._dashboardSubMenu[j];
                        var isSubActive = currentModule === sub.module;
                        var onClickAttr = isMobile ? ' onclick="setTimeout(function(){ if(window.closeSidebar) window.closeSidebar(); }, 300);"' : '';
                        html += '<a href="#" data-module="' + sub.module + '" class="sidebar-link sub-item' + (isSubActive ? ' nav-item-active' : '') + '"' + onClickAttr + '>' +
                            '<span class="menu-label">' + sub.label + '</span>' +
                            '</a>';
                    }

                    html += '</div></div>';
                } else {
                    var onClickAttr = isMobile ? ' onclick="setTimeout(function(){ if(window.closeSidebar) window.closeSidebar(); }, 300);"' : '';
                    html += '<a href="#" data-module="' + item.module + '" class="sidebar-link' + activeClass + '"' + onClickAttr + '>' +
                        '<i class="fas ' + item.icon + ' w-5"></i>' +
                        '<span class="menu-label">' + item.label + '</span>' +
                        '</a>';
                }
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

            if (window.innerWidth > 768) {
                var saved = localStorage.getItem('sidebar_expanded');
                if (saved === 'true') {
                    container.classList.add('expanded');
                } else {
                    container.classList.remove('expanded');
                }
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

                // 如果是 Dashboard 子模块，设置父模块为 dashboard
                var isDashboardSub = ['sales', 'executive', 'ai', 'crm', 'finance', 'inventory', 'marketing', 'employee', 'vehicle-monitor'].indexOf(module) !== -1;
                if (isDashboardSub) {
                    AppStore.set('currentModule', module);
                }

                if (window.ModuleLoader) {
                    ModuleLoader.load(module);
                }

                var allLinks = container.querySelectorAll('[data-module]');
                for (var j = 0; j < allLinks.length; j++) {
                    allLinks[j].classList.remove('nav-item-active');
                }
                this.classList.add('nav-item-active');

                // 展开 Dashboard 组
                var group = this.closest('.sidebar-group');
                if (group) {
                    group.classList.add('open');
                }

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

    setActive: function(moduleName) {
        var allLinks = document.querySelectorAll('[data-module]');
        for (var i = 0; i < allLinks.length; i++) {
            var el = allLinks[i];
            el.classList.remove('nav-item-active');
            if (el.dataset.module === moduleName) {
                el.classList.add('nav-item-active');
                var group = el.closest('.sidebar-group');
                if (group) {
                    group.classList.add('open');
                }
            }
        }
    }
};

console.log('[SidebarComponent] 加载完成');