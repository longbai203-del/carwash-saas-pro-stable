/**
 * app.js - Carwash Pro 完整应用
 * 包含：路由系统 + Mock数据 + 页面加载
 */

(function() {
  'use strict';

  console.log('🚀 Carwash Pro 应用启动...');

  // ============================================================
  // 1. Mock 数据
  // ============================================================

  var MockDB = {
    // 订单数据
    getOrders: function() {
      var orders = [];
      var statuses = ['pending', 'processing', 'completed', 'cancelled'];
      var customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
      var products = ['洗车套餐A', '洗车套餐B', '汽车美容', '抛光打蜡', '内饰清洁', '空调清洗'];

      for (var i = 0; i < 25; i++) {
        orders.push({
          id: 'ORD-' + String(i + 1).padStart(6, '0'),
          orderNo: 'ORD-2026-' + String(i + 1).padStart(4, '0'),
          customer: customers[i % customers.length],
          phone: '138' + String(Math.floor(Math.random() * 90000000) + 10000000),
          total: Math.floor(Math.random() * 1000) + 100,
          status: statuses[i % statuses.length],
          items: [{ name: products[i % products.length], qty: Math.floor(Math.random() * 3) + 1, price: Math.floor(Math.random() * 300) + 50 }],
          createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      return orders;
    },

    // 商品数据
    getProducts: function() {
      var products = [];
      var names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂', '纳米涂层', '轮毂清洁剂'];
      var categories = ['洗车', '美容', '保养', '配件'];
      var units = ['桶', '瓶', '个', '箱'];

      for (var i = 0; i < 20; i++) {
        products.push({
          id: 'PRD-' + String(i + 1).padStart(6, '0'),
          name: names[i % names.length],
          category: categories[i % categories.length],
          price: Math.floor(Math.random() * 500) + 50,
          cost: Math.floor(Math.random() * 300) + 20,
          stock: Math.floor(Math.random() * 500) + 10,
          unit: units[i % units.length],
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      return products;
    },

    // 客户数据
    getCustomers: function() {
      var customers = [];
      var names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
      var levels = ['gold', 'silver', 'bronze', 'vip'];

      for (var i = 0; i < 20; i++) {
        customers.push({
          id: 'CUS-' + String(i + 1).padStart(6, '0'),
          name: names[i % names.length],
          phone: '138' + String(Math.floor(Math.random() * 90000000) + 10000000),
          email: 'user' + (i + 1) + '@example.com',
          level: levels[i % levels.length],
          totalSpent: Math.floor(Math.random() * 50000) + 1000,
          orderCount: Math.floor(Math.random() * 50) + 1,
          lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      return customers;
    },

    // 采购订单
    getPurchaseOrders: function() {
      var orders = [];
      var suppliers = ['上海供应商有限公司', '深圳科技材料公司', '广州五金制品厂', '北京电子元件商行', '成都建材批发中心'];
      var statuses = ['draft', 'pending', 'approved', 'completed', 'cancelled'];

      for (var i = 0; i < 20; i++) {
        orders.push({
          id: 'PO-' + String(i + 1).padStart(6, '0'),
          orderNo: 'PO-2026-' + String(i + 1).padStart(4, '0'),
          supplier: suppliers[i % suppliers.length],
          totalAmount: Math.floor(Math.random() * 20000) + 1000,
          status: statuses[i % statuses.length],
          items: Math.floor(Math.random() * 10) + 1,
          createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      return orders;
    },

    // 员工数据
    getEmployees: function() {
      var employees = [];
      var names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛', '吴刚', '徐洁'];
      var departments = ['管理部', '销售部', '服务部', '技术部', '市场部'];
      var positions = ['经理', '主管', '员工', '实习生'];

      for (var i = 0; i < 15; i++) {
        employees.push({
          id: 'EMP-' + String(i + 1).padStart(6, '0'),
          name: names[i % names.length],
          department: departments[i % departments.length],
          position: positions[i % positions.length],
          phone: '138' + String(Math.floor(Math.random() * 90000000) + 10000000),
          email: 'emp' + (i + 1) + '@company.com',
          salary: Math.floor(Math.random() * 15000) + 3000,
          hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: Math.random() > 0.2 ? 'active' : 'inactive'
        });
      }
      return employees;
    },

    // Dashboard 统计
    getDashboardStats: function() {
      return {
        stats: {
          todayRevenue: 28650.00,
          todayOrders: 47,
          activeCustomers: 328,
          conversionRate: 68.5
        },
        recentOrders: [
          { id: 'ORD-001', customer: '张伟', amount: 680, status: 'completed', time: '10:30' },
          { id: 'ORD-002', customer: '李娜', amount: 420, status: 'pending', time: '10:15' },
          { id: 'ORD-003', customer: '王强', amount: 1250, status: 'processing', time: '09:45' },
          { id: 'ORD-004', customer: '刘洋', amount: 380, status: 'completed', time: '09:20' },
          { id: 'ORD-005', customer: '陈静', amount: 890, status: 'completed', time: '08:55' }
        ],
        chartData: {
          labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          values: [3200, 4500, 3800, 6200, 5800, 7200, 4800]
        }
      };
    }
  };

  // ============================================================
  // 2. 路由配置
  // ============================================================

  var MODULES = {
    'dashboard': { id: '01-dashboard', label: 'Dashboard', icon: 'chart-pie', defaultPage: 'sales' },
    'pos': { id: '02-pos', label: 'POS', icon: 'cash-register', defaultPage: 'quick-sale' },
    'orders': { id: '03-orders', label: 'Orders', icon: 'clipboard-list', defaultPage: 'list' },
    'products': { id: '04-products', label: 'Products', icon: 'box', defaultPage: 'products' },
    'crm': { id: '05-customers', label: 'CRM', icon: 'users', defaultPage: 'customers' },
    'marketing': { id: '06-marketing', label: 'Marketing', icon: 'megaphone', defaultPage: 'promotions' },
    'inventory': { id: '07-inventory', label: 'Inventory', icon: 'warehouse', defaultPage: 'stock' },
    'purchasing': { id: '08-purchase', label: 'Purchasing', icon: 'truck', defaultPage: 'orders' },
    'finance': { id: '09-finance', label: 'Finance', icon: 'coins', defaultPage: 'income' },
    'hr': { id: '10-hr', label: 'HR', icon: 'user-tie', defaultPage: 'employees' },
    'saas': { id: '11-saas', label: 'SaaS', icon: 'cloud', defaultPage: 'tenants' },
    'system': { id: '12-system', label: 'System', icon: 'cog', defaultPage: 'audit-logs' },
    'analytics': { id: '13-analytics', label: 'Analytics', icon: 'chart-bar', defaultPage: 'reports' },
    'settings': { id: '14-settings', label: 'Settings', icon: 'sliders-h', defaultPage: 'company' }
  };

  var PAGES = {
    '01-dashboard': ['executive', 'sales', 'finance', 'inventory', 'crm', 'marketing', 'ai', 'employee'],
    '02-pos': ['quick-sale', 'touch-pos', 'returns', 'exchange', 'customer-display', 'receipt', 'kitchen-display', 'offline-pos', 'cash-register'],
    '03-orders': ['list', 'detail', 'returns', 'refunds'],
    '04-products': ['products', 'categories', 'brands', 'variants', 'barcodes', 'price-lists', 'modifiers', 'combos'],
    '05-customers': ['customers', 'vehicles', 'membership', 'wallet', 'coupons', 'gift-cards', 'feedback'],
    '06-marketing': ['campaigns', 'promotions', 'loyalty', 'referrals'],
    '07-inventory': ['stock', 'warehouses', 'transfers', 'adjustments', 'cycle-counts', 'batches', 'expiry', 'serial-numbers', 'history', 'low-stock'],
    '08-purchase': ['orders', 'receiving', 'suppliers', 'supplier-payments', 'quotations', 'returns', 'import'],
    '09-finance': ['invoices', 'payments', 'expenses', 'income', 'cash-flow', 'bank', 'vat', 'journal', 'profit-loss', 'trial-balance', 'balance-sheet', 'taxes', 'refunds', 'settlements'],
    '10-hr': ['employees', 'attendance', 'leaves', 'payroll', 'commissions', 'bonuses', 'penalties', 'shifts', 'tasks', 'schedules', 'performance', 'permissions'],
    '11-saas': ['subscriptions', 'plans', 'packages', 'tenants', 'usage', 'storage', 'feature-limits', 'billing', 'invoices'],
    '12-system': ['roles', 'permissions', 'audit-logs', 'system-logs', 'notifications', 'backup', 'restore', 'api-keys', 'webhooks', 'integrations', 'marketplace', 'settings'],
    '13-analytics': ['custom-reports', 'visualizations', 'forecast', 'recommendations', 'business-health', 'reports'],
    '14-settings': ['company', 'branches', 'profile', 'preferences', 'general']
  };

  // ============================================================
  // 3. 核心函数
  // ============================================================

  function getModuleInfo(moduleId) {
    for (var key in MODULES) {
      if (MODULES[key].id === moduleId) {
        return MODULES[key];
      }
    }
    return null;
  }

  function getPages(moduleId) {
    return PAGES[moduleId] || ['index'];
  }

  function getHtmlPath(moduleId, page) {
    return '/modules/' + moduleId + '/' + page + '/' + page + '.html';
  }

  function getJsPath(moduleId, page) {
    return '/modules/' + moduleId + '/' + page + '/' + page + '.js';
  }

  // ============================================================
  // 4. 页面加载
  // ============================================================

  async function loadPage(moduleId, page) {
    console.log('📄 加载:', moduleId, '/', page);

    var content = document.getElementById('content');
    if (!content) {
      console.error('❌ content 元素不存在');
      return;
    }

    content.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:400px;">
        <div style="text-align:center;">
          <div style="width:48px;height:48px;border:4px solid #E5E7EB;border-top-color:#4F46E5;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto;"></div>
          <p style="margin-top:16px;color:#6B7280;">加载中...</p>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;

    try {
      var htmlPath = getHtmlPath(moduleId, page);
      console.log('📄 HTML:', htmlPath);

      var response = await fetch(htmlPath);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      var html = await response.text();
      console.log('✅ HTML 加载成功, 长度:', html.length);

      if (!html || html.trim().length < 10) {
        content.innerHTML = generatePlaceholder(moduleId, page);
        return;
      }

      content.innerHTML = html;

      try {
        var jsPath = getJsPath(moduleId, page);
        console.log('📄 JS:', jsPath);

        var module = await import(jsPath);
        if (module && typeof module.init === 'function') {
          await module.init();
          console.log('✅ JS 初始化成功');
        } else if (module && module.default && typeof module.default.init === 'function') {
          await module.default.init();
          console.log('✅ JS 初始化成功 (default)');
        } else {
          console.log('ℹ️ 无需JS初始化');
        }
      } catch (jsError) {
        console.warn('⚠️ JS加载失败:', jsError.message);
      }

      var info = getModuleInfo(moduleId);
      if (info) {
        document.title = info.label + ' - CarwashPro';
        var titleEl = document.getElementById('currentPageTitle');
        if (titleEl) {
          titleEl.textContent = info.label + ' - ' + page;
        }
      }

      console.log('✅ 加载完成:', moduleId, '/', page);

    } catch (error) {
      console.error('❌ 加载失败:', error);
      content.innerHTML = generateErrorPage(error.message);
    }
  }

  // ============================================================
  // 5. 错误页面
  // ============================================================

  function generateErrorPage(message) {
    return `
      <div style="padding:40px;text-align:center;">
        <i class="fas fa-exclamation-circle" style="font-size:48px;color:#EF4444;"></i>
        <h2 style="color:#EF4444;margin-top:16px;">加载失败</h2>
        <p style="color:#6B7280;">${message}</p>
        <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
          重新加载
        </button>
      </div>
    `;
  }

  // ============================================================
  // 6. 占位内容（含数据）
  // ============================================================

  function generatePlaceholder(moduleId, page) {
    var info = getModuleInfo(moduleId);
    var label = info ? info.label : moduleId;

    if (moduleId === '01-dashboard' || page === 'sales' || page === 'executive') {
      var stats = MockDB.getDashboardStats();
      return `
        <div style="padding:20px;">
          <h2 style="margin-bottom:20px;">📊 仪表盘</h2>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
            <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="color:#6B7280;font-size:14px;">今日收入</div>
              <div style="font-size:28px;font-weight:700;color:#1F2937;">¥${stats.stats.todayRevenue}</div>
            </div>
            <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="color:#6B7280;font-size:14px;">今日订单</div>
              <div style="font-size:28px;font-weight:700;color:#1F2937;">${stats.stats.todayOrders}</div>
            </div>
            <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="color:#6B7280;font-size:14px;">活跃客户</div>
              <div style="font-size:28px;font-weight:700;color:#1F2937;">${stats.stats.activeCustomers}</div>
            </div>
            <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="color:#6B7280;font-size:14px;">转化率</div>
              <div style="font-size:28px;font-weight:700;color:#1F2937;">${stats.stats.conversionRate}%</div>
            </div>
          </div>
          <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin-bottom:12px;">📋 最新订单</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#F9FAFB;">
                  <th style="padding:10px;text-align:left;font-size:12px;color:#6B7280;">订单号</th>
                  <th style="padding:10px;text-align:left;font-size:12px;color:#6B7280;">客户</th>
                  <th style="padding:10px;text-align:right;font-size:12px;color:#6B7280;">金额</th>
                  <th style="padding:10px;text-align:left;font-size:12px;color:#6B7280;">状态</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recentOrders.map(function(o) {
                  var bgColor = o.status === 'completed' ? '#D1FAE5' : '#FEF3C7';
                  var textColor = o.status === 'completed' ? '#065F46' : '#92400E';
                  return `<tr>
                    <td style="padding:10px;border-bottom:1px solid #F3F4F6;">${o.id}</td>
                    <td style="padding:10px;border-bottom:1px solid #F3F4F6;">${o.customer}</td>
                    <td style="padding:10px;border-bottom:1px solid #F3F4F6;text-align:right;">¥${o.amount}</td>
                    <td style="padding:10px;border-bottom:1px solid #F3F4F6;">
                      <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;background:${bgColor};color:${textColor};">${o.status}</span>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    var data = [];
    var columns = [];
    var dataMap = {
      '03-orders': { data: MockDB.getOrders, cols: ['订单编号', '客户', '金额', '状态'] },
      '04-products': { data: MockDB.getProducts, cols: ['商品名称', '分类', '价格', '库存'] },
      '05-customers': { data: MockDB.getCustomers, cols: ['姓名', '手机', '等级', '累计消费'] },
      '08-purchase': { data: MockDB.getPurchaseOrders, cols: ['订单编号', '供应商', '金额', '状态'] },
      '10-hr': { data: MockDB.getEmployees, cols: ['姓名', '部门', '职位', '薪资'] }
    };

    var mapping = dataMap[moduleId];
    if (mapping) {
      data = mapping.data().slice(0, 8);
      columns = mapping.cols;
    } else {
      data = MockDB.getOrders().slice(0, 8);
      columns = ['订单编号', '客户', '金额', '状态'];
    }

    var tableRows = data.map(function(row) {
      var values = Object.values(row).slice(0, columns.length);
      return '<tr>' + values.map(function(cell) {
        return '<td style="padding:10px;border-bottom:1px solid #F3F4F6;">' + cell + '</td>';
      }).join('') + '</tr>';
    }).join('');

    return `
      <div style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div>
            <h2 style="margin:0;">${label}</h2>
            <p style="color:#6B7280;margin:4px 0 0 0;">${page}</p>
          </div>
          <button style="padding:8px 16px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;">
            <i class="fas fa-plus"></i> 新建
          </button>
        </div>
        <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#F9FAFB;">
                ${columns.map(function(col) {
                  return '<th style="padding:12px 16px;text-align:left;font-size:12px;color:#6B7280;">' + col + '</th>';
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="' + columns.length + '" style="padding:40px;text-align:center;color:#6B7280;">暂无数据</td></tr>'}
            </tbody>
          </table>
        </div>
        <div style="margin-top:12px;text-align:right;font-size:14px;color:#6B7280;">
          共 ${data.length} 条记录
        </div>
      </div>
    `;
  }

  // ============================================================
  // 7. 路由处理
  // ============================================================

  function handleRoute() {
    var hash = window.location.hash.replace('#', '') || '/dashboard';
    if (!hash.startsWith('/')) hash = '/' + hash;

    var parts = hash.split('/').filter(function(p) { return p.length > 0; });
    var moduleKey = parts[0] || 'dashboard';
    var page = parts[1] || '';

    var moduleInfo = MODULES[moduleKey];
    if (!moduleInfo) {
      console.warn('未知模块:', moduleKey);
      window.location.hash = '/dashboard';
      return;
    }

    var moduleId = moduleInfo.id;
    var defaultPage = moduleInfo.defaultPage;

    var pages = getPages(moduleId);
    if (!page || pages.indexOf(page) === -1) {
      page = defaultPage;
      window.location.hash = '/' + moduleKey + '/' + page;
      return;
    }

    loadPage(moduleId, page);
  }

  // ============================================================
  // 8. 侧边栏
  // ============================================================

  function buildSidebar() {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      console.warn('⚠️ sidebar 不存在');
      return;
    }

    var currentHash = window.location.hash.replace('#', '') || '/dashboard';
    var currentKey = currentHash.split('/')[1] || 'dashboard';

    var html = `
      <div style="padding:20px 16px;border-bottom:1px solid #E5E7EB;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;background:#4F46E5;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            <i class="fas fa-car-wash" style="color:white;font-size:20px;"></i>
          </div>
          <div>
            <h2 style="font-size:18px;margin:0;font-weight:700;color:#1F2937;">Carwash Pro</h2>
            <p style="font-size:11px;color:#6B7280;margin:0;">Enterprise V2</p>
          </div>
        </div>
      </div>
    `;

    html += '<nav style="padding:8px 12px;flex:1;overflow-y:auto;">';

    var keys = Object.keys(MODULES);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var mod = MODULES[key];
      var isActive = currentKey === key;

      html += `
        <a href="#/${key}/${mod.defaultPage}"
           style="display:flex;align-items:center;padding:10px 14px;border-radius:8px;text-decoration:none;color:${isActive ? '#FFFFFF' : '#1F2937'};background:${isActive ? '#4F46E5' : 'transparent'};margin-bottom:2px;transition:all 0.2s;cursor:pointer;font-size:14px;"
           onmouseover="this.style.background='${isActive ? '#4F46E5' : '#F3F4F6'}'"
           onmouseout="this.style.background='${isActive ? '#4F46E5' : 'transparent'}'">
          <i class="fas fa-${mod.icon}" style="width:20px;text-align:center;color:${isActive ? '#FFFFFF' : '#6B7280'};"></i>
          <span style="margin-left:12px;">${mod.label}</span>
        </a>
      `;
    }

    html += '</nav>';

    html += `
      <div style="padding:12px 16px;border-top:1px solid #E5E7EB;margin-top:auto;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;width:8px;height:8px;background:#10B981;border-radius:50%;"></span>
          <span style="font-size:12px;color:#6B7280;">系统在线</span>
        </div>
      </div>
    `;

    sidebar.innerHTML = html;

    sidebar.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        if (href) {
          window.location.hash = href.substring(1);
        }
      });
    });
  }

  // ============================================================
  // 9. 初始化
  // ============================================================

  function init() {
    console.log('🚀 启动应用...');

    buildSidebar();

    window.addEventListener('hashchange', function() {
      handleRoute();
      buildSidebar();
    });

    setTimeout(handleRoute, 50);

    console.log('✅ 应用已启动');
  }

  // ============================================================
  // 10. 启动
  // ============================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

console.log('✅ app.js 加载完成');
