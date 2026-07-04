/**
 * services/permissionUI.js - 权限UI辅助
 * 用于控制页面元素的显示/隐藏
 */
(function() {
    'use strict';

    window.PermissionUI = {

        // ===== 检查并隐藏无权限元素 =====
        applyPermissionFilter() {
            const user = AppStore.get('currentUser');
            if (!user) return;

            // 对所有带 data-permission 属性的元素进行处理
            document.querySelectorAll('[data-permission]').forEach(el => {
                const requiredPerm = el.dataset.permission;
                const hasPerm = PermissionService.hasPermission(user.id, requiredPerm);
                if (!hasPerm) {
                    el.style.display = 'none';
                }
            });

            // 处理按钮权限
            document.querySelectorAll('[data-action]').forEach(el => {
                const action = el.dataset.action;
                const module = el.dataset.module || 'default';
                const permCode = module + ':' + action;
                const hasPerm = PermissionService.hasPermission(user.id, permCode);
                if (!hasPerm) {
                    el.style.display = 'none';
                }
            });
        },

        // ===== 检查单个权限 =====
        can(action, module) {
            const user = AppStore.get('currentUser');
            if (!user) return false;
            if (user.role === 'owner') return true;
            const permCode = module + ':' + action;
            return PermissionService.hasPermission(user.id, permCode);
        },

        // ===== 渲染权限标签 =====
        renderPermissionBadge(container, permissionCode) {
            const user = AppStore.get('currentUser');
            if (!user) return '';
            const hasPerm = PermissionService.hasPermission(user.id, permissionCode);
            return hasPerm ? '<span class="text-xs text-green-600">✅ 已授权</span>' : '<span class="text-xs text-red-600">❌ 无权限</span>';
        }
    };

    console.log('[PermissionUI] 加载完成');
})();