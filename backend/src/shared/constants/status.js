/**
 * shared/constants/status.js - 状态常量
 * 前后端共享
 */

// ===== 用户状态 =====
export const USER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
};

export const USER_STATUS_LABELS = {
    [USER_STATUS.PENDING]: '⏳ 待审核',
    [USER_STATUS.APPROVED]: '✅ 已通过',
    [USER_STATUS.REJECTED]: '❌ 已拒绝',
    [USER_STATUS.SUSPENDED]: '⛔ 已停用'
};

// ===== 订单状态 =====
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

export const ORDER_STATUS_LABELS = {
    [ORDER_STATUS.PENDING]: '待处理',
    [ORDER_STATUS.CONFIRMED]: '已确认',
    [ORDER_STATUS.IN_PROGRESS]: '进行中',
    [ORDER_STATUS.COMPLETED]: '已完成',
    [ORDER_STATUS.CANCELLED]: '已取消',
    [ORDER_STATUS.REFUNDED]: '已退款'
};

export const ORDER_STATUS_COLORS = {
    [ORDER_STATUS.PENDING]: 'status-pending',
    [ORDER_STATUS.CONFIRMED]: 'status-confirmed',
    [ORDER_STATUS.IN_PROGRESS]: 'status-in_progress',
    [ORDER_STATUS.COMPLETED]: 'status-completed',
    [ORDER_STATUS.CANCELLED]: 'status-cancelled',
    [ORDER_STATUS.REFUNDED]: 'status-refunded'
};

// ===== 支付方式 =====
export const PAYMENT_METHODS = {
    CASH: 'cash',
    MADA: 'mada',
    VISA: 'visa',
    MASTERCARD: 'mastercard',
    APPLE_PAY: 'apple_pay',
    GOOGLE_PAY: 'google_pay',
    BANK_TRANSFER: 'bank_transfer',
    SPLIT: 'split'
};

export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.CASH]: '💰 现金',
    [PAYMENT_METHODS.MADA]: '🇸🇦 mada',
    [PAYMENT_METHODS.VISA]: '💳 Visa',
    [PAYMENT_METHODS.MASTERCARD]: '💳 Mastercard',
    [PAYMENT_METHODS.APPLE_PAY]: '📱 Apple Pay',
    [PAYMENT_METHODS.GOOGLE_PAY]: '📱 Google Pay',
    [PAYMENT_METHODS.BANK_TRANSFER]: '🏦 银行转账',
    [PAYMENT_METHODS.SPLIT]: '🔀 混合支付'
};

// ===== 打卡类型 =====
export const CLOCK_TYPES = {
    IN: 'in',
    OUT: 'out'
};

export const CLOCK_TYPE_LABELS = {
    [CLOCK_TYPES.IN]: '上班打卡',
    [CLOCK_TYPES.OUT]: '下班打卡'
};

// ===== 通用状态检查 =====
export function isActiveStatus(status) {
    return status === USER_STATUS.APPROVED;
}

export function isPendingStatus(status) {
    return status === USER_STATUS.PENDING;
}

export function isOrderActive(status) {
    return status === ORDER_STATUS.PENDING || 
           status === ORDER_STATUS.CONFIRMED || 
           status === ORDER_STATUS.IN_PROGRESS;
}

export function isOrderComplete(status) {
    return status === ORDER_STATUS.COMPLETED;
}