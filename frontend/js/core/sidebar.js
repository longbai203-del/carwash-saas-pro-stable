/**
 * @file sidebar.js
 * @module core/sidebar
 * @description 侧边栏系统 - 动态菜单生成、权限过滤、交互控制
 * 
 * @example
 * import { initSidebar } from './sidebar.js';
 * 
 * // 初始化侧边栏
 * await initSidebar();
 * 
 * // 切换侧边栏
 * sidebar.toggle();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from './store.js';
import { router } from './router.js';
import { apiClient } from './api/api-client.js';

/**
 * @typedef {Object} MenuItem
 * @property {string} id - 菜单ID
 * @property {string} icon - 图标类名
 * @property {string} label - 显示名称
 * @property {string} path - 路径
 * @property {string[]} [permissions] - 所需权限
 * @property {MenuItem[]} [children] - 子菜单
 * @property {boolean} [public] - 是否公开
 */

/**
 * 默认菜单配置
 */
const DEFAULT_MENUS = [
    {
        id: 'dashboard',
        icon: 'fa-th-large',
        label: '仪表板',
        path: '/dashboard',
        permissions: ['dashboard:view']
    },
    {
        id: 'pos',
        icon: 'fa-cash-register',
        label: 'POS收银',
        path: '/pos',
        permissions: ['pos:view']
    },
    {
        id: 'orders',
        icon: 'fa-shopping-bag',
        label: '订单管理',
        path: '/orders',
        permissions: ['orders:view'],
        children: [
            { id: 'orders-list', label: '订单列表', path: '/orders/list', permissions: ['orders:view'] },
            { id: 'orders-refunds', label: '退款管理', path: '/orders/refunds', permissions: ['orders:view'] }
        ]
    },
    {
        id: 'products',
        icon: 'fa-box',
        label: '商品管理',
        path: '/products',
        permissions: ['products:view'],
        children: [
            { id: 'products-list', label: '商品列表', path: '/products/list', permissions: ['products:view'] },
            { id: 'products-categories', label: '分类管理', path: '/products/categories', permissions: ['products:edit'] },
            { id: 'products-brands', label: '品牌管理', path: '/products/brands', permissions: ['products:edit'] }
        ]
    },
    {
        id: 'customers',
        icon: 'fa-users',
        label: '客户管理',
        path: '/customers',
        permissions: ['customers:view'],
        children: [
            { id: 'customers-list', label: '客户列表', path: '/customers/list', permissions: ['customers:view'] },
            { id: 'customers-vehicles', label: '车辆管理', path: '/customers/vehicles', permissions: ['customers:view'] }
        ]
    },
    {
        id: 'inventory',
        icon: 'fa-warehouse',
        label: '库存管理',
        path: '/inventory',
        permissions: ['inventory:view'],
        children: [
            { id: 'inventory-stock', label: '库存盘点', path: '/inventory/stock', permissions: ['inventory:view'] },
            { id: 'inventory-warehouses', label: '仓库管理', path: '/inventory/warehouses', permissions: ['inventory:edit'] },
            { id: 'inventory-transfers', label: '调拨管理', path: '/inventory/transfers', permissions: ['inventory:edit'] }
        ]
    },
    {
        id: 'finance',
        icon: 'fa-coins',
        label: '财务管理',
        path: '/finance',
        permissions: ['finance:view'],
        children: [
            { id: 'finance-income', label: '收入管理', path: '/finance/income', permissions: ['finance:view'] },
            { id: 'finance-expenses', label: '支出管理', path: '/finance/expenses', permissions: ['finance:view'] },
            { id: 'finance-reports', label: '财务报表', path: '/finance/reports', permissions: ['finance:view'] }
        ]
    },
    {
        id: 'hr',
        icon: 'fa-user-tie',
        label: '人力资源管理',
        path: '/hr',
        permissions: ['employees:view'],
        children: [
            { id: 'hr-employees', label: '员工管理', path: '/hr/employees', permissions: ['employees:view'] },
            { id: 'hr-attendance', label: '考勤管理', path: '/hr/attendance', permissions: ['attendance:view'] },
            { id: 'hr-payroll', label: '薪资管理', path: '/hr/payroll', permissions: ['employees:view'] }
        ]
    },
    {
        id: 'marketing',
        icon: 'fa-bullhorn',
        label: '营销管理',
        path: '/marketing',
        permissions: ['marketing:view'],
        children: [
            { id: 'marketing-campaigns', label: '营销活动', path: '/marketing/campaigns', permissions: ['marketing:view'] },
            { id: 'marketing-promotions', label: '促销管理', path: '/marketing/promotions', permissions: ['marketing:edit'] }
        ]
    },
    {
        id: 'analytics',
        icon: 'fa-chart-line',
        label: '数据分析',
        path: '/analytics',
        permissions: ['reports:view'],
        children: [
            { id: 'analytics-reports', label: '数据报表', path: '/analytics/reports', permissions: ['reports:view'] },
            { id: 'analytics-forecast', label: '预测分析', path: '/analytics/forecast', permissions: ['reports:view'] }
        ]
    },
    {
        id: 'settings',
        icon: 'fa-cog',
        label: '系统设置',
        path: '/settings',
        permissions: ['settings:view'],
        children: [
            { id: 'settings-general', label: '常规设置', path: '/settings/general', permissions: ['settings:view'] },
            { id: 'settings-permissions', label: '权限管理', path: '/settings/permissions', permissions: ['settings:edit'] }
        ]
    }
];

