/**
 * 数据库迁移脚本（调用 database/schema/migrate.js）
 * 
 * @module scripts/migrate
 * @description 数据库迁移管理的便捷入口
 * 
 * @example
 * node scripts/migrate.js up
 * node scripts/migrate.js status
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 颜色工具
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  // 检查 .env 文件
  const envPath = path.join(__dirname, '../.env');
  try {
    await import('fs/promises').then(fs => fs.access(envPath));
    log('✅ 环境配置文件存在', 'green');
  } catch {
    log('⚠️ 未找到 .env 文件，请确保已配置 Supabase 环境变量', 'yellow');
  }

  // 执行迁移
  const migrateScript = path.join(__dirname, '../database/schema/migrate.js');
  
  try {
    const { stdout, stderr } = await execAsync(`node ${migrateScript} ${args.join(' ')}`);
    
    if (stdout) log(stdout, 'gray');
    if (stderr) log(stderr, 'yellow');
    
    log('✅ 迁移命令执行完成', 'green');
  } catch (error) {
    log(`❌ 执行失败: ${error.message}`, 'red');
    if (error.stdout) log(error.stdout, 'gray');
    if (error.stderr) log(error.stderr, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;