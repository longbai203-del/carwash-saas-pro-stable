/**
 * business-core/services/ai-service.js
 * AI 服务 - 智能业务助手
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || window.SUPABASE_CONFIG?.url;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || window.SUPABASE_CONFIG?.anonKey;

export class AIService {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟
    }

    // ============================================================
    // 1. 获取业务数据（用于 AI 分析）
    // ============================================================

    async getBusinessData(params = {}) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);

        // 并行获取所有数据
        const [orders, products, customers, income, expenses] = await Promise.all([
            this.supabase.from('orders').select('*').gte('created_at', weekAgo.toISOString()),
            this.supabase.from('products').select('*'),
            this.supabase.from('customers').select('*'),
            this.supabase.from('income_records').select('*').gte('created_at', monthAgo.toISOString()),
            this.supabase.from('expense_records').select('*').gte('created_at', monthAgo.toISOString())
        ]);

        return {
            orders: orders.data || [],
            products: products.data || [],
            customers: customers.data || [],
            income: income.data || [],
            expenses: expenses.data || []
        };
    }

    // ============================================================
    // 2. 智能问答
    // ============================================================

    async ask(question) {
        const cacheKey = `ask:${question}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        // 1. 理解问题意图
        const intent = this._detectIntent(question);
        
        // 2. 获取相关数据
        const data = await this.getBusinessData();
        
        // 3. 生成回答
        let answer = '';
        switch (intent) {
            case 'sales':
                answer = this._generateSalesReport(data);
                break;
            case 'inventory':
                answer = this._generateInventoryReport(data);
                break;
            case 'customer':
                answer = this._generateCustomerReport(data);
                break;
            case 'finance':
                answer = this._generateFinanceReport(data);
                break;
            case 'forecast':
                answer = this._generateForecast(data);
                break;
            default:
                answer = this._generateGeneralAnswer(question, data);
        }

        this.setCache(cacheKey, answer);
        return answer;
    }

    // ============================================================
    // 3. 意图识别
    // ============================================================

    _detectIntent(question) {
        const q = question.toLowerCase();
        if (q.includes('销售') || q.includes('订单') || q.includes('营业额') || q.includes('收入')) {
            return 'sales';
        }
        if (q.includes('库存') || q.includes('缺货') || q.includes('商品') || q.includes('产品')) {
            return 'inventory';
        }
        if (q.includes('客户') || q.includes('会员') || q.includes('充值')) {
            return 'customer';
        }
        if (q.includes('利润') || q.includes('成本') || q.includes('支出') || q.includes('财务')) {
            return 'finance';
        }
        if (q.includes('预测') || q.includes('趋势') || q.includes('未来') || q.includes('估计')) {
            return 'forecast';
        }
        return 'general';
    }

    // ============================================================
    // 4. 生成报告
    // ============================================================

    _generateSalesReport(data) {
        const orders = data.orders || [];
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const todayOrders = orders.filter(o => o.created_at?.startsWith(todayStr));
        const totalToday = todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
        
        // 计算趋势
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.created_at?.startsWith(dateStr));
            const total = dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
            last7Days.push({
                date: dayNames[d.getDay()],
                total: total,
                count: dayOrders.length
            });
        }

        const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
        const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

        return {
            summary: `📊 销售报告\n\n今日销售额: ¥${totalToday.toFixed(2)}\n今日订单数: ${todayOrders.length} 笔\n\n近7天总销售额: ¥${totalRevenue.toFixed(2)}\n平均订单金额: ¥${avgOrder.toFixed(2)}`,
            details: last7Days,
            todayTotal: totalToday,
            todayCount: todayOrders.length,
            weekTotal: totalRevenue,
            avgOrder: avgOrder
        };
    }

    _generateInventoryReport(data) {
        const products = data.products || [];
        const lowStock = products.filter(p => (p.stock_quantity || 0) < (p.min_stock || 10));
        const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);
        
        return {
            summary: `📦 库存报告\n\n总商品数: ${products.length}\n低库存预警: ${lowStock.length} 种\n已售罄: ${outOfStock.length} 种`,
            lowStock: lowStock.slice(0, 10),
            outOfStock: outOfStock.slice(0, 10)
        };
    }

    _generateCustomerReport(data) {
        const customers = data.customers || [];
        const vip = customers.filter(c => c.level === 'vip');
        const gold = customers.filter(c => c.level === 'gold');
        
        return {
            summary: `👥 客户报告\n\n总客户数: ${customers.length}\nVIP客户: ${vip.length}\n黄金客户: ${gold.length}\n普通客户: ${customers.length - vip.length - gold.length}`,
            total: customers.length,
            vip: vip.length,
            gold: gold.length
        };
    }

    _generateFinanceReport(data) {
        const income = data.income || [];
        const expenses = data.expenses || [];
        const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const profit = totalIncome - totalExpenses;
        
        return {
            summary: `💰 财务报告\n\n总收入: ¥${totalIncome.toFixed(2)}\n总支出: ¥${totalExpenses.toFixed(2)}\n净利润: ¥${profit.toFixed(2)}\n利润率: ${totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0}%`,
            totalIncome: totalIncome,
            totalExpenses: totalExpenses,
            profit: profit
        };
    }

    _generateForecast(data) {
        const orders = data.orders || [];
        // 简单预测：基于最近7天的平均值
        const today = new Date();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.created_at?.startsWith(dateStr));
            last7Days.push(dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0));
        }
        const avgDaily = last7Days.reduce((s, v) => s + v, 0) / last7Days.length;
        const next7Days = avgDaily * 7;
        const next30Days = avgDaily * 30;

        return {
            summary: `📈 销售预测\n\n最近7天日均销售额: ¥${avgDaily.toFixed(2)}\n预计未来7天销售额: ¥${next7Days.toFixed(2)}\n预计未来30天销售额: ¥${next30Days.toFixed(2)}`,
            avgDaily: avgDaily,
            forecast7Days: next7Days,
            forecast30Days: next30Days
        };
    }

    _generateGeneralAnswer(question, data) {
        // 通用问答：返回数据概览
        const orders = data.orders || [];
        const products = data.products || [];
        const customers = data.customers || [];
        const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

        return {
            summary: `💡 业务概览\n\n总订单数: ${orders.length}\n总商品数: ${products.length}\n总客户数: ${customers.length}\n总营业额: ¥${totalRevenue.toFixed(2)}`,
            question: question,
            data: {
                orders: orders.length,
                products: products.length,
                customers: customers.length,
                totalRevenue: totalRevenue
            }
        };
    }

    // ============================================================
    // 5. 获取业务洞察（AI 主动分析）
    // ============================================================

    async getInsights() {
        const cacheKey = 'insights';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const data = await this.getBusinessData();
        const insights = [];

        // 1. 销售洞察
        const salesReport = this._generateSalesReport(data);
        if (salesReport.todayCount === 0) {
            insights.push({
                type: 'warning',
                title: '今日暂无订单',
                description: '建议检查门店营业状态或进行促销活动'
            });
        }
        if (salesReport.weekTotal < salesReport.avgOrder * 7 * 0.7) {
            insights.push({
                type: 'warning',
                title: '本周销售额下降',
                description: `本周销售额 ¥${salesReport.weekTotal.toFixed(2)}，低于平均水平`
            });
        }

        // 2. 库存洞察
        const inventoryReport = this._generateInventoryReport(data);
        if (inventoryReport.lowStock.length > 0) {
            insights.push({
                type: 'danger',
                title: `${inventoryReport.lowStock.length} 种商品库存不足`,
                description: `建议立即采购: ${inventoryReport.lowStock.map(p => p.name).join('、')}`
            });
        }

        // 3. 客户洞察
        const customerReport = this._generateCustomerReport(data);
        if (customerReport.vip > 0) {
            insights.push({
                type: 'success',
                title: `有 ${customerReport.vip} 位 VIP 客户`,
                description: '建议为VIP客户提供专属优惠，提升客户忠诚度'
            });
        }

        this.setCache(cacheKey, insights);
        return insights;
    }

    // ============================================================
    // 6. 缓存管理
    // ============================================================

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clearCache() {
        this.cache.clear();
    }
}

export default AIService;