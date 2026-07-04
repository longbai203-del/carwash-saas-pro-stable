/**
 * api/vehicle-monitor.js - 车辆监控 API
 * GET    /api/vehicle-monitor
 * POST   /api/vehicle-monitor/entry
 * POST   /api/vehicle-monitor/exit
 * POST   /api/vehicle-monitor/recognize
 */
import { supabase, getPagination, safeQuery, getUserById } from './_lib/supabase.js';
import { authMiddleware, roleMiddleware } from './_lib/auth.js';
import { isRequired, validateVehicleRecord } from './_lib/validation.js';
import { logger } from './_lib/logger.js';

async function handler(req, res) {
    const { method } = req;
    const { action } = req.query;

    // GET /api/vehicle-monitor - 列表
    if (method === 'GET' && !action) {
        return handleList(req, res);
    }

    // POST /api/vehicle-monitor/entry - 进入
    if (method === 'POST' && action === 'entry') {
        return handleEntry(req, res);
    }

    // POST /api/vehicle-monitor/exit - 离开
    if (method === 'POST' && action === 'exit') {
        return handleExit(req, res);
    }

    // POST /api/vehicle-monitor/recognize - 识别
    if (method === 'POST' && action === 'recognize') {
        return handleRecognize(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ===== 车辆记录列表 =====
async function handleList(req, res) {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 20, date, plate, status } = req.query;

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

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

// ===== 车辆进入 =====
async function handleEntry(req, res) {
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

        const user = await getUserById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '未授权',
                code: 'UNAUTHORIZED'
            });
        }

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

        return res.status(201).json({
            success: true,
            data: result.data,
            message: `车辆 ${plate.toUpperCase()} 已进入`
        });

    } catch (error) {
        logger.error('[VehicleMonitor] 车辆进入失败:', error);
        return res.status(500).json({
            success: false,
            error: '记录车辆进入失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 车辆离开 =====
async function handleExit(req, res) {
    try {
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

        return res.status(200).json({
            success: true,
            data: result.data,
            message: `车辆 ${plate.toUpperCase()} 已离开，停留 ${durationMinutes} 分钟`
        });

    } catch (error) {
        logger.error('[VehicleMonitor] 车辆离开失败:', error);
        return res.status(500).json({
            success: false,
            error: '记录车辆离开失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

// ===== 车牌识别 =====
async function handleRecognize(req, res) {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: '图片数据不能为空',
                code: 'MISSING_IMAGE'
            });
        }

        // 模拟识别延迟
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockResults = [
            { plate: 'ABC 1234', plateColor: '白色', brand: 'Toyota', model: 'Camry', color: '白色', confidence: 0.96 },
            { plate: 'XYZ 5678', plateColor: '黄色', brand: 'Honda', model: 'Accord', color: '黑色', confidence: 0.94 },
            { plate: 'DEF 9012', plateColor: '蓝色', brand: 'Nissan', model: 'Altima', color: '银色', confidence: 0.92 },
            { plate: 'GHI 3456', plateColor: '白色', brand: 'Hyundai', model: 'Sonata', color: '白色', confidence: 0.95 }
        ];

        const randomIndex = Math.floor(Math.random() * mockResults.length);
        const result = mockResults[randomIndex];
        result.confidence = 0.85 + Math.random() * 0.14;

        return res.status(200).json({
            success: true,
            data: {
                plate: result.plate,
                plate_color: result.plateColor,
                brand: result.brand,
                model: result.model,
                color: result.color,
                confidence: Math.round(result.confidence * 100) / 100
            },
            message: '识别完成'
        });

    } catch (error) {
        logger.error('[VehicleMonitor] 车牌识别失败:', error);
        return res.status(500).json({
            success: false,
            error: '车牌识别失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));