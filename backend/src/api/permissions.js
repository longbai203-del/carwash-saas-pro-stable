/**
 * @file permissions.js
 * @module backend/api/permissions
 * @description 权限管理API - 角色CRUD、用户权限管理
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import express from 'express';
import { requireRole, requirePermission, getCurrentUser } from '../shared/lib/auth.js';
import { supabase } from '../shared/lib/supabase.js';
import { logger } from '../shared/lib/logger.js';

/** @type {import('express').Router} */
const router = express.Router();

// ============================================================
// 1. 获取当前用户权限
// ============================================================

/**
 * @route GET /api/permissions/me
 * @desc 获取当前用户权限信息
 * @access Private
 * 
 * @example
 * GET /api/permissions/me
 * Response: {
 *   success: true,
 *   data: {
 *     id: 'user-id',
 *     email: 'user@example.com',
 *     role: 'admin',
 *     permissions: ['*'],
 *     role_permissions: ['*']
 *   }
 * }
 */
router.get('/me', getCurrentUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: '未认证'
            });
        }

        // 从Supabase获取用户的完整权限
        const { data: permissions, error } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            logger.error('获取用户权限失败:', error);
            return res.status(500).json({
                success: false,
                error: '获取权限信息失败'
            });
        }

        res.json({
            success: true,
            data: {
                ...req.user,
                permissions: permissions?.permissions || [],
                role_permissions: permissions?.role_permissions || []
            }
        });
    } catch (error) {
        logger.error('获取用户权限异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// ============================================================
// 2. 角色管理
// ============================================================

/**
 * @route GET /api/permissions/roles
 * @desc 获取所有角色列表
 * @access Admin Only
 * 
 * @example
 * GET /api/permissions/roles
 * Response: {
 *   success: true,
 *   data: [{ id: 'role-id', name: 'admin', description: '管理员', permissions: ['*'] }]
 * }
 */
router.get('/roles', requireRole(['admin']), async (req, res) => {
    try {
        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');

        if (error) {
            logger.error('获取角色列表失败:', error);
            return res.status(500).json({
                success: false,
                error: '获取角色列表失败'
            });
        }

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        logger.error('获取角色列表异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * @route POST /api/permissions/roles
 * @desc 创建新角色
 * @access Admin Only
 * 
 * @example
 * POST /api/permissions/roles
 * Body: { name: 'manager', description: '经理', permissions: ['dashboard:view', 'orders:view'] }
 */
router.post('/roles', requireRole(['admin']), async (req, res) => {
    try {
        const { name, description, permissions, is_system } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: '角色名称为必填项'
            });
        }

        const { data: role, error } = await supabase
            .from('roles')
            .insert({
                name,
                description,
                permissions: permissions || [],
                is_system: is_system || false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            logger.error('创建角色失败:', error);
            return res.status(500).json({
                success: false,
                error: '创建角色失败'
            });
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        logger.error('创建角色异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * @route PUT /api/permissions/roles/:id
 * @desc 更新角色
 * @access Admin Only
 * 
 * @example
 * PUT /api/permissions/roles/role-id
 * Body: { name: 'manager', description: '经理', permissions: ['dashboard:view'] }
 */
router.put('/roles/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, is_system } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: '角色名称为必填项'
            });
        }

        // 检查是否是系统角色（系统角色不可修改名称和is_system）
        const { data: existing, error: checkError } = await supabase
            .from('roles')
            .select('is_system')
            .eq('id', id)
            .single();

        if (checkError) {
            logger.error('检查角色失败:', checkError);
            return res.status(404).json({
                success: false,
                error: '角色不存在'
            });
        }

        const updateData = {
            name,
            description,
            permissions: permissions || []
        };

        if (!existing.is_system) {
            updateData.is_system = is_system || false;
        }

        const { data: role, error } = await supabase
            .from('roles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('更新角色失败:', error);
            return res.status(500).json({
                success: false,
                error: '更新角色失败'
            });
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        logger.error('更新角色异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * @route DELETE /api/permissions/roles/:id
 * @desc 删除角色
 * @access Admin Only
 * 
 * @example
 * DELETE /api/permissions/roles/role-id
 */
router.delete('/roles/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // 检查是否是系统角色
        const { data: role, error: checkError } = await supabase
            .from('roles')
            .select('is_system')
            .eq('id', id)
            .single();

        if (checkError) {
            return res.status(404).json({
                success: false,
                error: '角色不存在'
            });
        }

        if (role.is_system) {
            return res.status(400).json({
                success: false,
                error: '系统角色不可删除'
            });
        }

        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('删除角色失败:', error);
            return res.status(500).json({
                success: false,
                error: '删除角色失败'
            });
        }

        res.json({
            success: true,
            message: '角色已删除'
        });
    } catch (error) {
        logger.error('删除角色异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// ============================================================
// 3. 用户权限管理
// ============================================================

/**
 * @route GET /api/permissions/user/:userId
 * @desc 获取指定用户的权限
 * @access Admin/Manager Only
 * 
 * @example
 * GET /api/permissions/user/user-id
 */
router.get('/user/:userId', requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, email, role, full_name, tenant_id, business_id')
            .eq('id', userId)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        const { data: permissions, error: permError } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (permError && permError.code !== 'PGRST116') {
            logger.error('获取用户权限失败:', permError);
            return res.status(500).json({
                success: false,
                error: '获取用户权限失败'
            });
        }

        res.json({
            success: true,
            data: {
                user,
                permissions: permissions?.permissions || [],
                role_permissions: permissions?.role_permissions || [],
                custom_permissions: permissions?.custom_permissions || []
            }
        });
    } catch (error) {
        logger.error('获取用户权限异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * @route PUT /api/permissions/user/:userId
 * @desc 更新用户权限
 * @access Admin Only
 * 
 * @example
 * PUT /api/permissions/user/user-id
 * Body: { role: 'manager', permissions: ['dashboard:view'] }
 */
router.put('/user/:userId', requireRole(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, permissions, custom_permissions } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                error: '角色为必填项'
            });
        }

        // 更新用户角色
        const { error: roleError } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (roleError) {
            logger.error('更新用户角色失败:', roleError);
            return res.status(500).json({
                success: false,
                error: '更新用户角色失败'
            });
        }

        // 更新或插入权限记录
        const { error: permError } = await supabase
            .from('user_permissions')
            .upsert({
                user_id: userId,
                permissions: permissions || [],
                custom_permissions: custom_permissions || [],
                updated_at: new Date().toISOString()
            });

        if (permError) {
            logger.error('更新用户权限失败:', permError);
            return res.status(500).json({
                success: false,
                error: '更新用户权限失败'
            });
        }

        res.json({
            success: true,
            message: '用户权限已更新'
        });
    } catch (error) {
        logger.error('更新用户权限异常:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// ============================================================
// 4. 导出
// ============================================================

export default router;