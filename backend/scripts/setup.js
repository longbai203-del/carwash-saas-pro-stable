/**
 * 项目初始化脚本
 * 设置开发环境
 * 
 * @module scripts/setup
 * 
 * @example
 * node scripts/setup.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

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
 * 检查环境变量
 */
async function checkEnvironment() {
  log('\n📋 检查环境变量...', 'cyan');

  const envPath = path.join(projectRoot, 'backend/.env');
  const envExamplePath = path.join(projectRoot, 'backend/.env.example');

  // 检查 .env 文件
  try {
    await fs.access(envPath);
    log('  ✅ .env 文件存在', 'green');
    
    const content = await fs.readFile(envPath, 'utf8');
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
    const missing = requiredVars.filter(v => !content.includes(`${v}=`));
    
    if (missing.length > 0) {
      log(`  ⚠️ 缺少环境变量: ${missing.join(', ')}`, 'yellow');
    } else {
      log('  ✅ 所有必需的环境变量已配置', 'green');
    }
  } catch {
    // 创建 .env 文件
    log('  ⚠️ .env 文件不存在，正在创建...', 'yellow');
    
    const exampleContent = await fs.readFile(envExamplePath, 'utf8');
    await fs.writeFile(envPath, exampleContent, 'utf8');
    log('  ✅ .env 文件已创建，请编辑并填入实际值', 'green');
  }
}

/**
 * 安装依赖
 */
async function installDependencies() {
  log('\n📦 安装依赖...', 'cyan');
  
  try {
    log('  安装 backend 依赖...', 'gray');
    await execAsync('cd backend && npm install', { stdio: 'inherit' });
    log('  ✅ backend 依赖安装完成', 'green');
  } catch (error) {
    log(`  ❌ 安装失败: ${error.message}`, 'red');
  }
}

/**
 * 创建必要的目录
 */
async function createDirectories() {
  log('\n📁 创建目录结构...', 'cyan');

  const dirs = [
    'backend/database/archive',
    'backend/database/migration',
    'backend/database/schema',
    'backend/tests/services',
    'backend/tests/business-core',
    'frontend/src/components',
    'frontend/src/config',
    'frontend/src/hooks',
    'frontend/src/layouts',
    'frontend/src/router',
    'frontend/src/services',
    'frontend/src/store',
    'frontend/src/styles',
    'frontend/src/utils'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(projectRoot, dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      log(`  ✅ ${dir}`, 'green');
    } catch {
      // 目录已存在
    }
  }
}

/**
 * 生成 module-map.json
 */
async function generateModuleMap() {
  log('\n📄 生成模块映射...', 'cyan');

  const modules = [
    { id: '01-dashboard', name: '仪表盘', icon: 'home' },
    { id: '02-pos', name: 'POS收银', icon: 'cash-register' },
    { id: '03-orders', name: '订单管理', icon: 'clipboard' },
    { id: '04-products', name: '商品管理', icon: 'box' },
    { id: '05-customers', name: '客户管理', icon: 'users' },
    { id: '06-marketing', name: '营销管理', icon: 'megaphone' },
    { id: '07-inventory', name: '库存管理', icon: 'package' },
    { id: '08-purchasing', name: '采购管理', icon: 'truck' },
    { id: '09-finance', name: '财务管理', icon: 'dollar-sign' },
    { id: '10-hr', name: '人力资源管理', icon: 'user-plus' },
    { id: '11-saas', name: 'SaaS管理', icon: 'cloud' },
    { id: '12-system', name: '系统管理', icon: 'settings' },
    { id: '13-analytics', name: '数据分析', icon: 'chart-bar' },
    { id: '14-settings', name: '设置中心', icon: 'cog' },
    { id: '15-ai', name: 'AI智能分析', icon: 'brain' }
  ];

  const map = {
    version: '2.0.0',
    appName: '洗车SaaS',
    basePath: '/',
    defaultModule: 'dashboard',
    defaultPage: 'dashboard',
    routes: {},
    modules: {}
  };

  modules.forEach(m => {
    map.routes[m.id] = `/modules/${m.id}/${m.id}.html`;
    map.modules[m.id] = {
      id: m.id,
      name: m.name,
      path: `/modules/${m.id}`,
      order: parseInt(m.id.split('-')[0]),
      enabled: true,
      icon: m.icon,
      module: m.id
    };
  });

  const mapPath = path.join(projectRoot, 'frontend/module-map.json');
  await fs.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf8');
  log('  ✅ module-map.json 已生成', 'green');
}

/**
 * 主函数
 */
async function main() {
  log('========================================', 'cyan');
  log('  🚀 洗车SaaS - 项目初始化', 'cyan');
  log('========================================', 'cyan');

  await createDirectories();
  await checkEnvironment();
  await generateModuleMap();
  await installDependencies();

  log('\n========================================', 'green');
  log('  ✅ 项目初始化完成!', 'green');
  log('========================================', 'green');
  log('\n📋 下一步:', 'cyan');
  log('  1. 编辑 backend/.env 填入实际的 Supabase 配置', 'gray');
  log('  2. 运行 npm run dev 启动开发服务器', 'gray');
  log('  3. 访问 http://localhost:3000', 'gray');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    log(`❌ 错误: ${err.message}`, 'red');
    process.exit(1);
  });
}

export default main;