/**
 * api/vehicle-monitor/entry.js - 车辆进入
 * POST /api/vehicle-monitor/entry
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware, roleMiddleware } from '../_lib/auth.js';
import { validateVehicleRecord } from '../_lib/validation.js';
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
        const { plate, vehicle_type, note, plate_color, vehicle_brand, vehicle_model, vehicle_color } = req.body;

        const errors = validateVehicleRecord({ plate });
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        // 检查车辆是否已在场内
        const { data: existing } = await supabase
            .from('vehicle_records')
            .select('id')
            .eq('plate', plate.toUpperCase())
            .is('exit_time', null);

        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: '车辆已在场内',
                code: 'VEHICLE_INSIDE'
            });
        }

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id')
            .eq('id', userId)
            .single();

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const recordData = {
            plate: plate.toUpperCase(),
            vehicle_type: vehicle_type || 'sedan',
            direction: 'in',
            date: today,
            entry_time: now.toISOString(),
            exit_time: null,
            duration_minutes: null,
            note: note || '',
            plate_color: plate_color || null,
            vehicle_brand: vehicle_brand || null,
            vehicle_model: vehicle_model || null,
            vehicle_color: vehicle_color || null,
            operator_id: userId,
            tenant_id: user?.tenant_id || null,
            store_id: user?.store_id || null,
            created_at: now.toISOString()
        };

        const result = await safeQuery(() =>
            supabase.from('vehicle_records').insert(recordData).select().single()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '记录车辆进入失败',
                code: 'DB_ERROR'
            });
        }

        await supabase.from('audit_logs').insert({
            action: 'VEHICLE_ENTRY',
            table_name: 'vehicle_records',
            record_id: result.data.id,
            username: req.user?.username || 'system',
            data: { plate: plate.toUpperCase() },
            created_at: new Date().toISOString()
        });

        return res.status(201).json({
            success: true,
            data: result.data,
            message: `车辆 ${plate.toUpperCase()} 已进入`
        });

    } catch (error) {
        logger.error('[VehicleEntry] 车辆进入失败:', error);
        return res.status(500).json({
            success: false,
            error: '记录车辆进入失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));