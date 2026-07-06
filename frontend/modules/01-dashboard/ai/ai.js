/**
 * modules/01-dashboard/ai/ai.js
 * AI 智能助手
 */

// ============================================================
// 1. 导入服务
// ============================================================

let aiService = null;

async function loadAIService() {
    try {
        // 尝试从业务核心加载
        const module = await import('/business-core/services/ai-service.js');
        aiService = new module.AIService();
        console.log('✅ AI 服务已加载');
        return true;
    } catch (error) {
        console.warn('⚠️ AI 服务加载失败，使用模拟模式:', error.message);
        return false;
    }
}

// ============================================================
// 2. 状态管理
// ============================================================

let isProcessing = false;

// ============================================================
// 3. 核心功能
// ============================================================

export async function init() {
    console.log('🤖 AI 智能助手初始化...');

    const loaded = await loadAIService();

    // 绑定事件
    document.getElementById('askBtn')?.addEventListener('click', handleAsk);
    document.getElementById('aiQuestion')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleAsk();
    });

    // 加载洞察
    await loadInsights();

    console.log('✅ AI 智能助手初始化完成');
}

// ============================================================
// 4. 提问功能
// ============================================================

async function handleAsk() {
    if (isProcessing) return;

    const input = document.getElementById('aiQuestion');
    const question = input.value.trim();
    if (!question) return;

    input.value = '';
    isProcessing = true;

    // 显示用户消息
    addMessage('user', question);

    // 显示加载状态
    const loadingId = addLoadingMessage();

    try {
        let answer;
        if (aiService && typeof aiService.ask === 'function') {
            answer = await aiService.ask(question);
        } else {
            // 模拟回答
            answer = generateMockAnswer(question);
        }

        // 移除加载消息
        removeLoadingMessage(loadingId);

        // 显示回答
        const formattedAnswer = formatAnswer(answer);
        addMessage('assistant', formattedAnswer);

    } catch (error) {
        console.error('❌ AI 问答失败:', error);
        removeLoadingMessage(loadingId);
        addMessage('assistant', '⚠️ 抱歉，我暂时无法回答这个问题，请稍后再试。');
    }

    isProcessing = false;
}

// 快捷提问
window.askQuick = function(question) {
    document.getElementById('aiQuestion').value = question;
    handleAsk();
};

// ============================================================
// 5. 消息渲染
// ============================================================

