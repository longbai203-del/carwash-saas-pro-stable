/**
 * loader.js - 模块加载器 V5
 * 统一加载 HTML + JS，确保 DOM 渲染完成后再初始化
 */
(function() {
    'use strict';

    window.ModuleLoader = {
        _loaded: {},
        _active: null,
        _loading: false,

        // ===== 模块配置 =====
        _modules: {
            dashboard: { obj: 'DashboardModule', label: '仪表板' },
            cashier: { obj: 'CashierModule', label: 'POS收银' },
            orders: { obj: 'OrdersModule', label: '订单管理' },
            inventory: { obj: 'InventoryModule', label: '库存管理' },
            customers: { obj: 'CustomersModule', label: '客户管理' },
            attendance: { obj: 'AttendanceModule', label: '考勤管理' },
            reports: { obj: 'ReportsModule', label: '财务管理' },
            employees: { obj: 'EmployeesModule', label: '员工审核' },
            audit: { obj: 'AuditModule', label: '审计日志' },
            settings: { obj: 'SettingsModule', label: '系统设置' }
        },

        // ===== 加载模块 =====
        load: async function(moduleName) {
            // 防止重复加载
            if (this._loading) {
                console.log('[Loader] 正在加载中，跳过');
                return;
            }

            var container = document.getElementById('moduleContent');
            if (!container) {
                console.error('[Loader] 容器不存在');
                return;
            }

            // 权限检查
            var user = AppStore.get('currentUser');
            if (user) {
                var perms = AppConfig.permissions[user.role] || [];
                if (!perms.includes(moduleName)) {
                    if (window.AppUtils && AppUtils.toast) {
                        AppUtils.toast('您没有权限访问此页面', 'warning');
                    }
                    return;
                }
            }

            // 销毁旧模块
            if (this._active && this._loaded[this._active]) {
                var old = this._loaded[this._active];
                if (typeof old.destroy === 'function') {
                    old.destroy();
                }
                delete this._loaded[this._active];
            }

            this._loading = true;
            container.innerHTML = '<div class="text-center text-gray-400 py-20">⏳ 加载中...</div>';

            try {
                var module = this._modules[moduleName];
                if (!module) throw new Error('模块未配置: ' + moduleName);

                // 1. 加载 HTML
                var htmlPath = 'modules/' + moduleName + '/' + moduleName + '.html';
                var htmlRes = await fetch(htmlPath);
                if (!htmlRes.ok) throw new Error('HTML加载失败: ' + htmlRes.status);
                container.innerHTML = await htmlRes.text();

                // 2. 等待 DOM 渲染
                await this._waitForDOM(moduleName);

                // 3. 加载 JS
                var jsPath = 'modules/' + moduleName + '/' + moduleName + '.js';
                var oldScript = document.querySelector('script[data-module="' + moduleName + '"]');
                if (oldScript) oldScript.remove();

                var self = this;
                await new Promise(function(resolve, reject) {
                    var script = document.createElement('script');
                    script.setAttribute('data-module', moduleName);
                    script.type = 'text/javascript';
                    script.src = jsPath + '?v=' + Date.now();

                    script.onload = function() {
                        var attempts = 0;
                        var maxAttempts = 50;
                        var check = function() {
                            attempts++;
                            var moduleObj = window[module.obj];
                            if (moduleObj && typeof moduleObj.init === 'function') {
                                self._loaded[moduleName] = moduleObj;
                                self._active = moduleName;
                                // 等待模块初始化完成
                                var result = moduleObj.init();
                                if (result && typeof result.then === 'function') {
                                    result.then(resolve).catch(reject);
                                } else {
                                    resolve();
                                }
                            } else if (attempts < maxAttempts) {
                                setTimeout(check, 100);
                            } else {
                                reject(new Error('模块 ' + module.obj + ' 未注册'));
                            }
                        };
                        check();
                    };

                    script.onerror = function() {
                        reject(new Error('JS加载失败: ' + jsPath));
                    };
                    document.head.appendChild(script);
                });

                this._loading = false;
                console.log('[Loader] 加载完成: ' + moduleName);

            } catch (error) {
                this._loading = false;
                console.error('[Loader] 加载失败:', error);
                container.innerHTML = `
                    <div class="text-center py-20">
                        <div class="text-red-500 text-xl">❌ 模块加载失败</div>
                        <div class="text-gray-400 text-sm mt-2">${error.message}</div>
                        <button onclick="ModuleLoader.load('${moduleName}')" class="btn-primary mt-4 px-6 py-2 rounded-lg">重新加载</button>
                    </div>
                `;
            }
        },

        // ===== 等待 DOM 渲染 =====
        _waitForDOM: function(moduleName) {
            return new Promise(function(resolve) {
                var attempts = 0;
                var maxAttempts = 50;
                var check = function() {
                    attempts++;
                    // 检查模块特定的 DOM 元素是否存在
                    var el = document.getElementById(moduleName + 'Container');
                    if (el || attempts > maxAttempts) {
                        // 额外等待 50ms 确保渲染完成
                        setTimeout(resolve, 50);
                    } else {
                        setTimeout(check, 50);
                    }
                };
                // 第一次检查延迟 30ms
                setTimeout(check, 30);
            });
        },

        // ===== 获取当前激活的模块 =====
        getActive: function() {
            return this._active;
        },

        // ===== 获取模块实例 =====
        getModule: function(moduleName) {
            return this._loaded[moduleName] || null;
        },

        // ===== 预加载模块 =====
        preload: function(moduleName) {
            try {
                var module = this._modules[moduleName];
                if (!module) return;
                var jsPath = 'modules/' + moduleName + '/' + moduleName + '.js';
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = jsPath + '?v=' + Date.now();
                document.head.appendChild(script);
                return new Promise(function(resolve) {
                    script.onload = function() {
                        var moduleObj = window[module.obj];
                        if (moduleObj && typeof moduleObj.init === 'function') {
                            window.ModuleLoader._loaded[moduleName] = moduleObj;
                        }
                        resolve();
                    };
                    script.onerror = function() { resolve(); };
                    setTimeout(resolve, 5000);
                });
            } catch (e) {
                console.warn('[Loader] 预加载失败:', e);
                return Promise.resolve();
            }
        }
    };

    console.log('[Loader] V5 加载完成');
})();