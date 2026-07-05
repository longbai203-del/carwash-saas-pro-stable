/**
 * app-v2.js - V2 应用入口（完全修复版）
 */
(function() {
  'use strict';

  // ---------- 配置 ----------
  const MODULES_BASE = '/modules/';
  let moduleMap = {};
  let pageRoutes = {};

  // ---------- 工具函数 ----------
  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url}: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      console.warn(`Error fetching ${url}:`, e);
      return null;
    }
  }

  // ---------- 加载模块映射 ----------
  async function loadModuleMap() {
    // 尝试多个可能的路径
    const paths = [
      '/module-map.json',
      '/modules/module-map.json',
      '/frontend/module-map.json'
    ];
    
    for (const path of paths) {
      const data = await fetchJSON(path);
      if (data) {
        moduleMap = data;
        console.log('📋 Module map loaded from:', path);
        return;
      }
    }
    
    // 如果所有路径都失败，使用硬编码回退
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
    console.log('📄 Loading page:', path);
    
    const route = pageRoutes[path];
    if (!route) {
      const contentEl = document.getElementById('content');
      if (contentEl) {
        contentEl.innerHTML = `<h1>404 - Page Not Found</h1><p>${path}</p>`;
      }
      return;
    }

    const contentEl = document.getElementById('content');
    if (!contentEl) {
      console.error('Content element not found!');
      return;
    }

    try {
      // 显示加载状态
      contentEl.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; min-height: 300px;">
          <div style="text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #007aff;"></i>
            <p style="margin-top: 12px; color: #6e6e73;">加载中...</p>
          </div>
        </div>
      `;

      // 加载 HTML
      const htmlUrl = route.htmlPath;
      console.log('Fetching HTML:', htmlUrl);
      
      const htmlRes = await fetch(htmlUrl);
      if (!htmlRes.ok) {
        throw new Error(`HTML ${htmlRes.status}: ${htmlRes.statusText}`);
      }
      
      const html = await htmlRes.text();
      console.log('HTML loaded, length:', html.length);
      
      // 如果 HTML 为空，使用默认内容
      if (!html.trim()) {
        contentEl.innerHTML = `
          <div style="padding: 40px;">
            <h1>${route.moduleId} - ${route.pageName}</h1>
            <p>This page is generated by V2 scaffolding.</p>
            <p style="color: #6e6e73; font-size: 14px;">HTML file exists but is empty. Please add content.</p>
          </div>
        `;
      } else {
        contentEl.innerHTML = html;
      }

      // 动态加载 JS（如果存在）
      try {
        const jsUrl = route.jsPath;
        console.log('Loading JS:', jsUrl);
        const jsModule = await import(jsUrl);
        if (jsModule.default && typeof jsModule.default.init === 'function') {
          await jsModule.default.init();
          console.log('✅ JS initialized for', route.moduleId, route.pageName);
        } else if (typeof jsModule.init === 'function') {
          await jsModule.init();
          console.log('✅ JS initialized for', route.moduleId, route.pageName);
        }
      } catch (e) {
        console.debug(`JS not available for ${route.moduleId}/${route.pageName}:`, e.message);
      }

      // 更新页面标题
      const titleEl = document.getElementById('currentPageTitle');
      if (titleEl) {
        const moduleName = moduleMap[route.moduleId] || route.moduleId;
        titleEl.textContent = `${moduleName} - ${route.pageName}`;
      }
      
      console.log('✅ Page loaded:', route.moduleId, route.pageName);
      
    } catch (error) {
      console.error('Page load error:', error);
      contentEl.innerHTML = `
        <div style="padding: 40px;">
          <h1 style="color: #ff3b30;">Error Loading Page</h1>
          <p><strong>Path:</strong> ${path}</p>
          <p><strong>Error:</strong> ${error.message}</p>
        </div>
      `;
    }
  }

  // ---------- 路由处理 ----------
  function handleRoute() {
    let hash = window.location.hash.replace('#', '') || '/01-dashboard/executive';
    if (!hash.startsWith('/')) hash = '/' + hash;
    console.log('📍 Route changed:', hash);
    
    if (!pageRoutes[hash]) {
      console.warn(`Unknown route: ${hash}, redirecting to default`);
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
    
    let html = `
      <div style="padding: 20px 16px; border-bottom: 1px solid #d2d2d7; margin-bottom: 8px;">
        <h2 style="font-size: 18px; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-car" style="color: #007aff;"></i>
          <span>Carwash Pro</span>
        </h2>
        <p style="font-size: 11px; color: #6e6e73; margin: 4px 0 0 0;">Enterprise V2</p>
      </div>
    `;
    
    html += '<ul style="list-style: none; padding: 0; margin: 0;">';
    
    for (const [id, name] of Object.entries(modules)) {
      const pages = getPagesForModule(id);
      const firstPage = pages.length > 0 ? pages[0] : 'index';
      const href = `#/${id}/${firstPage}`;
      const icon = getIconForModule(id);
      const isActive = window.location.hash.includes(id);
      
      html += `
        <li style="margin: 2px 8px;">
          <a href="${href}" 
             data-module="${id}"
             style="display: flex; align-items: center; padding: 10px 16px; border-radius: 8px; color: ${isActive ? '#fff' : '#1d1d1f'}; text-decoration: none; transition: all 0.2s ease; font-size: 14px; gap: 12px; cursor: pointer; background: ${isActive ? '#007aff' : 'transparent'};"
             onmouseover="this.style.background='${isActive ? '#007aff' : '#f5f5f7'}'" 
             onmouseout="this.style.background='${isActive ? '#007aff' : 'transparent'}'">
            <i class="fas fa-${icon}" style="width: 20px; text-align: center; color: ${isActive ? '#fff' : '#6e6e73'};"></i>
            <span>${name}</span>
          </a>
        </li>
      `;
    }
    
    html += '</ul>';
    sidebar.innerHTML = html;

    // 点击事件
    sidebar.querySelectorAll('a[data-module]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // 移除所有高亮
        sidebar.querySelectorAll('a[data-module]').forEach(l => {
          l.style.background = 'transparent';
          l.style.color = '#1d1d1f';
          const icon = l.querySelector('i');
          if (icon) icon.style.color = '#6e6e73';
        });
        // 高亮当前
        link.style.background = '#007aff';
        link.style.color = '#fff';
        const icon = link.querySelector('i');
        if (icon) icon.style.color = '#fff';
        
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

  // ---------- 应用初始化 ----------
  async function initApp() {
    console.log('🚀 Initializing V2 App...');

    try {
      // 1. 加载模块映射
      await loadModuleMap();

      // 2. 构建路由表
      await buildRoutes();

      // 3. 生成侧边栏
      buildSidebar(moduleMap);

      // 4. 启动路由监听
      window.addEventListener('hashchange', handleRoute);
      
      // 5. 处理初始路由
      setTimeout(handleRoute, 100);

      console.log('✅ V2 App ready successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize V2 App:', error);
      const content = document.getElementById('content');
      if (content) {
        content.innerHTML = `
          <div style="padding: 40px;">
            <h1 style="color: #ff3b30;">Application Initialization Error</h1>
            <p>${error.message}</p>
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