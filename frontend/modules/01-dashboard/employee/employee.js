/**
 * modules/01-dashboard/employee/employee.js - 员工概览
 * @module employee
 * @description 员工数据总览
 */

// ============================================================
// 1. 数据
// ============================================================

const EMPLOYEE_DATA = {
    stats: {
        total: 25,
        active: 23,
        attendanceRate: 92,
        monthlyPayroll: 128000
    },
    employees: [
        { name: '张伟', department: '管理部', position: '经理', status: '在职' },
        { name: '李娜', department: '销售部', position: '主管', status: '在职' },
        { name: '王强', department: '服务部', position: '员工', status: '在职' },
        { name: '刘洋', department: '技术部', position: '员工', status: '在职' },
        { name: '陈静', department: '市场部', position: '主管', status: '在职' }
    ]
};

// ============================================================
// 2. 工具函数
// ============================================================

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0';
    return Number(amount).toLocaleString('zh-CN');
}

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
// 3. 渲染函数
// ============================================================

function renderStats() {
    var stats = EMPLOYEE_DATA.stats;
    
    var cards = document.querySelectorAll('.employee-card');
    if (cards.length >= 4) {
        var values = cards.querySelectorAll('.value');
        if (values.length >= 4) {
            values[0].textContent = stats.total;
            values[1].textContent = stats.active;
            values[2].textContent = stats.attendanceRate + '%';
            values[3].textContent = '¥' + formatCurrency(stats.monthlyPayroll);
        }
    } else {
        // 备用：通过ID查找
        var idMap = {
            'empTotal': stats.total,
            'empActive': stats.active,
            'empAttendance': stats.attendanceRate + '%',
            'empPayroll': '¥' + formatCurrency(stats.monthlyPayroll)
        };
        Object.keys(idMap).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.textContent = idMap[id];
        });
    }
}

function renderEmployees() {
    var tbody = document.querySelector('.table tbody') || 
                document.querySelector('#employeeList tbody') ||
                document.querySelector('[data-employee-table] tbody');
    
    if (!tbody) {
        console.warn('⚠️ 找不到员工表格');
        return;
    }

    var html = '';
    for (var i = 0; i < EMPLOYEE_DATA.employees.length; i++) {
        var e = EMPLOYEE_DATA.employees[i];
        html += '<tr>' +
            '<td>' + e.name + '</td>' +
            '<td>' + e.department + '</td>' +
            '<td>' + e.position + '</td>' +
            '<td><span class="badge badge-success">' + e.status + '</span></td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

// ============================================================
// 4. 核心功能
// ============================================================

export function init() {
    console.log('👤 Employee Dashboard 初始化...');

    if (typeof document === 'undefined') {
        console.warn('⚠️ 非浏览器环境，跳过初始化');
        return;
    }

    setTimeout(function() {
        renderStats();
        renderEmployees();
    }, 100);

    var refreshBtn = document.querySelector('.page-header .btn-secondary, #refreshEmployeeBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(function() {
                    icon.classList.remove('fa-spin');
                    showToast('员工数据已刷新', 'success');
                }, 1000);
            }
            renderStats();
            renderEmployees();
        });
    }

    console.log('✅ Employee Dashboard 初始化完成');
}

// ============================================================
// 5. 自动初始化
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 200);
    });
} else {
    setTimeout(init, 200);
}

console.log('✅ Employee 模块加载完成');