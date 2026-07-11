/**
 * 产品服务
 * 处理所有产品相关的业务逻辑
 * 
 * @module services/ProductService
 * @extends BaseService
 * 
 * @example
 * import ProductService from './ProductService.js'
 * const productService = new ProductService()
 * const { data } = await productService.findByCategory('car-wash')
 */

import BaseService from './BaseService.js'

/**
 * @typedef {Object} Product
 * @property {string} id - 产品ID
 * @property {string} tenant_id - 租户ID
 * @property {string} category_id - 分类ID
 * @property {string} name - 产品名称
 * @property {string} description - 产品描述
 * @property {string} sku - SKU
 * @property {string} barcode - 条形码
 * @property {number} unit_price - 单价
 * @property {number} cost_price - 成本价
 * @property {number} min_stock - 最小库存
 * @property {number} max_stock - 最大库存
 * @property {number} current_stock - 当前库存
 * @property {string} unit - 单位
 * @property {number} tax_rate - 税率
 * @property {boolean} is_service - 是否为服务
 * @property {boolean} is_active - 是否激活
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 * @property {string} deleted_at - 删除时间
 */

class ProductService extends BaseService {
  /**
   * 创建产品服务实例
   */
  constructor() {
    super({
      table: 'products',
      selectFields: [
        'id', 'tenant_id', 'category_id', 'name', 'description',
        'sku', 'barcode', 'unit_price', 'cost_price',
        'min_stock', 'max_stock', 'current_stock', 'unit',
        'tax_rate', 'is_service', 'is_active',
        'created_at', 'updated_at'
      ],
      defaultOrder: { field: 'name', ascending: true }
    })
  }

  /**
   * 根据分类查找产品
   * @param {string} categoryId - 分类ID
   * @param {Object} options - 查询选项
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async findByCategory(categoryId, options = {}) {
    return this.findAll({
      ...options,
      filters: { category_id: categoryId, ...options.filters }
    })
  }

  /**
   * 根据SKU查找产品
   * @param {string} sku - SKU
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findBySku(sku, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('sku', sku)
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 根据条形码查找产品
   * @param {string} barcode - 条形码
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findByBarcode(barcode, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('barcode', barcode)
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  /**
   * 查找低库存产品
   * @param {string} tenantId - 租户ID
   * @param {number} threshold - 阈值（默认为最小库存）
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async findLowStock(tenantId, threshold = null) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('tenant_id', tenantId)
        .eq('is_service', false)
        .eq('is_active', true)

      if (threshold !== null) {
        query = query.lt('current_stock', threshold)
      } else {
        query = query.lt('current_stock', this.supabase.raw('min_stock'))
      }

      const { data, error } = await query.order('current_stock', { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 搜索产品
   * @param {string} query - 搜索关键词
   * @param {string} tenantId - 租户ID
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async search(query, tenantId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.selectFields.join(','))
        .eq('tenant_id', tenantId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 批量更新价格
   * @param {Array} updates - 价格更新列表 [{id, unit_price}]
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  async bulkUpdatePrices(updates) {
    try {
      const results = []
      for (const update of updates) {
        const { data, error } = await this.update(update.id, {
          unit_price: update.unit_price
        })
        if (error) {
          console.warn(`Failed to update product ${update.id}:`, error)
        } else {
          results.push(data)
        }
      }
      return { data: results, error: null }
    } catch (error) {
      return { data: [], error: error.message }
    }
  }

  /**
   * 验证产品数据
   * @param {Object} data - 产品数据
   * @throws {Error} 验证失败时抛出
   */
  validateData(data) {
    if (!data.name) {
      throw new Error('Product name is required')
    }
    if (data.unit_price !== undefined && data.unit_price < 0) {
      throw new Error('Unit price must be non-negative')
    }
    if (data.cost_price !== undefined && data.cost_price < 0) {
      throw new Error('Cost price must be non-negative')
    }
    if (data.current_stock !== undefined && data.current_stock < 0) {
      throw new Error('Current stock must be non-negative')
    }
    if (data.min_stock !== undefined && data.min_stock < 0) {
      throw new Error('Minimum stock must be non-negative')
    }
    if (data.tax_rate !== undefined && (data.tax_rate < 0 || data.tax_rate > 100)) {
      throw new Error('Tax rate must be between 0 and 100')
    }
    return true
  }
}

export default ProductService