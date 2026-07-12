/**
 * 状态常量定义
 * 
 * @module constants/status
 * 
 * @example
 * import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/status.js'
 */

/**
 * 订单状态
 */
export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  };
  
  /**
   * 订单状态名称
   */
  export const ORDER_STATUS_NAMES = {
    [ORDER_STATUS.PENDING]: '待处理',
    [ORDER_STATUS.PROCESSING]: '处理中',
    [ORDER_STATUS.COMPLETED]: '已完成',
    [ORDER_STATUS.CANCELLED]: '已取消',
    [ORDER_STATUS.REFUNDED]: '已退款',
  };
  
  /**
   * 订单状态颜色
   */
  export const ORDER_STATUS_COLORS = {
    [ORDER_STATUS.PENDING]: 'warning',
    [ORDER_STATUS.PROCESSING]: 'info',
    [ORDER_STATUS.COMPLETED]: 'success',
    [ORDER_STATUS.CANCELLED]: 'error',
    [ORDER_STATUS.REFUNDED]: 'default',
  };
  
  /**
   * 支付状态
   */
  export const PAYMENT_STATUS = {
    UNPAID: 'unpaid',
    PAID: 'paid',
    REFUNDED: 'refunded',
    FAILED: 'failed',
    PENDING: 'pending',
  };
  
  /**
   * 支付状态名称
   */
  export const PAYMENT_STATUS_NAMES = {
    [PAYMENT_STATUS.UNPAID]: '未支付',
    [PAYMENT_STATUS.PAID]: '已支付',
    [PAYMENT_STATUS.REFUNDED]: '已退款',
    [PAYMENT_STATUS.FAILED]: '支付失败',
    [PAYMENT_STATUS.PENDING]: '支付中',
  };
  
  /**
   * 用户状态
   */
  export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
  };
  
  /**
   * 用户状态名称
   */
  export const USER_STATUS_NAMES = {
    [USER_STATUS.ACTIVE]: '激活',
    [USER_STATUS.INACTIVE]: '停用',
    [USER_STATUS.SUSPENDED]: '已暂停',
    [USER_STATUS.BANNED]: '已封禁',
  };
  
  /**
   * 库存交易类型
   */
  export const INVENTORY_TRANSACTION_TYPES = {
    INBOUND: 'inbound',
    OUTBOUND: 'outbound',
    ADJUSTMENT: 'adjustment',
    COUNT: 'count',
    RETURN: 'return',
  };
  
  /**
   * 库存交易类型名称
   */
  export const INVENTORY_TRANSACTION_NAMES = {
    [INVENTORY_TRANSACTION_TYPES.INBOUND]: '入库',
    [INVENTORY_TRANSACTION_TYPES.OUTBOUND]: '出库',
    [INVENTORY_TRANSACTION_TYPES.ADJUSTMENT]: '调整',
    [INVENTORY_TRANSACTION_TYPES.COUNT]: '盘点',
    [INVENTORY_TRANSACTION_TYPES.RETURN]: '退货',
  };
  
  export default {
    ORDER_STATUS,
    ORDER_STATUS_NAMES,
    ORDER_STATUS_COLORS,
    PAYMENT_STATUS,
    PAYMENT_STATUS_NAMES,
    USER_STATUS,
    USER_STATUS_NAMES,
    INVENTORY_TRANSACTION_TYPES,
    INVENTORY_TRANSACTION_NAMES,
  };