/**
 * 重构脚本 - v1 到 v2 迁移
 * 将旧项目结构迁移到新架构
 * 
 * @module scripts/refactor-to-v2
 * 
 * @example
 * node scripts/refactor-to-v2.js --dry-run
 * node scripts/refactor-to-v2.js --execute
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

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
 * 重构计划
 */
const REFACTOR_PLAN = {
  // 要移动的目录
  moves: [
    { from: 'backend/api', to: 'backend/src/api' },
    { from: 'backend/business-core', to: 'backend/business-core' }, // 保留
    { from: 'backend/database', to: 'backend/database' }, // 保留
    { from: 'backend/scripts', to: 'backend/scripts' }, // 保留
  ],
  // 要删除的目录
  delete: [
    'backend/old-api',
    'backend/old-services',
    'backend/old-auth',
    'frontend/old-modules',
    'frontend/legacy',
    'backups/old-auth',
    'backups/old-sidebars'
  ],
  // 要创建的目录
  create: [
    'backend/src/api',
    'backend/src/middleware',
    'backend/src/services',
    'backend/src/shared/auth',
    'backend/src/shared/constants',
    'backend/src/shared/errors',
    'backend/src/shared/lib',
    'backend/src/shared/responses',
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
  ]
};

/**
 * 检查文件是否存在
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 删除目录
 */
async function deleteDirectory(dirPath, dryRun = false) {
  if (!await fileExists(dirPath)) {
    log(`  ⏭️ 跳过 ${dirPath} (不存在)`, 'gray');
    return false;
  }

  if (dryRun) {
    log(`  🗑️ 将删除: ${dirPath}`, 'yellow');
    return true;
  }

  await fs.rm(dirPath, { recursive: true, force: true });
  log(`  ✅ 删除: ${dirPath}`, 'green');
  return true;
}

/**
 * 创建目录
 */
async function createDirectory(dirPath, dryRun = false) {
  if (dryRun) {
    log(`  📁 将创建: ${dirPath}`, 'cyan');
    return true;
  }

  await fs.mkdir(dirPath, { recursive: true });
  log(`  ✅ 创建: ${dirPath}`, 'green');
  return true;
}

/**
 * 移动文件或目录
 */
async function moveItem(from, to, dryRun = false) {
  if (!await fileExists(from)) {
    log(`  ⏭️ 跳过 ${from} (不存在)`, 'gray');
    return false;
  }

  if (await fileExists(to)) {
    log(`  ⏭️ 跳过 ${from} -> ${to} (目标已存在)`, 'yellow');
    return false;
  }

  if (dryRun) {
    log(`  📦 将移动: ${from} -> ${to}`, 'cyan');
    return true;
  }

  // 确保目标目录存在
  await fs.mkdir(path.dirname(to), { recursive: true });
  
  // 移动
  await fs.rename(from, to);
  log(`  ✅ 移动: ${from} -> ${to}`, 'green');
  return true;
}

/**
 * 创建迁移完成标记文件
 */
async function createMigrationFlag(dryRun = false) {
  const flagPath = path.join(projectRoot, '.migrated-v2');
  
  if (dryRun) {
    log('  📄 将创建迁移标记: .migrated-v2', 'cyan');
    return;
  }

  const content = `# 迁移完成
# 日期: ${new Date().toISOString()}
# 版本: v2.0.0

此文件表示项目已从 v1 迁移到 v2 架构。
`;

  await fs.writeFile(flagPath, content, 'utf8');
  log('  ✅ 创建迁移标记: .migrated-v2', 'green');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');

  if (!dryRun && !execute) {
    log('📋 重构预览模式 (使用 --execute 执行)', 'yellow');
    log('   node scripts/refactor-to-v2.js --dry-run  查看将执行的操作', 'gray');
    log('   node scripts/refactor-to-v2.js --execute  执行重构', 'gray');
    log('');
  }

  if (dryRun) {
    log('🔍 预览模式 (--dry-run)', 'cyan');
  }
  
  if (execute) {
    log('🚀 执行重构 (--execute)', 'green');
  }

  log('\n📁 创建目录:', 'yellow');
  for (const dir of REFACTOR_PLAN.create) {
    await createDirectory(dir, dryRun || !execute);
  }

  log('\n📦 移动文件:', 'yellow');
  for (const move of REFACTOR_PLAN.moves) {
    await moveItem(move.from, move.to, dryRun || !execute);
  }

  log('\n🗑️ 删除旧目录:', 'yellow');
  for (const dir of REFACTOR_PLAN.delete) {
    await deleteDirectory(dir, dryRun || !execute);
  }

  log('\n📄 创建迁移标记:', 'yellow');
  await createMigrationFlag(dryRun || !execute);

  if (!execute && !dryRun) {
    log('\n💡 使用 --execute 参数执行实际重构', 'cyan');
  }

  if (execute) {
    log('\n✅ 重构完成!', 'green');
    log('📋 请检查以下事项:', 'cyan');
    log('  1. 确认所有文件已正确移动', 'gray');
    log('  2. 更新 package.json 中的入口路径', 'gray');
    log('  3. 更新 render.yaml 中的启动命令', 'gray');
    log('  4. 运行测试确保功能正常', 'gray');
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    log(`❌ 错误: ${err.message}`, 'red');
    process.exit(1);
  });
}

export default main;