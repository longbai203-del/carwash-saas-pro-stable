/**
 * scripts/setup.js - 项目初始化脚本
 * @module setup
 * @description 初始化项目环境，检查依赖，创建必要目录
 * 
 * 运行: npm run setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ============================================================
// 颜色输出
// ============================================================

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(message) {
    log(`\n📌 ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️ ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

// ============================================================
// 检查Node版本
// ============================================================

function checkNodeVersion() {
    logStep('检查Node.js版本...');

    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);

    if (major < 18) {
        logError(`Node.js ${version} 版本过低，请升级到 v18 或更高版本`);
        process.exit(1);
    }

    logSuccess(`Node.js ${version} 版本符合要求`);
}

// ============================================================
// 检查环境变量
// ============================================================

function checkEnvFile() {
    logStep('检查环境变量文件...');

    const envPath = path.join(rootDir, '.env');
    const envExamplePath = path.join(rootDir, '.env.example');

    if (!fs.existsSync(envPath)) {
        logWarning('.env 文件不存在');
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            logSuccess('已从 .env.example 创建 .env 文件');
            log('请编辑 .env 文件填写实际配置值', 'yellow');
        } else {
            logError('.env.example 文件不存在');
            process.exit(1);
        }
    } else {
        logSuccess('.env 文件已存在');
    }
}

// ============================================================
// 创建必要目录
// ============================================================

function createDirectories() {
    logStep('创建必要目录...');

    const dirs = [
        'logs',
        'tmp',
        'data',
        'backups'
    ];

    dirs.forEach(dir => {
        const dirPath = path.join(rootDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            logSuccess(`创建目录: ${dir}`);
        }
    });
}

// ============================================================
// 安装依赖
// ============================================================

function installDependencies() {
    logStep('检查依赖...');

    const nodeModulesPath = path.join(rootDir, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
        log('正在安装依赖...', 'yellow');
        try {
            execSync('npm install', { stdio: 'inherit', cwd: rootDir });
            logSuccess('依赖安装完成');
        } catch (error) {
            logError('依赖安装失败');
            process.exit(1);
        }
    } else {
        logSuccess('依赖已安装');
    }
}

// ============================================================
// 检查数据库连接
// ============================================================

async function checkDatabase() {
    logStep('检查数据库连接...');

    try {
        const env = await import('dotenv');
        env.config();

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            logWarning('Supabase配置缺失，跳过数据库检查');
            return;
        }

        // 尝试连接
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            logWarning(`数据库连接失败: ${error.message}`);
            log('请检查 Supabase 配置是否正确', 'yellow');
        } else {
            logSuccess('数据库连接成功');
        }

    } catch (error) {
        logWarning(`数据库检查失败: ${error.message}`);
    }
}

// ============================================================
// 生成JWT密钥
// ============================================================

function generateJwtSecret() {
    logStep('检查JWT密钥...');

    const envPath = path.join(rootDir, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    if (!envContent.includes('JWT_SECRET=') || envContent.includes('JWT_SECRET=your-super-secret')) {
        const crypto = await import('crypto');
        const secret = crypto.randomBytes(32).toString('hex');

        const updatedContent = envContent.replace(
            /JWT_SECRET=.*/,
            `JWT_SECRET=${secret}`
        );

        fs.writeFileSync(envPath, updatedContent);
        logSuccess('已生成新的JWT密钥');
    } else {
        logSuccess('JWT密钥已存在');
    }
}

// ============================================================
// 主函数
// ============================================================

async function main() {
    log('\n========================================', 'cyan');
    log('🚗 Carwash SaaS Pro - 项目初始化', 'cyan');
    log('========================================\n', 'cyan');

    try {
        checkNodeVersion();
        checkEnvFile();
        createDirectories();
        installDependencies();
        await generateJwtSecret();
        await checkDatabase();

        log('\n========================================', 'green');
        logSuccess('🎉 项目初始化完成！');
        log('\n下一步：', 'cyan');
        log('1. 编辑 .env 文件填写实际配置', 'white');
        log('2. 运行 npm run migrate 创建数据库表', 'white');
        log('3. 运行 npm run dev 启动开发服务器', 'white');
        log('4. 访问 http://localhost:3001 查看应用', 'white');
        log('\n========================================\n', 'cyan');

    } catch (error) {
        logError(`初始化失败: ${error.message}`);
        process.exit(1);
    }
}

// 执行
main();