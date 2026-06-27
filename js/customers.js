// ================================================================
//  customers.js - 客户管理模块
// ================================================================

const CustomersModule = {
    // 初始化
    init() {
        console.log('👥 CustomersModule 初始化');
        if (!document.getElementById('membersList')) {
            console.warn('⚠️ 客户元素未加载，延迟初始化');
            setTimeout(() => this.init(), 300);
            return;
        }
        this.refresh();
        this.bindEvents();
    },

    // 销毁
    destroy() {
        console.log('👥 CustomersModule 销毁');
    },

    // 绑定事件
    bindEvents() {
        // 可以添加搜索、筛选等事件
    },

    // 刷新客户列表
    refresh() {
        this.refreshCustomers();
    },

    // 刷新客户列表
    refreshCustomers() {
        const list = document.getElementById('membersList');
        if (!list) return;

        list.innerHTML = allCustomers.map(c => `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                <div>
                    <strong>${c.name || 'Unknown'}</strong>
                    <span class="customer-level customer-level-${(c.level || 'normal').toLowerCase()}">${c.level || '普通'}</span>
                    <br><small>${c.phone || ''} | ${c.plate_number || ''}</small>
                </div>
                <div class="text-right">
                    <div>余额: <span class="font-bold text-green-600">${(c.balance || 0).toFixed(2)} SAR</span></div>
                    <div class="text-sm">积分: ${c.points || 0} | 到店: ${c.visit_count || 0}次</div>
                </div>
            </div>
        `).join('') || '<div class="text-center text-gray-400">暂无客户</div>';
    },

    // 添加/充值客户
    async addCustomer() {
        if (!currentUser) { showToast('请先登录'); return; }
        const phone = document.getElementById('memberPhone')?.value?.trim();
        const name = document.getElementById('memberName')?.value?.trim();
        const plate = document.getElementById('memberPlate')?.value?.trim()?.toUpperCase();
        const amount = parseFloat(document.getElementById('rechargeAmount')?.value) || 0;
        if (!phone || !name || !plate) { showToast('请填写完整信息'); return; }

        try {
            let existing = allCustomers.find(c => c.phone === phone || c.plate_number === plate);
            if (existing) {
                const newBalance = (existing.balance || 0) + amount;
                await supabaseClient.from('customers').update({ balance: newBalance, name: name, total_spent: (existing.total_spent || 0) + amount }).eq('id', existing.id);
                existing.balance = newBalance;
                existing.name = name;
                existing.total_spent = (existing.total_spent || 0) + amount;
            } else {
                const { data, error } = await supabaseClient.from('customers').insert([{
                    phone, name, plate_number: plate, balance: amount,
                    points: 0, level: '普通', total_spent: amount,
                    visit_count: 1, last_visit: new Date().toISOString().split('T')[0]
                }]).select();
                if (error) throw new Error(error.message);
                if (data && data.length > 0) allCustomers.unshift(data[0]);
            }
            this.refreshCustomers();
            showToast('✅ 客户已保存 / 充值 ' + amount + ' SAR');
            document.getElementById('memberPhone').value = '';
            document.getElementById('memberName').value = '';
            document.getElementById('memberPlate').value = '';
            document.getElementById('rechargeAmount').value = '';
        } catch (error) { showToast('❌ 操作失败: ' + error.message); }
    }
};

// 暴露到全局
window.CustomersModule = CustomersModule;

// 兼容旧版函数
window.refreshCustomers = function() { CustomersModule.refreshCustomers(); };
window.addCustomer = function() { CustomersModule.addCustomer(); };

console.log('✅ customers.js 已加载 (模块化)');