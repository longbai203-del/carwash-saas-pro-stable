import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// 获取 Supabase 客户端
function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.warn('⚠️ Supabase credentials not found. Using mock mode.');
        return null;
    }
    return createClient(url, key);
}

export function authenticate(req, res, next) {
    if (!req || !req.headers) {
        return res.status(401).json({ message: '未认证' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: '无效的认证令牌' });
    }
}

export async function getCurrentUser(req, res, next) {
    try {
        if (!req || !req.user || !req.user.id) {
            return res.status(401).json({ message: '未认证' });
        }
        req.currentUser = req.user;
        next();
    } catch (error) {
        return res.status(500).json({ message: '获取用户信息失败' });
    }
}

export function requirePermission(resource, action) {
    return async (req, res, next) => {
        if (!req || !req.user) return res.status(401).json({ message: '未认证' });
        next();
    };
}

export function requireRole(roles) {
    return async (req, res, next) => {
        if (!req || !req.user) return res.status(401).json({ message: '未认证' });
        next();
    };
}

export function optionalAuth(req, res, next) {
    if (!req || !req.headers) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {}
    }
    next();
}

export const authMiddleware = authenticate;
export const roleMiddleware = requireRole;

export default {
    authenticate,
    getCurrentUser,
    requirePermission,
    requireRole,
    optionalAuth,
    authMiddleware,
    roleMiddleware
};