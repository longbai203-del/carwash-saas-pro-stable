/**
 * membership.js - 会员管理模块
 * @module membership
 * @description 提供会员等级和会员信息的CRUD操作
 */

// 05-customers/membership.js
console.log('📄 05-customers/membership page loaded');

/**
 * 初始化会员模块
 * @returns {void}
 */
export function init() {
    console.log('05-customers/membership initialized');
    
    // 加载等级数据
    const savedLevels = localStorage.getItem('membership_levels_data');
    if (savedLevels) {
        try {
            const data = JSON.parse(savedLevels);
            console.log('已加载等级数据:', data.length);
            if (typeof window.MembershipModule !== 'undefined') {
                window.MembershipModule.levels = data;
            }
        } catch (e) {
            console.warn('加载等级数据失败');
        }
    }
    
    // 加载会员数据
    const savedMembers = localStorage.getItem('membership_members_data');
    if (savedMembers) {
        try {
            const data = JSON.parse(savedMembers);
            console.log('已加载会员数据:', data.length);
            if (typeof window.MembershipModule !== 'undefined') {
                window.MembershipModule.members = data;
                window.MembershipModule.render();
            }
        } catch (e) {
            console.warn('加载会员数据失败');
        }
    }
}

/**
 * 获取所有会员等级
 * @returns {Array<Object>} 等级数组
 */
export function getLevels() {
    try {
        const data = localStorage.getItem('membership_levels_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 获取所有会员
 * @returns {Array<Object>} 会员数组
 */
export function getMembers() {
    try {
        const data = localStorage.getItem('membership_members_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 添加会员等级
 * @param {Object} level - 等级数据
 * @returns {boolean} 是否成功
 */
export function addLevel(level) {
    try {
        const levels = getLevels();
        levels.push(level);
        localStorage.setItem('membership_levels_data', JSON.stringify(levels));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新会员等级
 * @param {string} id - 等级ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateLevel(id, data) {
    try {
        const levels = getLevels();
        const index = levels.findIndex(l => l.id === id);
        if (index >= 0) {
            levels[index] = { ...levels[index], ...data };
            localStorage.setItem('membership_levels_data', JSON.stringify(levels));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除会员等级
 * @param {string} id - 等级ID
 * @returns {boolean} 是否成功
 */
export function deleteLevel(id) {
    try {
        const levels = getLevels();
        const filtered = levels.filter(l => l.id !== id);
        localStorage.setItem('membership_levels_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 添加会员
 * @param {Object} member - 会员数据
 * @returns {boolean} 是否成功
 */
export function addMember(member) {
    try {
        const members = getMembers();
        members.push(member);
        localStorage.setItem('membership_members_data', JSON.stringify(members));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新会员
 * @param {string} id - 会员ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateMember(id, data) {
    try {
        const members = getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index >= 0) {
            members[index] = { ...members[index], ...data };
            localStorage.setItem('membership_members_data', JSON.stringify(members));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除会员
 * @param {string} id - 会员ID
 * @returns {boolean} 是否成功
 */
export function deleteMember(id) {
    try {
        const members = getMembers();
        const filtered = members.filter(m => m.id !== id);
        localStorage.setItem('membership_members_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    init,
    getLevels,
    getMembers,
    addLevel,
    updateLevel,
    deleteLevel,
    addMember,
    updateMember,
    deleteMember
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('05-customers/membership DOM ready');
    init();
});