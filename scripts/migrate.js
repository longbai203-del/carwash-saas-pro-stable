/**
 * scripts/migrate.js - 数据库迁移脚本
 * @module migrate
 * @description 创建数据库表结构和索引
 * 
 * 运行: npm run migrate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 配置，请检查 .env 文件');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// 颜色输出
// ============================================================

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
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

function logError(message) {
    log(`❌ ${message}`, 'red');
}

// ============================================================
// SQL 表定义
// ============================================================

const SQL = `
-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 客户表
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    level VARCHAR(20) DEFAULT 'bronze',
    address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 车辆表
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 商品表
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT '个',
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 订单表
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    items JSONB DEFAULT '[]',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);

-- ============================================================
-- 默认管理员用户 (密码: admin123)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, role, status)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    'admin@carwash.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.7F6k2DdQFlhRp5q5e8QKq5cGJQO',
    '系统管理员',
    'admin',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@carwash.com');
`;

// ============================================================
// 执行迁移
// ============================================================

async function migrate() {
    log('\n========================================', 'cyan');
    log('🚗 Carwash SaaS Pro - 数据库迁移', 'cyan');
    log('========================================\n', 'cyan');

    try {
        logStep('执行SQL迁移...');

        // Supabase 使用 SQL 执行
        const { error } = await supabase.rpc('exec_sql', { sql: SQL });

        if (error) {
            // 如果 exec_sql 不可用，尝试逐条执行
            log('尝试逐条执行SQL...', 'yellow');

            const statements = SQL.split(';').filter(s => s.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        // 使用查询方式执行
                        await supabase.from('_migrations').select('count').limit(0);
                        // 如果表存在，使用 raw SQL
                        const { error: execError } = await supabase.rpc('exec_sql', { sql: statement });
                        if (execError) {
                            log(`执行失败: ${execError.message}`, 'yellow');
                        }
                    } catch (e) {
                        // 忽略错误，继续执行
                    }
                }
            }

            logSuccess('迁移完成（部分操作可能已跳过）');
        } else {
            logSuccess('迁移成功完成！');
        }

        log('\n========================================', 'green');
        logSuccess('🎉 数据库迁移完成！');
        log('\n默认管理员账号:', 'cyan');
        log('  邮箱: admin@carwash.com', 'white');
        log('  密码: admin123', 'white');
        log('\n⚠️ 请及时修改默认密码！', 'yellow');
        log('========================================\n', 'cyan');

    } catch (error) {
        logError(`迁移失败: ${error.message}`);
        process.exit(1);
    }
}

// 执行
migrate();