/**
 * @class Sidebar
 * @description 侧边栏管理类
 */
class Sidebar {
    constructor() {
        /** @type {HTMLElement|null} 侧边栏容器 */
        this.container = document.querySelector('.sidebar-nav');

        /** @type {boolean} 是否折叠 */
        this.isCollapsed = false;

        /** @type {MenuItem[]} 菜单列表 */
        this.menus = [];

        /** @type {string} 当前路径 */
        this.currentPath = '';

        /** @type {boolean} 是否已初始化 */
        this.initialized = false;

        // 绑定方法
        this.init = this.init.bind(this);
        this.render = this.render.bind(this);
        this.toggle = this.toggle.bind(this);
        this.collapse = this.collapse.bind(this);
        this.expand = this.expand.bind(this);
        this.setActive = this.setActive.bind(this);
        this.filterMenusByPermission = this.filterMenusByPermission.bind(this);

        // 监听路由变化
        this.setupRouteListener();

        // 从存储恢复状态
        if (typeof window !== 'undefined') {
            const saved = store.get('sidebarCollapsed');
            if (saved !== undefined) {
                this.isCollapsed = saved;
            }
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 初始化侧边栏
     */
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            // 加载菜单配置
            await this.loadMenus();

            // 渲染菜单
            this.render();

            // 设置当前激活项
            if (typeof window !== 'undefined') {
                this.setActive(window.location.pathname);
            }

            // 绑定事件
            this.bindEvents();

            // 响应式处理
            this.handleResponsive();

            console.log('✅ 侧边栏初始化完成');
        } catch (error) {
            console.error('侧边栏初始化失败:', error);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 加载菜单配置
     */
    async loadMenus() {
        try {
            // 尝试从服务器加载动态菜单
            const response = await apiClient.get('/menu');
            if (response.success && response.data) {
                this.menus = response.data;
                store.set('menus', this.menus);
                return;
            }
        } catch (error) {
            console.warn('加载动态菜单失败，使用默认菜单');
        }

        // 使用默认菜单
        this.menus = DEFAULT_MENUS;

        // 从存储恢复菜单
        const storedMenus = store.get('menus');
        if (storedMenus && storedMenus.length > 0) {
            this.menus = storedMenus;
        }
    }

    /**
     * @private
     * @param {MenuItem[]} menus - 菜单列表
     * @param {string[]} permissions - 用户权限
     * @returns {MenuItem[]} 过滤后的菜单
     * @description 根据权限过滤菜单
     */
    filterMenusByPermission(menus, permissions) {
        if (!permissions || permissions.length === 0) {
            // 没有权限时只显示公共菜单
            return menus.filter(m => m.public);
        }

        const filtered = [];
        for (const menu of menus) {
            // 检查是否有权限访问该菜单
            const hasPermission = !menu.permissions ||
                menu.permissions.some(p => permissions.includes('*') || permissions.includes(p));

            if (hasPermission) {
                const filteredMenu = { ...menu };
                if (menu.children) {
                    filteredMenu.children = this.filterMenusByPermission(menu.children, permissions);
                }
                filtered.push(filteredMenu);
            }
        }
        return filtered;
    }

    /**
     * @public
     * @description 渲染侧边栏
     */
    render() {
        if (!this.container) {
            console.warn('侧边栏容器未找到');
            return;
        }

        // 获取用户权限
        const permissions = store.get('permissions') || [];
        const user = store.get('user');

        // 如果是admin，拥有所有权限
        const effectivePermissions = user?.role === 'admin' ? ['*'] : permissions;

        // 过滤菜单
        const filteredMenus = this.filterMenusByPermission(this.menus, effectivePermissions);

        // 生成HTML
        let html = '<ul class="sidebar-menu">';

        for (const menu of filteredMenus) {
            const hasChildren = menu.children && menu.children.length > 0;
            const isActive = this.currentPath.startsWith(menu.path) && menu.path !== '/';
            const isExactActive = this.currentPath === menu.path;

            html += `<li class="menu-item ${isActive || isExactActive ? 'active' : ''}">`;

            if (hasChildren) {
                html += `
                    <div class="menu-toggle" data-menu="${menu.id}">
                        <i class="fas ${menu.icon}"></i>
                        <span class="menu-label">${menu.label}</span>
                        <i class="fas fa-chevron-down menu-arrow"></i>
                    </div>
                    <ul class="sub-menu" style="${isActive ? 'display:block' : 'display:none'}">
                `;

                for (const child of menu.children) {
                    const isChildActive = this.currentPath === child.path;
                    html += `
                        <li class="sub-menu-item ${isChildActive ? 'active' : ''}">
                            <a href="${child.path}" data-path="${child.path}">
                                <i class="fas fa-circle"></i>
                                <span>${child.label}</span>
                            </a>
                        </li>
                    `;
                }

                html += `</ul>`;
            } else {
                html += `
                    <a href="${menu.path}" data-path="${menu.path}" class="${isExactActive ? 'active' : ''}">
                        <i class="fas ${menu.icon}"></i>
                        <span class="menu-label">${menu.label}</span>
                    </a>
                `;
            }

            html += `</li>`;
        }

        html += '</ul>';

        this.container.innerHTML = html;

        // 更新用户信息
        this.updateUserInfo();

        // 应用折叠状态
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.isCollapsed);
        }
    }

