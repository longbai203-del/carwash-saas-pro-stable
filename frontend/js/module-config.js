/**
 * 模块配置文件 - 定义所有模块的路径和元数据
 */

const MODULE_CONFIG = {
    // 核心模块
    'dashboard': {
        path: '/modules/01-dashboard/sales/dashboard.html',
        label: '仪表板',
        icon: 'fa-chart-line'
    },
    'cashier': {
        path: '/modules/02-pos/quick-sale/cashier.html',
        label: 'POS收银',
        icon: 'fa-cash-register'
    },
    'orders': {
        path: '/modules/03-orders/list/orders.html',
        label: '订单管理',
        icon: 'fa-clipboard-list'
    },
    'products': {
        path: '/modules/04-products/products/products.html',
        label: '商品管理',
        icon: 'fa-box'
    },
    'customers': {
        path: '/modules/05-customers/customers/customers.html',
        label: '客户管理',
        icon: 'fa-users'
    },
    'promotions': {
        path: '/modules/06-marketing/promotions/promotions.html',
        label: '促销管理',
        icon: 'fa-bullhorn'
    },
    'inventory': {
        path: '/modules/07-inventory/stock/inventory.html',
        label: '库存管理',
        icon: 'fa-warehouse'
    },
    'purchase-orders': {
        path: '/modules/08-purchase/orders/orders.html',
        label: '采购订单',
        icon: 'fa-file-invoice'
    },
    'receiving': {
        path: '/modules/08-purchase/receiving/receiving.html',
        label: '采购收货',
        icon: 'fa-boxes'
    },
    'suppliers': {
        path: '/modules/08-purchase/suppliers/suppliers.html',
        label: '供应商管理',
        icon: 'fa-truck'
    },
    'income': {
        path: '/modules/09-finance/income/income.html',
        label: '收入管理',
        icon: 'fa-coins'
    },
    'employees': {
        path: '/modules/10-hr/employees/employees.html',
        label: '员工管理',
        icon: 'fa-user-tie'
    },
    'tenants': {
        path: '/modules/11-saas/tenants/tenants.html',
        label: '租户管理',
        icon: 'fa-building'
    },
    'audit-logs': {
        path: '/modules/12-system/audit-logs/audit-logs.html',
        label: '审计日志',
        icon: 'fa-history'
    },
    'reports': {
        path: '/modules/13-analytics/reports/reports.html',
        label: '报表管理',
        icon: 'fa-chart-bar'
    },
    'company': {
        path: '/modules/14-settings/company/company.html',
        label: '公司设置',
        icon: 'fa-building'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MODULE_CONFIG;
}

// 全局访问
window.MODULE_CONFIG = MODULE_CONFIG;

console.log('✅ 模块配置已加载，共 ' + Object.keys(MODULE_CONFIG).length + ' 个模块');
