/**
 * 服务层导出入口
 * 
 * @module services
 * @description 统一导出所有业务服务
 * 
 * @example
 * import { CustomerService, OrderService, ProductService } from './services/index.js'
 */

export { default as BaseService } from './BaseService.js'
export { default as CustomerService } from './CustomerService.js'
export { default as OrderService } from './OrderService.js'
export { default as ProductService } from './ProductService.js'
export { default as InventoryService } from './InventoryService.js'
// 以下服务可根据需要扩展
// export { default as EmployeeService } from './EmployeeService.js'
// export { default as FinanceService } from './FinanceService.js'
// export { default as ReportService } from './ReportService.js'