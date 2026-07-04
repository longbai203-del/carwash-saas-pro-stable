/**
 * config.js - 全局配置
 */
window.AppConfig = {
    // ===== Supabase 配置（新项目） =====
    supabase: {
        url: 'https://ukqhdzvegqlkimxzkfcp.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcWhkenZlZ3Fsa2lteHprZmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjE3OTQsImV4cCI6MjA5ODczNzc5NH0.YuEB1rzpqc8kynZukXU4ANKnVtpIC3JJ9IEacQ2fcQE'
    },
    
    // ===== API 配置 =====
    api: {
        baseUrl: '/api'
    },
    
    // ===== 应用配置 =====
    app: {
        name: 'CarWash Pro',
        version: '3.0.0',
        debug: true
    },
    
    // ===== 默认配置 =====
    defaults: {
        vatRate: 15,
        shopName: 'Car Wash Pro',
        shopTaxId: '310245678900003',
        commissionRate: 5
    },

    // ===== 订单状态 =====
    orderStatusLabels: {
        pending: '待处理',
        confirmed: '已确认',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
    },

    orderStatusClasses: {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        in_progress: 'status-in_progress',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
    },
    
    // ===== 模块列表 =====
    modules: {
        dashboard: { label: '仪表板', icon: 'fa-chart-line', permission: 'dashboard' },
        cashier: { label: 'POS收银', icon: 'fa-cash-register', permission: 'cashier' },
        orders: { label: '订单管理', icon: 'fa-clipboard-list', permission: 'orders' },
        inventory: { label: '库存管理', icon: 'fa-boxes', permission: 'inventory' },
        customers: { label: '客户管理', icon: 'fa-users', permission: 'customers' },
        attendance: { label: '考勤管理', icon: 'fa-clock', permission: 'attendance' },
        reports: { label: '财务管理', icon: 'fa-chart-bar', permission: 'reports' },
        employees: { label: '员工审核', icon: 'fa-user-tie', permission: 'employees' },
        audit: { label: '审计日志', icon: 'fa-history', permission: 'audit' },
        'vehicle-monitor': { label: '🚗 车辆监控', icon: 'fa-camera', permission: 'vehicle-monitor' },
        permission: { label: '🔐 权限中心', icon: 'fa-shield-alt', permission: 'permission' },
        settings: { label: '系统设置', icon: 'fa-cog', permission: 'settings' }
    },
    
    // ===== 角色权限 =====
    permissions: {
        owner: ['dashboard', 'cashier', 'orders', 'inventory', 'customers', 
                'attendance', 'reports', 'employees', 'audit', 'settings', 
                'vehicle-monitor', 'permission'],
        admin: ['dashboard', 'cashier', 'orders', 'inventory', 'customers', 
                'attendance', 'reports', 'employees', 'audit', 'settings',
                'vehicle-monitor', 'permission'],
        manager: ['dashboard', 'cashier', 'orders', 'inventory', 'customers', 'attendance', 'reports'],
        cashier: ['dashboard', 'cashier', 'customers'],
        employee: ['dashboard', 'attendance']
    }
};

console.log('[Config] ✅ 加载完成');