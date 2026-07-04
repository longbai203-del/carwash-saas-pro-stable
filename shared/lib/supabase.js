/**
 * shared/lib/supabase.js - 服务端 Supabase 客户端
 * 使用 Service Role Key 获得完整数据库访问权限
 * 供 api/ 目录下的 Vercel Serverless Functions 使用
 */
import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [Supabase] 环境变量未设置: SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
}

// 创建服务端客户端（使用 Service Role Key）
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('[Supabase] ✅ 服务端客户端已加载');

// ============================================================
// 用户相关函数
// ============================================================

/**
 * 从请求中获取用户信息（通过 JWT）
 */
export async function getUserFromRequest(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        
        const token = authHeader.replace('Bearer ', '');
        if (!token) return null;
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            console.warn('[Supabase] 获取用户失败:', error.message);
            return null;
        }
        return user;
    } catch (error) {
        console.error('[Supabase] 获取用户异常:', error);
        return null;
    }
}

/**
 * 根据用户ID获取用户信息（从 users 表）
 */
export async function getUserById(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[Supabase] 获取用户失败:', error);
        return null;
    }
}

/**
 * 检查用户是否有指定权限
 */
export async function checkPermission(userId, permissionCode) {
    try {
        // 先获取用户角色
        const user = await getUserById(userId);
        if (!user) return false;
        
        // Owner 和 Admin 拥有所有权限
        if (user.role === 'owner' || user.role === 'admin') return true;
        
        // 查询用户权限
        const { data, error } = await supabase
            .from('user_permissions')
            .select('permission_code')
            .eq('user_id', userId)
            .eq('permission_code', permissionCode);
        
        if (error) return false;
        return data && data.length > 0;
    } catch (error) {
        console.error('[Supabase] 检查权限失败:', error);
        return false;
    }
}

/**
 * 检查用户是否有指定角色
 */
export async function checkRole(userId, roleCode) {
    try {
        const user = await getUserById(userId);
        if (!user) return false;
        return user.role === roleCode;
    } catch (error) {
        console.error('[Supabase] 检查角色失败:', error);
        return false;
    }
}

/**
 * 获取用户的租户ID和门店ID
 */
export async function getUserContext(userId) {
    try {
        const user = await getUserById(userId);
        if (!user) return { tenantId: null, storeId: null };
        return {
            tenantId: user.tenant_id || null,
            storeId: user.store_id || null
        };
    } catch (error) {
        console.error('[Supabase] 获取用户上下文失败:', error);
        return { tenantId: null, storeId: null };
    }
}

// ============================================================
// 分页工具
// ============================================================

/**
 * 生成分页查询参数
 */
export function getPagination(page = 1, limit = 20) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    return { from: start, to: end };
}

// ============================================================
// 安全查询包装器
// ============================================================

/**
 * 安全执行查询，统一错误处理
 */
export async function safeQuery(queryFn) {
    try {
        const result = await queryFn();
        if (result.error) {
            console.error('[Supabase] 查询错误:', result.error);
            return { success: false, error: result.error.message, data: null };
        }
        return { success: true, data: result.data, error: null };
    } catch (error) {
        console.error('[Supabase] 查询异常:', error);
        return { success: false, error: error.message, data: null };
    }
}

// ============================================================
// 通用 CRUD 操作（可选，直接使用 supabase 对象也可以）
// ============================================================

/**
 * 查询数据（带过滤、排序、分页）
 */
export async function queryTable(table, options = {}) {
    try {
        let query = supabase.from(table).select(options.select || '*');

        if (options.filter) {
            Object.keys(options.filter).forEach(key => {
                query = query.eq(key, options.filter[key]);
            });
        }
        if (options.order) {
            query = query.order(options.order.by, {
                ascending: options.order.ascending || false
            });
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.page) {
            const { from, to } = getPagination(options.page, options.limit || 20);
            query = query.range(from, to);
        }

        const result = await query;
        if (result.error) throw result.error;
        return { success: true, data: result.data, error: null };
    } catch (error) {
        console.error('[Supabase] queryTable 错误:', error);
        return { success: false, data: null, error: error.message };
    }
}

/**
 * 插入数据
 */
export async function insertRow(table, data) {
    try {
        const result = await supabase.from(table).insert(data).select();
        if (result.error) throw result.error;
        return { success: true, data: result.data, error: null };
    } catch (error) {
        console.error('[Supabase] insertRow 错误:', error);
        return { success: false, data: null, error: error.message };
    }
}

/**
 * 更新数据
 */
export async function updateRow(table, id, data) {
    try {
        const result = await supabase.from(table).update(data).eq('id', id).select();
        if (result.error) throw result.error;
        return { success: true, data: result.data, error: null };
    } catch (error) {
        console.error('[Supabase] updateRow 错误:', error);
        return { success: false, data: null, error: error.message };
    }
}

/**
 * 删除数据
 */
export async function deleteRow(table, id) {
    try {
        const result = await supabase.from(table).delete().eq('id', id);
        if (result.error) throw result.error;
        return { success: true, error: null };
    } catch (error) {
        console.error('[Supabase] deleteRow 错误:', error);
        return { success: false, error: error.message };
    }
}