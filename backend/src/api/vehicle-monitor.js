/**
 * api/vehicle-monitor.js - 车辆监控 API
 * 
 * GET    /api/vehicle-monitor                 - 获取车辆记录列表
 * POST   /api/vehicle-monitor?action=entry   - 车辆进入
 * POST   /api/vehicle-monitor?action=exit    - 车辆离开
 * POST   /api/vehicle-monitor?action=recognize - 车牌识别（模拟）
 * POST   /api/vehicle-monitor?action=webhook - NVR 摄像头 Webhook
 */
import { supabase, getPagination, safeQuery, getUserById } from '../shared/lib/supabase.js';
import { authenticate, roleMiddleware } from '../middleware/auth.js';
import { isRequired, validateVehicleRecord } from '../shared/lib/validation.js';
import { logger } from '../shared/lib/logger.js';

// ============================================================
// 主 Handler
// ============================================================
async function handler(req, res) {
    const { method } = req;
    const { action } = req.query;

    // GET /api/vehicle-monitor - 列表
    if (method === 'GET' && !action) {
        return handleList(req, res);
    }

    // POST /api/vehicle-monitor?action=entry - 进入
    if (method === 'POST' && action === 'entry') {
        return handleEntry(req, res);
    }

    // POST /api/vehicle-monitor?action=exit - 离开
    if (method === 'POST' && action === 'exit') {
        return handleExit(req, res);
    }

    // POST /api/vehicle-monitor?action=recognize - 识别
    if (method === 'POST' && action === 'recognize') {
        return handleRecognize(req, res);
    }

    // POST /api/vehicle-monitor?action=webhook - NVR Webhook
    if (method === 'POST' && action === 'webhook') {
        return handleWebhook(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
    });
}

// ============================================================
// 1. 车辆记录列表
// ============================================================
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

// ============================================================
// 2. 车辆进入
// ============================================================
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

// ============================================================
// 3. 车辆离开
// ============================================================
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

// ============================================================
// 4. 车牌识别（模拟）
// ============================================================
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

// ============================================================
// 5. NVR Webhook（从 webhooks/nvr.js 合并）
// ============================================================
async function handleWebhook(req, res) {
    try {
        // 验证 Webhook 密钥
        const secret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.NVR_WEBHOOK_SECRET;

        if (expectedSecret && secret !== expectedSecret) {
            return res.status(401).json({
                success: false,
                error: 'Invalid webhook secret',
                code: 'UNAUTHORIZED'
            });
        }

        const {
            channel = 1,
            eventType = 'vehicle_detected',
            timestamp,
            imageUrl,
            imageBase64
        } = req.body;

        logger.info(`📸 [${new Date().toISOString()}] 收到 NVR 推送:`, {
            channel,
            eventType,
            hasImage: !!imageUrl || !!imageBase64
        });

        // 获取图片数据并识别车牌
        let plateResult = null;
        let savedImageUrl = imageUrl || '';

        if (imageBase64) {
            plateResult = await recognizePlateFromBase64(imageBase64);
        } else if (imageUrl) {
            plateResult = await recognizePlateFromUrl(imageUrl);
        }

        // 生成记录编号
        const recordNo = `NVR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        // 准备保存的数据
        const recordData = {
            record_no: recordNo,
            captured_at: timestamp || new Date().toISOString(),
            license_plate: plateResult?.plate || '',
            vehicle_type: plateResult?.type || '',
            vehicle_size: plateResult?.size || '',
            vehicle_color: plateResult?.color || '',
            confidence: plateResult?.confidence || 0,
            image_url: savedImageUrl,
            source: 'camera',
            status: 'pending'
        };

        logger.info('📝 准备保存:', {
            record_no: recordNo,
            plate: recordData.license_plate || '未识别',
            confidence: recordData.confidence
        });

        // 保存到 Supabase
        const { data, error } = await supabase
            .from('vehicle_records')
            .insert([recordData])
            .select();

        if (error) {
            logger.error('❌ 数据库写入失败:', error);
            return res.status(500).json({
                success: false,
                error: 'Database error',
                detail: error.message
            });
        }

        logger.info(`✅ 车辆记录已保存: ${recordNo}`);

        return res.status(200).json({
            success: true,
            record: data[0],
            plate: plateResult || { plate: '未识别', confidence: 0 }
        });

    } catch (error) {
        logger.error('[Webhook] 处理失败:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error',
            detail: error.message
        });
    }
}

// ============================================================
// 辅助函数：从 Base64 识别车牌
// ============================================================
async function recognizePlateFromBase64(imageBase64) {
    const plateApiToken = process.env.PLATE_API_TOKEN;
    if (!plateApiToken) {
        logger.warn('⚠️ 未配置 PLATE_API_TOKEN，跳过车牌识别');
        return null;
    }

    try {
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('upload', blob, 'plate.jpg');

        const response = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${plateApiToken}`
            },
            body: formData
        });

        if (!response.ok) {
            logger.warn(`⚠️ 车牌识别 API 返回错误: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                plate: result.plate || '',
                type: result.vehicle?.type || '',
                size: result.vehicle?.size || '',
                color: result.vehicle?.color || '',
                confidence: Math.round((result.score || 0) * 100)
            };
        }
        return null;

    } catch (error) {
        logger.error('[Recognize] 车牌识别失败:', error.message);
        return null;
    }
}

// ============================================================
// 辅助函数：从 URL 下载图片并识别车牌
// ============================================================
async function recognizePlateFromUrl(imageUrl) {
    const plateApiToken = process.env.PLATE_API_TOKEN;
    if (!plateApiToken) {
        logger.warn('⚠️ 未配置 PLATE_API_TOKEN，跳过车牌识别');
        return null;
    }

    try {
        const nvrAuth = process.env.NVR_AUTH || '';
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'Authorization': nvrAuth
            }
        });

        if (!imageResponse.ok) {
            logger.warn(`⚠️ 下载图片失败: ${imageResponse.status}`);
            return null;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        return await recognizePlateFromBase64(base64Image);

    } catch (error) {
        logger.error('[Recognize] 从 URL 识别车牌失败:', error.message);
        return null;
    }
}

// ============================================================
// 导出（仅 owner 和 admin 可访问）
// ============================================================
export default authenticate(roleMiddleware(['owner', 'admin'])(handler));
