/**
 * @file services.js
 * @module core/services
 * @description 服务管理 - 模块加载和服务注册
 * 
 * @example
 * import { loadModule, initServices } from './services.js';
 * 
 * // 初始化所有服务
 * await initServices();
 * 
 * // 加载模块
 * const dashboard = await loadModule('dashboard');
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from './store.js';

/**
 * @typedef {Object} ServiceConfig
 * @property {string} name - 服务名称
 * @property {string} [version='1.0.0'] - 版本号
 * @property {string[]} [dependencies] - 依赖列表
 * @property {any} [instance] - 服务实例
 * @property {boolean} [loaded=false] - 是否已加载
 */

/**
 * @typedef {Object} ModuleConfig
 * @property {string} name - 模块名称
 * @property {string} [version='1.0.0'] - 版本号
 * @property {string[]} [dependencies] - 依赖列表
 * @property {Object} [components] - 组件列表
 * @property {boolean} [loaded=false] - 是否已加载
 * @property {any} [instance] - 模块实例
 */

/**
 * @typedef {Object} ServiceStatus
 * @property {boolean} initialized - 是否已初始化
 * @property {Object} services - 服务状态
 * @property {Object} modules - 模块状态
 * @property {number} cacheSize - 缓存大小
 */

/**
 * 服务注册表
 */
const SERVICES = {
    auth: {
        name: 'auth',
        version: '1.0.0',
        dependencies: [],
        instance: null,
        loaded: false
    },
    api: {
        name: 'api',
        version: '1.0.0',
        dependencies: [],
        instance: null,
        loaded: false
    },
    store: {
        name: 'store',
        version: '1.0.0',
        dependencies: [],
        instance: null,
        loaded: false
    },
    router: {
        name: 'router',
        version: '1.0.0',
        dependencies: ['store'],
        instance: null,
        loaded: false
    },
    sidebar: {
        name: 'sidebar',
        version: '1.0.0',
        dependencies: ['store', 'router'],
        instance: null,
        loaded: false
    }
};

/**
 * 模块注册表
 */
const MODULES = {
    dashboard: {
        name: 'dashboard',
        version: '1.0.0',
        dependencies: [],
        components: {},
        loaded: false,
        instance: null
    },
    pos: {
        name: 'pos',
        version: '1.0.0',
        dependencies: ['products', 'customers'],
        components: {},
        loaded: false,
        instance: null
    },
    orders: {
        name: 'orders',
        version: '1.0.0',
        dependencies: ['customers', 'products'],
        components: {},
        loaded: false,
        instance: null
    },
    products: {
        name: 'products',
        version: '1.0.0',
        dependencies: [],
        components: {},
        loaded: false,
        instance: null
    },
    customers: {
        name: 'customers',
        version: '1.0.0',
        dependencies: [],
        components: {},
        loaded: false,
        instance: null
    },
    inventory: {
        name: 'inventory',
        version: '1.0.0',
        dependencies: ['products'],
        components: {},
        loaded: false,
        instance: null
    },
    finance: {
        name: 'finance',
        version: '1.0.0',
        dependencies: ['orders'],
        components: {},
        loaded: false,
        instance: null
    },
    hr: {
        name: 'hr',
        version: '1.0.0',
        dependencies: [],
        components: {},
        loaded: false,
        instance: null
    },
    marketing: {
        name: 'marketing',
        version: '1.0.0',
        dependencies: ['customers'],
        components: {},
        loaded: false,
        instance: null
    },
    analytics: {
        name: 'analytics',
        version: '1.0.0',
        dependencies: ['orders', 'finance'],
        components: {},
        loaded: false,
        instance: null
    },
    settings: {
        name: 'settings',
        version: '1.0.0',
        dependencies: [],
        components: {},
        loaded: false,
        instance: null
    },
    auth: {
        name: 'auth',
        version: '1.0.0',
        dependencies: [],
        components: {},
        loaded: false,
        instance: null
    }
};

/**
 * @class ServiceManager
 * @description 服务管理器
 */
