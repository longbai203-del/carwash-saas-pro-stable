/**
 * components/navbar.js - 导航栏组件
 * 新增：移动端汉堡菜单按钮 + 桌面端折叠按钮
 */
window.NavbarComponent = {
    render: function(container) {
        var user = AppStore.get('currentUser');
        var roleLabels = { owner: '老板', manager: '店长', cashier: '收银员', employee: '员工' };
        
        // ===== 新增：汉堡菜单按钮（移动端显示） =====
        var menuBtn = '<button onclick="event.stopPropagation(); window.toggleSidebar()" class="sidebar-toggle-btn text-xl text-gray-600 hover:text-blue-600">' +
            '<i class="fas fa-bars"></i>' +
            '</button>';
        
        // ===== 新增：桌面端侧边栏折叠按钮 =====
        var collapseBtn = '<button onclick="window.toggleDesktopSidebar()" class="sidebar-collapse-btn text-gray-400 hover:text-gray-600" title="折叠侧边栏">' +
            '<i class="fas fa-chevron-left"></i>' +
            '</button>';
        
        var html = '<nav class="bg-white shadow-sm py-3 px-6 flex justify-between items-center border-b border-gray-100">' +
            '<div class="flex items-center gap-3">' +
            menuBtn +
            '<i class="fas fa-car text-blue-500 text-xl"></i>' +
            '<span class="text-xl font-bold text-gray-800">CarWash Pro</span>' +
            collapseBtn +
            '</div>' +
            '<div class="flex items-center gap-4">' +
            '<span class="text-sm text-gray-600 hidden md:inline">👤 ' + (user && user.name ? user.name : user && user.username ? user.username : '未登录') + '</span>' +
            '<span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">' + (user && user.role ? roleLabels[user.role] || user.role : '未登录') + '</span>' +
            '<button onclick="AppAuth.logout()" class="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100">退出</button>' +
            '</div>' +
            '</nav>';
        
        if (container) {
            container.innerHTML = html;
        }
        return html;
    }
};

console.log('[NavbarComponent] 加载完成');