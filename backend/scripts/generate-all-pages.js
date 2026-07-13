/**
 * 页面生成脚本
 * 自动生成所有模块的页面文件
 * 
 * @module scripts/generate-all-pages
 * 
 * @example
 * node scripts/generate-all-pages.js          # 生成所有页面
 * node scripts/generate-all-pages.js --dry-run # 预览要生成的文件
 * node scripts/generate-all-pages.js --force   # 强制覆盖已有文件
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const frontendDir = path.join(projectRoot, 'frontend');
const modulesDir = path.join(frontendDir, 'modules');

// 模块配置
const MODULES = [
  { id: '01-dashboard', name: '仪表盘', icon: '📊' },
  { id: '02-pos', name: 'POS收银', icon: '💰' },
  { id: '03-orders', name: '订单管理', icon: '📋' },
  { id: '04-products', name: '商品管理', icon: '📦' },
  { id: '05-customers', name: '客户管理', icon: '👥' },
  { id: '06-marketing', name: '营销管理', icon: '📢' },
  { id: '07-inventory', name: '库存管理', icon: '📦' },
  { id: '08-purchasing', name: '采购管理', icon: '🛒' },
  { id: '09-finance', name: '财务管理', icon: '💰' },
  { id: '10-hr', name: '人力资源管理', icon: '👤' },
  { id: '11-saas', name: 'SaaS管理', icon: '☁️' },
  { id: '12-system', name: '系统管理', icon: '⚙️' },
  { id: '13-analytics', name: '数据分析', icon: '📊' },
  { id: '14-settings', name: '设置中心', icon: '⚙️' },
  { id: '15-ai', name: 'AI智能分析', icon: '🧠' },
];

/**
 * 颜色工具
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 生成模块文件
 * @param {Object} module - 模块配置
 * @param {boolean} force - 是否强制覆盖
 * @param {boolean} dryRun - 是否仅预览
 * @returns {Promise<Array>} 生成的文件列表
 */
async function generateModuleFiles(module, force = false, dryRun = false) {
  const { id, name, icon } = module;
  const dir = path.join(modulesDir, id);
  const files = [];

  // 文件模板
  const templates = {
    html: `<!--
  ${name}模块HTML
  由JavaScript动态渲染
-->
<!DOCTYPE html>
<div id="${id}-module">
  <div class="loading-container">
    <div class="spinner"></div>
    <p>加载${name}...</p>
  </div>
</div>
`,
    css: `/**
 * ${name}模块样式
 * 由JavaScript动态注入
 */

/* 基础样式 */
.module-container {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e8e8e8;
}

.module-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.module-badge {
  background: #4fc3f7;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.module-content {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.module-info {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.module-info p {
  margin: 4px 0;
  color: #0d47a1;
}

.module-placeholder {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  color: #888;
}

.module-placeholder p {
  margin: 8px 0;
}
`,
    moduleJson: JSON.stringify({
      id,
      name,
      icon,
      version: '1.0.0',
      author: 'Carwash SaaS Team',
      description: `${name}模块`,
      dependencies: [],
      createdAt: new Date().toISOString()
    }, null, 2),
    js: `/**
 * ${name}模块
 * 处理${name}相关的业务逻辑
 * 
 * @module modules/${id}
 * 
 * @example
 * import { init, destroy, onShow, onHide } from './${id}.js'
 */

import { api } from '../../src/services/api.js';
import { store } from '../../src/store/index.js';
import { formatDate, formatCurrency, timeAgo } from '../../src/utils/helpers.js';

/**
 * 模块状态
 */
let state = {
  initialized: false,
  data: [],
  isLoading: false,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  }
};

/**
 * 初始化模块
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} 模块API
 */
export function init(container) {
  if (state.initialized) {
    console.warn('${name} module already initialized');
    return getApi();
  }

  console.log('${icon} Initializing ${name} module...');
  
  state.container = container;
  state.initialized = true;

  // 加载数据
  loadData();

  console.log('✅ ${name} module initialized');

  return getApi();
}

/**
 * 加载数据
 */
async function loadData() {
  state.isLoading = true;
  render();

  try {
    // 模拟API调用
    // const response = await api.get('/${id}');
    // if (response?.success) {
    //   state.data = response.data || [];
    // }
    
    // 模拟数据
    state.data = [
      { id: 1, name: '示例数据 1', created_at: new Date().toISOString() },
      { id: 2, name: '示例数据 2', created_at: new Date().toISOString() },
    ];
    state.pagination.total = state.data.length;
  } catch (error) {
    console.error('Failed to load data:', error);
  }

  state.isLoading = false;
  render();
}

/**
 * 渲染界面
 */
function render() {
  const { container } = state;
  if (!container) return;

  container.innerHTML = \`
    <div class="module-container">
      <div class="module-header">
        <h2>${icon} ${name}</h2>
        <span class="module-badge">v1.0</span>
      </div>
      <div class="module-content">
        <div class="module-info">
          <p>✅ 模块加载成功</p>
          <p>📌 模块ID: ${id}</p>
          <p>🕐 加载时间: <span class="load-time">\${new Date().toLocaleString()}</span></p>
        </div>
        <div class="module-placeholder">
          <p>这里是 ${name} 模块的内容区域</p>
          <p>功能开发中...</p>
        </div>
      </div>
    </div>
  \`;

  // 应用样式
  applyStyles();
}

/**
 * 应用样式
 */
function applyStyles() {
  const styleId = '${id}-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = \`
    /* ${name} 模块样式 */
    .module-container {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e8e8e8;
    }
    .module-header h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
    }
    .module-badge {
      background: #4fc3f7;
      color: #fff;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
    }
    .module-content {
      background: #fafafa;
      border-radius: 8px;
      padding: 20px;
    }
    .module-info {
      background: #e3f2fd;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .module-info p {
      margin: 4px 0;
      color: #0d47a1;
    }
    .module-placeholder {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      color: #888;
    }
    .module-placeholder p {
      margin: 8px 0;
    }
  \`;
  document.head.appendChild(style);
}

/**
 * 模块显示时调用
 */
export function onShow() {
  console.log('👁️ ${name} module shown');
  loadData();
}

/**
 * 模块隐藏时调用
 */
export function onHide() {
  console.log('🙈 ${name} module hidden');
}

/**
 * 销毁模块
 */
export function destroy() {
  console.log('🗑️ Destroying ${name} module...');
  
  const style = document.getElementById('${id}-styles');
  if (style) style.remove();

  state.initialized = false;
  state.container = null;
  state.data = [];

  console.log('✅ ${name} module destroyed');
}

/**
 * 获取模块API
 */
function getApi() {
  return {
    reload: loadData,
    getData: () => [...state.data],
    onShow,
    onHide,
    destroy
  };
}

export default {
  init,
  destroy,
  onShow,
  onHide
};
`
  };

  const fileNames = [
    { name: `${id}.html`, content: templates.html },
    { name: `${id}.css`, content: templates.css },
    { name: `${id}.js`, content: templates.js },
    { name: 'module.json', content: templates.moduleJson }
  ];

  for (const file of fileNames) {
    const filePath = path.join(dir, file.name);
    
    // 检查文件是否已存在
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (exists && !force) {
      log(`  ⏭️ 跳过 ${file.name} (已存在)`, 'gray');
      continue;
    }

    if (dryRun) {
      log(`  📄 将生成 ${file.name}`, 'cyan');
      files.push(filePath);
      continue;
    }

    // 确保目录存在
    await fs.mkdir(dir, { recursive: true });
    
    // 写入文件
    await fs.writeFile(filePath, file.content, 'utf8');
    log(`  ✅ 生成 ${file.name}`, 'green');
    files.push(filePath);
  }

  return files;
}

