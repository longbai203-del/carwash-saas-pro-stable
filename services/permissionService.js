/**
 * services/permissionService.js - 权限服务层
 * 负责权限校验、缓存、菜单生成等核心功能
 */
(function() {
    'use strict';

    window.PermissionService = {

        // ===== 权限缓存 =====
        _cache: {
            menus: null,
            permissions: null,
            userPermissions: {}
        },

        // ===== 初始化当前用户权限 =====
        async initUserPermissions(userId, tenantId, storeId) {
            if (!userId) return;

            try {
                // 1. 获取用户角色
                const user = await AppApi.query('users', { filter: { id: userId } });
                if (!user || user.length === 0) return;
                const currentUser = user[0];

                // 2. 获取角色权限
                const roles = await AppApi.query('sys_role', {
                    filter: { tenant_id: tenantId, status: 'active' }
                });

                let userRoles = [];
                if (currentUser.role === 'owner') {
                    userRoles = roles.filter(r => r.role_code === 'owner');
                } else {
                    // 根据用户角色查找对应的系统角色
                    const roleCode = currentUser.role || 'employee';
                    userRoles = roles.filter(r => r.role_code === roleCode);
                }

                // 3. 获取所有权限
                const allPermissions = await AppApi.query('sys_permission', {
                    filter: { tenant_id: tenantId }
                });

                // 4. 获取角色权限关联
                let userPermissionIds = [];
                for (const role of userRoles) {
                    const rolePerms = await AppApi.query('sys_role_permission', {
                        filter: { role_id: role.id }
                    });
                    userPermissionIds = userPermissionIds.concat(rolePerms.map(rp => rp.permission_id));
                }

                // 5. 获取用户单独授权
                const userPerms = await AppApi.query('sys_user_permission', {
                    filter: { user_id: userId, is_granted: true }
                });
                userPermissionIds = userPermissionIds.concat(userPerms.map(up => up.permission_id));

                // 6. 去重并缓存
                const uniquePermIds = [...new Set(userPermissionIds)];
                const userPermissions = allPermissions.filter(p => uniquePermIds.includes(p.id));

                this._cache.userPermissions[userId] = userPermissions;
                this._cache.permissions = allPermissions;

                // 7. 生成菜单树
                this._generateMenuTree(tenantId, storeId);

                console.log('[PermissionService] 权限初始化完成，用户:', userId, '权限数:', userPermissions.length);
                return userPermissions;

            } catch (error) {
                console.error('[PermissionService] 初始化失败:', error);
                return [];
            }
        },

        // ===== 生成菜单树 =====
        async _generateMenuTree(tenantId, storeId) {
            try {
                const menus = await AppApi.query('sys_menu', {
                    filter: { tenant_id: tenantId, store_id: storeId, is_deleted: false, is_visible: true },
                    order: { by: 'sort_order', ascending: true }
                });

                // 构建树结构
                const menuMap = {};
                menus.forEach(m => {
                    menuMap[m.id] = { ...m, children: [] };
                });

                const tree = [];
                menus.forEach(m => {
                    if (m.parent_id && menuMap[m.parent_id]) {
                        menuMap[m.parent_id].children.push(menuMap[m.id]);
                    } else {
                        tree.push(menuMap[m.id]);
                    }
                });

                this._cache.menus = tree;
                return tree;

            } catch (error) {
                console.error('[PermissionService] 生成菜单树失败:', error);
                return [];
            }
        },

        // ===== 获取菜单树 =====
        getMenuTree() {
            return this._cache.menus || [];
        },

        // ===== 检查权限 =====
        hasPermission(userId, permissionCode) {
            if (!userId) return false;
            const perms = this._cache.userPermissions[userId] || [];
            // Owner 拥有所有权限
            const user = AppStore.get('currentUser');
            if (user && user.role === 'owner') return true;
            return perms.some(p => p.permission_code === permissionCode);
        },

        // ===== 检查API权限 =====
        async checkApiPermission(userId, apiPath, method) {
            if (!userId) return false;
            const user = AppStore.get('currentUser');
            if (user && user.role === 'owner') return true;

            try {
                const apiPerms = await AppApi.query('sys_api_permission', {
                    filter: { api_path: apiPath, api_method: method }
                });

                if (apiPerms.some(p => p.is_public)) return true;

                const userPerms = this._cache.userPermissions[userId] || [];
                return apiPerms.some(api => 
                    userPerms.some(p => p.id === api.permission_id)
                );
            } catch (e) {
                return false;
            }
        },

        // ===== 清除缓存 =====
        clearCache(userId) {
            if (userId) {
                delete this._cache.userPermissions[userId];
            } else {
                this._cache.userPermissions = {};
            }
            this._cache.menus = null;
            this._cache.permissions = null;
        },

        // ===== 记录操作日志 =====
        async logOperation(data) {
            try {
                const currentUser = AppStore.get('currentUser');
                const logData = {
                    user_id: currentUser?.id || null,
                    username: currentUser?.username || 'system',
                    operation_type: data.operationType || 'unknown',
                    operation_desc: data.description || '',
                    request_url: data.url || window.location.href,
                    request_method: data.method || 'GET',
                    request_params: data.params || {},
                    response_status: data.status || 200,
                    old_value: data.oldValue || null,
                    new_value: data.newValue || null,
                    ip_address: data.ip || '',
                    user_agent: navigator.userAgent,
                    device_type: this._getDeviceType(),
                    browser: this._getBrowser(),
                    tenant_id: AppStore.get('currentTenant')?.id || null,
                    store_id: AppStore.get('currentStore')?.id || null,
                    duration: data.duration || 0,
                    result: data.result || 'success'
                };
                await AppApi.insert('sys_operation_log', logData);
            } catch (e) {
                console.warn('[PermissionService] 记录操作日志失败:', e);
            }
        },

        // ===== 记录审计日志（不可删除） =====
        async logAudit(data) {
            try {
                const currentUser = AppStore.get('currentUser');
                const auditData = {
                    user_id: currentUser?.id || null,
                    username: currentUser?.username || 'system',
                    action: data.action || 'unknown',
                    resource_type: data.resourceType || 'unknown',
                    resource_id: data.resourceId || null,
                    resource_name: data.resourceName || '',
                    old_value: data.oldValue || null,
                    new_value: data.newValue || null,
                    ip_address: data.ip || '',
                    user_agent: navigator.userAgent,
                    tenant_id: AppStore.get('currentTenant')?.id || null,
                    store_id: AppStore.get('currentStore')?.id || null
                };
                await AppApi.insert('sys_audit_log', auditData);
            } catch (e) {
                console.warn('[PermissionService] 记录审计日志失败:', e);
            }
        },

        // ===== 辅助方法 =====
        _getDeviceType() {
            const ua = navigator.userAgent;
            if (/mobile/i.test(ua)) return 'mobile';
            if (/tablet/i.test(ua)) return 'tablet';
            return 'desktop';
        },

        _getBrowser() {
            const ua = navigator.userAgent;
            if (ua.includes('Chrome')) return 'Chrome';
            if (ua.includes('Firefox')) return 'Firefox';
            if (ua.includes('Safari')) return 'Safari';
            if (ua.includes('Edge')) return 'Edge';
            return 'Other';
        }
    };

    console.log('[PermissionService] 加载完成');
})();