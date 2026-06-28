/**
 * attendance.js - 考勤管理模块
 */
window.AttendanceModule = {
    initialized: false,
    moduleName: 'attendance',

    init: function() {
        if (this.initialized) return;
        console.log('[Attendance] 初始化...');
        var self = this;
        setTimeout(function() {
            self.cacheDom();
            self.bindEvents();
            self.loadData();
            self.initialized = true;
            console.log('[Attendance] 初始化完成');
        }, 50);
    },

    destroy: function() {
        console.log('[Attendance] 销毁...');
        this.initialized = false;
    },

    cacheDom: function() {
        this.el = {
            list: document.getElementById('attendanceList'),
            staff: document.getElementById('attendanceStaff')
        };
    },

    bindEvents: function() {
        // 无需额外事件
    },

    loadData: function() {
        var attendance = AppStore.get('allAttendance') || [];
        this.render(attendance);
    },

    render: function(attendance) {
        if (!this.el.list) return;
        if (!attendance || attendance.length === 0) {
            this.el.list.innerHTML = '<div class="text-center text-gray-400 py-8">暂无记录</div>';
            return;
        }

        var html = '';
        attendance.slice(0, 20).forEach(function(a) {
            html += '<div class="text-sm p-2 bg-gray-50 rounded">';
            html += (a.staff_name || '') + ' · ' + (a.type || '') + ' · ' + (a.time ? new Date(a.time).toLocaleString() : '');
            html += '</div>';
        });
        this.el.list.innerHTML = html;
    }
};

console.log('[Attendance] 模块已注册');