/**
 * 生成 module-map.json
 */
async function generateModuleMap(force = false, dryRun = false) {
  const mapPath = path.join(frontendDir, 'module-map.json');
  
  if (dryRun) {
    log('📄 将生成 module-map.json', 'cyan');
    return;
  }

  // 检查文件是否已存在
  const exists = await fs.access(mapPath).then(() => true).catch(() => false);
  
  if (exists && !force) {
    log('⏭️ 跳过 module-map.json (已存在)', 'gray');
    return;
  }

  const map = {
    version: '2.0.0',
    appName: '洗车SaaS',
    basePath: '/',
    defaultModule: 'dashboard',
    defaultPage: 'dashboard',
    routes: {},
    modules: {}
  };

  MODULES.forEach(module => {
    const id = module.id;
    const name = module.name;
    const moduleId = id.replace('0', '').replace('1', '');
    
    map.routes[id] = `/modules/${id}/${id}.html`;
    map.modules[id] = {
      id: id,
      name: name,
      path: `/modules/${id}`,
      order: parseInt(id.split('-')[0]),
      enabled: true,
      icon: module.icon.replace(/[^\w]/g, '').toLowerCase() || 'file',
      module: id
    };
  });

  await fs.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf8');
  log('✅ 生成 module-map.json', 'green');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  log('🚀 开始生成所有页面...', 'yellow');
  
  if (dryRun) {
    log('📋 预览模式 (--dry-run)', 'cyan');
  }
  
  if (force) {
    log('⚠️ 强制覆盖模式 (--force)', 'yellow');
  }

  log(`\n📁 目标目录: ${modulesDir}`, 'gray');

  let totalFiles = 0;

  for (const module of MODULES) {
    log(`\n📦 生成 ${module.name} (${module.id})`, 'cyan');
    const files = await generateModuleFiles(module, force, dryRun);
    totalFiles += files.length;
  }

  // 生成 module-map.json
  log('\n📦 生成模块映射', 'cyan');
  await generateModuleMap(force, dryRun);

  log(`\n✅ 完成! 共生成 ${totalFiles} 个文件`, 'green');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    log(`❌ 错误: ${err.message}`, 'red');
    process.exit(1);
  });
}

export { generateModuleFiles, generateModuleMap, MODULES };
export default main;