/**
 * vehicle-monitor.js - 车辆监控模块
 * @module vehicle-monitor
 * @description 车辆进出记录、停留时间追踪、实时计数、车牌智能识别
 */

(function() {
    'use strict';

    // ============================================================
    // 1. 安全工具函数
    // ============================================================

    /** 安全获取 AppStore */
    function safeGetStore() {
        if (typeof window.AppStore !== 'undefined') {
            return window.AppStore;
        }
        // 创建模拟 Store
        return {
            get: function(key) {
                try {
                    var data = localStorage.getItem('store_' + key);
                    return data ? JSON.parse(data) : null;
                } catch (e) {
                    return null;
                }
            },
            set: function(key, value) {
                try {
                    localStorage.setItem('store_' + key, JSON.stringify(value));
                } catch (e) {}
            }
        };
    }

    var AppStore = safeGetStore();

    /** 安全获取 ModuleBase */
    var ModuleBase = window.ModuleBase || {
        toast: function(msg, type) {
            var colors = {
                success: '#10B981',
                error: '#EF4444',
                warning: '#F59E0B',
                info: '#3B82F6'
            };
            var toast = document.createElement('div');
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
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
        },
        getEl: function(id) { return document.getElementById(id); }
    };

    // ============================================================
    // 2. 权限检查
    // ============================================================

    function checkPermission() {
        var user = AppStore.get('currentUser');
        if (!user) return false;
        return user.role === 'owner' || user.role === 'admin';
    }

    // ============================================================
    // 3. 模块定义
    // ============================================================

    window.VehicleMonitorModule = Object.create(ModuleBase);
    window.VehicleMonitorModule.moduleName = 'vehicle-monitor';

    // ============================================================
    // 4. 状态
    // ============================================================

    window.VehicleMonitorModule.activeVehicles = [];
    window.VehicleMonitorModule.records = [];
    window.VehicleMonitorModule.autoUpdateInterval = null;
    window.VehicleMonitorModule._lastRecognition = null;
    window.VehicleMonitorModule._isEditMode = false;

    // ============================================================
    // 5. 缓存 DOM
    // ============================================================

    window.VehicleMonitorModule.cacheDom = function() {
        if (!checkPermission()) {
            var container = document.getElementById('moduleContent');
            if (container) {
                container.innerHTML = `
                    <div style="padding:40px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:16px;">🔒</div>
                        <h2 style="color:#EF4444;">权限不足</h2>
                        <p style="color:#6B7280;">此页面仅限老板和系统管理员访问</p>
                        <button onclick="window.location.hash='#/dashboard'" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
                            返回仪表板
                        </button>
                    </div>
                `;
            }
            return;
        }

        this.el = {
            todayTotal: this.getEl('vmTodayTotal'),
            todayIn: this.getEl('vmTodayIn'),
            todayOut: this.getEl('vmTodayOut'),
            currentlyInside: this.getEl('vmCurrentlyInside'),
            avgStayTime: this.getEl('vmAvgStayTime'),
            todayInRate: this.getEl('vmTodayInRate'),
            todayOutRate: this.getEl('vmTodayOutRate'),
            statusText: this.getEl('vmStatusText'),
            recordCount: this.getEl('vmRecordCount'),
            plateInput: this.getEl('vmPlateInput'),
            vehicleType: this.getEl('vmVehicleType'),
            noteInput: this.getEl('vmNoteInput'),
            currentlyInsideList: this.getEl('vmCurrentlyInsideList'),
            recordsList: this.getEl('vmRecordsList'),
            dateFilter: this.getEl('vmDateFilter'),
            searchFilter: this.getEl('vmSearchFilter'),
            detailModal: this.getEl('vmDetailModal'),
            detailContent: this.getEl('vmDetailContent'),
            uploadArea: this.getEl('vmUploadArea'),
            previewContainer: this.getEl('vmPreviewContainer'),
            previewImg: this.getEl('vmPreviewImg'),
            loading: this.getEl('vmLoading'),
            recogStatus: this.getEl('vmRecogStatus'),
            recogPlate: this.getEl('vmRecogPlate'),
            recogPlateColor: this.getEl('vmRecogPlateColor'),
            recogBrand: this.getEl('vmRecogBrand'),
            recogModel: this.getEl('vmRecogModel'),
            recogColor: this.getEl('vmRecogColor'),
            recogConfidence: this.getEl('vmRecogConfidence'),
            recogConfidenceBar: this.getEl('vmRecogConfidenceBar'),
            recogHint: this.getEl('vmRecogHint'),
            saveRecogBtn: this.getEl('vmSaveRecogBtn')
        };

        if (this.el.dateFilter) {
            this.el.dateFilter.value = new Date().toISOString().split('T')[0];
        }
    };

    // ============================================================
    // 6. 绑定事件
    // ============================================================

    window.VehicleMonitorModule.bindEvents = function() {
        var self = this;

        if (this.el.plateInput) {
            this.el.plateInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var plate = this.value.trim().toUpperCase();
                    if (plate) {
                        var existing = self.activeVehicles.find(function(v) {
                            return v.plate === plate && !v.exit_time;
                        });
                        if (existing) {
                            self.quickExit(plate);
                        } else {
                            self.quickEntry(plate);
                        }
                    }
                }
            });
        }

        if (this.el.searchFilter) {
            this.el.searchFilter.addEventListener('input', function() {
                self.filterRecords();
            });
        }

        if (this.el.dateFilter) {
            this.el.dateFilter.addEventListener('change', function() {
                self.filterRecords();
            });
        }

        var placeholder = this.el.uploadArea;
        if (placeholder) {
            placeholder.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderColor = '#4F46E5';
                this.style.background = '#EEF2FF';
            });
            placeholder.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.style.borderColor = '#D1D5DB';
                this.style.background = '#F9FAFB';
            });
            placeholder.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderColor = '#D1D5DB';
                this.style.background = '#F9FAFB';
                var files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    self.processImage(files[0]);
                }
            });
            placeholder.addEventListener('click', function() {
                var input = document.getElementById('vmUploadInput');
                if (input) input.click();
            });
        }
    };

    // ============================================================
    // 7. 数据加载（使用 localStorage 降级）
    // ============================================================

    window.VehicleMonitorModule.loadData = function() {
        if (!checkPermission()) return;
        this.loadRecords();
        this.loadActiveVehicles();
        this.updateStats();
        this.startAutoUpdate();
        this.clearRecognition();
    };

    window.VehicleMonitorModule.loadRecords = function() {
        var today = new Date().toISOString().split('T')[0];
        var all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        this.records = all.filter(function(r) { return r.date === today; });
        this.renderRecords(this.records);
        if (this.el.recordCount) {
            this.el.recordCount.textContent = this.records.length;
        }
        this.updateStats();
    };

    window.VehicleMonitorModule.loadActiveVehicles = function() {
        var today = new Date().toISOString().split('T')[0];
        var all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        this.activeVehicles = all.filter(function(r) {
            return r.date === today && !r.exit_time;
        });
        this.renderActiveVehicles(this.activeVehicles);
    };

    // ============================================================
    // 8. 渲染函数
    // ============================================================

    window.VehicleMonitorModule.renderActiveVehicles = function(vehicles) {
        var list = this.el.currentlyInsideList;
        if (!list) return;

        if (!vehicles || vehicles.length === 0) {
            list.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#9CA3AF;">暂无车辆在场</td></tr>';
            if (this.el.currentlyInside) {
                this.el.currentlyInside.textContent = '0';
            }
            return;
        }

        var html = '';
        var self = this;
        vehicles.forEach(function(v, index) {
            var entryTime = new Date(v.entry_time);
            var now = new Date();
            var duration = Math.floor((now - entryTime) / 1000 / 60);

            var typeLabels = {
                sedan: '🚗 轿车',
                suv: '🚙 SUV',
                truck: '🚛 货车',
                bus: '🚌 客车',
                motorcycle: '🏍️ 摩托车'
            };

            html += '<tr style="border-bottom:1px solid #F3F4F6;">';
            html += '<td style="padding:8px 12px;">' + (index + 1) + '</td>';
            html += '<td style="padding:8px 12px;font-weight:600;">' + (v.plate || 'N/A') + '</td>';
            html += '<td style="padding:8px 12px;">' + (typeLabels[v.vehicle_type] || '🚗 轿车') + '</td>';
            html += '<td style="padding:8px 12px;font-size:13px;">' + entryTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</td>';
            html += '<td style="padding:8px 12px;font-weight:700;color:#F59E0B;">' + self.formatDuration(duration) + '</td>';
            html += '<td style="padding:8px 12px;font-size:13px;color:#6B7280;">' + (v.note || '') + '</td>';
            html += '<td style="padding:8px 12px;">';
            html += '<button onclick="VehicleMonitorModule.quickExit(\'' + v.plate + '\')" style="color:#EF4444;cursor:pointer;border:none;background:transparent;font-size:13px;">离开</button>';
            html += ' | ';
            html += '<button onclick="VehicleMonitorModule.showDetail(\'' + v.id + '\')" style="color:#4F46E5;cursor:pointer;border:none;background:transparent;font-size:13px;">详情</button>';
            html += '</td>';
            html += '</tr>';
        });

        list.innerHTML = html;

        if (this.el.currentlyInside) {
            this.el.currentlyInside.textContent = vehicles.length;
        }
    };

    window.VehicleMonitorModule.renderRecords = function(records) {
        var list = this.el.recordsList;
        if (!list) return;

        if (!records || records.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#9CA3AF;">暂无记录</td></tr>';
            return;
        }

        var directionLabels = {
            in: '📥 进入',
            out: '📤 离开'
        };
        var directionColors = {
            in: 'color:#10B981;',
            out: 'color:#EF4444;'
        };
        var typeLabels = {
            sedan: '🚗 轿车',
            suv: '🚙 SUV',
            truck: '🚛 货车',
            bus: '🚌 客车',
            motorcycle: '🏍️ 摩托车'
        };

        var html = '';
        var self = this;
        records.slice(0, 50).forEach(function(r) {
            var time = r.entry_time ? new Date(r.entry_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-';
            html += '<tr style="border-bottom:1px solid #F3F4F6;">';
            html += '<td style="padding:8px 12px;font-size:13px;">' + time + '</td>';
            html += '<td style="padding:8px 12px;font-weight:600;">' + (r.plate || 'N/A') + '</td>';
            html += '<td style="padding:8px 12px;">' + (typeLabels[r.vehicle_type] || '🚗 轿车') + '</td>';
            html += '<td style="padding:8px 12px;' + (directionColors[r.direction] || '') + '">' + (directionLabels[r.direction] || r.direction) + '</td>';
            html += '<td style="padding:8px 12px;">' + (r.direction === 'out' ? self.formatDuration(r.duration_minutes) : '-') + '</td>';
            html += '<td style="padding:8px 12px;font-size:13px;color:#6B7280;">' + (r.note || '') + '</td>';
            html += '</tr>';
        });

        list.innerHTML = html;
    };

    // ============================================================
    // 9. 统计更新
    // ============================================================

    window.VehicleMonitorModule.updateStats = function() {
        var records = this.records || [];
        var totalIn = records.filter(function(r) { return r.direction === 'in'; }).length;
        var totalOut = records.filter(function(r) { return r.direction === 'out'; }).length;
        var total = totalIn + totalOut;

        var completed = records.filter(function(r) {
            return r.direction === 'out' && r.duration_minutes;
        });
        var avgDuration = 0;
        if (completed.length > 0) {
            var sum = completed.reduce(function(s, r) { return s + (r.duration_minutes || 0); }, 0);
            avgDuration = Math.round(sum / completed.length);
        }

        var currentlyInside = totalIn - totalOut;
        var inRate = total > 0 ? Math.round(totalIn / total * 100) : 0;
        var outRate = total > 0 ? Math.round(totalOut / total * 100) : 0;

        if (this.el.todayTotal) this.el.todayTotal.textContent = total;
        if (this.el.todayIn) this.el.todayIn.textContent = totalIn;
        if (this.el.todayOut) this.el.todayOut.textContent = totalOut;
        if (this.el.currentlyInside) this.el.currentlyInside.textContent = currentlyInside;
        if (this.el.avgStayTime) this.el.avgStayTime.textContent = avgDuration;
        if (this.el.todayInRate) this.el.todayInRate.textContent = inRate + '%';
        if (this.el.todayOutRate) this.el.todayOutRate.textContent = outRate + '%';
    };

    // ============================================================
    // 10. 工具函数
    // ============================================================

    window.VehicleMonitorModule.formatDuration = function(minutes) {
        if (!minutes || minutes < 0) return '0分钟';
        if (minutes < 60) return minutes + '分钟';
        var hours = Math.floor(minutes / 60);
        var mins = minutes % 60;
        if (mins === 0) return hours + '小时';
        return hours + '小时' + mins + '分钟';
    };

    window.VehicleMonitorModule.toast = function(message, type) {
        var colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        var toast = document.createElement('div');
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
    };

    // ============================================================
    // 11. 快捷操作
    // ============================================================

    window.VehicleMonitorModule.quickEntry = function(plate) {
        var self = this;
        var vehicleType = this.el.vehicleType ? this.el.vehicleType.value : 'sedan';
        var note = this.el.noteInput ? this.el.noteInput.value.trim() : '';
        var now = new Date();
        var today = now.toISOString().split('T')[0];
        var id = 'veh_' + Date.now();

        var record = {
            id: id,
            plate: plate || 'UNKNOWN',
            vehicle_type: vehicleType,
            direction: 'in',
            date: today,
            entry_time: now.toISOString(),
            exit_time: null,
            duration_minutes: null,
            note: note,
            created_at: now.toISOString()
        };

        this.records.push(record);
        this.activeVehicles.push(record);
        this.saveToLocal();

        this.toast('📥 车辆 ' + (record.plate) + ' 已进入', 'success');

        if (this.el.plateInput) this.el.plateInput.value = '';
        if (this.el.noteInput) this.el.noteInput.value = '';
        if (this.el.vehicleType) this.el.vehicleType.value = 'sedan';

        this.refresh();
    };

    window.VehicleMonitorModule.quickExit = function(plate) {
        var self = this;

        var index = this.activeVehicles.findIndex(function(v) {
            return v.plate === plate && !v.exit_time;
        });

        if (index < 0) {
            this.toast('⚠️ 车辆 ' + plate + ' 不在场内', 'warning');
            return;
        }

        var vehicle = this.activeVehicles[index];
        var now = new Date();
        var entryTime = new Date(vehicle.entry_time);
        var duration = Math.floor((now - entryTime) / 1000 / 60);

        vehicle.exit_time = now.toISOString();
        vehicle.duration_minutes = duration;

        this.activeVehicles.splice(index, 1);

        var recordIndex = this.records.findIndex(function(r) { return r.id === vehicle.id; });
        if (recordIndex >= 0) {
            this.records[recordIndex] = vehicle;
        }

        this.saveToLocal();

        this.toast('📤 车辆 ' + plate + ' 已离开，停留 ' + this.formatDuration(duration), 'success');

        if (this.el.plateInput) this.el.plateInput.value = '';

        this.refresh();
    };

    // ============================================================
    // 12. 保存到本地
    // ============================================================

    window.VehicleMonitorModule.saveToLocal = function() {
        var all = JSON.parse(localStorage.getItem('vehicle_records') || '[]');
        this.records.forEach(function(r) {
            var existing = all.findIndex(function(a) { return a.id === r.id; });
            if (existing >= 0) {
                all[existing] = r;
            } else {
                all.push(r);
            }
        });
        localStorage.setItem('vehicle_records', JSON.stringify(all));
    };

    // ============================================================
    // 13. 图片识别（模拟）
    // ============================================================

    window.VehicleMonitorModule.processImage = function(file) {
        if (!file.type.startsWith('image/')) {
            this.toast('❌ 请上传图片文件', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.toast('❌ 图片大小不能超过10MB', 'error');
            return;
        }

        var self = this;
        var reader = new FileReader();
        reader.onload = function(e) {
            var imageData = e.target.result;
            self.showPreview(imageData);
            self.callRecognizeAPI(imageData);
        };
        reader.readAsDataURL(file);
    };

    window.VehicleMonitorModule.showPreview = function(imageData) {
        if (this.el.previewImg) {
            this.el.previewImg.src = imageData;
        }
        if (this.el.previewContainer) {
            this.el.previewContainer.style.display = 'block';
        }
        if (this.el.uploadArea) {
            this.el.uploadArea.style.display = 'none';
        }
        if (this.el.loading) {
            this.el.loading.style.display = 'block';
        }
        if (this.el.recogStatus) {
            this.el.recogStatus.textContent = '⏳ AI识别中...';
            this.el.recogStatus.className = 'vm-result-status';
            this.el.recogStatus.style.color = '#3B82F6';
        }
    };

    window.VehicleMonitorModule.callRecognizeAPI = function(imageData) {
        var self = this;
        setTimeout(function() {
            var mockResults = [
                { plate: 'ABC 1234', plateColor: '白色', brand: 'Toyota', model: 'Camry', color: '白色', confidence: 0.96 },
                { plate: 'XYZ 5678', plateColor: '黄色', brand: 'Honda', model: 'Accord', color: '黑色', confidence: 0.94 },
                { plate: 'DEF 9012', plateColor: '蓝色', brand: 'Nissan', model: 'Altima', color: '银色', confidence: 0.92 },
                { plate: 'GHI 3456', plateColor: '白色', brand: 'Hyundai', model: 'Sonata', color: '白色', confidence: 0.95 },
                { plate: 'JKL 7890', plateColor: '绿色', brand: 'Mercedes', model: 'E-Class', color: '黑色', confidence: 0.93 }
            ];

            var randomIndex = Math.floor(Math.random() * mockResults.length);
            var result = mockResults[randomIndex];
            result.confidence = 0.85 + Math.random() * 0.14;

            self.displayRecognitionResult(result);
        }, 1500 + Math.random() * 1000);
    };

    window.VehicleMonitorModule.displayRecognitionResult = function(result) {
        if (this.el.loading) {
            this.el.loading.style.display = 'none';
        }
        if (this.el.recogStatus) {
            this.el.recogStatus.textContent = '✅ 识别完成，请确认信息';
            this.el.recogStatus.className = 'vm-result-status';
            this.el.recogStatus.style.color = '#10B981';
        }

        if (this.el.recogPlate) this.el.recogPlate.value = result.plate || '';
        if (this.el.recogPlateColor) this.el.recogPlateColor.value = result.plateColor || '';
        if (this.el.recogBrand) this.el.recogBrand.value = result.brand || '';
        if (this.el.recogModel) this.el.recogModel.value = result.model || '';
        if (this.el.recogColor) this.el.recogColor.value = result.color || '';

        var confidence = Math.round((result.confidence || 0) * 100);
        if (this.el.recogConfidence) {
            this.el.recogConfidence.textContent = confidence + '%';
        }
        if (this.el.recogConfidenceBar) {
            this.el.recogConfidenceBar.style.width = Math.min(confidence, 100) + '%';
        }

        if (this.el.recogHint) {
            if (confidence >= 90) {
                this.el.recogHint.textContent = '✅ 置信度较高，建议直接保存';
                this.el.recogHint.style.color = '#10B981';
            } else if (confidence >= 70) {
                this.el.recogHint.textContent = '⚠️ 置信度一般，建议核对后保存';
                this.el.recogHint.style.color = '#F59E0B';
            } else {
                this.el.recogHint.textContent = '❌ 置信度较低，建议修正后保存';
                this.el.recogHint.style.color = '#EF4444';
            }
        }

        if (this.el.saveRecogBtn) {
            this.el.saveRecogBtn.disabled = false;
        }
        this._lastRecognition = result;
        this._isEditMode = false;
    };

    window.VehicleMonitorModule.enableEdit = function() {
        this._isEditMode = true;
        var inputs = ['recogPlate', 'recogBrand', 'recogModel', 'recogColor'];
        inputs.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.readOnly = false;
                el.disabled = false;
                el.style.borderColor = '#93C5FD';
                el.style.background = 'white';
            }
        });
        var select = document.getElementById('recogPlateColor');
        if (select) {
            select.disabled = false;
            select.style.borderColor = '#93C5FD';
            select.style.background = 'white';
        }

        if (this.el.recogStatus) {
            this.el.recogStatus.textContent = '✏️ 手动修正模式，修改后点击保存';
            this.el.recogStatus.style.color = '#F59E0B';
        }
        if (this.el.recogHint) {
            this.el.recogHint.textContent = '✏️ 请修正识别结果后点击保存';
            this.el.recogHint.style.color = '#F59E0B';
        }
        this.toast('✏️ 已进入修正模式，请修改后保存', 'info');
    };

    window.VehicleMonitorModule.saveRecognizedVehicle = function() {
        var plate = this.el.recogPlate ? this.el.recogPlate.value.trim().toUpperCase() : '';
        if (!plate) {
            this.toast('❌ 车牌号码不能为空', 'error');
            return;
        }

        var existing = this.activeVehicles.find(function(v) {
            return v.plate === plate && !v.exit_time;
        });
        if (existing) {
            this.toast('⚠️ 车辆 ' + plate + ' 已在场内，无需重复录入', 'warning');
            return;
        }

        var note = this._isEditMode ? '已手动修正' : 'AI识别';
        var now = new Date();
        var today = now.toISOString().split('T')[0];

        var record = {
            id: 'veh_' + Date.now(),
            plate: plate,
            vehicle_type: 'sedan',
            direction: 'in',
            date: today,
            entry_time: now.toISOString(),
            exit_time: null,
            duration_minutes: null,
            note: note,
            created_at: now.toISOString()
        };

        this.records.push(record);
        this.activeVehicles.push(record);
        this.saveToLocal();

        this.toast('✅ 车辆记录已保存', 'success');
        this.clearRecognition();
        this.refresh();
    };

    window.VehicleMonitorModule.clearRecognition = function() {
        if (this.el.previewContainer) {
            this.el.previewContainer.style.display = 'none';
        }
        if (this.el.uploadArea) {
            this.el.uploadArea.style.display = 'flex';
        }
        if (this.el.loading) {
            this.el.loading.style.display = 'none';
        }
        if (this.el.recogPlate) this.el.recogPlate.value = '';
        if (this.el.recogPlateColor) this.el.recogPlateColor.value = '';
        if (this.el.recogBrand) this.el.recogBrand.value = '';
        if (this.el.recogModel) this.el.recogModel.value = '';
        if (this.el.recogColor) this.el.recogColor.value = '';
        if (this.el.recogConfidence) this.el.recogConfidence.textContent = '--%';
        if (this.el.recogConfidenceBar) this.el.recogConfidenceBar.style.width = '0%';
        if (this.el.recogStatus) {
            this.el.recogStatus.textContent = '等待识别...';
            this.el.recogStatus.style.color = '#6B7280';
        }
        if (this.el.recogHint) {
            this.el.recogHint.textContent = '';
        }
        if (this.el.saveRecogBtn) {
            this.el.saveRecogBtn.disabled = true;
        }

        var inputs = ['recogPlate', 'recogBrand', 'recogModel', 'recogColor'];
        inputs.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.readOnly = true;
                el.disabled = true;
                el.style.borderColor = '#D1D5DB';
                el.style.background = '#F9FAFB';
            }
        });
        var select = document.getElementById('recogPlateColor');
        if (select) {
            select.disabled = true;
            select.style.borderColor = '#D1D5DB';
            select.style.background = '#F9FAFB';
        }

        this._lastRecognition = null;
        this._isEditMode = false;
    };

    // ============================================================
    // 14. 其他功能
    // ============================================================

    window.VehicleMonitorModule.showDetail = function(recordId) {
        var record = this.records.find(function(r) { return r.id === recordId; });
        if (!record) {
            this.toast('记录不存在', 'error');
            return;
        }

        var modal = this.el.detailModal;
        var content = this.el.detailContent;
        if (!modal || !content) return;

        var typeLabels = {
            sedan: '🚗 轿车',
            suv: '🚙 SUV',
            truck: '🚛 货车',
            bus: '🚌 客车',
            motorcycle: '🏍️ 摩托车'
        };
        var directionLabels = {
            in: '📥 进入',
            out: '📤 离开'
        };

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:#F9FAFB;border-radius:8px;">';
        html += '<div><span style="color:#6B7280;">车牌</span><br><span style="font-weight:700;">' + (record.plate || 'N/A') + '</span></div>';
        html += '<div><span style="color:#6B7280;">类型</span><br><span>' + (typeLabels[record.vehicle_type] || '🚗 轿车') + '</span></div>';
        html += '<div><span style="color:#6B7280;">方向</span><br><span style="' + (record.direction === 'in' ? 'color:#10B981;' : 'color:#EF4444;') + '">' + (directionLabels[record.direction] || record.direction) + '</span></div>';
        html += '<div><span style="color:#6B7280;">日期</span><br><span>' + (record.date || '-') + '</span></div>';
        html += '<div><span style="color:#6B7280;">进入时间</span><br><span>' + (record.entry_time ? new Date(record.entry_time).toLocaleString('zh-CN') : '-') + '</span></div>';
        html += '<div><span style="color:#6B7280;">离开时间</span><br><span>' + (record.exit_time ? new Date(record.exit_time).toLocaleString('zh-CN') : '🟢 仍在场内') + '</span></div>';
        html += '<div style="grid-column:span 2;"><span style="color:#6B7280;">停留时长</span><br><span style="font-weight:700;color:#F59E0B;">' + (record.duration_minutes ? this.formatDuration(record.duration_minutes) : '计算中...') + '</span></div>';
        html += '<div style="grid-column:span 2;"><span style="color:#6B7280;">备注</span><br><span>' + (record.note || '无') + '</span></div>';
        html += '</div>';

        content.innerHTML = html;
        modal.style.display = 'flex';
    };

    window.VehicleMonitorModule.closeDetail = function() {
        var modal = this.el.detailModal;
        if (modal) modal.style.display = 'none';
    };

    window.VehicleMonitorModule.filterRecords = function() {
        var date = this.el.dateFilter ? this.el.dateFilter.value : '';
        var search = this.el.searchFilter ? this.el.searchFilter.value.trim().toLowerCase() : '';

        var filtered = this.records;
        if (date) {
            filtered = filtered.filter(function(r) { return r.date === date; });
        }
        if (search) {
            filtered = filtered.filter(function(r) {
                return (r.plate || '').toLowerCase().includes(search);
            });
        }
        this.renderRecords(filtered);
    };

    window.VehicleMonitorModule.exportData = function() {
        var records = this.records || [];
        if (records.length === 0) {
            this.toast('暂无数据可导出', 'error');
            return;
        }

        var data = [['日期', '时间', '车牌', '类型', '方向', '停留时长(分钟)', '备注']];
        records.forEach(function(r) {
            var time = r.entry_time ? new Date(r.entry_time).toLocaleString('zh-CN') : '';
            var typeLabels = {
                sedan: '轿车',
                suv: 'SUV',
                truck: '货车',
                bus: '客车',
                motorcycle: '摩托车'
            };
            var directionLabels = {
                in: '进入',
                out: '离开'
            };
            data.push([
                r.date || '',
                time,
                r.plate || '',
                typeLabels[r.vehicle_type] || '轿车',
                directionLabels[r.direction] || r.direction,
                r.duration_minutes || '',
                r.note || ''
            ]);
        });

        var csvContent = data.map(function(row) {
            return row.join(',');
        }).join('\n');

        var blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        var today = new Date().toISOString().split('T')[0];
        link.download = '车辆监控_' + today + '.csv';
        link.click();
        this.toast('✅ 数据已导出', 'success');
    };

    window.VehicleMonitorModule.refresh = function() {
        this.loadRecords();
        this.loadActiveVehicles();
        this.updateStats();
        this.toast('✅ 数据已刷新', 'success');
    };

    // ============================================================
    // 15. 自动更新
    // ============================================================

    window.VehicleMonitorModule.startAutoUpdate = function() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
        this.autoUpdateInterval = setInterval(function() {
            this.loadActiveVehicles();
            this.updateStats();
        }.bind(this), 30000);
    };

    window.VehicleMonitorModule.destroy = function() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
        }
        this.initialized = false;
    };

    // ============================================================
    // 16. 拍照/上传
    // ============================================================

    window.VehicleMonitorModule.takePhoto = function() {
        var input = document.getElementById('vmCameraInput');
        if (input) {
            var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);
            if (isMobile) {
                input.setAttribute('capture', 'environment');
            } else {
                input.removeAttribute('capture');
            }
            input.click();
        } else {
            this.toast('❌ 无法打开相机', 'error');
        }
    };

    window.VehicleMonitorModule.uploadPhoto = function() {
        var input = document.getElementById('vmUploadInput');
        if (input) {
            input.click();
        } else {
            this.toast('❌ 无法打开文件选择器', 'error');
        }
    };

    window.VehicleMonitorModule.handleCameraCapture = function(event) {
        var file = event.target.files[0];
        if (!file) return;
        this.processImage(file);
        event.target.value = '';
    };

    window.VehicleMonitorModule.handleUploadSelect = function(event) {
        var file = event.target.files[0];
        if (!file) return;
        this.processImage(file);
        event.target.value = '';
    };

    // ============================================================
    // 17. 初始化
    // ============================================================

    var initialized = false;

    function initModule() {
        if (initialized) return;
        initialized = true;

        if (typeof VehicleMonitorModule !== 'undefined') {
            VehicleMonitorModule.cacheDom();
            VehicleMonitorModule.bindEvents();
            VehicleMonitorModule.loadData();
            console.log('✅ Vehicle Monitor 模块已初始化');
        } else {
            console.warn('⚠️ VehicleMonitorModule 未定义');
        }
    }

    // DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initModule, 300);
        });
    } else {
        setTimeout(initModule, 300);
    }

    console.log('[VehicleMonitor] 模块已加载');
})();