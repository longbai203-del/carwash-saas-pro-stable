/**
 * 常量定义 - 统一导出
 * 
 * @module constants/index
 * 
 * @example
 * import { ROLES, STATUS, ERROR_CODES } from '../constants/index.js'
 */

export * from './roles.js';
export * from './status.js';

/**
 * 系统常量
 */
export const SYSTEM = {
  APP_NAME: '洗车SaaS',
  APP_VERSION: '2.0.0',
  APP_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: '/api',
  DEFAULT_LOCALE: 'zh-CN',
  DEFAULT_TIMEZONE: 'Asia/Shanghai',
  DEFAULT_CURRENCY: 'CNY',
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  TOKEN_EXPIRY: '7d',
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 小时
};

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * 错误码
 */
export const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 业务错误
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // 支付错误
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUND_FAILED: 'PAYMENT_REFUND_FAILED',

  // 认证错误
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // 数据库错误
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_CONSTRAINT_VIOLATED: 'DB_CONSTRAINT_VIOLATED',
};

/**
 * 正则表达式
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-+()]{7,20}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^.{8,}$/,
  URL: /^https?:\/\/[^\s]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

export default {
  SYSTEM,
  HTTP_STATUS,
  ERROR_CODES,
  REGEX,
};