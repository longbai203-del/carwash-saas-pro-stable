/**
 * 种子数据脚本
 * 填充数据库初始数据
 * 
 * @module scripts/seed
 * 
 * @example
 * node scripts/seed.js          # 填充种子数据
 * node scripts/seed.js --clean  # 清空现有数据后重新填充
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * 种子数据
 */
const SEED_DATA = {
  tenants: [
    { id: '11111111-1111-1111-1111-111111111111', name: '示例租户', slug: 'demo', subscription_plan: 'free' }
  ],
  users: [
    { id: '22222222-2222-2222-2222-222222222222', tenant_id: '11111111-1111-1111-1111-111111111111', email: 'admin@example.com', password_hash: '$2b$10$placeholder', first_name: '管理员', last_name: '系统', role: 'admin' }
  ],
  customers: [
    { id: '33333333-3333-3333-3333-333333333333', tenant_id: '11111111-1111-1111-1111-111111111111', first_name: '张', last_name: '三', email: 'zhangsan@example.com', phone: '+86 13800138001' },
    { id: '44444444-4444-4444-4444-444444444444', tenant_id: '11111111-1111-1111-1111-111111111111', first_name: '李', last_name: '四', email: 'lisi@example.com', phone: '+86 13800138002' }
  ],
  products: [
    { id: '55555555-5555-5555-5555-555555555555', tenant_id: '11111111-1111-1111-1111-111111111111', name: '标准洗车', unit_price: 50, current_stock: 100 },
    { id: '66666666-6666-6666-6666-666666666666', tenant_id: '11111111-1111-1111-1111-111111111111', name: '高级洗车', unit_price: 80, current_stock: 50 },
    { id: '77777777-7777-7777-7777-777777777777', tenant_id: '11111111-1111-1111-1111-111111111111', name: '内饰清洁', unit_price: 120, current_stock: 30 }
  ]
};

/**
 * 种子数据管理器
 */
class SeedManager {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.clean = false;
  }

  /**
   * 检查数据是否存在
   */
  async checkDataExists(table) {
    const { count, error } = await this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) return false;
    return count > 0;
  }

  /**
   * 清空表数据
   */
  async truncateTable(table) {
    log(`  清空表: ${table}`, 'yellow');
    const { error } = await this.supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      log(`    ⚠️ 清空失败: ${error.message}`, 'red');
      return false;
    }
    return true;
  }

  /**
   * 插入种子数据
   */
  async seedTable(table, data) {
    if (!data || data.length === 0) return true;

    log(`  插入 ${table}: ${data.length} 条`, 'green');

    // 分批插入，避免超时
    const batchSize = 10;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from(table)
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        log(`    ❌ 插入失败: ${error.message}`, 'red');
        return false;
      }
    }
    return true;
  }

  /**
   * 执行种子填充
   */
  async seed() {
    log('🌱 开始填充种子数据...', 'yellow');

    if (this.clean) {
      log('🧹 清空现有数据...', 'yellow');
      for (const table of Object.keys(SEED_DATA).reverse()) {
        await this.truncateTable(table);
      }
    }

    let success = true;
    for (const [table, data] of Object.entries(SEED_DATA)) {
      // 检查数据是否已存在
      if (!this.clean && await this.checkDataExists(table)) {
        log(`  ⏭️ 跳过 ${table} (数据已存在)`, 'gray');
        continue;
      }

      const result = await this.seedTable(table, data);
      if (!result) success = false;
    }

    if (success) {
      log('✅ 种子数据填充完成', 'green');
    } else {
      log('❌ 种子数据填充失败', 'red');
    }

    return success;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const clean = args.includes('--clean');

  try {
    const manager = new SeedManager();
    manager.clean = clean;

    if (clean) {
      log('⚠️ 将清空现有数据后重新填充', 'yellow');
      const confirm = await new Promise(resolve => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('确认继续? (y/N) ', answer => {
          readline.close();
          resolve(answer.toLowerCase() === 'y');
        });
      });

      if (!confirm) {
        log('❌ 已取消', 'red');
        process.exit(0);
      }
    }

    await manager.seed();
  } catch (error) {
    log(`❌ 错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SeedManager, SEED_DATA };
export default main;