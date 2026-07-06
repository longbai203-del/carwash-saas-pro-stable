/**
 * 模块加载器 - 负责动态加载模块
 */

const ModuleLoader = {
    currentModule: null,
    container: null,

    init: function(containerId) {
        this.container = document.getElementById(containerId) || document.getElementById('mainContent');
        if (!this.container) {
            console.warn('⚠️ 主容器未找到，使用 body');
            this.container = document.body;
        }
        console.log('✅ ModuleLoader 已初始化');
        
        // 加载默认模块
        const defaultModule = 'dashboard';
        this.load(defaultModule);
    },

    load: function(moduleName) {
        if (!moduleName) {
            console.error('❌ 模块名不能为空');
            return;
        }

        const config = window.MODULE_CONFIG;
        if (!config) {
            console.error('❌ MODULE_CONFIG 未加载');
            this.showError('系统配置未加载，请刷新页面重试');
            return;
        }

        const moduleConfig = config[moduleName];
        if (!moduleConfig) {
            console.error('❌ 模块 "' + moduleName + '" 未找到');
            this.showError('模块 "' + moduleName + '" 不存在');
            return;
        }

        console.log('📦 加载模块: ' + moduleName + ' (' + moduleConfig.path + ')');
        this.currentModule = moduleName;

        // 更新侧边栏高亮
        if (window.SidebarComponent && typeof SidebarComponent.setActive === 'function') {
            SidebarComponent.setActive(moduleName);
        }

        this.loadHTML(moduleConfig.path, moduleName);
    },

    loadHTML: function(path, moduleName) {
        var container = this.container;
        if (!container) {
            console.error('❌ 容器不存在');
            return;
        }

        container.innerHTML = 
            '<div class="flex items-center justify-center h-64">' +
                '<div class="text-center">' +
                    '<i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>' +
                    '<p class="mt-4 text-gray-500">加载中...</p>' +
                '</div>' +
            '</div>';

        fetch(path)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.text();
            })
            .then(function(html) {
                if (html.includes('404') || html.includes('Not Found')) {
                    throw new Error('页面不存在 (404)');
                }
                
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var bodyContent = doc.body.innerHTML;
                
                if (!bodyContent || bodyContent.trim().length === 0) {
                    throw new Error('页面内容为空');
                }

                container.innerHTML = bodyContent;
                ModuleLoader.loadJS(moduleName);

                var event = new CustomEvent('moduleLoaded', { 
                    detail: { module: moduleName, path: path } 
                });
                document.dispatchEvent(event);

                console.log('✅ 模块 "' + moduleName + '" 加载成功');
            })
            .catch(function(error) {
                console.error('❌ 加载模块 "' + moduleName + '" 失败:', error);
                ModuleLoader.showError('加载失败: ' + error.message);
            });
    },

    loadJS: function(moduleName) {
        var config = window.MODULE_CONFIG;
        if (!config || !config[moduleName]) return;

        var jsPath = config[moduleName].path.replace('.html', '.js');
        var scriptId = 'module-js-' + moduleName;
        
        if (document.getElementById(scriptId)) {
            console.log('📄 JS 已加载: ' + moduleName);
            return;
        }

        var script = document.createElement('script');
        script.id = scriptId;
        script.type = 'module';
        script.src = jsPath;
        script.onload = function() {
            console.log('✅ JS 加载成功: ' + moduleName);
            var event = new CustomEvent('moduleReady', { 
                detail: { module: moduleName } 
            });
            document.dispatchEvent(event);
        };
        script.onerror = function() {
            console.warn('⚠️ JS 加载失败: ' + moduleName);
        };
        document.head.appendChild(script);
    },

    showError: function(message) {
        var container = this.container;
        if (!container) return;
        
        container.innerHTML = 
            '<div class="flex items-center justify-center h-64">' +
                '<div class="text-center">' +
                    '<i class="fas fa-exclamation-circle text-5xl text-red-500"></i>' +
                    '<p class="mt-4 text-lg font-semibold text-red-600">' + message + '</p>' +
                    '<button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">' +
                        '<i class="fas fa-sync"></i> 刷新页面' +
                    '</button>' +
                '</div>' +
            '</div>';
    },

    reload: function() {
        if (this.currentModule) {
            this.load(this.currentModule);
        } else {
            this.load('dashboard');
        }
    }
};

window.ModuleLoader = ModuleLoader;

// 等待配置加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (window.MODULE_CONFIG) {
        ModuleLoader.init('mainContent');
    } else {
        var checkConfig = setInterval(function() {
            if (window.MODULE_CONFIG) {
                clearInterval(checkConfig);
                ModuleLoader.init('mainContent');
            }
        }, 100);
    }
});

console.log('✅ ModuleLoader 已加载');