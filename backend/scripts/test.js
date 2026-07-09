/**
 * scripts/test.js - API测试脚本
 * @module test
 * @description 测试所有API端点
 * 
 * 运行: npm run test
 */

import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_USER = {
    email: 'admin@carwash.com',
    password: 'admin123'
};

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

function logTest(name, passed) {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`  ${icon} ${name}`, color);
}

// ============================================================
// 测试函数
// ============================================================

async function testEndpoint(method, endpoint, data = null, token = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        return {
            ok: response.ok,
            status: response.status,
            data: result
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            error: error.message
        };
    }
}

// ============================================================
// 主测试套件
// ============================================================

async function runTests() {
    log('\n========================================', 'cyan');
    log('🧪 Carwash SaaS Pro - API 测试', 'cyan');
    log('========================================\n', 'cyan');

    let passed = 0;
    let failed = 0;
    let token = null;

    // 1. 健康检查
    log('📌 健康检查...');
    const health = await testEndpoint('GET', '/health');
    if (health.ok) {
        logTest('健康检查', true);
        passed++;
    } else {
        logTest('健康检查', false);
        failed++;
        log(`   ${health.data?.message || health.error}`, 'yellow');
    }

    // 2. 登录
    log('\n📌 认证测试...');
    const login = await testEndpoint('POST', '/auth/login', TEST_USER);
    if (login.ok && login.data?.data?.token) {
        token = login.data.data.token;
        logTest('用户登录', true);
        passed++;
    } else {
        logTest('用户登录', false);
        failed++;
        log(`   ${login.data?.message || login.error}`, 'yellow');
    }

    if (!token) {
        log('\n❌ 无法获取认证令牌，跳过后续测试', 'red');
        return;
    }

    // 3. 获取当前用户
    const me = await testEndpoint('GET', '/auth/me', null, token);
    logTest('获取用户信息', me.ok);
    passed += me.ok ? 1 : 0;
    failed += me.ok ? 0 : 1;

    // 4. 获取订单列表
    const orders = await testEndpoint('GET', '/orders?limit=5', null, token);
    logTest('获取订单列表', orders.ok);
    passed += orders.ok ? 1 : 0;
    failed += orders.ok ? 0 : 1;

    // 5. 获取商品列表
    const products = await testEndpoint('GET', '/products?limit=5', null, token);
    logTest('获取商品列表', products.ok);
    passed += products.ok ? 1 : 0;
    failed += products.ok ? 0 : 1;

    // 6. 获取客户列表
    const customers = await testEndpoint('GET', '/customers?limit=5', null, token);
    logTest('获取客户列表', customers.ok);
    passed += customers.ok ? 1 : 0;
    failed += customers.ok ? 0 : 1;

    // 7. 创建订单
    log('\n📌 业务操作测试...');
    const newOrder = {
        customerName: '测试客户',
        customerPhone: '13800009999',
        items: [
            { name: '标准洗车', price: 68, qty: 1, subtotal: 68 }
        ],
        total: 68,
        paymentMethod: 'cash'
    };
    const createOrder = await testEndpoint('POST', '/orders', newOrder, token);
    logTest('创建订单', createOrder.ok);
    passed += createOrder.ok ? 1 : 0;
    failed += createOrder.ok ? 0 : 1;

    // 8. 创建商品
    const newProduct = {
        name: '测试商品',
        category: '测试',
        price: 99.99,
        stock: 10,
        unit: '个'
    };
    const createProduct = await testEndpoint('POST', '/products', newProduct, token);
    logTest('创建商品', createProduct.ok);
    passed += createProduct.ok ? 1 : 0;
    failed += createProduct.ok ? 0 : 1;

    // 9. 创建客户
    const newCustomer = {
        name: '测试客户',
        phone: '13800008888',
        level: 'gold'
    };
    const createCustomer = await testEndpoint('POST', '/customers', newCustomer, token);
    logTest('创建客户', createCustomer.ok);
    passed += createCustomer.ok ? 1 : 0;
    failed += createCustomer.ok ? 0 : 1;

    // 10. 获取统计
    const stats = await testEndpoint('GET', '/orders/stats/summary', null, token);
    logTest('获取订单统计', stats.ok);
    passed += stats.ok ? 1 : 0;
    failed += stats.ok ? 0 : 1;

    // ============================================================
    // 测试结果
    // ============================================================

    log('\n========================================', 'cyan');
    log('📊 测试结果', 'cyan');
    log('========================================\n', 'cyan');

    log(`  通过: ${passed}`, 'green');
    log(`  失败: ${failed}`, 'red');
    log(`  总计: ${passed + failed}`, 'white');

    const rate = ((passed / (passed + failed)) * 100).toFixed(1);
    log(`  通过率: ${rate}%`, 'cyan');

    log('\n========================================\n', 'cyan');

    if (failed === 0) {
        log('🎉 所有测试通过！', 'green');
    } else {
        log(`⚠️ 有 ${failed} 个测试失败，请检查`, 'yellow');
    }
}

// 执行测试
runTests();