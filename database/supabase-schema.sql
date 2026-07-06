-- ============================================================
-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 产品表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    category_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT '个',
    status VARCHAR(20) DEFAULT 'active',
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 分类表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 客户表
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    level VARCHAR(20) DEFAULT 'bronze',
    total_spent DECIMAL(10,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    last_visit TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 订单表
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10,2) DEFAULT 0,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_method VARCHAR(30),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 员工表
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    salary DECIMAL(10,2) DEFAULT 0,
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 插入示例数据
-- ============================================================

-- 插入分类
INSERT INTO categories (name, description) VALUES
('洗车', '洗车服务'),
('美容', '汽车美容服务'),
('保养', '汽车保养服务'),
('配件', '汽车配件');

-- 插入产品
INSERT INTO products (name, price, cost, stock_quantity, unit, category_id) VALUES
('标准洗车', 68, 20, 45, '次', (SELECT id FROM categories WHERE name = '洗车' LIMIT 1)),
('精致洗车', 128, 40, 30, '次', (SELECT id FROM categories WHERE name = '洗车' LIMIT 1)),
('抛光打蜡', 388, 100, 20, '次', (SELECT id FROM categories WHERE name = '美容' LIMIT 1)),
('内饰清洗', 328, 80, 15, '次', (SELECT id FROM categories WHERE name = '美容' LIMIT 1));

-- 插入客户
INSERT INTO customers (name, phone, level, total_spent, order_count) VALUES
('张伟', '13800001111', 'gold', 12500, 15),
('李娜', '13800002222', 'vip', 32800, 28),
('王强', '13800003333', 'silver', 5600, 8);

-- 插入订单
INSERT INTO orders (order_number, customer_name, total, status) VALUES
('ORD-2026-0001', '张伟', 680, 'completed'),
('ORD-2026-0002', '李娜', 420, 'pending');

-- 插入员工
INSERT INTO employees (name, department, position, salary) VALUES
('张伟', '管理部', '经理', 12000),
('李娜', '销售部', '主管', 8000);

-- ============================================================
-- 启用 Row Level Security (RLS)
-- ============================================================

-- 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作 - 开发环境）
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON employees FOR ALL USING (true);