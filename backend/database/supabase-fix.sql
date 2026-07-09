-- ============================================================
-- Carwash Pro V3 - Supabase 数据库修复脚本
-- 检查并修复缺失的列
-- ============================================================

-- 1. 检查并修复 products 表
DO $$ 
BEGIN
    -- 添加 price 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE products ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ 添加 products.price 列';
    END IF;

    -- 添加 cost 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost') THEN
        ALTER TABLE products ADD COLUMN cost DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ 添加 products.cost 列';
    END IF;

    -- 添加 stock_quantity 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
        ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 products.stock_quantity 列';
    END IF;

    -- 添加 unit 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'unit') THEN
        ALTER TABLE products ADD COLUMN unit VARCHAR(20) DEFAULT 'piece';
        RAISE NOTICE '✅ 添加 products.unit 列';
    END IF;

    -- 添加 vat_rate 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vat_rate') THEN
        ALTER TABLE products ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 15.00;
        RAISE NOTICE '✅ 添加 products.vat_rate 列';
    END IF;

    -- 添加 category_id 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
        ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);
        RAISE NOTICE '✅ 添加 products.category_id 列';
    END IF;
END $$;

-- 2. 检查并修复 customers 表
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_spent') THEN
        ALTER TABLE customers ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ 添加 customers.total_spent 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_orders') THEN
        ALTER TABLE customers ADD COLUMN total_orders INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 customers.total_orders 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_visit') THEN
        ALTER TABLE customers ADD COLUMN last_visit TIMESTAMP;
        RAISE NOTICE '✅ 添加 customers.last_visit 列';
    END IF;
END $$;

-- 3. 检查并修复 orders 表
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'ORD-' || gen_random_uuid();
        RAISE NOTICE '✅ 添加 orders.order_number 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ 添加 orders.subtotal 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ 添加 orders.total_amount 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vat_amount') THEN
        ALTER TABLE orders ADD COLUMN vat_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ 添加 orders.vat_amount 列';
    END IF;
END $$;

-- 4. 检查并修复 inventory_items 表
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'quantity') THEN
        ALTER TABLE inventory_items ADD COLUMN quantity INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 inventory_items.quantity 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'reserved_quantity') THEN
        ALTER TABLE inventory_items ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 inventory_items.reserved_quantity 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'min_stock') THEN
        ALTER TABLE inventory_items ADD COLUMN min_stock INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 添加 inventory_items.min_stock 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'max_stock') THEN
        ALTER TABLE inventory_items ADD COLUMN max_stock INTEGER DEFAULT 99999;
        RAISE NOTICE '✅ 添加 inventory_items.max_stock 列';
    END IF;
END $$;

-- 5. 检查并修复 employees 表
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'salary') THEN
        ALTER TABLE employees ADD COLUMN salary DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ 添加 employees.salary 列';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_number') THEN
        ALTER TABLE employees ADD COLUMN employee_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'EMP-' || gen_random_uuid();
        RAISE NOTICE '✅ 添加 employees.employee_number 列';
    END IF;
END $$;

-- ============================================================
-- 验证结果
-- ============================================================

-- 查看 products 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 查看 customers 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 查看 orders 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

SELECT '✅ 数据库修复完成！请重新执行种子数据插入。' as status;