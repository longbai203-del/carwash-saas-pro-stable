const fs = require('fs-extra');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const OLD_MODULES = path.join(FRONTEND, 'modules');
const NEW_MODULES = path.join(FRONTEND, 'modules'); // 同路径，重组子目录

// 旧模块 -> 新路径映射
const moduleMap = {
  'dashboard': '01-dashboard/executive',
  'cashier': '02-pos/quick-sale',
  'orders': '03-orders/list',
  'inventory': '07-inventory/stock',
  'customers': '05-customers/list',
  'employees': '10-hr/employees',
  'attendance': '10-hr/attendance',
  'reports': '13-analytics/reports',
  'permission': '12-system/permissions',
  'settings': '14-settings/general',
  'audit': '12-system/audit-logs',
  'vehicle-monitor': '01-dashboard/vehicle-monitor' // 可放入仪表板
};

// 新模块列表（按编号）
const moduleDirs = [
  '01-dashboard', '02-pos', '03-orders', '04-products',
  '05-customers', '06-marketing', '07-inventory', '08-purchase',
  '09-finance', '10-hr', '11-saas', '12-system', '13-analytics', '14-settings'
];

// 每个模块的元数据（用于 module.json）
const metaTemplate = {
  '01-dashboard': { name: 'Dashboard', icon: 'dashboard', order: 1 },
  '02-pos': { name: 'POS', icon: 'cash-register', order: 2 },
  '03-orders': { name: 'Orders', icon: 'clipboard-list', order: 3 },
  '04-products': { name: 'Products', icon: 'box', order: 4 },
  '05-customers': { name: 'CRM', icon: 'users', order: 5 },
  '06-marketing': { name: 'Marketing', icon: 'megaphone', order: 6 },
  '07-inventory': { name: 'Inventory', icon: 'warehouse', order: 7 },
  '08-purchase': { name: 'Purchasing', icon: 'truck', order: 8 },
  '09-finance': { name: 'Finance', icon: 'coins', order: 9 },
  '10-hr': { name: 'HR', icon: 'user-tie', order: 10 },
  '11-saas': { name: 'SaaS', icon: 'cloud', order: 11 },
  '12-system': { name: 'System', icon: 'cog', order: 12 },
  '13-analytics': { name: 'Analytics', icon: 'chart-bar', order: 13 },
  '14-settings': { name: 'Settings', icon: 'sliders-h', order: 14 }
};

async function main() {
  // 1. 创建新模块目录
  for (const dir of moduleDirs) {
    await fs.ensureDir(path.join(NEW_MODULES, dir));
  }

  // 2. 迁移旧模块
  for (const [oldName, newPath] of Object.entries(moduleMap)) {
    const src = path.join(OLD_MODULES, oldName);
    const dest = path.join(NEW_MODULES, newPath);
    if (await fs.pathExists(src)) {
      await fs.copy(src, dest, { overwrite: true });
      console.log(`✅ Copied ${oldName} → ${newPath}`);
    } else {
      console.warn(`⚠️  Old module "${oldName}" not found, skipped.`);
    }
  }

  // 3. 为每个模块创建 module.json
  for (const dir of moduleDirs) {
    const metaPath = path.join(NEW_MODULES, dir, 'module.json');
    if (!await fs.pathExists(metaPath)) {
      const meta = metaTemplate[dir] || { name: dir.split('-')[1] || dir, icon: 'folder', order: 999 };
      await fs.writeJson(metaPath, meta, { spaces: 2 });
      console.log(`📄 Created module.json for ${dir}`);
    }
  }

  console.log('🎉 重构完成！旧模块已保留，新目录结构已生成。');
  console.log('📌 下一步：运行 node scripts/generate-all-pages.js 生成所有子页面骨架。');
}

main().catch(console.error);