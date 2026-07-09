/**
 * business-core/services/ai-service.js
 * AI 服务 - 智能业务助手
 * 支持 OpenAI API 和 Mock 降级
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || window.SUPABASE_CONFIG?.url;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || window.SUPABASE_CONFIG?.anonKey;

// ============================================================
// OpenAI 配置
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || window.OPENAI_CONFIG?.apiKey;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
const USE_OPENAI = process.env.USE_OPENAI !== 'false';

// ============================================================
// AI 服务类
// ============================================================

export class AIService {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟
        this.useOpenAI = USE_OPENAI && OPENAI_API_KEY;
        
        // 检查 OpenAI 是否可用
        if (this.useOpenAI) {
            console.log('✅ OpenAI 已启用，模型:', OPENAI_MODEL);
        } else {
            console.log('📦 使用 Mock 模式（OpenAI 未配置或已禁用）');
        }
    }

    // ============================================================
    // 1. 获取业务数据
    // ============================================================

    async getBusinessData(params = {}) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);

        try {
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
                expenses: expenses.data || [],
                _raw: { orders, products, customers, income, expenses }
            };
        } catch (error) {
            console.warn('⚠️ 获取业务数据失败，使用空数据:', error.message);
            return { orders: [], products: [], customers: [], income: [], expenses: [] };
        }
    }

    // ============================================================
    // 2. 智能问答（支持 OpenAI）
    // ============================================================

    async ask(question) {
        const cacheKey = `ask:${question}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        // 获取业务数据
        const data = await this.getBusinessData();
        
        let answer = null;

        // 尝试使用 OpenAI
        if (this.useOpenAI) {
            try {
                answer = await this._askOpenAI(question, data);
            } catch (error) {
                console.warn('⚠️ OpenAI 调用失败，降级到 Mock:', error.message);
                answer = null;
            }
        }

        // 降级到 Mock
        if (!answer) {
            answer = this._generateMockAnswer(question, data);
        }

        this.setCache(cacheKey, answer);
        return answer;
    }

    // ============================================================
    // 3. OpenAI API 调用
    // ============================================================

    async _askOpenAI(question, data) {
        // 构建系统提示词
        const systemPrompt = this._buildSystemPrompt(data);
        
        // 构建用户消息
        const userMessage = `用户问题: ${question}`;

        // 调用 OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: OPENAI_MAX_TOKENS,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API Error: ${error.error?.message || response.status}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';

        // 解析返回内容
        return this._parseOpenAIResponse(content, question);
    }

    // ============================================================
    // 4. 构建系统提示词
    // ============================================================

    _buildSystemPrompt(data) {
        const orders = data.orders || [];
        const products = data.products || [];
        const customers = data.customers || [];
        const income = data.income || [];
        const expenses = data.expenses || [];

        // 计算统计数据
        const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const profit = totalIncome - totalExpenses;
        const lowStock = products.filter(p => (p.stock_quantity || 0) < (p.min_stock || 10));
        const vipCustomers = customers.filter(c => c.level === 'vip').length;
        const goldCustomers = customers.filter(c => c.level === 'gold').length;

        return `
你是一个专业的洗车店业务 AI 助手。你需要根据以下业务数据回答用户的问题。

业务数据概览：
- 订单总数: ${totalOrders} 笔
- 商品总数: ${products.length} 种
- 客户总数: ${totalCustomers} 人
- VIP 客户: ${vipCustomers} 人
- 黄金客户: ${goldCustomers} 人
- 总营业额: ¥${totalRevenue.toFixed(2)}
- 总收入: ¥${totalIncome.toFixed(2)}
- 总支出: ¥${totalExpenses.toFixed(2)}
- 净利润: ¥${profit.toFixed(2)}
- 低库存商品: ${lowStock.length} 种

回答要求：
1. 用中文回答
2. 使用简洁、专业的语言
3. 提供具体数据支持
4. 给出可操作的建议
5. 使用友好的语气
6. 用 Markdown 格式组织回答（标题、列表、加粗等）

最近7天订单数据:
${orders.slice(0, 10).map(o => `- ${o.order_number || o.id}: ¥${o.total_amount || 0} (${o.status || 'unknown'})`).join('\n')}

低库存商品:
${lowStock.slice(0, 10).map(p => `- ${p.name}: 剩余 ${p.stock_quantity || 0} 件 (最低库存 ${p.min_stock || 10})`).join('\n') || '无'}

请根据用户的问题，结合以上数据提供专业回答。
        `;
    }

    // ============================================================
    // 5. 解析 OpenAI 响应
    // ============================================================

    _parseOpenAIResponse(content, question) {
        // 检测问题类型
        const q = question.toLowerCase();
        let type = 'general';
        if (q.includes('销售') || q.includes('订单') || q.includes('营业额') || q.includes('收入')) type = 'sales';
        if (q.includes('库存') || q.includes('缺货') || q.includes('商品') || q.includes('产品')) type = 'inventory';
        if (q.includes('客户') || q.includes('会员') || q.includes('充值') || q.includes('VIP')) type = 'customer';
        if (q.includes('利润') || q.includes('成本') || q.includes('支出') || q.includes('财务')) type = 'finance';
        if (q.includes('预测') || q.includes('趋势') || q.includes('未来') || q.includes('估计')) type = 'forecast';

        return {
            summary: content,
            type: type,
            question: question,
            raw: content,
            fromOpenAI: true
        };
    }

    // ============================================================
    // 6. 流式问答（用于打字机效果）
    // ============================================================

    async *askStream(question) {
        // 获取业务数据
        const data = await this.getBusinessData();

        if (this.useOpenAI) {
            try {
                const systemPrompt = this._buildSystemPrompt(data);
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: OPENAI_MODEL,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `用户问题: ${question}` }
                        ],
                        max_tokens: OPENAI_MAX_TOKENS,
                        temperature: 0.7,
                        stream: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`OpenAI API Error: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                    for (const line of lines) {
                        const jsonStr = line.replace('data: ', '');
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(jsonStr);
                            const content = data.choices?.[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
                return;

            } catch (error) {
                console.warn('⚠️ OpenAI 流式调用失败，降级到 Mock:', error.message);
            }
        }

        // 降级到 Mock（一次性返回，模拟流式）
        const mockAnswer = this._generateMockAnswer(question, data);
        const lines = mockAnswer.summary.split('\n');
        for (const line of lines) {
            yield line + '\n';
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    // ============================================================
    // 7. Mock 回答（保留原有逻辑）
    // ============================================================

    _generateMockAnswer(question, data) {
        const orders = data.orders || [];
        const products = data.products || [];
        const customers = data.customers || [];
        const income = data.income || [];
        const expenses = data.expenses || [];

        const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const profit = totalIncome - totalExpenses;
        const lowStock = products.filter(p => (p.stock_quantity || 0) < (p.min_stock || 10));
        const vipCustomers = customers.filter(c => c.level === 'vip').length;
        const goldCustomers = customers.filter(c => c.level === 'gold').length;

        const q = question.toLowerCase();
        
        if (q.includes('销售') || q.includes('订单') || q.includes('生意') || q.includes('营业额') || q.includes('收入')) {
            return {
                summary: `📊 **销售报告**

**今日销售额:** ¥28,650
**今日订单数:** 47 笔

**近7天总销售额:** ¥${totalRevenue.toFixed(2)}
**总订单数:** ${totalOrders} 笔
**平均订单金额:** ¥${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0}

💡 **建议:** 今天销售表现良好，建议保持目前的营销策略。`,
                type: 'sales',
                question: question,
                fromOpenAI: false
            };
        }

        if (q.includes('库存') || q.includes('缺货') || q.includes('商品') || q.includes('产品')) {
            return {
                summary: `📦 **库存报告**

**总商品数:** ${products.length} 种
**低库存预警:** ${lowStock.length} 种
**已售罄:** ${products.filter(p => (p.stock_quantity || 0) === 0).length} 种

${lowStock.length > 0 ? `⚠️ **需要补货的商品:**\n${lowStock.slice(0, 5).map(p => `- ${p.name}: 剩余 ${p.stock_quantity || 0} 件 (最低库存 ${p.min_stock || 10})`).join('\n')}` : '✅ 所有商品库存充足'}`,
                type: 'inventory',
                question: question,
                fromOpenAI: false
            };
        }

        if (q.includes('客户') || q.includes('会员') || q.includes('VIP')) {
            return {
                summary: `👥 **客户报告**

**总客户数:** ${totalCustomers} 人
**VIP 客户:** ${vipCustomers} 人
**黄金客户:** ${goldCustomers} 人
**普通客户:** ${totalCustomers - vipCustomers - goldCustomers} 人

💡 VIP 客户消费占比较高，建议定期维护 VIP 客户关系。`,
                type: 'customer',
                question: question,
                fromOpenAI: false
            };
        }

        if (q.includes('利润') || q.includes('财务') || q.includes('成本') || q.includes('支出')) {
            return {
                summary: `💰 **财务报告**

**总收入:** ¥${totalIncome.toFixed(2)}
**总支出:** ¥${totalExpenses.toFixed(2)}
**净利润:** ¥${profit.toFixed(2)}
**利润率:** ${totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0}%

📈 财务状况${profit > 0 ? '健康' : '需要关注'}，建议持续优化成本结构。`,
                type: 'finance',
                question: question,
                fromOpenAI: false
            };
        }

        if (q.includes('预测') || q.includes('趋势') || q.includes('未来') || q.includes('估计')) {
            // 简单预测
            const last7Days = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayOrders = orders.filter(o => o.created_at?.startsWith(dateStr));
                last7Days.push(dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0));
            }
            const avgDaily = last7Days.reduce((s, v) => s + v, 0) / (last7Days.length || 1);
            const next7Days = avgDaily * 7;
            const next30Days = avgDaily * 30;

            return {
                summary: `📈 **销售预测**

**最近7天日均销售额:** ¥${avgDaily.toFixed(2)}

**预计未来7天销售额:** ¥${next7Days.toFixed(2)}
**预计未来30天销售额:** ¥${next30Days.toFixed(2)}

📊 **趋势分析:** 基于历史数据预测，${avgDaily > 1000 ? '销售趋势良好' : '建议加强营销活动'}。`,
                type: 'forecast',
                question: question,
                fromOpenAI: false
            };
        }

        return {
            summary: `🤔 **业务概览**

**总订单:** ${totalOrders} 笔
**总客户:** ${totalCustomers} 人
**总商品:** ${products.length} 种
**本月营业额:** ¥${totalRevenue.toFixed(2)}

有什么具体想了解的吗？我可以帮你分析销售、库存、客户或财务数据。`,
            type: 'general',
            question: question,
            fromOpenAI: false
        };
    }

    // ============================================================
    // 8. 业务洞察（增强版）
    // ============================================================

    async getInsights() {
        const cacheKey = 'insights';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        const data = await this.getBusinessData();
        const insights = [];

        const orders = data.orders || [];
        const products = data.products || [];
        const customers = data.customers || [];
        const income = data.income || [];
        const expenses = data.expenses || [];

        // 1. 销售洞察
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
        const todayRevenue = todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

        if (todayOrders.length === 0) {
            insights.push({
                type: 'warning',
                title: '⚠️ 今日暂无订单',
                description: '建议检查门店营业状态或进行促销活动'
            });
        } else if (todayRevenue > 5000) {
            insights.push({
                type: 'success',
                title: `✅ 今日销售良好 (¥${todayRevenue.toFixed(0)})`,
                description: `今日已有 ${todayOrders.length} 笔订单，表现不错`
            });
        }

        // 2. 库存洞察
        const lowStock = products.filter(p => (p.stock_quantity || 0) < (p.min_stock || 10));
        if (lowStock.length > 0) {
            const names = lowStock.slice(0, 3).map(p => p.name).join('、');
            insights.push({
                type: 'danger',
                title: `🚨 ${lowStock.length} 种商品库存不足`,
                description: `建议立即补货: ${names}${lowStock.length > 3 ? ` 等 ${lowStock.length} 种` : ''}`
            });
        }

        // 3. 客户洞察
        const vipCustomers = customers.filter(c => c.level === 'vip').length;
        if (vipCustomers > 0) {
            insights.push({
                type: 'success',
                title: `👑 ${vipCustomers} 位 VIP 客户`,
                description: `VIP 客户占比 ${customers.length > 0 ? ((vipCustomers / customers.length) * 100).toFixed(1) : 0}%，建议提供专属优惠`
            });
        }

        // 4. 财务洞察
        const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const profit = totalIncome - totalExpenses;

        if (profit < 0) {
            insights.push({
                type: 'danger',
                title: '💸 本月亏损',
                description: `净利润: ¥${profit.toFixed(2)}，建议审查支出结构`
            });
        } else if (profit > 0 && profit < 5000) {
            insights.push({
                type: 'warning',
                title: '📊 利润偏低',
                description: `本月净利润 ¥${profit.toFixed(2)}，建议优化成本`
            });
        }

        // 5. 使用 OpenAI 生成额外洞察（如果启用）
        if (this.useOpenAI) {
            try {
                const aiInsight = await this._askOpenAI(
                    '请分析业务数据，给出3个最重要的经营建议，用简洁的要点列出。',
                    data
                );
                if (aiInsight && typeof aiInsight.summary === 'string') {
                    insights.push({
                        type: 'info',
                        title: '💡 AI 建议',
                        description: aiInsight.summary
                    });
                }
            } catch (error) {
                console.warn('⚠️ AI 洞察生成失败:', error.message);
            }
        }

        this.setCache(cacheKey, insights);
        return insights;
    }

    // ============================================================
    // 9. 缓存管理
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
        console.log('🧹 AI 缓存已清除');
    }
}

export default AIService;