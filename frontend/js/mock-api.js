/**
 * mock-api.js - 模拟API数据
 * 用于开发环境，提供Mock数据
 */

window.MockAPI = {
    // 通用响应格式
    response: function(data, total) {
      return {
        code: 0,
        message: 'success',
        data: {
          list: data || [],
          total: total || (data ? data.length : 0),
          page: 1,
          limit: 10
        }
      };
    },
  
    // 生成订单数据
    getOrders: function(params) {
      var orders = [];
      var statuses = ['pending', 'processing', 'completed', 'cancelled'];
      var customers = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
      var products = ['洗车套餐A', '洗车套餐B', '汽车美容', '抛光打蜡', '内饰清洁', '空调清洗'];
  
      for (var i = 0; i < 25; i++) {
        var total = Math.floor(Math.random() * 1000) + 100;
        orders.push({
          id: 'ORD-' + String(i + 1).padStart(6, '0'),
          orderNo: 'ORD-2026-' + String(i + 1).padStart(4, '0'),
          customer: customers[i % customers.length],
          phone: '138' + String(Math.floor(Math.random() * 90000000) + 10000000),
          total: total,
          status: statuses[i % statuses.length],
          items: [
            { name: products[i % products.length], qty: Math.floor(Math.random() * 3) + 1, price: Math.floor(Math.random() * 300) + 50 }
          ],
          createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
  
      return this.response(orders);
    },
  
    // 生成商品数据
    getProducts: function(params) {
      var products = [];
      var names = ['泡沫洗车液', '水蜡', '轮胎光亮剂', '玻璃清洁剂', '内饰清洗剂', '空调清洗剂', '车蜡', '抛光剂'];
      var categories = ['洗车', '美容', '保养', '配件'];
  
      for (var i = 0; i < 20; i++) {
        products.push({
          id: 'PRD-' + String(i + 1).padStart(6, '0'),
          name: names[i % names.length],
          category: categories[i % categories.length],
          price: Math.floor(Math.random() * 500) + 50,
          cost: Math.floor(Math.random() * 300) + 20,
          stock: Math.floor(Math.random() * 500) + 10,
          unit: '桶',
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
  
      return this.response(products);
    },
  
    // 生成客户数据
    getCustomers: function(params) {
      var customers = [];
      var names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
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
  
      return this.response(customers);
    },
  
    // 生成员工数据
    getEmployees: function(params) {
      var employees = [];
      var names = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
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
  
      return this.response(employees);
    },
  
    // 生成采购订单数据
    getPurchaseOrders: function(params) {
      var orders = [];
      var suppliers = ['上海供应商有限公司', '深圳科技材料公司', '广州五金制品厂', '北京电子元件商行'];
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
  
      return this.response(orders);
    },
  
    // 生成Dashboard统计
    getDashboardStats: function() {
      return {
        code: 0,
        data: {
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
        }
      };
    }
  };
  
  console.log('✅ MockAPI 已加载');