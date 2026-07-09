/**
 * scripts/seed.js - 数据种子脚本
 * @module seed
 * @description 初始化示例数据
 * 
 * 运行: npm run seed
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 配置，请检查 .env 文件');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// 示例数据
// ============================================================

const seedData = {
    customers: [
        { name: '张伟', phone: '13800001111', level: 'gold' },
        { name: '李娜', phone: '13800002222', level: 'vip' },
        { name: '王强', phone: '13800003333', level: 'silver' },
        { name: '刘洋', phone: '13800004444', level: 'bronze' },
        { name: '陈静', phone: '13800005555', level: 'vip' }
    ],
    products: [
        { name: '标准洗车', category: '洗车', price: 68, stock: 45, unit: '次' },
        { name: '精致洗车', category: '洗车', price: 128, stock: 30, unit: '次' },
        { name: '深度清洁', category: '洗车', price: 268, stock: 20, unit: '次' },
        { name: '抛光打蜡', category: '美容', price: 388, stock: 15, unit: '次' },
        { name: '内饰清洗', category: '美容', price: 328, stock: 12, unit: '次' },
        { name: '发动机清洗', category: '保养', price: 188, stock: 8, unit: '次' },
        { name: '空调清洗', category: '保养', price: 158, stock: 10, unit: '次' },
        { name: '洗车月卡', category: '会员', price: 398, stock: 50, unit: '张' }
    ]
};

// ============================================================
// 执行种子
// ============================================================

async function seed() {
    console.log('\n🌱 开始填充示例数据...\n');

    try {
        // 清空现有数据
        console.log('📌 清空现有数据...');
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 插入客户
        console.log('📌 插入客户...');
        const { data: customers, error: customerError } = await supabase
            .from('customers')
            .insert(seedData.customers)
            .select();

        if (customerError) {
            console.error('客户插入失败:', customerError);
        }

        // 插入商品
        console.log('📌 插入商品...');
        const productsWithSku = seedData.products.map(p => ({
            ...p,
            sku: `SKU-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            status: 'active'
        }));

        const { data: products, error: productError } = await supabase
            .from('products')
            .insert(productsWithSku)
            .select();

        if (productError) {
            console.error('商品插入失败:', productError);
        }

        console.log(`✅ 插入 ${customers?.length || 0} 个客户`);
        console.log(`✅ 插入 ${products?.length || 0} 个商品`);

        console.log('\n🎉 数据种子填充完成！');

    } catch (error) {
        console.error('❌ 种子填充失败:', error);
        process.exit(1);
    }
}

// 执行
seed();