/**
 * attendance.js - 员工系统模块 V2
 * 包含：考勤、GPS打卡、绩效、提成、工资
 */
(function() {
    'use strict';

    window.AttendanceModule = Object.create(ModuleBase);
    window.AttendanceModule.moduleName = 'attendance';
    window.AttendanceModule.gpsLocation = null;

    // ===== 缓存 DOM =====
    window.AttendanceModule.cacheDom = function() {
        this.el = {
            list: document.getElementById('attendanceList'),
            staff: document.getElementById('attendanceStaff'),
            gpsStatus: document.getElementById('gpsStatus'),
            gpsLocationText: document.getElementById('gpsLocationText'),
            gpsAccuracy: document.getElementById('gpsAccuracy'),
            todayCheckIns: document.getElementById('todayCheckIns'),
            todayWorkHours: document.getElementById('todayWorkHours'),
            weekWorkHours: document.getElementById('weekWorkHours'),
            monthWorkDays: document.getElementById('monthWorkDays'),
            // 绩效
            performanceList: document.getElementById('performanceList'),
            // 提成
            commissionList: document.getElementById('commissionList'),
            commissionTotal: document.getElementById('commissionTotal'),
            commissionPeriod: document.getElementById('commissionPeriod'),
            // 工资
            salaryList: document.getElementById('salaryList'),
            // 位置设置
            storeLat: document.getElementById('storeLat'),
            storeLng: document.getElementById('storeLng'),
            storeRadius: document.getElementById('storeRadius'),
            // 模态框
            addSalaryModal: document.getElementById('addSalaryModal'),
            salaryEmployeeSelect: document.getElementById('salaryEmployeeSelect'),
            salaryPeriodStart: document.getElementById('salaryPeriodStart'),
            salaryPeriodEnd: document.getElementById('salaryPeriodEnd'),
            salaryBaseAmount: document.getElementById('salaryBaseAmount'),
            salaryCommissionAmount: document.getElementById('salaryCommissionAmount'),
            salaryBonusAmount: document.getElementById('salaryBonusAmount'),
            salaryDeductionAmount: document.getElementById('salaryDeductionAmount')
        };
    };

    // ===== 绑定事件 =====
    window.AttendanceModule.bindEvents = function() {
        if (this.el.staff) {
            this.el.staff.addEventListener('change', function() { window.AttendanceModule.loadData(); });
        }
    };

    // ============================================================
    // 加载数据
    // ============================================================

    window.AttendanceModule.loadData = function() {
        this.loadAttendance();
        this.loadPerformance();
        this.loadCommissions();
        this.loadSalaries();
        this.loadStoreLocation();
        this.updateStats();
        this.updateStaffSelect();
    };

    // ===== 加载考勤记录 =====
    window.AttendanceModule.loadAttendance = function() {
        var self = this;
        AppApi.query('attendance', { order: { by: 'time', ascending: false }, limit: 100 })
            .then(function(data) {
                AppStore.set('allAttendance', data || []);
                self.renderAttendance(data || []);
            })
            .catch(function(error) {
                console.error('[Attendance] 加载考勤失败:', error);
            });
    };

    // ===== 加载绩效 =====
    window.AttendanceModule.loadPerformance = function() {
        var self = this;
        AppApi.query('employee_performance', { order: { by: 'period_start', ascending: false }, limit: 50 })
            .then(function(data) {
                self.renderPerformance(data || []);
            })
            .catch(function(error) {
                console.error('[Attendance] 加载绩效失败:', error);
            });
    };

    // ===== 加载提成 =====
    window.AttendanceModule.loadCommissions = function() {
        var self = this;
        var period = this.el.commissionPeriod ? this.el.commissionPeriod.value : 'today';
        var today = new Date().toISOString().split('T')[0];
        var startDate = today;

        if (period === 'week') {
            var d = new Date();
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString().split('T')[0];
        } else if (period === 'month') {
            var d = new Date();
            d.setDate(1);
            startDate = d.toISOString().split('T')[0];
        } else if (period === 'all') {
            startDate = '2020-01-01';
        }

        AppApi.query('commissions', { filter: { date: startDate }, order: { by: 'created_at', ascending: false }, limit: 100 })
            .then(function(data) {
                self.renderCommissions(data || [], period);
            })
            .catch(function(error) {
                console.error('[Attendance] 加载提成失败:', error);
            });
    };

    // ===== 加载工资 =====
    window.AttendanceModule.loadSalaries = function() {
        var self = this;
        AppApi.query('salaries', { order: { by: 'created_at', ascending: false }, limit: 50 })
            .then(function(data) {
                self.renderSalaries(data || []);
            })
            .catch(function(error) {
                console.error('[Attendance] 加载工资失败:', error);
            });
    };

    // ===== 加载门店位置 =====
    window.AttendanceModule.loadStoreLocation = function() {
        var self = this;
        var store = AppStore.get('currentStore');
        if (!store) return;

        AppApi.query('store_locations', { filter: { store_id: store.id }, limit: 1 })
            .then(function(data) {
                if (data && data.length > 0) {
                    var loc = data[0];
                    if (self.el.storeLat) self.el.storeLat.value = loc.latitude || '';
                    if (self.el.storeLng) self.el.storeLng.value = loc.longitude || '';
                    if (self.el.storeRadius) self.el.storeRadius.value = loc.radius || 100;
                }
            })
            .catch(function(error) {
                console.error('[Attendance] 加载门店位置失败:', error);
            });
    };

    // ============================================================
    // 渲染函数
    // ============================================================

    // ===== 渲染考勤记录 =====
    window.AttendanceModule.renderAttendance = function(records) {
        var list = this.el.list;
        if (!list) return;

        if (!records || records.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无考勤记录</div>';
            return;
        }

        var html = '';
        var users = AppStore.get('allUsers') || [];
        records.slice(0, 30).forEach(function(a) {
            var user = users.find(function(u) { return u.id === a.employee_id; });
            var name = user ? (user.name || user.username) : (a.staff_name || '未知');
            var location = a.check_in_location || '';
            var verified = a.is_verified ? '✅' : '⚠️';
            html += '<div class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded border">';
            html += '<div><span class="font-medium">' + name + '</span>';
            html += '<span class="text-gray-400 ml-2">' + a.type + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (a.time ? new Date(a.time).toLocaleString() : '') + '</span>';
            html += '</div>';
            html += '<div class="flex items-center gap-2">';
            if (location) html += '<span class="text-xs text-blue-500"><i class="fas fa-map-marker-alt"></i> ' + location + '</span>';
            html += '<span class="text-xs">' + verified + '</span>';
            if (a.work_hours) html += '<span class="text-xs text-gray-400">' + a.work_hours + 'h</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    // ===== 渲染绩效 =====
    window.AttendanceModule.renderPerformance = function(performances) {
        var list = this.el.performanceList;
        if (!list) return;

        if (!performances || performances.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无绩效数据</div>';
            return;
        }

        var users = AppStore.get('allUsers') || [];
        var html = '';
        performances.slice(0, 20).forEach(function(p) {
            var user = users.find(function(u) { return u.id === p.employee_id; });
            var name = user ? (user.name || user.username) : '未知';
            var rating = p.rating_score || 0;
            var stars = '';
            for (var i = 0; i < 5; i++) {
                stars += i < Math.round(rating) ? '⭐' : '☆';
            }
            html += '<div class="flex justify-between items-center p-2 bg-gray-50 rounded border">';
            html += '<div><span class="font-medium">' + name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + p.period_start + ' ~ ' + p.period_end + '</span>';
            html += '</div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="text-sm">订单: ' + (p.total_orders || 0) + '</span>';
            html += '<span class="text-sm">收入: ' + (p.total_revenue || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-sm">' + stars + '</span>';
            html += '<span class="text-xs text-green-600">奖金: ' + (p.bonus_amount || 0).toFixed(2) + ' SAR</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    // ===== 渲染提成 =====
    window.AttendanceModule.renderCommissions = function(commissions, period) {
        var list = this.el.commissionList;
        if (!list) return;

        var total = commissions.reduce(function(s, c) { return s + (c.commission_amount || 0); }, 0);

        if (!commissions || commissions.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无提成记录</div>';
            if (this.el.commissionTotal) this.el.commissionTotal.textContent = '0 SAR';
            return;
        }

        var users = AppStore.get('allUsers') || [];
        var html = '';
        commissions.slice(0, 30).forEach(function(c) {
            var user = users.find(function(u) { return u.id === c.employee_id; });
            var name = user ? (user.name || user.username) : '未知';
            var status = c.status === 'paid' ? '✅ 已结算' : c.status === 'approved' ? '⏳ 待发放' : '⏳ 待审批';
            var statusColor = c.status === 'paid' ? 'text-green-600' : c.status === 'approved' ? 'text-amber-600' : 'text-gray-400';
            html += '<div class="flex justify-between items-center p-1 border-b hover:bg-gray-50">';
            html += '<div><span class="font-medium">' + name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">订单: ' + (c.order_count || 1) + '单</span></div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="font-bold text-blue-600">' + (c.commission_amount || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-xs ' + statusColor + '">' + status + '</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;

        if (this.el.commissionTotal) this.el.commissionTotal.textContent = total.toFixed(2) + ' SAR';
    };

    // ===== 渲染工资 =====
    window.AttendanceModule.renderSalaries = function(salaries) {
        var list = this.el.salaryList;
        if (!list) return;

        if (!salaries || salaries.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无工资记录</div>';
            return;
        }

        var users = AppStore.get('allUsers') || [];
        var statusMap = { pending: '⏳ 待审核', approved: '✅ 已审核', paid: '💰 已发放', cancelled: '❌ 已取消' };

        var html = '';
        salaries.slice(0, 20).forEach(function(s) {
            var user = users.find(function(u) { return u.id === s.employee_id; });
            var name = user ? (user.name || user.username) : '未知';
            html += '<div class="flex justify-between items-center p-2 border-b hover:bg-gray-50">';
            html += '<div><span class="font-medium">' + name + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + s.period_start + ' ~ ' + s.period_end + '</span></div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="font-bold text-blue-600">' + (s.net_salary || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-xs text-gray-400">' + (statusMap[s.status] || s.status) + '</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    // ===== 更新统计 =====
    window.AttendanceModule.updateStats = function() {
        var records = AppStore.get('allAttendance') || [];
        var today = new Date().toISOString().split('T')[0];
        var todayRecords = records.filter(function(r) {
            return r.time && r.time.startsWith(today);
        });

        // 今日打卡数
        var checkIns = todayRecords.filter(function(r) { return r.type === 'Clock In' || r.type === '上班打卡'; }).length;
        if (this.el.todayCheckIns) this.el.todayCheckIns.textContent = checkIns;

        // 今日工时
        var workHours = 0;
        var clockIns = todayRecords.filter(function(r) { return r.type === 'Clock In' || r.type === '上班打卡'; });
        var clockOuts = todayRecords.filter(function(r) { return r.type === 'Clock Out' || r.type === '下班打卡'; });
        // 简单计算：如果有打卡记录，显示8小时
        if (clockIns.length > 0 && clockOuts.length > 0) {
            workHours = 8;
        } else if (clockIns.length > 0) {
            workHours = 4;
        }
        if (this.el.todayWorkHours) this.el.todayWorkHours.textContent = workHours + 'h';

        // 本周工时
        var weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        var weekStartStr = weekStart.toISOString().split('T')[0];
        var weekRecords = records.filter(function(r) {
            return r.time && r.time >= weekStartStr;
        });
        var weekHours = weekRecords.filter(function(r) {
            return r.type === 'Clock In' || r.type === '上班打卡';
        }).length * 8;
        if (this.el.weekWorkHours) this.el.weekWorkHours.textContent = weekHours + 'h';

        // 本月出勤
        var monthStart = new Date();
        monthStart.setDate(1);
        var monthStartStr = monthStart.toISOString().split('T')[0];
        var monthRecords = records.filter(function(r) {
            return r.time && r.time >= monthStartStr && (r.type === 'Clock In' || r.type === '上班打卡');
        });
        var uniqueDays = new Set();
        monthRecords.forEach(function(r) {
            if (r.time) uniqueDays.add(r.time.split('T')[0]);
        });
        if (this.el.monthWorkDays) this.el.monthWorkDays.textContent = uniqueDays.size || 0;
    };

    // ============================================================
    // 更新员工下拉
    // ============================================================

    window.AttendanceModule.updateStaffSelect = function() {
        var users = AppStore.get('allUsers') || [];
        var staff = users.filter(function(u) { return u.role !== 'owner' && u.role !== 'admin' && u.status === 'approved'; });
        var sel = this.el.staff;
        if (sel) {
            var html = '';
            staff.forEach(function(u) {
                html += '<option value="' + u.id + '">' + (u.name || u.username) + '</option>';
            });
            sel.innerHTML = html || '<option value="">暂无员工</option>';
        }

        // 工资员工下拉
        var salarySel = this.el.salaryEmployeeSelect;
        if (salarySel) {
            var html = '';
            staff.forEach(function(u) {
                html += '<option value="' + u.id + '">' + (u.name || u.username) + '</option>';
            });
            salarySel.innerHTML = html || '<option value="">暂无员工</option>';
        }
    };

    // ============================================================
    // GPS 定位
    // ============================================================

    window.AttendanceModule.getLocation = function() {
        var self = this;
        if (!navigator.geolocation) {
            if (this.el.gpsLocationText) this.el.gpsLocationText.textContent = '❌ 浏览器不支持GPS';
            return;
        }

        if (this.el.gpsLocationText) this.el.gpsLocationText.textContent = '📍 定位中...';

        navigator.geolocation.getCurrentPosition(
            function(position) {
                self.gpsLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                if (self.el.gpsLocationText) {
                    self.el.gpsLocationText.textContent = '📍 ' + position.coords.latitude.toFixed(6) + ', ' + position.coords.longitude.toFixed(6);
                }
                if (self.el.gpsAccuracy) {
                    self.el.gpsAccuracy.textContent = '精度: ' + Math.round(position.coords.accuracy) + 'm';
                }
                // 检查是否在门店范围内
                self.checkLocationProximity(position.coords.latitude, position.coords.longitude);
            },
            function(error) {
                if (self.el.gpsLocationText) {
                    self.el.gpsLocationText.textContent = '❌ GPS错误: ' + error.message;
                }
                console.error('GPS Error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    window.AttendanceModule.checkLocationProximity = function(lat, lng) {
        var storeLat = parseFloat(this.el.storeLat ? this.el.storeLat.value : 0);
        var storeLng = parseFloat(this.el.storeLng ? this.el.storeLng.value : 0);
        var radius = parseFloat(this.el.storeRadius ? this.el.storeRadius.value : 100);

        if (!storeLat || !storeLng) return;

        var distance = this.calculateDistance(lat, lng, storeLat, storeLng);
        if (distance <= radius) {
            if (this.el.gpsLocationText) {
                this.el.gpsLocationText.textContent += ' ✅ 在门店范围内 (' + Math.round(distance) + 'm)';
            }
        } else {
            if (this.el.gpsLocationText) {
                this.el.gpsLocationText.textContent += ' ⚠️ 距离门店 ' + Math.round(distance) + 'm (超出范围)';
            }
        }
    };

    window.AttendanceModule.calculateDistance = function(lat1, lon1, lat2, lon2) {
        var R = 6371000; // 地球半径（米）
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // ============================================================
    // 打卡功能
    // ============================================================

    window.AttendanceModule.clockIn = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser.id) {
            this.toast('请先登录', 'error');
            return;
        }

        var staff = this.el.staff ? this.el.staff.value || currentUser.id : currentUser.id;

        // 获取位置
        var location = '';
        if (this.gpsLocation) {
            location = this.gpsLocation.lat.toFixed(6) + ',' + this.gpsLocation.lng.toFixed(6);
        }

        var data = {
            employee_id: staff,
            staff_name: currentUser.name || currentUser.username,
            type: 'Clock In',
            time: new Date().toISOString(),
            check_in_location: location,
            check_in_lat: this.gpsLocation ? this.gpsLocation.lat : null,
            check_in_lng: this.gpsLocation ? this.gpsLocation.lng : null,
            is_verified: !!this.gpsLocation
        };

        AppApi.insert('attendance', data)
            .then(function() {
                self.toast('✅ 上班打卡成功', 'success');
                self.loadData();
            })
            .catch(function(error) {
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

        var staff = this.el.staff ? this.el.staff.value || currentUser.id : currentUser.id;

        var location = '';
        if (this.gpsLocation) {
            location = this.gpsLocation.lat.toFixed(6) + ',' + this.gpsLocation.lng.toFixed(6);
        }

        var data = {
            employee_id: staff,
            staff_name: currentUser.name || currentUser.username,
            type: 'Clock Out',
            time: new Date().toISOString(),
            check_out_location: location,
            check_out_lat: this.gpsLocation ? this.gpsLocation.lat : null,
            check_out_lng: this.gpsLocation ? this.gpsLocation.lng : null,
            is_verified: !!this.gpsLocation
        };

        AppApi.insert('attendance', data)
            .then(function() {
                self.toast('✅ 下班打卡成功', 'success');
                self.loadData();
            })
            .catch(function(error) {
                self.toast('❌ 打卡失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 提成审批
    // ============================================================

    window.AttendanceModule.approveCommission = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
            this.toast('只有老板和店长可以审批提成', 'error');
            return;
        }

        // 获取待审批的提成
        AppApi.query('commissions', { filter: { status: 'pending' }, limit: 50 })
            .then(function(pending) {
                if (!pending || pending.length === 0) {
                    self.toast('没有待审批的提成', 'info');
                    return;
                }

                var ids = pending.map(function(c) { return c.id; });
                var updates = ids.map(function(id) {
                    return AppApi.update('commissions', id, {
                        status: 'approved',
                        is_approved: true,
                        approved_by: currentUser.id,
                        approved_at: new Date().toISOString()
                    });
                });

                return Promise.all(updates);
            })
            .then(function() {
                self.toast('✅ 提成已审批', 'success');
                self.loadCommissions();
            })
            .catch(function(error) {
                self.toast('❌ 审批失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 工资管理
    // ============================================================

    window.AttendanceModule.showAddSalary = function() {
        var modal = this.el.addSalaryModal;
        if (modal) {
            modal.classList.remove('hidden');
            this.updateStaffSelect();
            // 设置默认日期范围（本月）
            var now = new Date();
            var firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            var lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            if (this.el.salaryPeriodStart) this.el.salaryPeriodStart.value = firstDay.toISOString().split('T')[0];
            if (this.el.salaryPeriodEnd) this.el.salaryPeriodEnd.value = lastDay.toISOString().split('T')[0];
            if (this.el.salaryBaseAmount) this.el.salaryBaseAmount.value = '';
            if (this.el.salaryCommissionAmount) this.el.salaryCommissionAmount.value = '';
            if (this.el.salaryBonusAmount) this.el.salaryBonusAmount.value = '';
            if (this.el.salaryDeductionAmount) this.el.salaryDeductionAmount.value = '';
        }
    };

    window.AttendanceModule.saveSalaryRecord = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var employeeId = this.el.salaryEmployeeSelect ? this.el.salaryEmployeeSelect.value : '';
        var start = this.el.salaryPeriodStart ? this.el.salaryPeriodStart.value : '';
        var end = this.el.salaryPeriodEnd ? this.el.salaryPeriodEnd.value : '';
        var base = this.el.salaryBaseAmount ? parseFloat(this.el.salaryBaseAmount.value) || 0 : 0;
        var commission = this.el.salaryCommissionAmount ? parseFloat(this.el.salaryCommissionAmount.value) || 0 : 0;
        var bonus = this.el.salaryBonusAmount ? parseFloat(this.el.salaryBonusAmount.value) || 0 : 0;
        var deduction = this.el.salaryDeductionAmount ? parseFloat(this.el.salaryDeductionAmount.value) || 0 : 0;

        if (!employeeId) {
            this.toast('请选择员工', 'error');
            return;
        }
        if (!start || !end) {
            this.toast('请选择日期范围', 'error');
            return;
        }

        var netSalary = base + commission + bonus - deduction;

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        var data = {
            tenant_id: tenant ? tenant.id : null,
            store_id: store ? store.id : null,
            employee_id: employeeId,
            period_start: start,
            period_end: end,
            base_salary: base,
            commission_amount: commission,
            bonus_amount: bonus,
            deduction_amount: deduction,
            net_salary: netSalary,
            status: 'pending',
            created_by: currentUser ? currentUser.id : null
        };

        AppApi.insert('salaries', data)
            .then(function() {
                self.toast('✅ 工资已添加: ' + netSalary.toFixed(2) + ' SAR', 'success');
                self.closeModal('addSalaryModal');
                self.loadSalaries();
            })
            .catch(function(error) {
                self.toast('❌ 添加失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 批量工资处理
    // ============================================================

    window.AttendanceModule.processPayroll = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'owner') {
            this.toast('只有老板可以批量处理工资', 'error');
            return;
        }

        if (!confirm('确认批量处理本月工资？')) return;

        var month = new Date().getMonth() + 1;
        var year = new Date().getFullYear();

        // 获取所有员工
        var users = AppStore.get('allUsers') || [];
        var employees = users.filter(function(u) {
            return u.role !== 'owner' && u.role !== 'admin' && u.status === 'approved';
        });

        if (employees.length === 0) {
            this.toast('暂无员工', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        // 为每个员工创建工资记录
        var promises = employees.map(function(emp) {
            // 计算提成（从订单中计算）
            var orders = AppStore.get('allOrders') || [];
            var empOrders = orders.filter(function(o) {
                return o.employee_id === emp.id && o.date && o.date.startsWith(year + '-' + String(month).padStart(2, '0'));
            });
            var totalRevenue = empOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
            var commissionRate = AppStore.get('config')?.commissionRate || 5;
            var commissionAmount = totalRevenue * commissionRate / 100;

            var start = year + '-' + String(month).padStart(2, '0') + '-01';
            var lastDay = new Date(year, month, 0).getDate();
            var end = year + '-' + String(month).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');

            var baseSalary = 5000; // 默认底薪

            var data = {
                tenant_id: tenant ? tenant.id : null,
                store_id: store ? store.id : null,
                employee_id: emp.id,
                period_start: start,
                period_end: end,
                base_salary: baseSalary,
                commission_amount: commissionAmount,
                bonus_amount: 0,
                deduction_amount: 0,
                net_salary: baseSalary + commissionAmount,
                total_orders: empOrders.length,
                total_revenue: totalRevenue,
                status: 'pending',
                created_by: currentUser.id
            };

            return AppApi.insert('salaries', data);
        });

        Promise.all(promises)
            .then(function() {
                self.toast('✅ 工资批量处理完成', 'success');
                self.loadSalaries();
            })
            .catch(function(error) {
                self.toast('❌ 处理失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 保存门店位置
    // ============================================================

    window.AttendanceModule.saveStoreLocation = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'owner') {
            this.toast('只有老板可以修改门店位置', 'error');
            return;
        }

        var store = AppStore.get('currentStore');
        if (!store) {
            this.toast('请先选择门店', 'error');
            return;
        }

        var lat = this.el.storeLat ? parseFloat(this.el.storeLat.value) : 0;
        var lng = this.el.storeLng ? parseFloat(this.el.storeLng.value) : 0;
        var radius = this.el.storeRadius ? parseInt(this.el.storeRadius.value) || 100 : 100;

        if (!lat || !lng) {
            this.toast('请输入有效的经纬度', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');

        var data = {
            tenant_id: tenant ? tenant.id : null,
            store_id: store.id,
            name: store.name + ' - GPS定位',
            address: store.address || '',
            latitude: lat,
            longitude: lng,
            radius: radius,
            is_active: true
        };

        AppApi.query('store_locations', { filter: { store_id: store.id }, limit: 1 })
            .then(function(existing) {
                if (existing && existing.length > 0) {
                    return AppApi.update('store_locations', existing[0].id, data);
                } else {
                    return AppApi.insert('store_locations', data);
                }
            })
            .then(function() {
                self.toast('✅ 门店位置已保存', 'success');
            })
            .catch(function(error) {
                self.toast('❌ 保存失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 关闭模态框
    // ============================================================

    window.AttendanceModule.closeModal = function(modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    };

    console.log('[Attendance] 模块已注册');
})();