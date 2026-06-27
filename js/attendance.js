// ================================================================
//  attendance.js - 考勤管理模块
// ================================================================

const AttendanceModule = {
    // 初始化
    init() {
        console.log('⏰ AttendanceModule 初始化');
        if (!document.getElementById('attendanceList')) {
            console.warn('⚠️ 考勤元素未加载，延迟初始化');
            setTimeout(() => this.init(), 300);
            return;
        }
        this.refresh();
        this.bindEvents();
    },

    // 销毁
    destroy() {
        console.log('⏰ AttendanceModule 销毁');
    },

    // 绑定事件
    bindEvents() {
        // 可以添加刷新等事件
    },

    // 刷新考勤
    refresh() {
        this.refreshAttendance();
    },

    // 刷新考勤列表
    refreshAttendance() {
        const list = document.getElementById('attendanceList');
        if (!list) return;

        list.innerHTML = (allAttendance || []).slice(0, 20).map(a =>
            `<div class="text-sm p-2 bg-gray-50 rounded">${a.staff_name} · ${a.type} · ${a.time ? new Date(a.time).toLocaleString() : ''}</div>`
        ).join('') || '<div class="text-center text-gray-400">暂无记录</div>';

        const sel = document.getElementById('attendanceStaff');
        if (sel) {
            const staff = allUsers.filter(u => u.role !== 'owner' && u.status === 'approved').map(u => u.name || u.username);
            sel.innerHTML = staff.map(s => `<option value="${s}">${s}</option>`).join('') || '<option value="">暂无员工</option>';
            if (currentUser?.name) {
                for (let opt of sel.options) {
                    if (opt.value === currentUser.name || opt.value === currentUser.username) {
                        opt.selected = true;
                        break;
                    }
                }
            }
        }
    },

    // 上班打卡
    async clockIn() {
        if (!currentUser) { showToast('请先登录'); return; }
        const staff = document.getElementById('attendanceStaff')?.value || currentUser.name || currentUser.username;
        try {
            const { data, error } = await supabaseClient.from('attendance').insert([{ staff_name: staff, type: '上班打卡', time: new Date().toISOString() }]).select();
            if (error) throw new Error(error.message);
            if (data && data.length > 0) allAttendance.unshift(data[0]);
            this.refreshAttendance();
            showToast('✅ ' + staff + ' 上班打卡成功');
        } catch (error) { showToast('❌ 打卡失败: ' + error.message); }
    },

    // 下班打卡
    async clockOut() {
        if (!currentUser) { showToast('请先登录'); return; }
        const staff = document.getElementById('attendanceStaff')?.value || currentUser.name || currentUser.username;
        try {
            const { data, error } = await supabaseClient.from('attendance').insert([{ staff_name: staff, type: '下班打卡', time: new Date().toISOString() }]).select();
            if (error) throw new Error(error.message);
            if (data && data.length > 0) allAttendance.unshift(data[0]);
            this.refreshAttendance();
            showToast('✅ ' + staff + ' 下班打卡成功');
        } catch (error) { showToast('❌ 打卡失败: ' + error.message); }
    }
};

// 暴露到全局
window.AttendanceModule = AttendanceModule;

// 兼容旧版函数
window.refreshAttendance = function() { AttendanceModule.refreshAttendance(); };
window.clockIn = function() { AttendanceModule.clockIn(); };
window.clockOut = function() { AttendanceModule.clockOut(); };

console.log('✅ attendance.js 已加载 (模块化)');