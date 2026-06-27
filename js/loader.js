// ================================================================
//  loader.js - 模块加载器 v3.0 (修复版)
//  功能：统一管理模块的加载、切换、初始化和缓存
// ================================================================

const ModuleLoader = {
    // 缓存已加载的模块HTML
    cache: {},
    
    // 当前激活的模块名称
    currentModule: null,
    
    // 模块是否已初始化
    initializedModules: {},

    // 模块名 → 模块对象名 映射
    moduleMap: {
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
    },

    // 模块名 → 兼容函数名 映射（当模块对象不存在时使用）
    fallbackMap: {
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
    },

    // 切换到指定模块
    async switchTo(moduleName) {
        // 如果已经在当前模块且已初始化，跳过
        if (this.currentModule === moduleName && this.initializedModules[moduleName]) {
            console.log(`📌 已在 ${moduleName} 模块`);
            return;
        }

        console.log(`🔄 切换模块: ${moduleName}`);

        // 1. 销毁当前模块
        if (this.currentModule) {
            this.destroyModule(this.currentModule);
        }

        // 2. 加载模块HTML
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
        console.log(`✅ HTML 已注入: ${moduleName}`);

        // 4. 更新当前模块
        this.currentModule = moduleName;
        this.initializedModules[moduleName] = false;

        // 5. 延迟初始化（等待DOM渲染）
        setTimeout(() => {
            this.initModule(moduleName);
        }, 350);
    },

    // 加载模块HTML（带缓存）
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

        // 方式1：通过模块对象调用 init()
        const moduleKey = this.moduleMap[moduleName];
        if (moduleKey) {
            const moduleObj = window[moduleKey];
            if (moduleObj && typeof moduleObj.init === 'function') {
                try {
                    moduleObj.init();
                    this.initializedModules[moduleName] = true;
                    console.log(`✅ 模块 ${moduleName} init() 调用成功`);
                    return;
                } catch (e) {
                    console.error(`❌ ${moduleKey}.init() 错误:`, e.message);
                }
            }
        }

        // 方式2：通过兼容函数
        const fallbackFn = this.fallbackMap[moduleName];
        if (fallbackFn && typeof window[fallbackFn] === 'function') {
            try {
                window[fallbackFn]();
                this.initializedModules[moduleName] = true;
                console.log(`✅ 兼容函数 ${fallbackFn}() 调用成功`);
                return;
            } catch (e) {
                console.error(`❌ ${fallbackFn}() 错误:`, e.message);
            }
        }

        console.warn(`⚠️ 模块 ${moduleName} 没有可用的初始化方法`);
        
        // 方式3：尝试直接查找模块对象并调用 refresh
        for (const key in window) {
            if (key.toLowerCase().includes(moduleName.toLowerCase()) && 
                typeof window[key] === 'object' && 
                window[key] !== null &&
                typeof window[key].refresh === 'function') {
                try {
                    window[key].refresh();
                    this.initializedModules[moduleName] = true;
                    console.log(`✅ 通过 ${key}.refresh() 初始化成功`);
                    return;
                } catch(e) {}
            }
        }
    },

    // 销毁模块
    destroyModule(moduleName) {
        console.log(`🧹 销毁模块: ${moduleName}`);
        const moduleKey = this.moduleMap[moduleName];
        if (moduleKey) {
            const moduleObj = window[moduleKey];
            if (moduleObj && typeof moduleObj.destroy === 'function') {
                try {
                    moduleObj.destroy();
                } catch (e) {
                    console.warn('销毁模块警告:', e.message);
                }
            }
        }
        this.initializedModules[moduleName] = false;
    },

    // 刷新当前模块
    refresh() {
        if (this.currentModule) {
            console.log(`🔄 刷新模块: ${this.currentModule}`);
            this.initModule(this.currentModule);
        }
    },

    // 预加载所有模块（提升切换速度）
    async preloadAll() {
        console.log('📦 预加载所有模块...');
        const modules = Object.keys(this.moduleMap);
        for (const name of modules) {
            await this.loadModuleHTML(name);
        }
        console.log('✅ 预加载完成');
    }
};

// 暴露到全局
window.ModuleLoader = ModuleLoader;

console.log('✅ loader.js v3.0 已加载');