class ServiceManager {
    constructor() {
        /** @type {Object<string, ServiceConfig>} 服务列表 */
        this.services = SERVICES;

        /** @type {Object<string, ModuleConfig>} 模块列表 */
        this.modules = MODULES;

        /** @type {Map<string, any>} 模块缓存 */
        this.moduleCache = new Map();

        /** @type {Map<string, Promise>} 加载中的Promise */
        this.loadingPromises = new Map();

        /** @type {boolean} 是否已初始化 */
        this.initialized = false;

        // 绑定方法
        this.initServices = this.initServices.bind(this);
        this.loadModule = this.loadModule.bind(this);
        this.loadAllModules = this.loadAllModules.bind(this);
        this.getService = this.getService.bind(this);
        this.registerService = this.registerService.bind(this);
        this.registerModule = this.registerModule.bind(this);
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 初始化所有服务
     */
    async initServices() {
        if (this.initialized) return;

        try {
            console.log('🔧 正在初始化服务...');

            // 按依赖顺序加载服务
            const serviceNames = Object.keys(this.services);
            const sorted = this.topologicalSort(serviceNames, (name) => {
                return this.services[name].dependencies || [];
            });

            for (const name of sorted) {
                await this.loadService(name);
            }

            this.initialized = true;
            store.set('servicesInitialized', true);
            console.log('✅ 所有服务初始化完成');

        } catch (error) {
            console.error('服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * @private
     * @param {string} name - 服务名称
     * @returns {Promise<void>}
     * @description 加载单个服务
     */
    async loadService(name) {
        if (this.services[name].loaded) return;

        try {
            console.log(`📦 加载服务: ${name}`);

            // 确保依赖已加载
            const deps = this.services[name].dependencies || [];
            for (const dep of deps) {
                if (!this.services[dep]?.loaded) {
                    await this.loadService(dep);
                }
            }

            // 动态导入服务模块
            const module = await import(`./${name}.js`);

            // 获取服务实例
            let instance = module.default || module[name];
            if (typeof instance === 'function') {
                instance = new instance();
            }

            this.services[name].instance = instance;
            this.services[name].loaded = true;

            store.set(`service:${name}`, instance);

            console.log(`✅ 服务 ${name} 加载完成`);

        } catch (error) {
            console.error(`服务 ${name} 加载失败:`, error);
            throw error;
        }
    }

    /**
     * @public
     * @param {string} name - 模块名称
     * @returns {Promise<any>} 模块实例
     * @description 加载模块
     * 
     * @example
     * const dashboard = await loadModule('dashboard');
     */
    async loadModule(name) {
        // 检查缓存
        if (this.moduleCache.has(name)) {
            return this.moduleCache.get(name);
        }

        // 检查是否正在加载
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const promise = this._loadModuleInternal(name);
        this.loadingPromises.set(name, promise);

        try {
            const module = await promise;
            this.moduleCache.set(name, module);
            return module;
        } finally {
            this.loadingPromises.delete(name);
        }
    }

    /**
     * @private
     * @param {string} name - 模块名称
     * @returns {Promise<any>} 模块实例
     * @description 内部加载模块
     */
    async _loadModuleInternal(name) {
        try {
            console.log(`📦 加载模块: ${name}`);

            // 检查模块定义
            if (!this.modules[name]) {
                throw new Error(`模块 ${name} 未注册`);
            }

            // 加载依赖
            const deps = this.modules[name].dependencies || [];
            for (const dep of deps) {
                await this.loadModule(dep);
            }

            // 动态导入模块
            try {
                // 尝试从 modules 目录加载
                const module = await import(`/js/modules/${name}/index.js`);
                const moduleExports = module.default || module;

                // 初始化模块
                if (typeof moduleExports.init === 'function') {
                    await moduleExports.init();
                }

                this.modules[name].instance = moduleExports;
                this.modules[name].loaded = true;

                // 更新已加载模块列表
                const loadedModules = store.get('loadedModules') || [];
                if (!loadedModules.includes(name)) {
                    loadedModules.push(name);
                    store.set('loadedModules', loadedModules);
                }

                console.log(`✅ 模块 ${name} 加载完成`);
                return moduleExports;

            } catch (error) {
                // 如果加载失败，尝试使用备用的HTML页面
                console.warn(`模块 ${name} JS加载失败，使用HTML页面`, error);

                // 返回一个基本的模块对象
                const fallbackModule = {
                    name,
                    version: '1.0.0',
                    loaded: true,
                    render: (params) => {
                        console.log(`渲染模块 ${name}，参数:`, params);
                    }
                };

                this.modules[name].instance = fallbackModule;
                this.modules[name].loaded = true;

                return fallbackModule;
            }

        } catch (error) {
            console.error(`模块 ${name} 加载失败:`, error);
            throw error;
        }
    }

    /**
     * @public
     * @returns {Promise<void>}
     * @description 加载所有模块
     */
    async loadAllModules() {
        const names = Object.keys(this.modules);
        console.log(`📦 加载所有模块 (${names.length}个)`);

        // 并发加载，但限制并发数量
        const batchSize = 3;
        const results = [];

        for (let i = 0; i < names.length; i += batchSize) {
            const batch = names.slice(i, i + batchSize);
            const batchResults = await Promise.allSettled(
                batch.map(name => this.loadModule(name))
            );
            results.push(...batchResults);
        }

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        console.log(`✅ 模块加载完成: ${successCount}成功, ${failCount}失败`);

        store.set('allModulesLoaded', true);
    }

    /**
     * @public
     * @param {string} name - 服务名称
     * @returns {any|null} 服务实例
     * @description 获取服务实例
     */
    getService(name) {
        if (this.services[name]?.loaded) {
            return this.services[name].instance;
        }
        console.warn(`服务 ${name} 未加载`);
        return null;
    }

    /**
     * @public
     * @param {string} name - 模块名称
     * @returns {any|null} 模块实例
     * @description 获取模块实例
     */
    getModule(name) {
        if (this.moduleCache.has(name)) {
            return this.moduleCache.get(name);
        }
        if (this.modules[name]?.loaded) {
            return this.modules[name].instance;
        }
        console.warn(`模块 ${name} 未加载`);
        return null;
    }

    /**
     * @public
     * @param {string} name - 服务名称
     * @param {ServiceConfig} config - 服务配置
     * @description 注册自定义服务
     */
    registerService(name, config) {
        this.services[name] = {
            name,
            version: config.version || '1.0.0',
            dependencies: config.dependencies || [],
            instance: config.instance || null,
            loaded: false,
            ...config
        };
    }

    /**
     * @public
     * @param {string} name - 模块名称
     * @param {ModuleConfig} config - 模块配置
     * @description 注册自定义模块
     */
    registerModule(name, config) {
        this.modules[name] = {
            name,
            version: config.version || '1.0.0',
            dependencies: config.dependencies || [],
            components: config.components || {},
            loaded: false,
            instance: null,
            ...config
        };
    }

    /**
     * @private
     * @param {string[]} items - 项目列表
     * @param {function(string): string[]} getDependencies - 获取依赖的函数
     * @returns {string[]} 排序后的列表
     * @description 拓扑排序（按依赖顺序）
     */
    topologicalSort(items, getDependencies) {
        const visited = new Set();
        const result = [];

        function visit(item) {
            if (visited.has(item)) return;
            visited.add(item);

            const deps = getDependencies(item) || [];
            for (const dep of deps) {
                if (items.includes(dep)) {
                    visit(dep);
                }
            }

            result.push(item);
        }

        for (const item of items) {
            visit(item);
        }

        return result;
    }

    /**
     * @public
     * @returns {ServiceStatus} 服务状态
     * @description 检查服务状态
     */
    getStatus() {
        const services = {};
        for (const [name, service] of Object.entries(this.services)) {
            services[name] = {
                loaded: service.loaded,
                version: service.version,
                dependencies: service.dependencies
            };
        }

        const modules = {};
        for (const [name, module] of Object.entries(this.modules)) {
            modules[name] = {
                loaded: module.loaded,
                version: module.version,
                dependencies: module.dependencies
            };
        }

        return {
            initialized: this.initialized,
            services,
            modules,
            cacheSize: this.moduleCache.size
        };
    }

    /**
     * @public
     * @description 清除模块缓存
     */
    clearCache() {
        this.moduleCache.clear();
        this.loadingPromises.clear();
        for (const name of Object.keys(this.modules)) {
            this.modules[name].loaded = false;
            this.modules[name].instance = null;
        }
        store.remove('loadedModules');
        console.log('🧹 模块缓存已清除');
    }
}

// 创建单例实例
/**
 * @global
 * @type {ServiceManager}
 * @description 全局服务管理器实例
 */
export const serviceManager = new ServiceManager();

// 便捷导出
export const initServices = serviceManager.initServices.bind(serviceManager);
export const loadModule = serviceManager.loadModule.bind(serviceManager);
export const loadAllModules = serviceManager.loadAllModules.bind(serviceManager);
export const getService = serviceManager.getService.bind(serviceManager);
export const getModule = serviceManager.getModule.bind(serviceManager);
export const registerService = serviceManager.registerService.bind(serviceManager);
export const registerModule = serviceManager.registerModule.bind(serviceManager);

// 全局暴露
if (typeof window !== 'undefined') {
    window.serviceManager = serviceManager;
}

export default serviceManager;