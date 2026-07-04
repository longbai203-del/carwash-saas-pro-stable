/**
 * api/vehicle-monitor/exit.js - 车辆离开
 * POST /api/vehicle-monitor/exit
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware, roleMiddleware } from '../_lib/auth.js';
import { isRequired } from '../_lib/validation.js';
import { logger } from '../_lib/logger.js';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        const userId = req.user?.id;
        const { plate, note } = req.body;

        const errors = [];
        const plateError = isRequired(plate, '车牌号');
        if (plateError) errors.push(plateError);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        // 查找在场车辆
        const { data: vehicle } = await supabase
            .from('vehicle_records')
            .select('*')
            .eq('plate', plate.toUpperCase())
            .is('exit_time', null);

        if (!vehicle || vehicle.length === 0) {
            return res.status(404).json({
                success: false,
                error: '车辆不在场内',
                code: 'VEHICLE_NOT_FOUND'
            });
        }

        const record = vehicle[0];
        const now = new Date();
        const entryTime = new Date(record.entry_time);
        const durationMinutes = Math.round((now - entryTime) / (1000 * 60));

        const updateData = {
            exit_time: now.toISOString(),
            duration_minutes: durationMinutes,
            note: note || record.note,
            updated_at: now.toISOString()
        };

        const result = await safeQuery(() =>
            supabase.from('vehicle_records')
                .update(updateData)
                .eq('id', record.id)
                .select()
                .single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '记录车辆离开失败',
                code: 'DB_ERROR'
            });
        }

        await supabase.from('audit_logs').insert({
            action: 'VEHICLE_EXIT',
            table_name: 'vehicle_records',
            record_id: record.id,
            username: req.user?.username || 'system',
            data: { plate: plate.toUpperCase(), duration: durationMinutes },
            created_at: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            data: result.data,
            message: `车辆 ${plate.toUpperCase()} 已离开，停留 ${durationMinutes} 分钟`
        });

    } catch (error) {
        logger.error('[VehicleExit] 车辆离开失败:', error);
        return res.status(500).json({
            success: false,
            error: '记录车辆离开失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));