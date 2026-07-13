/**
 * 测试运行脚本
 * 运行所有测试
 * 
 * @module scripts/test
 * 
 * @example
 * node scripts/test.js           # 运行所有测试
 * node scripts/test.js --watch   # 监听模式
 * node scripts/test.js --coverage # 生成覆盖率报告
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

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
 * 检查 vitest 是否安装
 */
async function checkVitest() {
  try {
    const pkgPath = path.join(backendDir, 'package.json');
    const pkg = JSON.parse(await import('fs/promises').then(fs => fs.readFile(pkgPath, 'utf8')));
    const hasVitest = pkg.devDependencies?.vitest || pkg.dependencies?.vitest;
    if (!hasVitest) {
      log('⚠️ vitest 未安装，正在安装...', 'yellow');
      await execAsync('cd backend && npm install vitest @vitest/coverage-v8 --save-dev');
      log('✅ vitest 安装完成', 'green');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 运行测试
 */
async function runTests(args = []) {
  log('🧪 运行测试...', 'cyan');

  const watch = args.includes('--watch');
  const coverage = args.includes('--coverage');
  const verbose = args.includes('--verbose');

  let command = 'npx vitest';
  
  if (watch) command += ' --watch';
  if (coverage) command += ' --coverage';
  if (verbose) command += ' --verbose';

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: backendDir,
      env: { ...process.env, NODE_ENV: 'test' }
    });

    if (stdout) log(stdout, 'gray');
    if (stderr) log(stderr, 'yellow');

    log('✅ 测试完成', 'green');
    return true;
  } catch (error) {
    if (error.stdout) log(error.stdout, 'gray');
    if (error.stderr) log(error.stderr, 'red');
    log(`❌ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  // 检查 vitest
  await checkVitest();

  // 运行测试
  const success = await runTests(args);

  if (!success) {
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTests, checkVitest };
export default main;