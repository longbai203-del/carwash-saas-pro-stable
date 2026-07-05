/**
 * app-v2.js - V2 应用入口（完全独立，不依赖任何 ES Module 导入）
 * 所有依赖通过全局对象访问
 */
(function() {
  'use strict';

  // ---------- 配置 ----------
  const MODULES_BASE = '/modules/';
  let moduleMap = {};
  let pageRoutes = {};

  // ---------- 工具函数 ----------
  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }

  // ---------- 加载模块映射 ----------
  async function loadModuleMap() {
    try {
      moduleMap = await fetchJSON('/modules/module-map.json');
      console.log('📋 Module map loaded:', moduleMap);
    } catch (e) {
      console.warn('Using fallback module map');
      moduleMap = {
        '01-dashboard': 'Dashboard',
        '02-pos': 'POS',
        '03-orders': 'Orders',
        '04-products': 'Products',
        '05-customers': 'CRM',
        '06-marketing': 'Marketing',
        '07-inventory': 'Inventory',
        '08-purchase': 'Purchasing',
        '09-finance': 'Finance',
        '10-hr': 'HR',
        '11-saas': 'SaaS',
        '12-system': 'System',
        '13-analytics': 'Analytics',
        '14-settings': 'Settings'
      };
    }
  }

  // ---------- 获取模块子页面列表 ----------
  function getPagesForModule(moduleId) {
    const map = {
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
      '13-analytics': ['custom-reports', 'visualizations', 'forecast', 'recommendations', 'business-health'],
      '14-settings': ['company', 'branches', 'profile', 'preferences']
    };
    return map[moduleId] || [];
  }

  // ---------- 构建路由表 ----------
  async function buildRoutes() {
    pageRoutes = {};
    const moduleIds = Object.keys(moduleMap);
    for (const moduleId of moduleIds) {
      const pageList = getPagesForModule(moduleId);
      for (const page of pageList) {
        const path = `/${moduleId}/${page}`;
        pageRoutes[path] = {
          moduleId,
          pageName: page,
          htmlPath: `${MODULES_BASE}${moduleId}/${page}/${page}.html`,
          jsPath: `${MODULES_BASE}${moduleId}/${page}/${page}.js`
        };
      }
    }
    console.log(`🗺️  Built ${Object.keys(pageRoutes).length} routes`);
  }

  // ---------- 加载页面 ----------
  async function loadPage(path) {
    const route = pageRoutes[path];
    if (!route) {
      document.getElementById('content').innerHTML = `<h1>404 - Page Not Found</h1><p>${path}</p>`;
      return;
    }

    const contentEl = document.getElementById('content');
    try {
      // 加载 HTML
      const htmlRes = await fetch(route.htmlPath);
      if (!htmlRes.ok) throw new Error(`HTML ${htmlRes.status}`);
      contentEl.innerHTML = await htmlRes.text();

      // 动态加载 JS（如果存在）- 使用动态 import
      try {
        const jsModule = await import(route.jsPath);
        if (jsModule.default && typeof jsModule.default.init === 'function') {
          await jsModule.default.init();
        } else if (typeof jsModule.init === 'function') {
          await jsModule.init();
        }
      } catch (e) {
        // JS 加载失败时静默处理（页面可能只有 HTML）
        console.debug(`JS not available for ${route.moduleId}/${route.pageName}`);
      }

      // 更新页面标题
      const titleEl = document.getElementById('currentPageTitle');
      if (titleEl) {
        const moduleName = moduleMap[route.moduleId] || route.moduleId;
        titleEl.textContent = `${moduleName} - ${route.pageName}`;
      }
    } catch (error) {
      console.error('Page load error:', error);
      contentEl.innerHTML = `<h1>Error Loading Page</h1><p>${error.message}</p>`;
    }
  }

  // ---------- 路由处理 ----------
  function handleRoute() {
    let hash = window.location.hash.replace('#', '') || '/01-dashboard/executive';
    if (!hash.startsWith('/')) hash = '/' + hash;
    if (!pageRoutes[hash]) {
      hash = '/01-dashboard/executive';
      window.location.hash = hash;
      return;
    }
    loadPage(hash);
  }

  // ---------- 侧边栏 ----------
  function buildSidebar(modules) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      console.warn('Sidebar element not found');
      return;
    }
    
    let html = '<div class="sidebar-inner"><ul class="sidebar-menu">';
    for (const [id, name] of Object.entries(modules)) {
      const pages = getPagesForModule(id);
      const firstPage = pages.length > 0 ? pages[0] : 'index';
      const href = `#/${id}/${firstPage}`;
      const icon = getIconForModule(id);
      html += `
        <li class="sidebar-item">
          <a href="${href}" class="sidebar-link" data-module="${id}">
            <i class="fas fa-${icon}"></i>
            <span>${name}</span>
          </a>
        </li>
      `;
    }
    html += '</ul></div>';
    sidebar.innerHTML = html;

    // 点击事件
    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) window.location.hash = href.substring(1);
      });
    });
  }

  function getIconForModule(id) {
    const icons = {
      '01-dashboard': 'chart-pie',
      '02-pos': 'cash-register',
      '03-orders': 'clipboard-list',
      '04-products': 'box',
      '05-customers': 'users',
      '06-marketing': 'megaphone',
      '07-inventory': 'warehouse',
      '08-purchase': 'truck',
      '09-finance': 'coins',
      '10-hr': 'user-tie',
      '11-saas': 'cloud',
      '12-system': 'cog',
      '13-analytics': 'chart-bar',
      '14-settings': 'sliders-h'
    };
    return icons[id] || 'folder';
  }

  // ---------- 初始化认证（兼容全局 auth） ----------
  function initAuth() {
    // 尝试多种可能的全局认证对象
    if (typeof window.AppAuth !== 'undefined' && typeof window.AppAuth.init === 'function') {
      return window.AppAuth.init();
    }
    if (typeof window.initAuth === 'function') {
      return window.initAuth();
    }
    if (typeof window.AuthManager !== 'undefined' && typeof window.AuthManager.init === 'function') {
      return window.AuthManager.init();
    }
    console.log('🔐 No auth module found, proceeding without authentication');
    return Promise.resolve();
  }

  // ---------- 应用初始化 ----------
  async function initApp() {
    console.log('🚀 Initializing V2 App...');

    try {
      // 1. 初始化认证
      await initAuth();

      // 2. 加载模块映射
      await loadModuleMap();

      // 3. 构建路由表
      await buildRoutes();

      // 4. 生成侧边栏
      buildSidebar(moduleMap);

      // 5. 启动路由监听
      window.addEventListener('hashchange', handleRoute);
      
      // 6. 处理初始路由
      handleRoute();

      console.log('✅ V2 App ready successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize V2 App:', error);
      // 显示错误信息在页面上
      const content = document.getElementById('content');
      if (content) {
        content.innerHTML = `
          <div class="error-container">
            <h1>Application Initialization Error</h1>
            <p>${error.message}</p>
            <details>
              <summary>Technical Details</summary>
              <pre>${error.stack}</pre>
            </details>
          </div>
        `;
      }
    }
  }

  // ---------- 启动 ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();