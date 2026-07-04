/**
 * api/vehicle-monitor/recognize.js - 车牌智能识别
 * POST /api/vehicle-monitor/recognize
 * 
 * 注意：这是模拟识别接口，实际使用时需要接入第三方车牌识别API
 * 如：百度AI、阿里云、腾讯云等
 */
import { authMiddleware, roleMiddleware } from '../_lib/auth.js';
import { logger } from '../_lib/logger.js';

// 模拟车牌识别结果
const mockResults = [
    { plate: 'ABC 1234', plateColor: '白色', brand: 'Toyota', model: 'Camry', color: '白色', confidence: 0.96 },
    { plate: 'XYZ 5678', plateColor: '黄色', brand: 'Honda', model: 'Accord', color: '黑色', confidence: 0.94 },
    { plate: 'DEF 9012', plateColor: '蓝色', brand: 'Nissan', model: 'Altima', color: '银色', confidence: 0.92 },
    { plate: 'GHI 3456', plateColor: '白色', brand: 'Hyundai', model: 'Sonata', color: '白色', confidence: 0.95 },
    { plate: 'JKL 7890', plateColor: '绿色', brand: 'Mercedes', model: 'E-Class', color: '黑色', confidence: 0.93 },
    { plate: 'MNO 2345', plateColor: '蓝色', brand: 'BMW', model: '3 Series', color: '蓝色', confidence: 0.91 },
    { plate: 'PQR 6789', plateColor: '白色', brand: 'Audi', model: 'A4', color: '红色', confidence: 0.94 },
    { plate: 'STU 0123', plateColor: '黄色', brand: 'Ford', model: 'Fusion', color: '灰色', confidence: 0.92 }
];

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

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
        const delay = 500 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // 随机返回一个识别结果
        const randomIndex = Math.floor(Math.random() * mockResults.length);
        const result = mockResults[randomIndex];
        
        // 添加随机置信度波动
        result.confidence = 0.85 + Math.random() * 0.14;

        logger.info('[Recognize] 车牌识别完成', {
            plate: result.plate,
            confidence: result.confidence,
            brand: result.brand
        });

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
        logger.error('[Recognize] 车牌识别失败:', error);
        return res.status(500).json({
            success: false,
            error: '车牌识别失败',
            code: 'INTERNAL_ERROR'
        });
    }
}

export default authMiddleware(roleMiddleware(['owner', 'admin'])(handler));