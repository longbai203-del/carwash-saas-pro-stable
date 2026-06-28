/**
 * reports.js - 财务管理模块（完整财务系统）
 */
(function() {
    'use strict';

    window.ReportsModule = Object.create(ModuleBase);
    window.ReportsModule.moduleName = 'reports';

    // ===== 缓存 DOM =====
    window.ReportsModule.cacheDom = function() {
        this.el = {
            // 财务概览
            financeTotalIncome: document.getElementById('financeTotalIncome'),
            financeTotalExpense: document.getElementById('financeTotalExpense'),
            financeNetProfit: document.getElementById('financeNetProfit'),
            financeCommissionTotal: document.getElementById('financeCommissionTotal'),
            // 现金流
            cashFlowList: document.getElementById('cashFlowList'),
            cashFlowIncome: document.getElementById('cashFlowIncome'),
            cashFlowExpense: document.getElementById('cashFlowExpense'),
            cashFlowPeriod: document.getElementById('cashFlowPeriod'),
            // 工资
            salaryList: document.getElementById('salaryList'),
            // 每日结算
            dailyClosingList: document.getElementById('dailyClosingList'),
            // 月度报表
            monthlyReportContent: document.getElementById('monthlyReportContent'),
            monthlyReportDate: document.getElementById('monthlyReportDate'),
            // 模态框
            cashFlowModal: document.getElementById('cashFlowModal'),
            cashFlowType: document.getElementById('cashFlowType'),
            cashFlowAmount: document.getElementById('cashFlowAmount'),
            cashFlowCategory: document.getElementById('cashFlowCategory'),
            cashFlowDesc: document.getElementById('cashFlowDesc'),
            salaryModal: document.getElementById('salaryModal'),
            salaryEmployee: document.getElementById('salaryEmployee'),
            salaryStart: document.getElementById('salaryStart'),
            salaryEnd: document.getElementById('salaryEnd'),
            salaryBase: document.getElementById('salaryBase'),
            salaryCommission: document.getElementById('salaryCommission'),
            salaryBonus: document.getElementById('salaryBonus'),
            salaryDeduction: document.getElementById('salaryDeduction'),
            salaryNotes: document.getElementById('salaryNotes')
        };
    };

    // ===== 绑定事件 =====
    window.ReportsModule.bindEvents = function() {
        var self = this;
        if (this.el.cashFlowPeriod) {
            this.el.cashFlowPeriod.addEventListener('change', function() { self.loadCashFlow(); });
        }
        if (this.el.monthlyReportDate) {
            this.el.monthlyReportDate.addEventListener('change', function() { self.loadMonthlyReport(); });
        }
    };

    // ============================================================
    // 加载财务数据
    // ============================================================

    window.ReportsModule.loadData = function() {
        this.loadFinancialOverview();
        this.loadCashFlow();
        this.loadSalaries();
        this.loadDailyClosing();
        this.loadMonthlyReport();

        // 设置月度报表默认值
        if (this.el.monthlyReportDate) {
            var now = new Date();
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var year = now.getFullYear();
            this.el.monthlyReportDate.value = year + '-' + month;
        }
    };

    // ============================================================
    // 财务概览
    // ============================================================

    window.ReportsModule.loadFinancialOverview = function() {
        var self = this;
        var orders = this.getData('allOrders') || [];
        var expenses = this.getData('allExpenses') || [];

        var totalIncome = orders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var totalExpense = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
        var netProfit = totalIncome - totalExpense;

        // 计算提成（假设提成率为5%）
        var commissionTotal = totalIncome * 0.05;

        if (this.el.financeTotalIncome) this.el.financeTotalIncome.textContent = totalIncome.toFixed(2) + ' SAR';
        if (this.el.financeTotalExpense) this.el.financeTotalExpense.textContent = totalExpense.toFixed(2) + ' SAR';
        if (this.el.financeNetProfit) this.el.financeNetProfit.textContent = netProfit.toFixed(2) + ' SAR';
        if (this.el.financeCommissionTotal) this.el.financeCommissionTotal.textContent = commissionTotal.toFixed(2) + ' SAR';
    };

    // ============================================================
    // 现金流
    // ============================================================

    window.ReportsModule.loadCashFlow = function() {
        var self = this;
        var period = this.el.cashFlowPeriod ? this.el.cashFlowPeriod.value : 'today';
        var today = new Date().toISOString().split('T')[0];
        var now = new Date();
        var startDate = today;

        if (period === 'week') {
            var d = new Date(now);
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString().split('T')[0];
        } else if (period === 'month') {
            var d = new Date(now);
            d.setDate(1);
            startDate = d.toISOString().split('T')[0];
        } else if (period === 'all') {
            startDate = '2020-01-01';
        }

        // 获取订单作为收入
        var orders = this.getData('allOrders') || [];
        var incomes = orders.filter(function(o) {
            return o.date >= startDate;
        });

        // 获取费用作为支出
        var expenses = this.getData('allExpenses') || [];
        var expenseItems = expenses.filter(function(e) {
            return e.expense_date >= startDate;
        });

        // 合并数据
        var items = [];
        incomes.forEach(function(o) {
            items.push({
                type: 'income',
                amount: o.total || 0,
                description: '订单 #' + (o.order_number || o.id.slice(0, 8)),
                date: o.date,
                category: '销售',
                id: o.id
            });
        });
        expenseItems.forEach(function(e) {
            items.push({
                type: 'expense',
                amount: e.amount || 0,
                description: e.description || '费用支出',
                date: e.expense_date,
                category: e.category_name || '其他',
                id: e.id
            });
        });

        items.sort(function(a, b) { return b.date < a.date; });

        var totalIncome = incomes.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var totalExpense = expenseItems.reduce(function(s, e) { return s + (e.amount || 0); }, 0);

        this.renderCashFlow(items, totalIncome, totalExpense);
    };

    window.ReportsModule.renderCashFlow = function(items, totalIncome, totalExpense) {
        var list = this.el.cashFlowList;
        if (!list) return;

        if (!items || items.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无现金流记录</div>';
            if (this.el.cashFlowIncome) this.el.cashFlowIncome.textContent = '0 SAR';
            if (this.el.cashFlowExpense) this.el.cashFlowExpense.textContent = '0 SAR';
            return;
        }

        var html = '';
        items.slice(0, 30).forEach(function(item) {
            var isIncome = item.type === 'income';
            var color = isIncome ? 'text-green-600' : 'text-red-600';
            var sign = isIncome ? '+' : '-';
            html += '<div class="flex justify-between items-center p-1 border-b hover:bg-gray-50">';
            html += '<div><span class="text-xs text-gray-400">' + item.date + '</span>';
            html += '<span class="ml-2">' + item.description + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + item.category + '</span></div>';
            html += '<div class="font-bold ' + color + '">' + sign + (item.amount || 0).toFixed(2) + ' SAR</div>';
            html += '</div>';
        });
        list.innerHTML = html;

        if (this.el.cashFlowIncome) this.el.cashFlowIncome.textContent = totalIncome.toFixed(2) + ' SAR';
        if (this.el.cashFlowExpense) this.el.cashFlowExpense.textContent = totalExpense.toFixed(2) + ' SAR';
    };

    // ============================================================
    // 添加现金流
    // ============================================================

    window.ReportsModule.showAddCashFlow = function() {
        var modal = this.el.cashFlowModal;
        if (modal) {
            modal.classList.remove('hidden');
            if (this.el.cashFlowAmount) this.el.cashFlowAmount.value = '';
            if (this.el.cashFlowDesc) this.el.cashFlowDesc.value = '';
        }
    };

    window.ReportsModule.saveCashFlow = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var type = this.el.cashFlowType ? this.el.cashFlowType.value : 'income';
        var amount = this.el.cashFlowAmount ? parseFloat(this.el.cashFlowAmount.value) || 0 : 0;
        var category = this.el.cashFlowCategory ? this.el.cashFlowCategory.value : 'other';
        var desc = this.el.cashFlowDesc ? this.el.cashFlowDesc.value.trim() : '';

        if (amount <= 0) {
            this.toast('请输入有效金额', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        var data = {
            tenant_id: tenant ? tenant.id : null,
            store_id: store ? store.id : null,
            flow_type: type,
            category: category,
            amount: amount,
            description: desc || (type === 'income' ? '收入' : '支出'),
            transaction_date: new Date().toISOString().split('T')[0],
            created_by: currentUser ? currentUser.id : null
        };

        AppApi.insert('cash_flow', data)
            .then(function() {
                self.toast('✅ 现金流已添加', 'success');
                self.closeModal('cashFlowModal');
                self.loadCashFlow();
                self.loadFinancialOverview();
            })
            .catch(function(error) {
                self.toast('❌ 添加失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 员工工资
    // ============================================================

    window.ReportsModule.loadSalaries = function() {
        var self = this;
        AppApi.query('salaries', { order: { by: 'created_at', ascending: false }, limit: 50 })
            .then(function(data) {
                self.renderSalaries(data || []);
                self.updateSalaryEmployeeSelect();
            })
            .catch(function(error) {
                console.error('[Reports] 加载工资失败:', error);
            });
    };

    window.ReportsModule.renderSalaries = function(salaries) {
        var list = this.el.salaryList;
        if (!list) return;

        if (!salaries || salaries.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无工资记录</div>';
            return;
        }

        var users = this.getData('allUsers') || [];
        var statusMap = { pending: '⏳ 待审核', approved: '✅ 已审核', paid: '💰 已发放', cancelled: '❌ 已取消' };

        var html = '';
        salaries.slice(0, 20).forEach(function(s) {
            var employee = users.find(function(u) { return u.id === s.employee_id; });
            var name = employee ? employee.name || employee.username : '未知';
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

    window.ReportsModule.updateSalaryEmployeeSelect = function() {
        var sel = this.el.salaryEmployee;
        if (!sel) return;
        var users = this.getData('allUsers') || [];
        var html = '';
        users.filter(function(u) { return u.role !== 'owner'; }).forEach(function(u) {
            html += '<option value="' + u.id + '">' + (u.name || u.username) + ' (' + u.role + ')</option>';
        });
        sel.innerHTML = html || '<option value="">暂无员工</option>';
    };

    window.ReportsModule.showAddSalary = function() {
        var modal = this.el.salaryModal;
        if (modal) {
            modal.classList.remove('hidden');
            this.updateSalaryEmployeeSelect();
            // 设置默认日期范围（本月）
            var now = new Date();
            var firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            var lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            if (this.el.salaryStart) this.el.salaryStart.value = firstDay.toISOString().split('T')[0];
            if (this.el.salaryEnd) this.el.salaryEnd.value = lastDay.toISOString().split('T')[0];
            if (this.el.salaryBase) this.el.salaryBase.value = '';
            if (this.el.salaryCommission) this.el.salaryCommission.value = '';
            if (this.el.salaryBonus) this.el.salaryBonus.value = '';
            if (this.el.salaryDeduction) this.el.salaryDeduction.value = '';
            if (this.el.salaryNotes) this.el.salaryNotes.value = '';
        }
    };

    window.ReportsModule.saveSalary = function() {
        var self = this;
        var currentUser = this.getCurrentUser();

        var employeeId = this.el.salaryEmployee ? this.el.salaryEmployee.value : '';
        var start = this.el.salaryStart ? this.el.salaryStart.value : '';
        var end = this.el.salaryEnd ? this.el.salaryEnd.value : '';
        var base = this.el.salaryBase ? parseFloat(this.el.salaryBase.value) || 0 : 0;
        var commission = this.el.salaryCommission ? parseFloat(this.el.salaryCommission.value) || 0 : 0;
        var bonus = this.el.salaryBonus ? parseFloat(this.el.salaryBonus.value) || 0 : 0;
        var deduction = this.el.salaryDeduction ? parseFloat(this.el.salaryDeduction.value) || 0 : 0;
        var notes = this.el.salaryNotes ? this.el.salaryNotes.value.trim() : '';

        if (!employeeId) {
            this.toast('请选择员工', 'error');
            return;
        }
        if (!start || !end) {
            this.toast('请选择日期范围', 'error');
            return;
        }

        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        var netSalary = base + commission + bonus - deduction;

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
            notes: notes,
            status: 'pending',
            created_by: currentUser ? currentUser.id : null
        };

        AppApi.insert('salaries', data)
            .then(function() {
                self.toast('✅ 工资已添加: ' + netSalary.toFixed(2) + ' SAR', 'success');
                self.closeModal('salaryModal');
                self.loadSalaries();
            })
            .catch(function(error) {
                self.toast('❌ 添加失败: ' + error.message, 'error');
            });
    };

    // ============================================================
    // 每日结算
    // ============================================================

    window.ReportsModule.loadDailyClosing = function() {
        var self = this;
        AppApi.query('daily_closing', { order: { by: 'closing_date', ascending: false }, limit: 30 })
            .then(function(data) {
                self.renderDailyClosing(data || []);
            })
            .catch(function(error) {
                console.error('[Reports] 加载每日结算失败:', error);
            });
    };

    window.ReportsModule.renderDailyClosing = function(closings) {
        var list = this.el.dailyClosingList;
        if (!list) return;

        if (!closings || closings.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-4">暂无结算记录</div>';
            return;
        }

        var statusMap = { open: '🟡 未结算', closed: '✅ 已结算', verified: '🔵 已审核' };

        var html = '';
        closings.forEach(function(c) {
            html += '<div class="flex justify-between items-center p-2 border-b hover:bg-gray-50">';
            html += '<div><span class="font-medium">' + c.closing_date + '</span>';
            html += '<span class="text-xs text-gray-400 ml-2">' + (statusMap[c.status] || c.status) + '</span></div>';
            html += '<div class="flex items-center gap-3">';
            html += '<span class="text-green-600">收入: ' + (c.total_sales || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="text-red-600">支出: ' + (c.total_expenses || 0).toFixed(2) + ' SAR</span>';
            html += '<span class="font-bold text-blue-600">利润: ' + (c.net_profit || 0).toFixed(2) + ' SAR</span>';
            html += '</div></div>';
        });
        list.innerHTML = html;
    };

    window.ReportsModule.generateDailyClosing = function() {
        var self = this;
        var currentUser = this.getCurrentUser();
        var today = new Date().toISOString().split('T')[0];
        var tenant = AppStore.get('currentTenant');
        var store = AppStore.get('currentStore');

        // 检查今天是否已结算
        AppApi.query('daily_closing', { filter: { closing_date: today, store_id: store ? store.id : null } })
            .then(function(existing) {
                if (existing && existing.length > 0) {
                    if (existing[0].status === 'closed') {
                        self.toast('今日已结算', 'warning');
                        return;
                    }
                    // 更新结算
                    return self.updateClosing(existing[0].id);
                } else {
                    // 创建新结算
                    return self.createClosing(today, tenant, store, currentUser);
                }
            })
            .then(function() {
                self.loadDailyClosing();
                self.loadFinancialOverview();
            })
            .catch(function(error) {
                self.toast('❌ 结算失败: ' + error.message, 'error');
            });
    };

    window.ReportsModule.createClosing = function(date, tenant, store, user) {
        var orders = this.getData('allOrders') || [];
        var expenses = this.getData('allExpenses') || [];

        var dayOrders = orders.filter(function(o) { return o.date === date; });
        var dayExpenses = expenses.filter(function(e) { return e.expense_date === date; });

        var totalSales = dayOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var totalExpenses = dayExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
        var netProfit = totalSales - totalExpenses;

        var data = {
            tenant_id: tenant ? tenant.id : null,
            store_id: store ? store.id : null,
            closing_date: date,
            opened_by: user ? user.id : null,
            opening_balance: 0,
            total_sales: totalSales,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            status: 'closed',
            closed_by: user ? user.id : null,
            closed_at: new Date().toISOString()
        };

        return AppApi.insert('daily_closing', data);
    };

    window.ReportsModule.updateClosing = function(closingId) {
        var date = new Date().toISOString().split('T')[0];
        var orders = this.getData('allOrders') || [];
        var expenses = this.getData('allExpenses') || [];

        var dayOrders = orders.filter(function(o) { return o.date === date; });
        var dayExpenses = expenses.filter(function(e) { return e.expense_date === date; });

        var totalSales = dayOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var totalExpenses = dayExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
        var netProfit = totalSales - totalExpenses;

        return AppApi.update('daily_closing', closingId, {
            total_sales: totalSales,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            status: 'closed',
            closed_at: new Date().toISOString()
        });
    };

    // ============================================================
    // 月度报表
    // ============================================================

    window.ReportsModule.loadMonthlyReport = function() {
        var self = this;
        var date = this.el.monthlyReportDate ? this.el.monthlyReportDate.value : null;
        if (!date) {
            var now = new Date();
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var year = now.getFullYear();
            date = year + '-' + month;
            if (this.el.monthlyReportDate) this.el.monthlyReportDate.value = date;
        }

        var startDate = date + '-01';
        var lastDay = new Date(parseInt(date.split('-')[0]), parseInt(date.split('-')[1]), 0).getDate();
        var endDate = date + '-' + String(lastDay).padStart(2, '0');

        var orders = this.getData('allOrders') || [];
        var expenses = this.getData('allExpenses') || [];

        var monthOrders = orders.filter(function(o) {
            return o.date >= startDate && o.date <= endDate;
        });
        var monthExpenses = expenses.filter(function(e) {
            return e.expense_date >= startDate && e.expense_date <= endDate;
        });

        var totalIncome = monthOrders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
        var totalExpense = monthExpenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
        var netProfit = totalIncome - totalExpense;

        // 按日统计收入
        var dailyStats = {};
        monthOrders.forEach(function(o) {
            dailyStats[o.date] = (dailyStats[o.date] || 0) + (o.total || 0);
        });

        this.renderMonthlyReport(dailyStats, totalIncome, totalExpense, netProfit, monthOrders.length, monthExpenses.length);
    };

    window.ReportsModule.renderMonthlyReport = function(dailyStats, totalIncome, totalExpense, netProfit, orderCount, expenseCount) {
        var content = this.el.monthlyReportContent;
        if (!content) return;

        var html = '';
        html += '<div class="grid grid-cols-3 gap-3 mb-3">';
        html += '<div class="bg-green-50 p-2 rounded text-center"><div class="text-sm text-gray-500">总收入</div><div class="font-bold text-green-600">' + totalIncome.toFixed(2) + ' SAR</div></div>';
        html += '<div class="bg-red-50 p-2 rounded text-center"><div class="text-sm text-gray-500">总支出</div><div class="font-bold text-red-600">' + totalExpense.toFixed(2) + ' SAR</div></div>';
        html += '<div class="bg-blue-50 p-2 rounded text-center"><div class="text-sm text-gray-500">净利润</div><div class="font-bold text-blue-600">' + netProfit.toFixed(2) + ' SAR</div></div>';
        html += '</div>';
        html += '<div class="grid grid-cols-2 gap-3 text-sm mb-3">';
        html += '<div class="bg-gray-50 p-1 rounded text-center">订单数: ' + orderCount + '</div>';
        html += '<div class="bg-gray-50 p-1 rounded text-center">支出数: ' + expenseCount + '</div>';
        html += '</div>';

        // 每日明细
        var keys = Object.keys(dailyStats).sort();
        if (keys.length > 0) {
            html += '<div class="max-h-48 overflow-auto border rounded-lg p-2">';
            keys.forEach(function(date) {
                html += '<div class="flex justify-between p-1 border-b text-sm">';
                html += '<span>' + date + '</span>';
                html += '<span class="text-green-600">+' + dailyStats[date].toFixed(2) + ' SAR</span>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            html += '<div class="text-center text-gray-400 py-4">本月暂无数据</div>';
        }

        content.innerHTML = html;
    };

    // ============================================================
    // 导出月度报表
    // ============================================================

    window.ReportsModule.exportMonthlyReport = function() {
        var date = this.el.monthlyReportDate ? this.el.monthlyReportDate.value : null;
        if (!date) {
            var now = new Date();
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var year = now.getFullYear();
            date = year + '-' + month;
        }

        var startDate = date + '-01';
        var lastDay = new Date(parseInt(date.split('-')[0]), parseInt(date.split('-')[1]), 0).getDate();
        var endDate = date + '-' + String(lastDay).padStart(2, '0');

        var orders = this.getData('allOrders') || [];
        var expenses = this.getData('allExpenses') || [];

        var monthOrders = orders.filter(function(o) {
            return o.date >= startDate && o.date <= endDate;
        });
        var monthExpenses = expenses.filter(function(e) {
            return e.expense_date >= startDate && e.expense_date <= endDate;
        });

        var data = [['日期', '类型', '描述', '金额', '支付方式']];
        monthOrders.forEach(function(o) {
            data.push([o.date, '收入', o.service_name || '服务', '+' + (o.total || 0).toFixed(2), o.payment_method || '']);
        });
        monthExpenses.forEach(function(e) {
            data.push([e.expense_date, '支出', e.description || '费用', '-' + (e.amount || 0).toFixed(2), e.payment_method || '']);
        });

        if (data.length === 1) {
            this.toast('本月暂无数据', 'error');
            return;
        }

        var ws = XLSX.utils.aoa_to_sheet(data);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '月度报表');
        XLSX.writeFile(wb, '月度报表_' + date + '.xlsx');
        this.toast('✅ 报表已导出', 'success');
    };

    // ============================================================
    // 关闭模态框
    // ============================================================

    window.ReportsModule.closeModal = function(modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    };

    // ============================================================
    // 兼容原有方法
    // ============================================================

    // 保留原有的 VAT 设置方法
    window.ReportsModule.loadVatSettings = window.ReportsModule.loadVatSettings || function() {};
    window.ReportsModule.saveVatSettings = window.ReportsModule.saveVatSettings || function() {};
    window.ReportsModule.loadInvoices = window.ReportsModule.loadInvoices || function() {};
    window.ReportsModule.showCreateInvoice = window.ReportsModule.showCreateInvoice || function() {};
    window.ReportsModule.generateInvoice = window.ReportsModule.generateInvoice || function() {};
    window.ReportsModule.previewInvoice = window.ReportsModule.previewInvoice || function() {};
    window.ReportsModule.closeInvoicePreview = window.ReportsModule.closeInvoicePreview || function() {};
    window.ReportsModule.printInvoice = window.ReportsModule.printInvoice || function() {};
    window.ReportsModule.downloadInvoicePDF = window.ReportsModule.downloadInvoicePDF || function() {};
    window.ReportsModule.loadCreditNotes = window.ReportsModule.loadCreditNotes || function() {};
    window.ReportsModule.showCreateCreditNote = window.ReportsModule.showCreateCreditNote || function() {};
    window.ReportsModule.generateCreditNote = window.ReportsModule.generateCreditNote || function() {};
    window.ReportsModule.closeCreditNoteModal = window.ReportsModule.closeCreditNoteModal || function() {};
    window.ReportsModule.loadExpenses = window.ReportsModule.loadExpenses || function() {};
    window.ReportsModule.renderReport = window.ReportsModule.renderReport || function() {};
    window.ReportsModule.exportReport = window.ReportsModule.exportReport || function() {};

    console.log('[Reports] 模块已注册');
})();