/**
 * attendance.js - 考勤管理模块
 */
(function() {
    'use strict';

    window.AttendanceModule = Object.create(ModuleBase);
    window.AttendanceModule.moduleName = 'attendance';

    window.AttendanceModule.cacheDom = function() {
        this.el = {
            list: this.getEl('attendanceList'),
            staff: this.getEl('attendanceStaff'),
            clockInBtn: document.querySelector('[onclick="clockIn()"]'),
            clockOutBtn: document.querySelector('[onclick="clockOut()"]')
        };
    };

    window.AttendanceModule.bindEvents = function() {
        var self = this;
        if (this.el.clockInBtn) {
            this.el.clockInBtn.addEventListener('click', function() { self.clockIn(); });
        }
        if (this.el.clockOutBtn) {
            this.el.clockOutBtn.addEventListener('click', function() { self.clockOut(); });
        }
    };

    window.AttendanceModule.loadData = function() {
        var attendance = this.getData('allAttendance');
        this.render(attendance);
    };

    window.AttendanceModule.render = function(attendance) {
        var list = this.el.list;
        if (!list) return;
        if (!attendance || attendance.length === 0) {
            this.setEmpty(list);
            return;
        }

        var html = '';
        attendance.slice(0, 20).forEach(function(a) {
            html += '<div class="text-sm p-2 bg-gray-50 rounded">';
            html += (a.staff_name || '') + ' · ' + (a.type || '') + ' · ' + (a.time ? new Date(a.time).toLocaleString() : '');
            html += '</div>';
        });
        list.innerHTML = html;
    };

    window.AttendanceModule.clockIn = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser.id) {
            this.toast('请先登录', 'error');
            return;
        }
        var staff = this.el.staff ? this.el.staff.value || currentUser.name || currentUser.username : currentUser.name || currentUser.username;

        AppApi.insert('attendance', [{
            staff_name: staff,
            type: '上班打卡',
            time: new Date().toISOString()
        }]).then(function(data) {
            if (data && data.length > 0) {
                var attendance = self.getData('allAttendance');
                attendance.unshift(data[0]);
                self.setData('allAttendance', attendance);
                self.loadData();
                self.toast('✅ ' + staff + ' 上班打卡成功', 'success');
            }
        }).catch(function(error) {
            self.toast('❌ 打卡失败: ' + error.message, 'error');
        });
    };

    window.AttendanceModule.clockOut = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser.id) {
            this.toast('请先登录', 'error');
            return;
        }
        var staff = this.el.staff ? this.el.staff.value || currentUser.name || currentUser.username : currentUser.name || currentUser.username;

        AppApi.insert('attendance', [{
            staff_name: staff,
            type: '下班打卡',
            time: new Date().toISOString()
        }]).then(function(data) {
            if (data && data.length > 0) {
                var attendance = self.getData('allAttendance');
                attendance.unshift(data[0]);
                self.setData('allAttendance', attendance);
                self.loadData();
                self.toast('✅ ' + staff + ' 下班打卡成功', 'success');
            }
        }).catch(function(error) {
            self.toast('❌ 打卡失败: ' + error.message, 'error');
        });
    };

    console.log('[Attendance] 模块已注册');
})();