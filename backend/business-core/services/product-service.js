/**
 * business-core/services/product-service.js
 * 商品服务 - 产品管理核心
 */

import { BaseService } from './base-service.js';

export class ProductService extends BaseService {
    constructor() {
        super('products');
    }

    // 获取商品列表（含分类）
    async getList(params = {}) {
        const query = this.supabase.from(this.tableName).select(`
            *,
            categories:category_id (id, name)
        `);

        // 分页
        if (params.page) {
            const from = (params.page - 1) * (params.limit || 10);
            const to = from + (params.limit || 10) - 1;
            query.range(from, to);
        }

        // 排序
        query.order('created_at', { ascending: false });

        // 过滤
        if (params.name) {
            query.ilike('name', `%${params.name}%`);
        }
        if (params.category) {
            query.eq('category_id', params.category);
        }
        if (params.status) {
            query.eq('status', params.status);
        }
        if (params.minPrice) {
            query.gte('price', params.minPrice);
        }
        if (params.maxPrice) {
            query.lte('price', params.maxPrice);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            list: data || [],
            total: count || data?.length || 0,
            page: params.page || 1,
            limit: params.limit || 10
        };
    }

    // 获取商品详情（含库存）
    async getDetail(id) {
        const product = await this.findById(id);
        if (!product) return null;

        // 获取库存信息
        const { data: inventory } = await this.supabase
            .from('inventory_items')
            .select('*, warehouses(name)')
            .eq('product_id', id);

        // 获取变体
        const { data: variants } = await this.supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', id);

        return {
            ...product,
            inventory: inventory || [],
            variants: variants || []
        };
    }

    // 更新库存
    async updateStock(productId, quantity, warehouseId, note = '') {
        try {
            // 查找或创建库存记录
            let { data: inventory } = await this.supabase
                .from('inventory_items')
                .select('*')
                .eq('product_id', productId)
                .eq('warehouse_id', warehouseId)
                .single();

            if (!inventory) {
                // 创建库存记录
                const { data: newInventory, error: createError } = await this.supabase
                    .from('inventory_items')
                    .insert({
                        product_id: productId,
                        warehouse_id: warehouseId,
                        quantity: 0
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                inventory = newInventory;
            }

            // 记录变动日志
            const previousQuantity = inventory.quantity || 0;
            const newQuantity = previousQuantity + quantity;

            // 更新库存
            const { data: updated, error: updateError } = await this.supabase
                .from('inventory_items')
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', inventory.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // 记录日志
            const { error: logError } = await this.supabase
                .from('inventory_logs')
                .insert({
                    inventory_id: inventory.id,
                    change_type: quantity > 0 ? 'adjustment' : 'adjustment',
                    quantity: quantity,
                    previous_quantity: previousQuantity,
                    new_quantity: newQuantity,
                    note: note,
                    created_by: localStorage.getItem('userId')
                });

            if (logError) console.warn('日志记录失败:', logError);

            // 更新商品总库存
            await this._updateProductTotalStock(productId);

            this.clearCache();
            this.emit('stock:updated', { productId, warehouseId, newQuantity });
            return updated;

        } catch (error) {
            console.error(`❌ ProductService.updateStock 失败:`, error);
            throw error;
        }
    }

    // 更新商品总库存
    async _updateProductTotalStock(productId) {
        const { data: items, error } = await this.supabase
            .from('inventory_items')
            .select('quantity')
            .eq('product_id', productId);

        if (error) throw error;

        const totalStock = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

        await this.supabase
            .from(this.tableName)
            .update({ stock_quantity: totalStock })
            .eq('id', productId);

        this.clearCache();
    }

    // 获取低库存商品
    async getLowStockItems(threshold = 10) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .lt('stock_quantity', threshold)
            .eq('status', 'active');

        if (error) throw error;
        return data || [];
    }

    // 获取分类列表
    async getCategories() {
        const { data, error } = await this.supabase
            .from('categories')
            .select('*')
            .eq('status', 'active')
            .order('sort_order');

        if (error) throw error;
        return data || [];
    }

    // 创建分类
    async createCategory(data) {
        const { data: result, error } = await this.supabase
            .from('categories')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        this.clearCache();
        return result;
    }
}

export default ProductService;