    /**
     * @private
     * @description 更新用户信息
     */
    updateUserInfo() {
        const user = store.get('user');
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');

        if (userNameEl) {
            userNameEl.textContent = user?.name || user?.full_name || '用户';
        }

        if (userRoleEl) {
            const roleMap = {
                'admin': '管理员',
                'manager': '经理',
                'staff': '员工',
                'cashier': '收银员'
            };
            userRoleEl.textContent = roleMap[user?.role] || user?.role || '访客';
        }
    }

    /**
     * @private
     * @description 绑定事件
     */
    bindEvents() {
        // 菜单切换（展开/折叠）
        const toggles = this.container.querySelectorAll('.menu-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const parent = toggle.closest('.menu-item');
                const subMenu = parent.querySelector('.sub-menu');
                if (subMenu) {
                    const isOpen = subMenu.style.display !== 'none';
                    subMenu.style.display = isOpen ? 'none' : 'block';
                    toggle.classList.toggle('open', !isOpen);
                }
            });
        });

        // 菜单项点击
        const links = this.container.querySelectorAll('a[data-path]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-path');
                if (path) {
                    this.setActive(path);
                    router.navigate(path);

                    // 移动端点击后关闭侧边栏
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                        this.collapse();
                    }
                }
            });
        });

        // 侧边栏折叠切换
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }

        // 移动端菜单切换
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggle();
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // 窗口大小变化时处理响应式
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this.handleResponsive.bind(this));
        }

        // 监听状态变化
        store.subscribe('user', () => {
            this.updateUserInfo();
        });

        store.subscribe('permissions', () => {
            this.render();
        });
    }

    /**
     * @private
     * @description 设置路由监听
     */
    setupRouteListener() {
        router.on('routeLoaded', ({ moduleName, pageName, params }) => {
            const path = `/${moduleName}/${pageName}`;
            this.setActive(path);
        });
    }

    /**
     * @public
     * @param {string} path - 路径
     * @description 设置激活项
     */
    setActive(path) {
        this.currentPath = path;

        // 移除所有激活状态
        const allItems = this.container.querySelectorAll('.menu-item, .sub-menu-item');
        allItems.forEach(item => item.classList.remove('active'));

        // 移除所有链接激活状态
        const allLinks = this.container.querySelectorAll('a');
        allLinks.forEach(link => link.classList.remove('active'));

        // 激活匹配的项
        const links = this.container.querySelectorAll(`a[data-path="${path}"]`);
        links.forEach(link => {
            link.classList.add('active');
            const parent = link.closest('.menu-item');
            if (parent) {
                parent.classList.add('active');
                // 如果有父级菜单，展开
                const subMenu = parent.querySelector('.sub-menu');
                if (subMenu) {
                    subMenu.style.display = 'block';
                    const toggle = parent.querySelector('.menu-toggle');
                    if (toggle) {
                        toggle.classList.add('open');
                    }
                }
            }

            // 激活父级菜单项
            const parentItem = link.closest('.sub-menu-item');
            if (parentItem) {
                parentItem.classList.add('active');
                const grandParent = parentItem.closest('.menu-item');
                if (grandParent) {
                    grandParent.classList.add('active');
                    const subMenu = grandParent.querySelector('.sub-menu');
                    if (subMenu) {
                        subMenu.style.display = 'block';
                        const toggle = grandParent.querySelector('.menu-toggle');
                        if (toggle) {
                            toggle.classList.add('open');
                        }
                    }
                }
            }
        });
    }

    /**
     * @public
     * @description 切换侧边栏状态
     */
    toggle() {
        this.isCollapsed = !this.isCollapsed;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.isCollapsed);
        }
        store.set('sidebarCollapsed', this.isCollapsed);
    }

    /**
     * @public
     * @description 折叠侧边栏
     */
    collapse() {
        this.isCollapsed = true;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
        store.set('sidebarCollapsed', true);
    }

    /**
     * @public
     * @description 展开侧边栏
     */
    expand() {
        this.isCollapsed = false;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
        }
        store.set('sidebarCollapsed', false);
    }

    /**
     * @private
     * @description 处理响应式
     */
    handleResponsive() {
        if (typeof window === 'undefined') return;
        const width = window.innerWidth;
        const sidebar = document.querySelector('.sidebar');

        if (width <= 768) {
            if (sidebar) {
                sidebar.classList.add('mobile');
            }
            // 小屏幕默认折叠
            if (!this.isCollapsed) {
                this.collapse();
            }
        } else {
            if (sidebar) {
                sidebar.classList.remove('mobile');
            }
            // 大屏幕恢复之前的状态
            const savedState = store.get('sidebarCollapsed');
            if (savedState !== undefined) {
                this.isCollapsed = savedState;
                if (sidebar) {
                    sidebar.classList.toggle('collapsed', this.isCollapsed);
                }
            } else {
                this.expand();
            }
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @description 处理退出登录
     */
    async handleLogout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.warn('退出请求失败:', error);
        }

        apiClient.setToken(null);
        store.clear(['theme', 'language']);
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 更新菜单（动态刷新）
     */
    async refresh() {
        await this.loadMenus();
        this.render();
        this.setActive(this.currentPath);
    }

    /**
     * @public
     * @param {MenuItem} menu - 菜单项
     * @description 添加自定义菜单项
     */
    addMenu(menu) {
        this.menus.push(menu);
        store.set('menus', this.menus);
        this.render();
    }

    /**
     * @public
     * @param {string} menuId - 菜单ID
     * @description 移除菜单项
     */
    removeMenu(menuId) {
        this.menus = this.menus.filter(m => m.id !== menuId);
        store.set('menus', this.menus);
        this.render();
    }
}

// 创建单例实例
/**
 * @global
 * @type {Sidebar}
 * @description 全局Sidebar实例
 */
export const sidebar = new Sidebar();

/**
 * @public
 * @returns {Promise<void>}
 * @description 初始化侧边栏（供app.js调用）
 */
export async function initSidebar() {
    await sidebar.init();
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.sidebar = sidebar;
}

export default sidebar;