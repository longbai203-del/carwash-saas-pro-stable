/**
 * Dashboard - 仪表盘
 */
export function init() {
    console.log('✅ Dashboard 已加载');
    
    var statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
        var html = '';
        html += '<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:16px;\">';
        html += '  <div style=\"background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);\">';
        html += '    <div style=\"color:#6B7280;font-size:14px;\">今日收入</div>';
        html += '    <div style=\"font-size:28px;font-weight:700;color:#1F2937;\">¥28,650</div>';
        html += '  </div>';
        html += '  <div style=\"background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);\">';
        html += '    <div style=\"color:#6B7280;font-size:14px;\">今日订单</div>';
        html += '    <div style=\"font-size:28px;font-weight:700;color:#1F2937;\">47</div>';
        html += '  </div>';
        html += '  <div style=\"background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);\">';
        html += '    <div style=\"color:#6B7280;font-size:14px;\">活跃客户</div>';
        html += '    <div style=\"font-size:28px;font-weight:700;color:#1F2937;\">328</div>';
        html += '  </div>';
        html += '  <div style=\"background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);\">';
        html += '    <div style=\"color:#6B7280;font-size:14px;\">转化率</div>';
        html += '    <div style=\"font-size:28px;font-weight:700;color:#1F2937;\">68.5%</div>';
        html += '  </div>';
        html += '</div>';
        statsContainer.innerHTML = html;
    }
}
