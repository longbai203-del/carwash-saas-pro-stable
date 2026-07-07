/**
 * components/sidebar.js - 侧边栏组件
 * 支持移动端滑动菜单和桌面端折叠
 */
window.SidebarComponent = {
    _menuItems: [
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

    _dashboardSubMenu: [
        { module: 'dashboard', label: '📊 Dashboard' },
        { module: 'executive', label: '📈 Executive' },
        { module: 'ai', label: '🤖 AI' },
        { module: 'crm', label: '👥 CRM' },
        { module: 'finance', label: '💰 Finance' },
        { module: 'inventory', label: '📦 Inventory' },
        { module: 'marketing', label: '📢 Marketing' },
        { module: 'employee', label: '👤 Employee' },
        { module: 'vehicle-monitor', label: '🚗 Vehicle Monitor' }
    ],

    render: function(container) {
        var user = AppStore.get('currentUser');
        var perms = user ? AppConfig.permissions[user.role] || [] : [];
        var isMobile = window.innerWidth <= 768;
        var currentHash = window.location.hash.replace('#', '') || '/dashboard/dashboard';
        var parts = currentHash.split('/').filter(function(p) { return p.length > 0; });
        var currentKey = parts[0] || 'dashboard';
        var currentPage = parts[1] || 'dashboard';

        var subModules = ['dashboard', 'executive', 'ai', 'crm', 'finance', 'inventory', 'marketing', 'employee', 'vehicle-monitor'];
        var isDashboardSub = subModules.indexOf(currentPage) !== -1;

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
            '<nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">' +
            '<style>' +
            '.sidebar-group-items { overflow: hidden; transition: max-height 0.3s ease; max-height: 0; }' +
            '.sidebar-group.open .sidebar-group-items { max-height: 600px; }' +
            '.sidebar-group.open .toggle-icon { transform: rotate(180deg); }' +
            '.sidebar-group-label { display: flex; align-items: center; padding: 10px 14px; border-radius: 8px; cursor: pointer; }' +
            '.sidebar-group-label:hover { background: #F3F4F6; }' +
            '.sidebar-link.sub-item { display: block; padding: 8px 16px 8px 36px; border-radius: 6px; text-decoration: none; font-size: 14px; cursor: pointer; margin: 2px 0; }' +
            '.sidebar-link.sub-item:hover { background: #F3F4F6; }' +
            '.sidebar-link.sub-item.nav-item-active { background: #4F46E5; color: #FFFFFF; }' +
            '.toggle-icon { transition: transform 0.3s; margin-left: auto; }' +
            '</style>';

        for (var i = 0; i < this._menuItems.length; i++) {
            var item = this._menuItems[i];
            var show = perms.indexOf(item.module) !== -1 || perms.length === 0;

            if (show) {
                var isActive = false;
                if (item.module === 'dashboard') {
                    isActive = (currentKey === 'dashboard' || isDashboardSub);
                } else {
                    isActive = (currentKey === item.module);
                }

                if (item.module === 'dashboard') {
                    var isExpanded = (currentKey === 'dashboard' || isDashboardSub);

                    html += '<div class="sidebar-group' + (isExpanded ? ' open' : '') + '" style="margin-bottom:4px;">';
                    html += '<div class="sidebar-group-label" onclick="this.parentElement.classList.toggle(\'open\')" style="color:' + (isActive ? '#FFFFFF' : '#1F2937') + ';background:' + (isActive ? '#4F46E5' : 'transparent') + ';">';
                    html += '<i class="fas ' + item.icon + '" style="width:20px;text-align:center;color:' + (isActive ? '#FFFFFF' : '#6B7280') + ';"></i>';
                    html += '<span style="margin-left:12px;">' + item.label + '</span>';
                    html += '<i class="fas fa-chevron-down toggle-icon"></i>';
                    html += '</div>';
                    html += '<div class="sidebar-group-items">';

                    for (var j = 0; j < this._dashboardSubMenu.length; j++) {
                        var sub = this._dashboardSubMenu[j];
                        var isSubActive = (currentKey === 'dashboard' && currentPage === sub.module);
                        var href = '#/dashboard/' + sub.module;

                        html += '<a href="' + href + '" data-module="' + sub.module + '" class="sidebar-link sub-item' + (isSubActive ? ' nav-item-active' : '') + '">' +
                            '<span>' + sub.label + '</span>' +
                            '</a>';
                    }

                    html += '</div></div>';
                } else {
                    var href = '#/' + item.module + '/' + (item.defaultPage || 'index');
                    html += '<a href="' + href + '" data-module="' + item.module + '" style="display:flex;align-items:center;padding:10px 14px;border-radius:8px;text-decoration:none;color:' + (isActive ? '#FFFFFF' : '#1F2937') + ';background:' + (isActive ? '#4F46E5' : 'transparent') + ';margin-bottom:2px;transition:all 0.2s;cursor:pointer;font-size:14px;" onmouseover="this.style.background=\'' + (isActive ? '#4F46E5' : '#F3F4F6') + '\'" onmouseout="this.style.background=\'' + (isActive ? '#4F46E5' : 'transparent') + '\'">' +
                        '<i class="fas ' + item.icon + '" style="width:20px;text-align:center;color:' + (isActive ? '#FFFFFF' : '#6B7280') + ';"></i>' +
                        '<span style="margin-left:12px;">' + item.label + '</span>' +
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

            container.querySelectorAll('a[href^="#"]').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    var href = this.getAttribute('href');
                    if (href) {
                        window.location.hash = href.substring(1);
                    }
                });
            });

            var branchSel = container.querySelector('#branchSelector');
            if (branchSel) {
                branchSel.addEventListener('change', function() {
                    AppStore.set('currentBranch', this.value);
                    if (window.AppUtils) {
                        AppUtils.toast('已切换门店', 'info');
                    }
                });
            }
        }
        return html;
    },

    bindEvents: function(container) {
        var links = container.querySelectorAll('[data-module]');
        for (var i = 0; i < links.length; i++) {
            var el = links[i];
            if (!el.getAttribute('href')) {
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    var module = this.dataset.module;
                    AppStore.set('currentModule', module);
                    if (window.ModuleLoader) {
                        ModuleLoader.load(module);
                    }
                    var allLinks = container.querySelectorAll('[data-module]');
                    for (var j = 0; j < allLinks.length; j++) {
                        allLinks[j].classList.remove('nav-item-active');
                    }
                    this.classList.add('nav-item-active');
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