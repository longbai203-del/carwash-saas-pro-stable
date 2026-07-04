/**
 * utils.js - 工具函数
 */
(function() {
    window.AppUtils = {
        toast: function(msg, type) {
            type = type || 'info';
            var colors = { info: '#0091D5', success: '#16a34a', warning: '#f59e0b', error: '#dc2626' };
            var t = document.createElement('div');
            t.className = 'toast-custom';
            t.textContent = msg;
            t.style.borderLeft = '4px solid ' + (colors[type] || colors.info);
            document.body.appendChild(t);
            setTimeout(function() { t.remove(); }, 3000);
        },
        
        $: function(id) {
            var el = document.getElementById(id);
            if (!el) console.warn('[Utils] 元素不存在: #' + id);
            return el;
        },
        
        qs: function(selector, parent) {
            parent = parent || document;
            var el = parent.querySelector(selector);
            if (!el) console.warn('[Utils] 元素不存在: ' + selector);
            return el;
        },
        
        formatDate: function(date) {
            if (!date) return '';
            return new Date(date).toLocaleString('zh-CN');
        },
        
        formatCurrency: function(amount) {
            return (amount || 0).toFixed(2) + ' SAR';
        },
        
        today: function() {
            return new Date().toISOString().split('T')[0];
        },
        
        delay: function(ms) {
            return new Promise(function(resolve) { setTimeout(resolve, ms); });
        },
        
        waitForDOM: function(id, timeout) {
            timeout = timeout || 3000;
            return new Promise(function(resolve) {
                var attempts = 0;
                var check = function() {
                    attempts++;
                    if (document.getElementById(id)) {
                        resolve(true);
                    } else if (attempts < timeout / 50) {
                        setTimeout(check, 50);
                    } else {
                        resolve(false);
                    }
                };
                check();
            });
        }
    };
    console.log('[Utils] 加载完成');
})();