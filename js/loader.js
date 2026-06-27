// ================================================================
//  loader.js - 统一模块加载器 v4.0
//  职责：加载HTML、调用init/destroy、缓存、切换
// ================================================================

const ModuleLoader = {
    // 缓存
    cache: {},
    
    // 当前模块
    currentModule: null,
    
    // 已初始化标记
    initializedModules: {},

    // 模块注册表
    modules: {
        dashboard: { obj: 'DashboardModule', fallback: 'refreshDashboard' },
        cashier: { obj: 'CashierModule', fallback: 'refreshPOS' },
        orders: { obj: 'OrdersModule', fallback: 'loadOrders' },
        inventory: { obj: 'InventoryModule', fallback: 'refreshInventory' },
        members: { obj: 'CustomersModule', fallback: 'refreshCustomers' },
        reports: { obj: 'ReportsModule', fallback: 'loadDailyReport' },
        attendance: { obj: 'AttendanceModule', fallback: 'refreshAttendance' },
        employees: { obj: 'EmployeesModule', fallback: 'loadUsersForReview' },
        audit: { obj: 'AuditModule', fallback: 'loadAuditLog' },
        settings: { obj: 'SettingsModule', fallback: 'loadSettings' }
    },

    async switchTo(moduleName) {
        if (this.currentModule === moduleName && this.initializedModules[moduleName]) {
            console.log(`📌 已在 ${moduleName} 模块`);
            return;
        }

        console.log(`🔄 切换模块: ${moduleName}`);

        // 1. 销毁当前模块
        if (this.currentModule) {
            this.destroyModule(this.currentModule);
        }

        // 2. 加载并注入HTML
        const html = await this.loadModuleHTML(moduleName);
        if (!html) {
            console.error(`❌ 加载模块 ${moduleName} 失败`);
            return;
        }

        const container = document.getElementById('moduleContainer');
        if (!container) {
            console.error('❌ moduleContainer 不存在');
            return;
        }
        container.innerHTML = html;
        console.log(`✅ HTML 已注入: ${moduleName}`);

        // 3. 更新状态
        this.currentModule = moduleName;
        this.initializedModules[moduleName] = false;

        // 4. 延迟初始化
        setTimeout(() => {
            this.initModule(moduleName);
        }, 300);
    },

    async loadModuleHTML(moduleName) {
        if (this.cache[moduleName]) {
            console.log(`📦 从缓存加载: ${moduleName}`);
            return this.cache[moduleName];
        }

        try {
            const response = await fetch(`modules/${moduleName}.html`);
            if (!response.ok) {
                console.error(`❌ HTTP ${response.status}: ${moduleName}.html`);
                return null;
            }
            const html = await response.text();
            this.cache[moduleName] = html;
            console.log(`✅ 加载模块: ${moduleName}`);
            return html;
        } catch (error) {
            console.error(`❌ 加载模块 ${moduleName} 失败:`, error.message);
            return null;
        }
    },

    initModule(moduleName) {
        console.log(`⚡ 初始化模块: ${moduleName}`);

        const config = this.modules[moduleName];
        if (!config) {
            console.warn(`⚠️ 未知模块: ${moduleName}`);
            return;
        }

        // 方式1：通过模块对象调用 init()
        const moduleObj = window[config.obj];
        if (moduleObj && typeof moduleObj.init === 'function') {
            try {
                moduleObj.init();
                this.initializedModules[moduleName] = true;
                console.log(`✅ ${moduleName} init() 成功`);
                return;
            } catch (e) {
                console.error(`❌ ${config.obj}.init() 错误:`, e.message);
            }
        }

        // 方式2：通过兼容函数
        if (config.fallback && typeof window[config.fallback] === 'function') {
            try {
                window[config.fallback]();
                this.initializedModules[moduleName] = true;
                console.log(`✅ ${config.fallback}() 成功`);
                return;
            } catch (e) {
                console.error(`❌ ${config.fallback}() 错误:`, e.message);
            }
        }

        console.warn(`⚠️ ${moduleName} 没有可用的初始化方法`);
    },

    destroyModule(moduleName) {
        console.log(`🧹 销毁模块: ${moduleName}`);
        const config = this.modules[moduleName];
        if (config) {
            const moduleObj = window[config.obj];
            if (moduleObj && typeof moduleObj.destroy === 'function') {
                try {
                    moduleObj.destroy();
                } catch (e) {
                    console.warn('销毁警告:', e.message);
                }
            }
        }
        this.initializedModules[moduleName] = false;
    },

    refresh() {
        if (this.currentModule) {
            console.log(`🔄 刷新: ${this.currentModule}`);
            this.initModule(this.currentModule);
        }
    },

    async preloadAll() {
        console.log('📦 预加载所有模块...');
        for (const name of Object.keys(this.modules)) {
            await this.loadModuleHTML(name);
        }
        console.log('✅ 预加载完成');
    }
};

window.ModuleLoader = ModuleLoader;
console.log('✅ loader.js v4.0 已加载');