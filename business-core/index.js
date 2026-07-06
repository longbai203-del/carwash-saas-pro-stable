/**
 * business-core/index.js
 * 业务核心模块入口
 * 导出所有服务
 */

// 导出服务
export { BaseService } from './services/base-service.js';
export { TenantService } from './services/tenant-service.js';
export { CustomerService } from './services/customer-service.js';
export { ProductService } from './services/product-service.js';
export { OrderService } from './services/order-service.js';

// 创建服务实例
import { TenantService } from './services/tenant-service.js';
import { CustomerService } from './services/customer-service.js';
import { ProductService } from './services/product-service.js';
import { OrderService } from './services/order-service.js';

export const services = {
    tenant: new TenantService(),
    customer: new CustomerService(),
    product: new ProductService(),
    order: new OrderService()
};

// 全局访问
if (typeof window !== 'undefined') {
    window.BusinessCore = {
        services,
        ...services
    };
}

console.log('✅ Business Core 已加载');