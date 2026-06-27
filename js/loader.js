// ================================================================
//  loader.js - 模块加载器 v2.0
//  专门负责：加载HTML、切换模块、调用init/destroy、缓存
// ================================================================

const ModuleLoader = {
    // 缓存已加载的模块HTML
    cache: {},
    
    // 当前激活的模块名称
    currentModule: null,
    
    // 模块是否已初始化
    initializedModules: {},
    
    // 加载并切换模块
    async switchTo(moduleName) {
        // 如果正在加载同一个模块，跳过
        if (this.currentModule === moduleName && this.initializedModules[moduleName]) {
            console.log(`📌 已在 ${moduleName} 模块`);
            return;
        }
        
        console.log(`🔄 切换模块: ${moduleName}`);
        
        // 1. 销毁当前模块
        if (this.currentModule) {
            this.destroyModule(this.currentModule);
        }
        
        // 2. 加载新模块HTML
        const html = await this.loadModuleHTML(moduleName);
        if (!html) {
            console.error(`❌ 加载模块 ${moduleName} 失败`);
            return;
        }
        
        // 3. 注入到容器
        const container = document.getElementById('moduleContainer');
        if (!container) {
            console.error('❌ moduleContainer 不存在');
            return;
        }
        container.innerHTML = html;
        
        // 4. 更新当前模块
        this.currentModule = moduleName;
        this.initializedModules[moduleName] = false;
        
        // 5. 初始化新模块（延迟等待DOM渲染）
        setTimeout(() => {
            this.initModule(moduleName);
        }, 200);
    },
    
    // 加载模块HTML（带缓存）
    async loadModuleHTML(moduleName) {
        // 检查缓存
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
            console.log(`✅ 加载模块: ${moduleName} (${html.length} bytes)`);
            return html;
        } catch (error) {
            console.error(`❌ 加载模块 ${moduleName} 失败:`, error.message);
            return null;
        }
    },
    
    // 初始化模块
    initModule(moduleName) {
        console.log(`⚡ 初始化模块: ${moduleName}`);
        
        // 模块名到模块对象的映射
        const moduleMap = {
            'dashboard': 'DashboardModule',
            'cashier': 'CashierModule',
            'orders': 'OrdersModule',
            'inventory': 'InventoryModule',
            'members': 'CustomersModule',
            'reports': 'ReportsModule',
            'attendance': 'AttendanceModule',
            'employees': 'EmployeesModule',
            'audit': 'AuditModule',
            'settings': 'SettingsModule'
        };
        
        const moduleKey = moduleMap[moduleName];
        if (!moduleKey) {
            console.warn(`⚠️ 未知模块: ${moduleName}`);
            return;
        }
        
        // 查找对应的模块对象
        const moduleObj = window[moduleKey];
        if (moduleObj && typeof moduleObj.init === 'function') {
            try {
                moduleObj.init();
                this.initializedModules[moduleName] = true;
                console.log(`✅ 模块 ${moduleName} 初始化完成`);
            } catch(e) {
                console.error(`❌ 模块 ${moduleName} 初始化错误:`, e.message);
            }
        } else {
            // 兼容旧版：直接调用函数
            const funcMap = {
                'dashboard': 'refreshDashboard',
                'cashier': 'refreshPOS',
                'orders': 'loadOrders',
                'inventory': 'refreshInventory',
                'members': 'refreshCustomers',
                'reports': 'loadDailyReport',
                'attendance': 'refreshAttendance',
                'employees': 'loadUsersForReview',
                'audit': 'loadAuditLog',
                'settings': 'loadSettings'
            };
            const funcName = funcMap[moduleName];
            if (funcName && typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                    this.initializedModules[moduleName] = true;
                    console.log(`✅ 模块 ${moduleName} 初始化完成 (兼容模式)`);
                } catch(e) {
                    console.error(`❌ 模块 ${moduleName} 初始化错误 (兼容模式):`, e.message);
                }
            } else {
                console.warn(`⚠️ 模块 ${moduleName} 没有 init 方法，且无兼容函数`);
            }
        }
    },
    
    // 销毁模块
    destroyModule(moduleName) {
        console.log(`🧹 销毁模块: ${moduleName}`);
        
        const moduleMap = {
            'dashboard': 'DashboardModule',
            'cashier': 'CashierModule',
            'orders': 'OrdersModule',
            'inventory': 'InventoryModule',
            'members': 'CustomersModule',
            'reports': 'ReportsModule',
            'attendance': 'AttendanceModule',
            'employees': 'EmployeesModule',
            'audit': 'AuditModule',
            'settings': 'SettingsModule'
        };
        
        const moduleKey = moduleMap[moduleName];
        if (moduleKey) {
            const moduleObj = window[moduleKey];
            if (moduleObj && typeof moduleObj.destroy === 'function') {
                try {
                    moduleObj.destroy();
                } catch(e) {
                    console.warn('销毁模块警告:', e.message);
                }
            }
        }
        
        this.initializedModules[moduleName] = false;
    },
    
    // 强制刷新当前模块
    refresh() {
        if (this.currentModule) {
            console.log(`🔄 刷新模块: ${this.currentModule}`);
            this.initModule(this.currentModule);
        }
    },
    
    // 预加载所有模块（提升切换速度）
    async preloadAll() {
        console.log('📦 预加载所有模块...');
        const modules = ['dashboard', 'cashier', 'orders', 'inventory', 'members', 'reports', 'attendance', 'employees', 'audit', 'settings'];
        for (const name of modules) {
            await this.loadModuleHTML(name);
        }
        console.log('✅ 预加载完成');
    }
};

// 暴露到全局
window.ModuleLoader = ModuleLoader;

console.log('✅ loader.js 已加载 (v2.0)');