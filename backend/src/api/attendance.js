/**
 * api/attendance.js - 考勤 API
 * GET    /api/attendance
 * POST   /api/attendance/clock
 */
import { supabase, getPagination, safeQuery, getUserById } from '../shared/lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { isRequired } from '../shared/lib/validation.js';
import { logger } from '../shared/lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { action } = req.query;

    // GET /api/attendance - 列表
    if (method === 'GET' && !action) {
        return handleList(req, res);
    }

    // POST /api/attendance/clock - 打卡
    if (method === 'POST' && action === 'clock') {
        return handleClock(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ===== 考勤列表 =====
async function handleList(req, res) {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 20, date, employee_id } = req.query;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        let query = supabase.from('attendance').select('*', { count: 'exact' });

        if (user?.tenant_id) {
            query = query.eq('tenant_id', user.tenant_id);
        }

        if (date) {
            query = query.eq('date', date);
        }

        // 普通员工只能看自己的考勤
        if (user?.role === 'employee' || user?.role === 'cashier') {
            query = query.eq('employee_id', userId);
        } else if (employee_id) {
            query = query.eq('employee_id', employee_id);
        }

        const { from, to } = getPagination(parseInt(page), parseInt(limit));
        query = query.order('time', { ascending: false }).range(from, to);

        const result = await safeQuery(() => query);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: '查询考勤失败',
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
        logger.error('[Attendance] 获取考勤失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取考勤失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 打卡 =====
async function handleClock(req, res) {
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
                error: '无效的打卡类型',
                code: 'INVALID_TYPE'
            });
        }

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        const { data: existing } = await supabase
            .from('attendance')
            .select('id, check_in_time, check_out_time')
            .eq('employee_id', userId)
            .eq('date', today);

        if (type === 'in') {
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

            return res.status(200).json({
                success: true,
                data: result.data,
                message: '打卡上班成功'
            });

        } else {
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

            return res.status(200).json({
                success: true,
                data: result.data,
                message: '打卡下班成功'
            });
        }

    } catch (error) {
        logger.error('[Attendance] 打卡失败:', error);
        return res.status(500).json({
            success: false,
            error: '打卡失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authenticate(handler);
