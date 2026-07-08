/**
 * modules/01-dashboard/ai/ai.js - AI 智能助手
 * @module ai
 * @description AI 智能问答和业务洞察
 */

// ============================================================
// 1. 状态管理
// ============================================================

let isProcessing = false;
let aiService = null;

// ============================================================
// 2. AI 服务加载
// ============================================================

async function loadAIService() {
    try {
        // 尝试加载 AI 服务
        const module = await import('/business-core/services/ai-service.js');
        if (module && module.AIService) {
            aiService = new module.AIService();
            console.log('✅ AI 服务已加载');
            return true;
        }
        return false;
    } catch (error) {
        console.warn('⚠️ AI 服务加载失败，使用模拟模式:', error.message);
        return false;
    }
}

// ============================================================
// 3. 工具函数
// ============================================================

function showToast(message, type) {
    var toast = document.createElement('div');
    var colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 12px 24px;
        background: ${colors[type] || '#4F46E5'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-size: 14px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

// ============================================================
// 4. 消息渲染
// ============================================================

function addMessage(role, content) {
    var container = document.getElementById('chatMessages');
    if (!container) return;

    var message = document.createElement('div');
    message.className = 'chat-message ' + role;

    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '你' : 'AI';

    var contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = content;

    message.appendChild(avatar);
    message.appendChild(contentDiv);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

function addStreamingMessage() {
    var container = document.getElementById('chatMessages');
    if (!container) return null;

    var id = 'stream-' + Date.now();
    var message = document.createElement('div');
    message.id = id;
    message.className = 'chat-message assistant';

    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'AI';

    var contentDiv = document.createElement('div');
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
    var message = document.getElementById(id);
    if (!message) return;

    var contentDiv = message.querySelector('.content');
    if (contentDiv) {
        contentDiv.innerHTML = content;
        var container = document.getElementById('chatMessages');
        if (container) container.scrollTop = container.scrollHeight;
    }
}

function removeLoadingState(id) {
    var message = document.getElementById(id);
    if (!message) return;

    var contentDiv = message.querySelector('.content');
    if (contentDiv && contentDiv.querySelector('.ai-loading')) {
        contentDiv.innerHTML = '';
    }
}

// ============================================================
// 5. 内容格式化
// ============================================================

function formatContent(content) {
    if (!content) return '暂无内容';

    var formatted = content
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li>$1. $2</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    formatted = formatted
        .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
        .replace(/<ul><li>(\d+)\./g, '<ol><li>$1.');

    return formatted;
}

// ============================================================
// 6. 模拟回答
// ============================================================

function generateMockAnswer(question) {
    var q = question.toLowerCase();
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
// 7. 提问功能
// ============================================================

async function handleAsk() {
    if (isProcessing) return;

    var input = document.getElementById('aiQuestion');
    var question = input.value.trim();
    if (!question) return;

    input.value = '';
    isProcessing = true;

    addMessage('user', question);
    var messageId = addStreamingMessage();

    try {
        if (aiService && typeof aiService.ask === 'function') {
            var answer = await aiService.ask(question);
            removeLoadingState(messageId);
            updateStreamingMessage(messageId, formatContent(answer.summary || answer));
        } else {
            removeLoadingState(messageId);
            var mockAnswer = generateMockAnswer(question);
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
// 8. 快捷提问
// ============================================================

window.askQuick = function(question) {
    var input = document.getElementById('aiQuestion');
    if (input) {
        input.value = question;
        handleAsk();
    }
};

// ============================================================
// 9. 业务洞察
// ============================================================

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

function renderInsights(insights) {
    var container = document.getElementById('insightsContainer');
    if (!container) return;

    var typeMap = {
        warning: { icon: '⚠️', className: 'warning' },
        danger: { icon: '🚨', className: 'danger' },
        success: { icon: '✅', className: 'success' },
        info: { icon: '💡', className: '' }
    };

    var html = '';
    for (var i = 0; i < insights.length; i++) {
        var insight = insights[i];
        var type = typeMap[insight.type] || typeMap.info;
        var desc = (insight.description || '').replace(/\n/g, '<br>');
        html += `
            <div class="insight-card ${type.className}">
                <div class="title"><span class="icon">${type.icon}</span> ${insight.title}</div>
                <div class="description">${desc}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function loadInsights() {
    var container = document.getElementById('insightsContainer');
    if (!container) return;

    try {
        var insights = null;
        if (aiService && typeof aiService.getInsights === 'function') {
            insights = await aiService.getInsights();
        } else {
            insights = getMockInsights();
        }

        if (insights && insights.length > 0) {
            renderInsights(insights);
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

// ============================================================
// 10. 初始化
// ============================================================

export async function init() {
    console.log('🤖 AI 智能助手初始化...');

    await loadAIService();

    var askBtn = document.getElementById('askBtn');
    var aiQuestion = document.getElementById('aiQuestion');

    if (askBtn) {
        askBtn.addEventListener('click', handleAsk);
    }
    if (aiQuestion) {
        aiQuestion.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleAsk();
        });
    }

    await loadInsights();

    console.log('✅ AI 智能助手初始化完成');
}

// ============================================================
// 11. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 200);
    });
} else {
    setTimeout(init, 200);
}

console.log('✅ AI 模块加载完成（支持流式响应）');