/**
 * @file detail.js
 * @module orders-detail
 * @description 订单详情 - 订单详细信息展示、状态更新
 * 
 * @example
 * import { init } from './detail.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { apiClient } from '../../../js/core/api/api-client.js';
import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} OrderDetail
 * @property {string} id - 订单ID
 * @property {string} customer - 客户名称
 * @property {string} customerPhone - 客户电话
 * @property {number} amount - 订单金额
 * @property {string} status - 订单状态
 * @property {string} paymentMethod - 支付方式
 * @property {string} paymentStatus - 支付状态
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {Array<{name: string, qty: number, price: number, subtotal: number}>} items - 商品列表
 * @property {string} note - 备注
 * @property {string} address - 地址
 */

/**
 * @typedef {Object} OrderDetailState
 * @property {OrderDetail|null} order - 订单详情
 * @property {string} orderId - 订单ID
 * @property {boolean} loading - 加载状态
 * @property {string|null} error - 错误信息
 */

/** @type {OrderDetailState} 状态 */
const state = {
    order: null,
    orderId: '',
    loading: false,
    error: null
};

/**
 * 状态标签映射
 */
const STATUS_MAP = {
    'pending': { label: '待处理', color: '#F59E0B', bg: '#FEF3C7' },
    'processing': { label: '处理中', color: '#3B82F6', bg: '#DBEAFE' },
    'completed': { label: '已完成', color: '#10B981', bg: '#D1FAE5' },
    'cancelled': { label: '已取消', color: '#EF4444', bg: '#FEE2E2' },
    'refunded': { label: '已退款', color: '#8B5CF6', bg: '#EDE9FE' }
};

const PAYMENT_MAP = {
    'cash': '现金',
    'card': '刷卡',
    'wechat': '微信支付',
    'alipay': '支付宝',
    'bank': '银行转账'
};

/**
 * @private
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toFixed(2);
}

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * @private
 * @returns {Promise<void>}
 * @description 加载订单详情
 */
async function loadOrderDetail(orderId) {
    try {
        state.loading = true;
        state.error = null;
        state.orderId = orderId;
        
        // 从URL获取订单ID
        if (!orderId && typeof window !== 'undefined') {
            const path = window.location.pathname;
            const match = path.match(/\/orders\/detail\/(.+)/);
            if (match) {
                orderId = match[1];
                state.orderId = orderId;
            }
        }
        
        if (!orderId) {
            state.error = '缺少订单ID';
            state.loading = false;
            showError('缺少订单ID');
            return;
        }
        
        const response = await apiClient.get(`/orders/${orderId}`);
        
        if (response && response.success) {
            state.order = response.data;
        } else {
            // 使用模拟数据
            state.order = getMockOrder(orderId);
        }
        
        state.loading = false;
        renderOrderDetail();
        
    } catch (error) {
        console.error('❌ 加载订单详情失败:', error);
        state.loading = false;
        state.error = error.message || '加载订单详情失败';
        showToast('加载订单详情失败: ' + state.error, 'error');
        // 使用模拟数据
        state.order = getMockOrder(orderId);
        renderOrderDetail();
    }
}

/**
 * @private
 * @param {string} orderId - 订单ID
 * @returns {OrderDetail} 模拟订单详情
 * @description 获取模拟订单详情
 */
function getMockOrder(orderId) {
    const services = ['标准洗车', '精致洗车', '深度清洁', '抛光打蜡', '内饰清洗', '发动机清洗'];
    const prices = [68, 128, 268, 388, 328, 188];
    const items = [];
    let total = 0;
    
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * services.length);
        const qty = Math.floor(Math.random() * 2) + 1;
        const subtotal = prices[idx] * qty;
        items.push({
            name: services[idx],
            price: prices[idx],
            qty: qty,
            subtotal: subtotal
        });
        total += subtotal;
    }
    
    const statuses = ['pending', 'processing', 'completed', 'completed', 'completed', 'cancelled', 'refunded'];
    const customers = ['张伟', '李娜', '王强', '刘洋', '陈静'];
    const payments = ['cash', 'card', 'wechat', 'alipay'];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const payment = payments[Math.floor(Math.random() * payments.length)];
    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    return {
        id: orderId,
        customer: customer,
        customerPhone: '1380000' + String(Math.floor(Math.random() * 9000) + 1000),
        amount: total,
        status: status,
        paymentMethod: payment,
        paymentStatus: status === 'completed' || status === 'processing' ? 'paid' : 'pending',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        items: items,
        note: Math.random() > 0.7 ? '请尽快处理' : '',
        address: '市区洗车路' + (Math.floor(Math.random() * 200) + 1) + '号'
    };
}

/**
 * @private
 * @description 渲染订单详情
 */
