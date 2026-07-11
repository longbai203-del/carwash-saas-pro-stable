// frontend/src/config/modules.js
export const MODULE_REGISTRY = {
    // 核心业务模块
    dashboard: {
      id: 'dashboard',
      name: '仪表盘',
      path: '/dashboard',
      icon: 'home',
      order: 1,
      module: '01-dashboard',
      enabled: true
    },
    pos: {
      id: 'pos',
      name: 'POS收银',
      path: '/pos',
      icon: 'cash-register',
      order: 2,
      module: '02-pos',
      enabled: true
    },
    orders: {
      id: 'orders',
      name: '订单管理',
      path: '/orders',
      icon: 'clipboard',
      order: 3,
      module: '03-orders',
      enabled: true
    },
    products: {
      id: 'products',
      name: '商品管理',
      path: '/products',
      icon: 'box',
      order: 4,
      module: '04-products',
      enabled: true
    },
    customers: {
      id: 'customers',
      name: '客户管理',
      path: '/customers',
      icon: 'users',
      order: 5,
      module: '05-customers',
      enabled: true
    },
    marketing: {
      id: 'marketing',
      name: '营销管理',
      path: '/marketing',
      icon: 'megaphone',
      order: 6,
      module: '06-marketing',
      enabled: true
    },
    inventory: {
      id: 'inventory',
      name: '库存管理',
      path: '/inventory',
      icon: 'package',
      order: 7,
      module: '07-inventory',
      enabled: true
    },
    purchasing: {
      id: 'purchasing',
      name: '采购管理',
      path: '/purchasing',
      icon: 'truck',
      order: 8,
      module: '08-purchasing',
      enabled: true
    },
    finance: {
      id: 'finance',
      name: '财务管理',
      path: '/finance',
      icon: 'dollar-sign',
      order: 9,
      module: '09-finance',
      enabled: true
    },
    hr: {
      id: 'hr',
      name: '人力资源管理',
      path: '/hr',
      icon: 'user-plus',
      order: 10,
      module: '10-hr',
      enabled: true
    },
    saas: {
      id: 'saas',
      name: 'SaaS管理',
      path: '/saas',
      icon: 'cloud',
      order: 11,
      module: '11-saas',
      enabled: true
    },
    system: {
      id: 'system',
      name: '系统管理',
      path: '/system',
      icon: 'settings',
      order: 12,
      module: '12-system',
      enabled: true
    },
    analytics: {
      id: 'analytics',
      name: '数据分析',
      path: '/analytics',
      icon: 'chart-bar',
      order: 13,
      module: '13-analytics',
      enabled: true
    },
    settings: {
      id: 'settings',
      name: '设置中心',
      path: '/settings',
      icon: 'cog',
      order: 14,
      module: '14-settings',
      enabled: true
    },
    ai: {
      id: 'ai',
      name: 'AI智能分析',
      path: '/ai',
      icon: 'brain',
      order: 15,
      module: '15-ai',
      enabled: true
    }
  }
  
  // 工具函数：获取所有模块
  export const getAllModules = () => Object.values(MODULE_REGISTRY)
  
  // 工具函数：获取启用的模块
  export const getEnabledModules = () => Object.values(MODULE_REGISTRY).filter(m => m.enabled)
  
  // 工具函数：按顺序排序
  export const getSortedModules = () => Object.values(MODULE_REGISTRY).sort((a, b) => a.order - b.order)
  
  // 工具函数：获取模块路径
  export const getModulePath = (id) => {
    const module = MODULE_REGISTRY[id]
    return module ? `/modules/${module.module}` : null
  }