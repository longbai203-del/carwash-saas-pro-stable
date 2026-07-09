/**
 * Employees - 员工管理
 */
export function init() {
    console.log('✅ Employees 已加载');
    
    var tbody = document.getElementById('employeesTableBody');
    if (tbody) {
        var employees = [
            { name: '张伟', department: '管理部', position: '经理', salary: 12000, status: '在职' },
            { name: '李娜', department: '销售部', position: '主管', salary: 8000, status: '在职' },
            { name: '王强', department: '服务部', position: '员工', salary: 5000, status: '在职' },
            { name: '刘洋', department: '技术部', position: '员工', salary: 5500, status: '在职' },
            { name: '陈静', department: '市场部', position: '主管', salary: 7500, status: '在职' }
        ];
        
        tbody.innerHTML = employees.map(function(e) {
            return '<tr>' +
                '<td><div class="flex items-center gap-3">' +
                '<div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">' + e.name.charAt(0) + '</div>' +
                '<div><div class="font-medium">' + e.name + '</div></div></div></td>' +
                '<td>' + e.department + '</td>' +
                '<td>' + e.position + '</td>' +
                '<td>1380000' + Math.floor(Math.random() * 10000) + '</td>' +
                '<td class="text-right font-semibold">¥' + e.salary + '</td>' +
                '<td class="text-sm">2026-01-01</td>' +
                '<td><span class="badge badge-success">' + e.status + '</span></td>' +
                '<td><div class="flex gap-1">' +
                '<button class="btn-sm btn-primary"><i class="fas fa-edit"></i></button>' +
                '<button class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }
}
