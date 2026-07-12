/**
 * 模块加载器
 * 负责动态加载和管理应用模块
 */

class ModuleLoader {
    constructor() {
        this.modules = new Map();
        this.loading = new Map();
        this.cache = new Map();
    }

    /**
     * 注册模块
     * @param {string} name - 模块名称
     * @param {Function} loader - 加载函数
     */
    register(name, loader) {
        this.modules.set(name, loader);
    }

    /**
     * 加载模块
     * @param {string} name - 模块名称
     * @returns {Promise<any>} 模块导出
     */
    async load(name) {
        // 检查缓存
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        // 检查是否正在加载
        if (this.loading.has(name)) {
            return this.loading.get(name);
        }

        // 开始加载
        const loader = this.modules.get(name);
        if (!loader) {
            throw new Error(`Module "${name}" not registered`);
        }

        const promise = loader();
        this.loading.set(name, promise);

        try {
            const result = await promise;
            this.cache.set(name, result);
            return result;
        } finally {
            this.loading.delete(name);
        }
    }

    /**
     * 批量加载模块
     * @param {string[]} names - 模块名称列表
     * @returns {Promise<Object>} 模块导出对象
     */
    async loadAll(names) {
        const results = {};
        await Promise.all(names.map(async (name) => {
            results[name] = await this.load(name);
        }));
        return results;
    }

    /**
     * 清除缓存
     * @param {string} name - 可选，指定模块名称
     */
    clearCache(name) {
        if (name) {
            this.cache.delete(name);
        } else {
            this.cache.clear();
        }
    }
}

// 创建单例
export const moduleLoader = new ModuleLoader();

// 默认导出
export default moduleLoader;