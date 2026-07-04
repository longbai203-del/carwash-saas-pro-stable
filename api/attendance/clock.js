/**
 * api/attendance/clock.js - 打卡
 * POST /api/attendance/clock
 */
import { supabase, safeQuery } from '../_lib/supabase.js';
import { authMiddleware } from '../_lib/auth.js';
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
        const { type, lat, lng, location } = req.body;

        const errors = [];
        const typeError = isRequired(type, '打卡类型');
        if (typeError) errors.push(typeError);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                errors: errors,
                code: 'VALIDATION_ERROR'
            });
        }

        if (!['in', 'out'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '无效的打卡类型，必须是 in 或 out',
                code: 'INVALID_TYPE'
            });
        }

        const { data: user } = await supabase
            .from('users')
            .select('tenant_id, store_id, name, username')
            .eq('id', userId)
            .single();

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // 检查今日是否已打卡
        const { data: existing } = await supabase
            .from('attendance')
            .select('id, check_in_time, check_out_time')
            .eq('employee_id', userId)
            .eq('date', today);

        let attendanceId = null;

        if (type === 'in') {
            // 检查是否已打卡
            if (existing && existing.length > 0 && existing[0].check_in_time) {
                return res.status(409).json({
                    success: false,
                    error: '今日已打卡上班',
                    code: 'ALREADY_CLOCKED_IN'
                });
            }

            const result = await safeQuery(() =>
                supabase.from('attendance').insert({
                    employee_id: userId,
                    staff_name: user?.name || user?.username || '员工',
                    date: today,
                    check_in_time: now,
                    check_in_lat: lat || null,
                    check_in_lng: lng || null,
                    check_in_location: location || null,
                    tenant_id: user?.tenant_id || null,
                    store_id: user?.store_id || null,
                    status: 'present',
                    created_at: now
                }).select().single()
            );

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: '打卡失败',
                    code: 'DB_ERROR'
                });
            }

            attendanceId = result.data.id;

        } else {
            // 下班打卡
            if (!existing || existing.length === 0 || !existing[0].check_in_time) {
                return res.status(400).json({
                    success: false,
                    error: '今日尚未打卡上班',
                    code: 'NOT_CLOCKED_IN'
                });
            }

            if (existing[0].check_out_time) {
                return res.status(409).json({
                    success: false,
                    error: '今日已打卡下班',
                    code: 'ALREADY_CLOCKED_OUT'
                });
            }

            const checkInTime = new Date(existing[0].check_in_time);
            const checkOutTime = new Date(now);
            const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

            const result = await safeQuery(() =>
                supabase.from('attendance')
                    .update({
                        check_out_time: now,
                        check_out_lat: lat || null,
                        check_out_lng: lng || null,
                        check_out_location: location || null,
                        work_hours: Math.round(workHours * 100) / 100,
                        updated_at: now
                    })
                    .eq('id', existing[0].id)
                    .select().single()
            );

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: '打卡失败',
                    code: 'DB_ERROR'
                });
            }

            attendanceId = result.data.id;
        }

        // 记录审计日志
        await supabase.from('audit_logs').insert({
            action: type === 'in' ? 'CLOCK_IN' : 'CLOCK_OUT',
            table_name: 'attendance',
            record_id: attendanceId,
            username: req.user?.username || 'system',
            data: { type, lat, lng },
            created_at: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            data: { id: attendanceId },
            message: type === 'in' ? '打卡上班成功' : '打卡下班成功'
        });

    } catch (error) {
        logger.error('[Clock] 打卡失败:', error);
        return res.status(500).json({
            success: false,
            error: '打卡失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(handler);