function addMessage(role, content) {
    const container = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = `chat-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '你' : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = content;

    message.appendChild(avatar);
    message.appendChild(contentDiv);
    container.appendChild(message);

    // 滚动到底部
    container.scrollTop = container.scrollHeight;

    return message;
}

function addLoadingMessage() {
    const container = document.getElementById('chatMessages');
    const id = 'loading-' + Date.now();
    const message = document.createElement('div');
    message.id = id;
    message.className = 'chat-message assistant';
    message.innerHTML = `
        <div class="avatar">AI</div>
        <div class="content">
            <div class="ai-loading">
                <div class="spinner"></div>
                正在思考<span class="loading-dots"></span>
            </div>
        </div>
    `;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeLoadingMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ============================================================
// 6. 格式化和模拟回答
// ============================================================

function formatAnswer(answer) {
    if (typeof answer === 'string') {
        return answer.replace(/\n/g, '<br>');
    }
    if (typeof answer === 'object' && answer.summary) {
        return answer.summary.replace(/\n/g, '<br>');
    }
    return JSON.stringify(answer, null, 2).replace(/\n/g, '<br>');
}

function generateMockAnswer(question) {
    const q = question.toLowerCase();
    if (q.includes('销售') || q.includes('订单') || q.includes('生意') || q.includes('营业额')) {
        return `📊 今日销售报告\n\n今日销售额: ¥28,650\n今日订单数: 47 笔\n\n近7天销售额: ¥198,430\n同比增长: +12.3%\n\n💡 建议: 今天销售表现良好，建议保持目前的营销策略。`;
    }
    if (q.includes('库存') || q.includes('缺货') || q.includes('商品') || q.includes('产品')) {
        return `📦 库存报告\n\n总商品数: 156 种\n低库存预警: 8 种\n已售罄: 3 种\n\n⚠️ 需要补货的商品:\n• 泡沫洗车液 (剩余 5 桶)\n• 轮胎光亮剂 (剩余 8 瓶)\n• 内饰清洗剂 (剩余 3 瓶)`;
    }
    if (q.includes('客户') || q.includes('会员') || q.includes('VIP')) {
        return `👥 客户报告\n\n总客户数: 328 人\nVIP客户: 45 人\n黄金客户: 89 人\n\n本月新增客户: 23 人\n客户活跃度: 68%\n\n💡 VIP客户消费占比: 42%，建议重点关注。`;
    }
    if (q.includes('利润') || q.includes('财务') || q.includes('成本') || q.includes('支出')) {
        return `💰 财务报告\n\n本月总收入: ¥245,800\n本月总支出: ¥178,200\n\n净利润: ¥67,600\n利润率: 27.5%\n\n📈 同比上月增长: +8.2%`;
    }
    if (q.includes('预测') || q.includes('未来') || q.includes('趋势')) {
        return `📈 销售预测\n\n基于近7天数据预测:\n\n未来7天预计销售额: ¥198,430\n未来30天预计销售额: ¥850,000\n\n📊 趋势: 平稳上升\n💡 建议: 预计下周销售高峰在周五、周六。`;
    }
    return `🤔 我理解你想了解: "${question}"\n\n这是你当前的业务概览:\n• 总订单: 1,247 笔\n• 总客户: 328 人\n• 总商品: 156 种\n• 本月营业额: ¥245,800\n\n有什么具体想了解的吗？`;
}

// ============================================================
// 7. 业务洞察
// ============================================================

async function loadInsights() {
    const container = document.getElementById('insightsContainer');
    if (!container) return;

    try {
        let insights = null;
        if (aiService && typeof aiService.getInsights === 'function') {
            insights = await aiService.getInsights();
        } else {
            insights = getMockInsights();
        }

        if (insights && insights.length > 0) {
            renderInsights(container, insights);
        } else {
            container.innerHTML = `
                <div class="insight-card" style="grid-column:1/-1;text-align:center;color:#6B7280;">
                    <div class="title">✅ 一切正常</div>
                    <div class="description">暂无需要关注的业务问题</div>
                </div>
            `;
        }

    } catch (error) {
        console.error('❌ 加载洞察失败:', error);
        container.innerHTML = `
            <div class="insight-card" style="grid-column:1/-1;text-align:center;color:#6B7280;">
                <div class="title">⚠️ 加载失败</div>
                <div class="description">无法获取业务洞察，请稍后刷新</div>
            </div>
        `;
    }
}

function renderInsights(container, insights) {
    const typeMap = {
        warning: { icon: '⚠️', className: 'warning' },
        danger: { icon: '🚨', className: 'danger' },
        success: { icon: '✅', className: 'success' },
        info: { icon: '💡', className: '' }
    };

    let html = '';
    for (const insight of insights) {
        const type = typeMap[insight.type] || typeMap.info;
        html += `
            <div class="insight-card ${type.className}">
                <div class="title"><span class="icon">${type.icon}</span> ${insight.title}</div>
                <div class="description">${insight.description}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function getMockInsights() {
    return [
        {
            type: 'warning',
            title: '8 种商品库存不足',
            description: '建议立即补货: 泡沫洗车液、轮胎光亮剂、内饰清洗剂等'
        },
        {
            type: 'success',
            title: '45 位 VIP 客户',
            description: 'VIP客户消费占比 42%，建议提供专属优惠提升忠诚度'
        },
        {
            type: 'info',
            title: '今日销售额 ¥28,650',
            description: '比昨日增长 5.9%，表现良好，建议继续保持'
        }
    ];
}

// ============================================================
// 8. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ AI 模块加载完成');