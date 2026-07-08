/**
 * components/sidebar.js - 侧边栏组件 (重构版)
 * @module sidebar
 * @description 渲染侧边栏菜单，支持折叠、激活状态、响应路由变化
 * 
 * @example
 * import { SidebarComponent } from './components/sidebar.js';
 * const sidebar = document.getElementById('sidebar');
 * SidebarComponent.render(sidebar);
 * // 或使用便捷方法
 * SidebarComponent.init(sidebar);
 */

import { appStore } from '../js/core/store.js';
import { router } from '../js/core/router.js';

/**
 * 侧边栏组件对象
 */
export const SidebarComponent = {
    /** @type {HTMLElement} 容器元素 */
    container: null,
    /** @type {Array} 菜单配置 */
    menuItems: [],
    /** @type {string} 当前路径 */
    currentPath: '',
    /** @type {number} 展开的菜单ID */
    expandedMenu: null,

    /**
     * 初始化侧边栏
     * @param {HTMLElement} container - 侧边栏容器
     * @returns {void}
     */
    init(container) {
        this.container = container;
        if (!container) {
            console.error('[Sidebar] ❌ 容器不存在');
            return;
        }

        // 从Store获取菜单配置
        this.menuItems = appStore.get('menuConfig') || this.getDefaultMenu();

        // 渲染
        this.render();

        // 绑定事件
        this.bindEvents();

        // 监听路由变化
        document.addEventListener('menu:activate', (e) => {
            if (e.detail && e.detail.path) {
                this.setActive(e.detail.path);
            }
        });

        console.log('[Sidebar] ✅ 初始化完成');
    },

    /**
     * 渲染侧边栏
     * @returns {void}
     */
    render() {
        if (!this.container) return;

        // 获取当前路径
        this.currentPath = router.getCurrentPath() || window.location.hash.replace('#', '') || '/dashboard';

        const html = this.buildMenuHTML();
        this.container.innerHTML = html;
    },

    /**
     * 获取默认菜单配置
     * @returns {Array} 菜单数组
     */
    getDefaultMenu() {
        return [
            {
                id: 'dashboard',
                icon: 'fa-chart-pie',
                label: 'Dashboard',
                path: '/dashboard',
                children: [
                    { id: 'overview', label: '📊 总览', path: '/dashboard' },
                    { id: 'executive', label: '📈 高管视图', path: '/dashboard/executive' },
                    { id: 'ai', label: '🤖 AI 分析', path: '/dashboard/ai' },
                    { id: 'crm', label: '👥 CRM', path: '/dashboard/crm' },
                    { id: 'finance', label: '💰 财务', path: '/dashboard/finance' },
                    { id: 'inventory', label: '📦 库存', path: '/dashboard/inventory' },
                    { id: 'marketing', label: '📢 营销', path: '/dashboard/marketing' },
                    { id: 'employee', label: '👤 员工', path: '/dashboard/employee' },
                    { id: 'vehicle-monitor', label: '🚗 车辆监控', path: '/dashboard/vehicle-monitor' }
                ]
            },
            {
                id: 'pos',
                icon: 'fa-cash-register',
                label: 'POS',
                path: '/pos',
                children: [
                    { id: 'cashier', label: '💵 收银台', path: '/pos/cashier' },
                    { id: 'quick-sale', label: '⚡ 快速销售', path: '/pos/quick-sale' },
                    { id: 'touch-pos', label: '👆 触屏POS', path: '/pos/touch-pos' },
                    { id: 'offline-pos', label: '📶 离线POS', path: '/pos/offline-pos' },
                    { id: 'returns', label: '↩️ 退货管理', path: '/pos/returns' },
                    { id: 'exchange', label: '🔄 换货管理', path: '/pos/exchange' }
                ]
            },
            {
                id: 'orders',
                icon: 'fa-clipboard-list',
                label: 'Orders',
                path: '/orders',
                children: [
                    { id: 'orders-list', label: '📋 订单列表', path: '/orders' },
                    { id: 'orders-detail', label: '📄 订单详情', path: '/orders/detail' },
                    { id: 'orders-refunds', label: '💰 退款管理', path: '/orders/refunds' },
                    { id: 'orders-returns', label: '↩️ 退货管理', path: '/orders/returns' }
                ]
            },
            {
                id: 'products',
                icon: 'fa-box',
                label: 'Products',
                path: '/products',
                children: [
                    { id: 'products-list', label: '📦 商品管理', path: '/products' },
                    { id: 'products-categories', label: '📁 分类管理', path: '/products/categories' },
                    { id: 'products-brands', label: '🏷️ 品牌管理', path: '/products/brands' },
                    { id: 'products-barcodes', label: '📊 条码管理', path: '/products/barcodes' }
                ]
            },
            {
                id: 'crm',
                icon: 'fa-users',
                label: 'CRM',
                path: '/crm',
                children: [
                    { id: 'crm-customers', label: '👥 客户管理', path: '/crm' },
                    { id: 'crm-membership', label: '👑 会员管理', path: '/crm/membership' },
                    { id: 'crm-vehicles', label: '🚗 车辆管理', path: '/crm/vehicles' },
                    { id: 'crm-coupons', label: '🎫 优惠券', path: '/crm/coupons' }
                ]
            },
            {
                id: 'marketing',
                icon: 'fa-megaphone',
                label: 'Marketing',
                path: '/marketing',
                children: [
                    { id: 'marketing-promotions', label: '🎯 促销管理', path: '/marketing' },
                    { id: 'marketing-campaigns', label: '📢 营销活动', path: '/marketing/campaigns' },
                    { id: 'marketing-loyalty', label: '⭐ 积分管理', path: '/marketing/loyalty' }
                ]
            },
            {
                id: 'inventory',
                icon: 'fa-warehouse',
                label: 'Inventory',
                path: '/inventory',
                children: [
                    { id: 'inventory-stock', label: '📦 库存管理', path: '/inventory' },
                    { id: 'inventory-transfers', label: '🚚 调拨管理', path: '/inventory/transfers' },
                    { id: 'inventory-low-stock', label: '⚠️ 低库存预警', path: '/inventory/low-stock' }
                ]
            },
            {
                id: 'purchasing',
                icon: 'fa-truck',
                label: 'Purchasing',
                path: '/purchasing',
                children: [
                    { id: 'purchasing-orders', label: '📋 采购订单', path: '/purchasing' },
                    { id: 'purchasing-suppliers', label: '🏢 供应商管理', path: '/purchasing/suppliers' }
                ]
            },
            {
                id: 'finance',
                icon: 'fa-coins',
                label: 'Finance',
                path: '/finance',
                children: [
                    { id: 'finance-income', label: '📈 收入管理', path: '/finance' },
                    { id: 'finance-expenses', label: '📉 支出管理', path: '/finance/expenses' },
                    { id: 'finance-vat', label: '🧾 VAT管理', path: '/finance/vat' }
                ]
            },
            {
                id: 'hr',
                icon: 'fa-user-tie',
                label: 'HR',
                path: '/hr',
                children: [
                    { id: 'hr-employees', label: '👤 员工管理', path: '/hr' },
                    { id: 'hr-attendance', label: '📋 考勤管理', path: '/hr/attendance' },
                    { id: 'hr-payroll', label: '💰 薪资管理', path: '/hr/payroll' }
                ]
            },
            {
                id: 'saas',
                icon: 'fa-cloud',
                label: 'SaaS',
                path: '/saas',
                children: [
                    { id: 'saas-tenants', label: '🏢 租户管理', path: '/saas' },
                    { id: 'saas-subscriptions', label: '📋 订阅管理', path: '/saas/subscriptions' },
                    { id: 'saas-billing', label: '💳 计费管理', path: '/saas/billing' }
                ]
            },
            {
                id: 'system',
                icon: 'fa-cog',
                label: 'System',
                path: '/system',
                children: [
                    { id: 'system-audit-logs', label: '📋 审计日志', path: '/system' },
                    { id: 'system-permissions', label: '🔐 权限管理', path: '/system/permissions' },
                    { id: 'system-settings', label: '⚙️ 系统设置', path: '/system/settings' }
                ]
            },
            {
                id: 'analytics',
                icon: 'fa-chart-bar',
                label: 'Analytics',
                path: '/analytics',
                children: [
                    { id: 'analytics-reports', label: '📊 报表中心', path: '/analytics' },
                    { id: 'analytics-forecast', label: '📈 预测分析', path: '/analytics/forecast' }
                ]
            },
            {
                id: 'settings',
                icon: 'fa-sliders-h',
                label: 'Settings',
                path: '/settings',
                children: [
                    { id: 'settings-company', label: '🏢 公司设置', path: '/settings' },
                    { id: 'settings-profile', label: '👤 个人设置', path: '/settings/profile' }
                ]
            }
        ];
    },

    /**
     * 构建菜单HTML
     * @returns {string} HTML字符串
     */
    buildMenuHTML() {
        let html = `
            <style>
                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    padding: 8px 12px;
                }
                .menu-item {
                    border-radius: 8px;
                    overflow: hidden;
                }
                .menu-item.active > .menu-header {
                    background: #4F46E5;
                    color: white;
                }
                .menu-item.active > .menu-header i {
                    color: white;
                }
                .menu-header {
                    display: flex;
                    align-items: center;
                    padding: 10px 14px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #1F2937;
                    font-size: 14px;
                    user-select: none;
                }
                .menu-header:hover {
                    background: #F3F4F6;
                }
                .menu-item.active > .menu-header:hover {
                    background: #4338CA;
                }
                .menu-header i:first-child {
                    width: 20px;
                    text-align: center;
                    color: #6B7280;
                }
                .menu-item.active > .menu-header i:first-child {
                    color: white;
                }
                .menu-header span {
                    margin-left: 12px;
                    flex: 1;
                }
                .menu-arrow {
                    transition: transform 0.3s;
                    margin-left: auto;
                    font-size: 12px;
                }
                .menu-arrow.open {
                    transform: rotate(180deg);
                }
                .menu-children {
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    max-height: 0;
                }
                .menu-children.open {
                    max-height: 600px;
                }
                .menu-child {
                    display: block;
                    padding: 8px 16px 8px 36px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-size: 14px;
                    cursor: pointer;
                    margin: 2px 0;
                    color: #4B5563;
                    transition: all 0.2s;
                }
                .menu-child:hover {
                    background: #F3F4F6;
                    color: #1F2937;
                }
                .menu-child.active {
                    background: #4F46E5;
                    color: white;
                }
                .menu-child.active:hover {
                    background: #4338CA;
                }
                .sidebar-footer {
                    padding: 12px 16px;
                    border-top: 1px solid #E5E7EB;
                    margin-top: auto;
                }
                [data-theme="dark"] .menu-header {
                    color: #E5E7EB;
                }
                [data-theme="dark"] .menu-header:hover {
                    background: #374151;
                }
                [data-theme="dark"] .menu-child {
                    color: #9CA3AF;
                }
                [data-theme="dark"] .menu-child:hover {
                    background: #374151;
                    color: #F3F4F6;
                }
                [data-theme="dark"] .sidebar-footer {
                    border-color: #374151;
                }
                [data-theme="dark"] .menu-item.active > .menu-header {
                    background: #6366F1;
                }
            </style>
            <nav class="sidebar-nav">
        `;

        this.menuItems.forEach(item => {
            const isActive = this.currentPath.startsWith(item.path);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = isActive || this.currentPath === item.path || this.expandedMenu === item.id;

            html += `<div class="menu-item ${isActive ? 'active' : ''}" data-menu-id="${item.id}">`;
            html += `<div class="menu-header" data-target="${item.id}" data-path="${item.path}">`;
            html += `<i class="fas ${item.icon}"></i>`;
            html += `<span>${item.label}</span>`;
            if (hasChildren) {
                html += `<i class="fas fa-chevron-down menu-arrow ${isExpanded ? 'open' : ''}"></i>`;
            }
            html += '</div>';

            if (hasChildren) {
                html += `<div class="menu-children ${isExpanded ? 'open' : ''}" data-parent="${item.id}">`;
                item.children.forEach(child => {
                    const childActive = this.currentPath === child.path;
                    html += `<a href="#${child.path}" class="menu-child ${childActive ? 'active' : ''}" data-path="${child.path}">${child.label}</a>`;
                });
                html += '</div>';
            }
            html += '</div>';
        });

        html += '</nav>';

        // 底部信息
        const user = appStore.get('user');
        html += `
            <div class="sidebar-footer">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:8px;height:8px;background:#10B981;border-radius:50%;"></span>
                    <span style="font-size:12px;color:#6B7280;">系统在线</span>
                    <span style="margin-left:auto;font-size:12px;color:#6B7280;">${user ? user.name : '未登录'}</span>
                </div>
            </div>
        `;

        return html;
    },

    /**
     * 绑定事件
     * @returns {void}
     */
    bindEvents() {
        if (!this.container) return;

        // 1. 菜单折叠切换
        this.container.querySelectorAll('.menu-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const parentItem = header.closest('.menu-item');
                if (!parentItem) return;

                const childrenContainer = parentItem.querySelector('.menu-children');
                const arrow = header.querySelector('.menu-arrow');

                if (childrenContainer) {
                    childrenContainer.classList.toggle('open');
                    if (arrow) arrow.classList.toggle('open');

                    // 保存展开状态
                    const menuId = parentItem.dataset.menuId;
                    if (childrenContainer.classList.contains('open')) {
                        this.expandedMenu = menuId;
                    } else if (this.expandedMenu === menuId) {
                        this.expandedMenu = null;
                    }
                }

                // 如果是导航链接，触发路由
                const path = header.dataset.path;
                if (path && !header.querySelector('.menu-children')) {
                    window.location.hash = `#${path}`;
                }
            });
        });

        // 2. 菜单链接点击 (事件委托)
        this.container.addEventListener('click', (e) => {
            const link = e.target.closest('.menu-child');
            if (link) {
                e.preventDefault();
                const path = link.dataset.path;
                if (path) {
                    window.location.hash = `#${path}`;
                    // 更新激活状态
                    this.setActive(path);
                }
            }
        });
    },

    /**
     * 设置激活状态
     * @param {string} path - 路径
     * @returns {void}
     */
    setActive(path) {
        this.currentPath = path;

        if (!this.container) return;

        // 移除所有激活状态
        this.container.querySelectorAll('.menu-item, .menu-child').forEach(el => {
            el.classList.remove('active');
        });

        // 激活当前菜单项
        const activeLink = this.container.querySelector(`.menu-child[data-path="${path}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const parentItem = activeLink.closest('.menu-item');
            if (parentItem) {
                parentItem.classList.add('active');
                const childrenContainer = parentItem.querySelector('.menu-children');
                if (childrenContainer) {
                    childrenContainer.classList.add('open');
                }
                const arrow = parentItem.querySelector('.menu-arrow');
                if (arrow) arrow.classList.add('open');
            }
        }

        // 如果没有找到精确匹配，尝试父路径匹配
        if (!activeLink) {
            const parentMatch = this.container.querySelector(`.menu-item[data-menu-id]`);
            if (parentMatch) {
                const menuId = parentMatch.dataset.menuId;
                const menuItem = this.menuItems.find(m => m.id === menuId);
                if (menuItem && path.startsWith(menuItem.path)) {
                    parentMatch.classList.add('active');
                    const childrenContainer = parentMatch.querySelector('.menu-children');
                    if (childrenContainer) {
                        childrenContainer.classList.add('open');
                    }
                    const arrow = parentMatch.querySelector('.menu-arrow');
                    if (arrow) arrow.classList.add('open');
                }
            }
        }
    },

    /**
     * 刷新侧边栏
     * @returns {void}
     */
    refresh() {
        this.render();
        this.setActive(this.currentPath);
    }
};

// 导出默认对象
export default SidebarComponent;