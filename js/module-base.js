/**
 * module-base.js - 统一模块基类
 * 所有模块继承此基类，保持生命周期一致
 */
(function() {
    'use strict';

    var ModuleBase = {
        initialized: false,
        moduleName: '',
        events: [],
        timers: [],
        el: {},

        // ===== 生命周期：初始化 =====
        init: function() {
            if (this.initialized) return;
            console.log('[' + this.moduleName + '] 初始化...');

            var self = this;
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    try {
                        self.cacheDom();
                        self.bindEvents();
                        self.loadData();
                        self.initialized = true;
                        console.log('[' + self.moduleName + '] 初始化完成');
                        resolve();
                    } catch (error) {
                        console.error('[' + self.moduleName + '] 初始化失败:', error);
                        reject(error);
                    }
                }, 50);
            });
        },

        // ===== 生命周期：销毁 =====
        destroy: function() {
            console.log('[' + this.moduleName + '] 销毁...');
            this.events.forEach(function(evt) {
                if (evt.el && evt.el.removeEventListener) {
                    evt.el.removeEventListener(evt.event, evt.handler);
                }
            });
            this.events = [];
            this.timers.forEach(function(timer) {
                clearTimeout(timer);
                clearInterval(timer);
            });
            this.timers = [];
            this.initialized = false;
        },

        // ===== 子类重写方法 =====
        cacheDom: function() {},
        bindEvents: function() {},
        loadData: function() {},
        render: function() {},

        // ===== 工具：安全绑定事件 =====
        bindEvent: function(id, event, handler) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener(event, handler);
                this.events.push({ el: el, event: event, handler: handler });
            } else {
                console.warn('[' + this.moduleName + '] 元素不存在: #' + id);
            }
            return el;
        },

        // ===== 工具：安全绑定选择器事件 =====
        bindSelector: function(selector, event, handler) {
            var el = document.querySelector(selector);
            if (el) {
                el.addEventListener(event, handler);
                this.events.push({ el: el, event: event, handler: handler });
            } else {
                console.warn('[' + this.moduleName + '] 元素不存在: ' + selector);
            }
            return el;
        },

        // ===== 工具：安全获取元素 =====
        getEl: function(id) {
            var el = document.getElementById(id);
            if (!el) console.warn('[' + this.moduleName + '] 元素不存在: #' + id);
            return el;
        },

        // ===== 工具：安全获取配置 =====
        getConfig: function(key, defaultValue) {
            var config = AppStore.get('config') || {};
            return config[key] !== undefined ? config[key] : defaultValue;
        },

        // ===== 工具：安全获取当前用户 =====
        getCurrentUser: function() {
            return AppStore.get('currentUser') || {};
        },

        // ===== 工具：安全获取数据 =====
        getData: function(key) {
            return AppStore.get(key) || [];
        },

        // ===== 工具：安全设置数据 =====
        setData: function(key, data) {
            AppStore.set(key, data);
            return this;
        },

        // ===== 工具：Toast =====
        toast: function(msg, type) {
            type = type || 'info';
            if (window.AppUtils && AppUtils.toast) {
                AppUtils.toast(msg, type);
            } else {
                console.log('[' + this.moduleName + '] ' + msg);
            }
            return this;
        },

        // ===== 工具：加载状态 =====
        setLoading: function(container) {
            if (container) {
                container.innerHTML = '<div class="text-center text-gray-400 py-20">⏳ 加载中...</div>';
            }
            return this;
        },

        // ===== 工具：空状态 =====
        setEmpty: function(container, message) {
            if (container) {
                container.innerHTML = '<div class="text-center text-gray-400 py-8">' + (message || '暂无数据') + '</div>';
            }
            return this;
        }
    };

    window.ModuleBase = ModuleBase;
    console.log('[ModuleBase] 加载完成');
})();
