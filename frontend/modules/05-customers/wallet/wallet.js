/**
 * wallet.js - 电子钱包模块
 * @module wallet
 * @description 提供钱包余额管理和交易记录功能
 */

// 05-customers/wallet.js
console.log('📄 05-customers/wallet page loaded');

/**
 * 初始化钱包模块
 * @returns {void}
 */
export function init() {
    console.log('05-customers/wallet initialized');
    
    const savedWallet = localStorage.getItem('wallet_data');
    if (savedWallet) {
        try {
            const data = JSON.parse(savedWallet);
            console.log('已加载钱包数据:', data);
            if (typeof window.WalletModule !== 'undefined') {
                window.WalletModule.wallet = data;
            }
        } catch (e) {
            console.warn('加载钱包数据失败');
        }
    }
    
    const savedTransactions = localStorage.getItem('wallet_transactions');
    if (savedTransactions) {
        try {
            const data = JSON.parse(savedTransactions);
            console.log('已加载交易记录:', data.length);
            if (typeof window.WalletModule !== 'undefined') {
                window.WalletModule.transactions = data;
                window.WalletModule.render();
            }
        } catch (e) {
            console.warn('加载交易记录失败');
        }
    }
}

/**
 * 获取钱包数据
 * @returns {Object} 钱包数据
 */
export function getWallet() {
    try {
        const data = localStorage.getItem('wallet_data');
        return data ? JSON.parse(data) : { balance: 0, totalRecharge: 0, totalSpend: 0 };
    } catch (e) {
        return { balance: 0, totalRecharge: 0, totalSpend: 0 };
    }
}

/**
 * 更新钱包数据
 * @param {Object} wallet - 钱包数据
 * @returns {boolean} 是否成功
 */
export function updateWallet(wallet) {
    try {
        localStorage.setItem('wallet_data', JSON.stringify(wallet));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取所有交易记录
 * @returns {Array<Object>} 交易数组
 */
export function getTransactions() {
    try {
        const data = localStorage.getItem('wallet_transactions');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 添加交易记录
 * @param {Object} transaction - 交易数据
 * @param {string} transaction.type - 类型 (income/expense)
 * @param {string} transaction.desc - 描述
 * @param {number} transaction.amount - 金额
 * @param {string} transaction.status - 状态 (success/pending/failed)
 * @returns {boolean} 是否成功
 */
export function addTransaction(transaction) {
    try {
        const transactions = getTransactions();
        transactions.push(transaction);
        localStorage.setItem('wallet_transactions', JSON.stringify(transactions));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取收入记录
 * @returns {Array<Object>} 收入交易数组
 */
export function getIncomeTransactions() {
    try {
        const transactions = getTransactions();
        return transactions.filter(t => t.type === 'income');
    } catch (e) {
        return [];
    }
}

/**
 * 获取支出记录
 * @returns {Array<Object>} 支出交易数组
 */
export function getExpenseTransactions() {
    try {
        const transactions = getTransactions();
        return transactions.filter(t => t.type === 'expense');
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getWallet,
    updateWallet,
    getTransactions,
    addTransaction,
    getIncomeTransactions,
    getExpenseTransactions
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('05-customers/wallet DOM ready');
    init();
});