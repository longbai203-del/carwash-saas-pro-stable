/**
 * shared/constants/roles.js - 角色常量
 * 前后端共享
 */

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    EMPLOYEE: 'employee'
};

export const ROLE_LABELS = {
    [ROLES.OWNER]: '老板',
    [ROLES.ADMIN]: '系统管理员',
    [ROLES.MANAGER]: '店长',
    [ROLES.CASHIER]: '收银员',
    [ROLES.EMPLOYEE]: '员工'
};

export const ROLE_HIERARCHY = {
    [ROLES.OWNER]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.CASHIER]: 2,
    [ROLES.EMPLOYEE]: 1
};

export const ROLE_COLORS = {
    [ROLES.OWNER]: 'bg-purple-600 text-white',
    [ROLES.ADMIN]: 'bg-blue-600 text-white',
    [ROLES.MANAGER]: 'bg-amber-500 text-white',
    [ROLES.CASHIER]: 'bg-green-500 text-white',
    [ROLES.EMPLOYEE]: 'bg-gray-500 text-white'
};

export const DEFAULT_ROLE = ROLES.EMPLOYEE;

// 检查是否有更高权限
export function hasHigherRole(role1, role2) {
    return (ROLE_HIERARCHY[role1] || 0) > (ROLE_HIERARCHY[role2] || 0);
}

// 检查角色是否有效
export function isValidRole(role) {
    return Object.values(ROLES).includes(role);
}