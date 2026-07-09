/**
 * Company - 公司设置
 */
export function init() {
    console.log('✅ Company Settings 已加载');
    
    var form = document.getElementById('companyForm');
    if (form) {
        // 使用字符串拼接替代模板字符串，避免 JSX 误报
        var html = '';
        html += '<div class="form-group">';
        html += '  <label>公司名称</label>';
        html += '  <input type="text" class="form-control" value="CarwashPro 洗车管理系统" />';
        html += '</div>';
        html += '<div class="grid-2">';
        html += '  <div class="form-group">';
        html += '    <label>联系电话</label>';
        html += '    <input type="text" class="form-control" value="400-888-9999" />';
        html += '  </div>';
        html += '  <div class="form-group">';
        html += '    <label>电子邮箱</label>';
        html += '    <input type="email" class="form-control" value="info@carwashpro.com" />';
        html += '  </div>';
        html += '</div>';
        html += '<div class="form-group">';
        html += '  <label>公司地址</label>';
        html += '  <input type="text" class="form-control" value="中国广东省深圳市南山区科技园路88号" />';
        html += '</div>';
        html += '<div class="grid-2">';
        html += '  <div class="form-group">';
        html += '    <label>税号</label>';
        html += '    <input type="text" class="form-control" value="91440300MA5XXXXX" />';
        html += '  </div>';
        html += '  <div class="form-group">';
        html += '    <label>公司网站</label>';
        html += '    <input type="url" class="form-control" value="https://www.carwashpro.com" />';
        html += '  </div>';
        html += '</div>';
        html += '<div class="form-group">';
        html += '  <label>公司简介</label>';
        html += '  <textarea class="form-control" rows="3">专业的洗车店管理系统，提供收银、会员、库存、财务等一站式解决方案</textarea>';
        html += '</div>';
        
        form.innerHTML = html;
    }
    
    // 显示Logo预览
    var logoPreview = document.getElementById('logoPreview');
    if (logoPreview) {
        logoPreview.innerHTML = 
            '<div style="display:flex;align-items:center;gap:12px;">' +
            '  <div style="width:60px;height:60px;background:#4F46E5;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:700;">CP</div>' +
            '  <span style="font-size:14px;color:#1F2937;">CarwashPro</span>' +
            '</div>';
    }
}