// ================================================================
//  cashier.js - POS/收银模块
//  改造后：只暴露 CashierModule.init()
// ================================================================

const CashierModule = {
    // 初始化
    init() {
        console.log('💰 CashierModule 初始化');
        // 检查DOM元素是否存在
        if (!document.getElementById('posService')) {
            console.warn('⚠️ POS 元素未加载，延迟初始化');
            setTimeout(() => this.init(), 300);
            return;
        }
        this.refresh();
        this.bindEvents();
    },
    
    // 销毁（清理事件监听）
    destroy() {
        console.log('💰 CashierModule 销毁');
        const posService = document.getElementById('posService');
        if (posService) {
            posService.removeEventListener('change', this._boundUpdatePrice);
        }
        const posAmount = document.getElementById('posAmount');
        if (posAmount) {
            posAmount.removeEventListener('input', this._boundAmountChange);
        }
    },
    
    // 刷新数据
    refresh() {
        this.refreshPOS();
        this.updatePOSPrice();
    },
    
    // 绑定事件
    bindEvents() {
        const posService = document.getElementById('posService');
        if (posService) {
            this._boundUpdatePrice = () => this.updatePOSPrice();
            posService.addEventListener('change', this._boundUpdatePrice);
        }
        const posAmount = document.getElementById('posAmount');
        if (posAmount) {
            this._boundAmountChange = function() {
                const amount = parseFloat(this.value) || 0;
                const vat = amount * (config.vatRate || 15) / 100;
                const posSubtotal = document.getElementById('posSubtotal');
                const posVat = document.getElementById('posVat');
                const posTotal = document.getElementById('posTotal');
                if (posSubtotal) posSubtotal.textContent = amount.toFixed(2) + ' SAR';
                if (posVat) posVat.textContent = vat.toFixed(2) + ' SAR';
                if (posTotal) posTotal.textContent = (amount + vat).toFixed(2) + ' SAR';
            };
            posAmount.addEventListener('input', this._boundAmountChange);
        }
    },
    
    // 刷新 POS 下拉列表
    refreshPOS() {
        const custSel = document.getElementById('posCustomer');
        if (custSel) {
            const val = custSel.value;
            custSel.innerHTML = '<option value="">散客</option>' + 
                allCustomers.map(c => `<option value="${c.id}">${c.name} (${c.plate_number || ''})</option>`).join('');
            if (val) custSel.value = val;
        }
        const empSel = document.getElementById('posEmployee');
        if (empSel) {
            const staff = allUsers.filter(u => u.role !== 'owner' && u.status === 'approved');
            empSel.innerHTML = staff.map(u => `<option value="${u.id}">${u.name || u.username}</option>`).join('');
            if (currentUser) {
                for (let opt of empSel.options) {
                    if (opt.value === currentUser.id) {
                        opt.selected = true;
                        break;
                    }
                }
            }
        }
        this.updatePOSPrice();
    },
    
    // 更新价格
    updatePOSPrice() {
        const posService = document.getElementById('posService');
        const posAmount = document.getElementById('posAmount');
        const posSubtotal = document.getElementById('posSubtotal');
        const posVat = document.getElementById('posVat');
        const posTotal = document.getElementById('posTotal');
        
        // 安全检查
        if (!posService || !posAmount) {
            return;
        }
        
        const servicePrices = { '基础清洗': 30, '深度清洗': 55, '外部抛光': 65, '内部护理': 70, '全车精洗': 110 };
        const service = posService.value;
        const amount = servicePrices[service] || 30;
        const vat = amount * (config.vatRate || 15) / 100;
        posAmount.value = amount;
        if (posSubtotal) posSubtotal.textContent = amount.toFixed(2) + ' SAR';
        if (posVat) posVat.textContent = vat.toFixed(2) + ' SAR';
        if (posTotal) posTotal.textContent = (amount + vat).toFixed(2) + ' SAR';
    },
    
    // 保存订单
    async saveOrder() {
        if (!currentUser) { showToast('请先登录'); return; }
        const plate = document.getElementById('posPlate')?.value?.trim()?.toUpperCase();
        if (!plate) { showToast('请输入车牌号'); return; }
        const amount = parseFloat(document.getElementById('posAmount')?.value) || 0;
        if (amount <= 0) { showToast('金额必须大于0'); return; }

        try {
            const employeeId = document.getElementById('posEmployee')?.value || null;
            const serviceName = document.getElementById('posService')?.value;
            const paymentMethod = document.getElementById('posPayment')?.value;
            const vat = amount * (config.vatRate || 15) / 100;
            const total = amount + vat;
            const today = new Date().toISOString().split('T')[0];
            const orderNumber = 'ORD-' + today.replace(/-/g, '') + '-' + 
                String(allOrders.filter(o => (o.date || '').startsWith(today)).length + 1).padStart(4, '0');
            const orderData = { 
                order_number: orderNumber, 
                plate_number: plate, 
                employee_id: employeeId, 
                staff_name: employeeId ? allUsers.find(u => u.id === employeeId)?.name : currentUser.name,
                service_name: serviceName, 
                amount: amount, 
                vat: vat, 
                total: total, 
                payment_method: paymentMethod, 
                status: 'completed', 
                date: today 
            };
            const { data, error } = await supabaseClient.from('orders').insert([orderData]).select();
            if (error) throw new Error(error.message);
            if (data && data.length > 0) allOrders.unshift(data[0]);
            if (typeof refreshAll === 'function') refreshAll();
            showToast('✅ 订单保存成功: ' + total.toFixed(2) + ' SAR');
            if (document.getElementById('posPlate')) document.getElementById('posPlate').value = '';
        } catch (error) {
            showToast('❌ 保存失败: ' + error.message);
        }
    }
};

// 暴露到全局
window.CashierModule = CashierModule;

// 兼容旧版函数调用
window.refreshPOS = function() { CashierModule.refreshPOS(); };
window.updatePOSPrice = function() { CashierModule.updatePOSPrice(); };
window.posSaveOrder = function() { CashierModule.saveOrder(); };

console.log('✅ cashier.js 已加载 (模块化)');