function renderOrderDetail() {
    const order = state.order;
    if (!order) {
        document.getElementById('orderDetailContent').innerHTML = `
            <div style="text-align:center;padding:60px 0;color:#9CA3AF;">
                <i class="fas fa-file-invoice" style="font-size:48px;display:block;margin-bottom:16px;"></i>
                <p>暂无订单信息</p>
            </div>
        `;
        return;
    }
    
    const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
    const payment = PAYMENT_MAP[order.paymentMethod] || order.paymentMethod;
    
    // 更新基本信息
    document.getElementById('detailOrderId').textContent = order.id;
    document.getElementById('detailStatus').textContent = status.label;
    document.getElementById('detailStatus').style.background = status.bg;
    document.getElementById('detailStatus').style.color = status.color;
    
    document.getElementById('detailCustomer').textContent = order.customer;
    document.getElementById('detailPhone').textContent = order.customerPhone || '-';
    document.getElementById('detailAmount').textContent = '¥' + formatCurrency(order.amount);
    document.getElementById('detailPayment').textContent = payment;
    document.getElementById('detailPaymentStatus').textContent = order.paymentStatus === 'paid' ? '已支付' : '待支付';
    document.getElementById('detailCreatedAt').textContent = formatDate(order.createdAt);
    document.getElementById('detailUpdatedAt').textContent = formatDate(order.updatedAt || order.createdAt);
    document.getElementById('detailNote').textContent = order.note || '无';
    document.getElementById('detailAddress').textContent = order.address || '-';
    
    // 渲染商品列表
    const itemsContainer = document.getElementById('detailItems');
    if (itemsContainer) {
        if (order.items.length === 0) {
            itemsContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#9CA3AF;">暂无商品</td></tr>';
        } else {
            itemsContainer.innerHTML = order.items.map(item => `
                <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:10px 12px;">${item.name}</td>
                    <td style="padding:10px 12px;text-align:center;">${item.qty}</td>
                    <td style="padding:10px 12px;text-align:right;">¥${formatCurrency(item.price)}</td>
                    <td style="padding:10px 12px;text-align:right;font-weight:600;">¥${formatCurrency(item.subtotal)}</td>
                </tr>
            `).join('');
        }
    }
    
    // 更新状态操作按钮
    const actionsContainer = document.getElementById('detailActions');
    if (actionsContainer) {
        let html = '';
        if (order.status === 'pending') {
            html += `
                <button class="btn btn-success" onclick="window.OrdersDetailModule.updateStatus('processing')">
                    <i class="fas fa-check"></i> 确认处理
                </button>
                <button class="btn btn-danger" onclick="window.OrdersDetailModule.updateStatus('cancelled')">
                    <i class="fas fa-times"></i> 取消订单
                </button>
            `;
        } else if (order.status === 'processing') {
            html += `
                <button class="btn btn-success" onclick="window.OrdersDetailModule.updateStatus('completed')">
                    <i class="fas fa-check-circle"></i> 标记完成
                </button>
            `;
        } else if (order.status === 'completed') {
            html += `
                <button class="btn btn-warning" onclick="window.OrdersDetailModule.updateStatus('refunded')">
                    <i class="fas fa-undo"></i> 退款
                </button>
            `;
        }
        actionsContainer.innerHTML = html;
    }
}

/**
 * @private
 * @param {string} status - 新状态
 * @description 更新订单状态
 */
async function updateStatus(status) {
    if (!state.order) return;
    
    try {
        const response = await apiClient.put(`/orders/${state.order.id}/status`, { status });
        if (response && response.success) {
            showToast('订单状态已更新为: ' + (STATUS_MAP[status]?.label || status), 'success');
            await loadOrderDetail(state.order.id);
        } else {
            throw new Error(response.message || '更新失败');
        }
    } catch (error) {
        console.error('❌ 更新订单状态失败:', error);
        showToast('更新失败: ' + error.message, 'error');
    }
}

/**
 * @private
 * @param {string} message - 错误信息
 * @description 显示错误信息
 */
function showError(message) {
    const container = document.getElementById('orderDetailContent');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 0;color:#EF4444;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;display:block;margin-bottom:16px;"></i>
                <h3>加载失败</h3>
                <p>${message}</p>
                <button onclick="window.OrdersDetailModule.retry()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                    重试
                </button>
            </div>
        `;
    }
}

/**
 * @private
 * @description 重试加载
 */
function retry() {
    loadOrderDetail(state.orderId);
}

/**
 * @private
 * @description 返回订单列表
 */
function goBack() {
    if (typeof window.router !== 'undefined') {
        window.router.navigate('/orders');
    } else {
        window.location.hash = '#/orders';
    }
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const backBtn = document.getElementById('backToList');
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
}

/**
 * @public
 * @param {string} orderId - 订单ID
 * @returns {Promise<void>}
 * @description 初始化订单详情
 */
export async function init(orderId) {
    console.log('📄 订单详情 初始化...');
    
    bindEvents();
    await loadOrderDetail(orderId);
    
    // 暴露全局方法
    window.OrdersDetailModule = {
        state,
        loadOrderDetail,
        updateStatus,
        retry,
        goBack,
        renderOrderDetail
    };
    
    console.log('✅ 订单详情 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // 从URL获取订单ID
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const match = path.match(/\/orders\/detail\/(.+)/);
        if (match) {
            init(match[1]);
        } else {
            init();
        }
    } else {
        init();
    }
}

export default {
    init,
    loadOrderDetail,
    updateStatus,
    retry,
    goBack
};