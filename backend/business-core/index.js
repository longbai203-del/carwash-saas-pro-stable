/**
 * Business Core - Unified Export
 * 
 * @module business-core
 * @description Export all business managers
 */

import CustomerManager from './customers/CustomerManager.js';
import OrderManager from './customers/orders/OrderManager.js';
import InventoryManager from './inventory/InventoryManager.js';
import FinanceManager from './finance/FinanceManager.js';

export {
    CustomerManager,
    OrderManager,
    InventoryManager,
    FinanceManager
};

export default {
    CustomerManager,
    OrderManager,
    InventoryManager,
    FinanceManager
};
