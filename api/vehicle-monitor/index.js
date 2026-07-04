/**
 * api/vehicle-monitor/index.js - 获取车辆记录
 * GET /api/vehicle-monitor
 */
import { supabase, getPagination, safeQuery } from '../_lib/supabase.js';
import { authMiddleware, roleMiddleware } from '../_lib/auth.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const userId = req.user?.id;
        const { page = 1, limit = 20, date, plate, status } = req.query;

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id')
            .eq('id', userId)
            .single();

        let query = supabase.from('vehicle_records').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (date) {
            query = query.eq('date', date);
        }

        if (plate) {
            query = query.ilike('plate', `%${plate}%`);
        }

        if (status === 'inside') {
            query = query.is('exit_time', null);
        } else if (status === 'outside') {
            query = query.not('exit_time', 'is', null);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('entry_time', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询车辆记录失败',
                code: 'DB_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.data?.length || 0
            }
        });

    } catch (error) {
        logger.error('[VehicleMonitor] 获取车辆记录失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取车辆记录失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));