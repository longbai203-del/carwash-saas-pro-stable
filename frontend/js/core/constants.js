/**
 * @file constants.js
 * @module constants
 * @description 常量定义 - 系统常量
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

/**
 * @description 应用常量
 */
export const APP = {
    NAME: 'Carwash Pro',
    VERSION: '2.0.0',
    DESCRIPTION: '智能洗车管理平台'
};

/**
 * @description 用户角色
 */
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    INVENTORY: 'inventory',
    FINANCE: 'finance',
    VIEWER: 'viewer'
};

/**
 * @description 权限
 */
export const PERMISSIONS = {
    // 仪表盘
    DASHBOARD_ACCESS: 'dashboard:access',
    DASHBOARD_VIEW: 'dashboard:view',
    
    // POS
    POS_ACCESS: 'pos:access',
    POS_CREATE: 'pos:create',
    POS_UPDATE: 'pos:update',
    POS_DELETE: 'pos:delete',
    
    // 订单
    ORDER_ACCESS: 'order:access',
    ORDER_CREATE: 'order:create',
    ORDER_UPDATE: 'order:update',
    ORDER_DELETE: 'order:delete',
    ORDER_EXPORT: 'order:export',
    
    // 商品
    PRODUCT_ACCESS: 'product:access',
    PRODUCT_CREATE: 'product:create',
    PRODUCT_UPDATE: 'product:update',
    PRODUCT_DELETE: 'product:delete',
    
    // 客户
    CUSTOMER_ACCESS: 'customer:access',
    CUSTOMER_CREATE: 'customer:create',
    CUSTOMER_UPDATE: 'customer:update',
    CUSTOMER_DELETE: 'customer:delete',
    
    // 库存
    INVENTORY_ACCESS: 'inventory:access',
    INVENTORY_UPDATE: 'inventory:update',
    INVENTORY_EXPORT: 'inventory:export',
    
    // 财务
    FINANCE_ACCESS: 'finance:access',
    FINANCE_VIEW: 'finance:view',
    FINANCE_EXPORT: 'finance:export',
    
    // 人力资源
    HR_ACCESS: 'hr:access',
    HR_CREATE: 'hr:create',
    HR_UPDATE: 'hr:update',
    HR_DELETE: 'hr:delete',
    
    // 系统
    SYSTEM_ACCESS: 'system:access',
    SYSTEM_SETTINGS: 'system:settings',
    SYSTEM_USERS: 'system:users',
    SYSTEM_ROLES: 'system:roles'
};

/**
 * @description 订单状态
 */
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

/**
 * @description 订单状态显示
 */
export const ORDER_STATUS_LABELS = {
    pending: { label: '待处理', color: '#F59E0B' },
    confirmed: { label: '已确认', color: '#3B82F6' },
    processing: { label: '处理中', color: '#8B5CF6' },
    completed: { label: '已完成', color: '#10B981' },
    cancelled: { label: '已取消', color: '#EF4444' },
    refunded: { label: '已退款', color: '#6B7280' }
};

/**
 * @description 支付方式
 */
export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    ALIPAY: 'alipay',
    WECHAT: 'wechat',
    BANK: 'bank',
    CREDIT: 'credit'
};

/**
 * @description 支付方式显示
 */
export const PAYMENT_METHOD_LABELS = {
    cash: '现金',
    card: '银行卡',
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行转账',
    credit: '赊账'
};

/**
 * @description 库存操作类型
 */
export const INVENTORY_ACTIONS = {
    RECEIVE: 'receive',
    SALE: 'sale',
    RETURN: 'return',
    ADJUST: 'adjust',
    TRANSFER: 'transfer',
    COUNT: 'count'
};

/**
 * @description 库存操作显示
 */
export const INVENTORY_ACTION_LABELS = {
    receive: '入库',
    sale: '销售出库',
    return: '退货入库',
    adjust: '库存调整',
    transfer: '库存调拨',
    count: '盘点'
};

/**
 * @description 时间格式
 */
export const DATE_FORMATS = {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    SHORT_DATE: 'MM-DD',
    SHORT_TIME: 'HH:mm'
};

/**
 * @description 货币
 */
export const CURRENCIES = {
    CNY: { code: 'CNY', symbol: '¥', name: '人民币' },
    USD: { code: 'USD', symbol: '$', name: '美元' },
    EUR: { code: 'EUR', symbol: '€', name: '欧元' },
    JPY: { code: 'JPY', symbol: '¥', name: '日元' }
};

/**
 * @description 默认货币
 */
export const DEFAULT_CURRENCY = CURRENCIES.CNY;

/**
 * @description HTTP状态码
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

/**
 * @description 分页默认值
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZES: [10, 20, 30, 50, 100]
};

/**
 * @description 文件类型
 */
export const FILE_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ARCHIVE: ['application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip']
};

/**
 * @description Toast消息类型
 */
export const TOAST_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

export default {
    APP,
    ROLES,
    PERMISSIONS,
    ORDER_STATUS,
    ORDER_STATUS_LABELS,
    PAYMENT_METHODS,
    PAYMENT_METHOD_LABELS,
    INVENTORY_ACTIONS,
    INVENTORY_ACTION_LABELS,
    DATE_FORMATS,
    CURRENCIES,
    DEFAULT_CURRENCY,
    HTTP_STATUS,
    PAGINATION,
    FILE_TYPES,
    TOAST_TYPES
};