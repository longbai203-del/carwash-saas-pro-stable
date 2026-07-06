/**
 * modules/01-dashboard/ai/ai.js
 * AI 智能助手 - 支持流式响应
 */

// ============================================================
// 1. 导入服务
// ============================================================

let aiService = null;

async function loadAIService() {
    try {
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
let currentStreamAbort = null;

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
// 4. 提问功能（支持流式）
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

    // 创建 AI 消息占位
    const messageId = addStreamingMessage();

    try {
        // 检查是否支持流式
        if (aiService && typeof aiService.askStream === 'function') {
            // 流式响应
            let fullContent = '';
            let firstChunk = true;

            for await (const chunk of aiService.askStream(question)) {
                if (firstChunk) {
                    // 移除加载状态
                    removeLoadingState(messageId);
                    firstChunk = false;
                }
                fullContent += chunk;
                updateStreamingMessage(messageId, fullContent);
            }

            // 最终格式化
            if (fullContent) {
                updateStreamingMessage(messageId, formatContent(fullContent));
            } else {
                // 如果流式没返回内容，尝试普通问答
                const answer = await aiService.ask(question);
                updateStreamingMessage(messageId, formatContent(answer.summary));
            }

        } else if (aiService && typeof aiService.ask === 'function') {
            // 普通问答（非流式）
            const answer = await aiService.ask(question);
            removeLoadingState(messageId);
            updateStreamingMessage(messageId, formatContent(answer.summary));

        } else {
            // 完全降级到模拟
            removeLoadingState(messageId);
            const mockAnswer = generateMockAnswer(question);
            updateStreamingMessage(messageId, formatContent(mockAnswer));
        }

    } catch (error) {
        console.error('❌ AI 问答失败:', error);
        removeLoadingState(messageId);
        updateStreamingMessage(messageId, '⚠️ 抱歉，我暂时无法回答这个问题，请稍后再试。');
    }

    isProcessing = false;
}

// ============================================================
// 5. 快捷提问
// ============================================================

window.askQuick = function(question) {
    document.getElementById('aiQuestion').value = question;
    handleAsk();
};

// ============================================================
// 6. 消息渲染（支持流式）
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

    container.scrollTop = container.scrollHeight;
    return message;
}

function addStreamingMessage() {
    const container = document.getElementById('chatMessages');
    const id = 'stream-' + Date.now();
    const message = document.createElement('div');
    message.id = id;
    message.className = 'chat-message assistant';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = `
        <div class="ai-loading">
            <div class="spinner"></div>
            正在思考<span class="loading-dots"></span>
        </div>
    `;

    message.appendChild(avatar);
    message.appendChild(contentDiv);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return id;
}

function updateStreamingMessage(id, content) {
    const message = document.getElementById(id);
    if (!message) return;

    const contentDiv = message.querySelector('.content');
    if (contentDiv) {
        contentDiv.innerHTML = content;
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }
}

function removeLoadingState(id) {
    const message = document.getElementById(id);
    if (!message) return;

    const contentDiv = message.querySelector('.content');
    if (contentDiv) {
        // 如果内容还是加载状态，清除它
        if (contentDiv.querySelector('.ai-loading')) {
            contentDiv.innerHTML = '';
        }
    }
}

// ============================================================
// 7. 内容格式化
// ============================================================

function formatContent(content) {
    if (!content) return '暂无内容';

    // 处理 Markdown 格式
    let formatted = content
        // 标题
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        // 列表
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        // 数字列表
        .replace(/^(\d+)\. (.*$)/gm, '<li>$1. $2</li>')
        // 加粗
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 换行
        .replace(/\n/g, '<br>');

    // 包裹列表
    formatted = formatted
        .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
        .replace(/<ul><li>(\d+)\./g, '<ol><li>$1.');

    return formatted;
}

// ============================================================
// 8. 模拟回答（降级用）
// ============================================================

function generateMockAnswer(question) {
    const q = question.toLowerCase();
    if (q.includes('销售') || q.includes('订单') || q.includes('生意') || q.includes('营业额')) {
        return `📊 **今日销售报告**

**今日销售额:** ¥28,650
**今日订单数:** 47 笔

**近7天销售额:** ¥198,430
**同比增长:** +12.3%

💡 **建议:** 今天销售表现良好，建议保持目前的营销策略。`;
    }
    if (q.includes('库存') || q.includes('缺货') || q.includes('商品')) {
        return `📦 **库存报告**

**总商品数:** 156 种
**低库存预警:** 8 种
**已售罄:** 3 种

⚠️ **需要补货的商品:**
- 泡沫洗车液 (剩余 5 桶)
- 轮胎光亮剂 (剩余 8 瓶)
- 内饰清洗剂 (剩余 3 瓶)`;
    }
    if (q.includes('客户') || q.includes('会员') || q.includes('VIP')) {
        return `👥 **客户报告**

**总客户数:** 328 人
**VIP 客户:** 45 人
**黄金客户:** 89 人

本月新增客户: 23 人
客户活跃度: 68%

💡 VIP 客户消费占比 42%，建议重点关注。`;
    }
    if (q.includes('利润') || q.includes('财务') || q.includes('成本')) {
        return `💰 **财务报告**

**本月总收入:** ¥245,800
**本月总支出:** ¥178,200

**净利润:** ¥67,600
**利润率:** 27.5%

📈 同比上月增长: +8.2%`;
    }
    if (q.includes('预测') || q.includes('趋势') || q.includes('未来')) {
        return `📈 **销售预测**

基于近7天数据预测:

**未来7天预计销售额:** ¥198,430
**未来30天预计销售额:** ¥850,000

📊 趋势: 平稳上升
💡 建议: 预计下周销售高峰在周五、周六。`;
    }
    return `🤔 我理解你想了解: "${question}"

这是你当前的业务概览:
- 总订单: 1,247 笔
- 总客户: 328 人
- 总商品: 156 种
- 本月营业额: ¥245,800

有什么具体想了解的吗？`;
}

// ============================================================
// 9. 业务洞察
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
        // 格式化描述（支持 Markdown）
        let desc = insight.description || '';
        desc = desc.replace(/\n/g, '<br>');
        
        html += `
            <div class="insight-card ${type.className}">
                <div class="title"><span class="icon">${type.icon}</span> ${insight.title}</div>
                <div class="description">${desc}</div>
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
// 10. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}

console.log('✅ AI 模块加载完成（支持流式响应）');