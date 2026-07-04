// ============================================================
// api/nvr-webhook.js
// Vercel Serverless Function - 接收 NVR 推送
// ============================================================

import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const plateApiToken = process.env.PLATE_API_TOKEN;

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 必须配置');
}

// 初始化 Supabase 客户端
let supabase = null;
try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 客户端初始化成功');
} catch (err) {
    console.error('❌ Supabase 客户端初始化失败:', err.message);
}

// ============================================================
// Vercel Serverless Function 入口
// ============================================================
export default async function handler(req, res) {
    // 1. 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    // 2. 检查 Supabase 是否初始化成功
    if (!supabase) {
        return res.status(500).json({
            success: false,
            error: 'Supabase 客户端未初始化，请检查环境变量配置'
        });
    }

    try {
        // 3. 接收 NVR 推送的数据（根据你的 NVR 实际格式调整）
        const {
            channel = 1,
            eventType = 'vehicle_detected',
            timestamp,
            imageUrl,
            imageBase64
        } = req.body;

        console.log(`📸 [${new Date().toISOString()}] 收到 NVR 推送:`, {
            channel,
            eventType,
            hasImage: !!imageUrl || !!imageBase64
        });

        // 4. 获取图片数据
        let plateResult = null;
        let savedImageUrl = imageUrl || '';

        if (imageBase64) {
            plateResult = await recognizePlateFromBase64(imageBase64);
        } else if (imageUrl) {
            plateResult = await recognizePlateFromUrl(imageUrl);
        }

        // 5. 生成记录编号
        const recordNo = `NVR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        // 6. 准备保存的数据
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

        console.log('📝 准备保存:', {
            record_no: recordNo,
            plate: recordData.license_plate || '未识别',
            confidence: recordData.confidence
        });

        // 7. 保存到 Supabase
        const { data, error } = await supabase
            .from('vehicle_records')
            .insert([recordData])
            .select();

        if (error) {
            console.error('❌ 数据库写入失败:', error);
            return res.status(500).json({
                success: false,
                error: 'Database error',
                detail: error.message
            });
        }

        console.log(`✅ 车辆记录已保存: ${recordNo}`);

        return res.status(200).json({
            success: true,
            record: data[0],
            plate: plateResult || { plate: '未识别', confidence: 0 }
        });

    } catch (err) {
        console.error('❌ 处理失败:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal error',
            detail: err.message
        });
    }
}

// ============================================================
// 辅助函数：从 Base64 识别车牌
// ============================================================
async function recognizePlateFromBase64(imageBase64) {
    if (!plateApiToken) {
        console.warn('⚠️ 未配置 PLATE_API_TOKEN，跳过车牌识别');
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
            console.warn(`⚠️ 车牌识别 API 返回错误: ${response.status}`);
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
    } catch (err) {
        console.error('车牌识别失败:', err.message);
        return null;
    }
}

// ============================================================
// 辅助函数：从 URL 下载图片并识别车牌
// ============================================================
async function recognizePlateFromUrl(imageUrl) {
    if (!plateApiToken) {
        console.warn('⚠️ 未配置 PLATE_API_TOKEN，跳过车牌识别');
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
            console.warn(`⚠️ 下载图片失败: ${imageResponse.status}`);
            return null;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        return await recognizePlateFromBase64(base64Image);
    } catch (err) {
        console.error('从 URL 识别车牌失败:', err.message);
        return null;
    }
}