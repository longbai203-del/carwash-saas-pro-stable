/**
 * vehicles.js - 车辆管理模块
 * @module vehicles
 * @description 提供车辆信息的CRUD操作和数据管理
 */

// 05-customers/vehicles.js
console.log('📄 05-customers/vehicles page loaded');

/**
 * 初始化车辆模块
 * @returns {void}
 */
export function init() {
    console.log('05-customers/vehicles initialized');
    
    const saved = localStorage.getItem('vehicle_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载车辆数据:', data.length);
            if (typeof window.VehicleModule !== 'undefined') {
                window.VehicleModule.vehicles = data;
                window.VehicleModule.filteredVehicles = [...data];
                window.VehicleModule.extractBrands();
                window.VehicleModule.updateBrandFilter();
                window.VehicleModule.render();
            }
        } catch (e) {
            console.warn('加载车辆数据失败');
        }
    }
}

/**
 * 获取所有车辆
 * @returns {Array<Object>} 车辆数组
 */
export function getVehicles() {
    try {
        const data = localStorage.getItem('vehicle_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 根据ID获取车辆
 * @param {string} id - 车辆ID
 * @returns {Object|null} 车辆对象或null
 */
export function getVehicleById(id) {
    try {
        const vehicles = getVehicles();
        return vehicles.find(v => v.id === id) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 根据车牌号获取车辆
 * @param {string} plate - 车牌号
 * @returns {Object|null} 车辆对象或null
 */
export function getVehicleByPlate(plate) {
    try {
        const vehicles = getVehicles();
        return vehicles.find(v => v.plate === plate) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 新增车辆
 * @param {Object} vehicle - 车辆数据
 * @param {string} vehicle.plate - 车牌号
 * @param {string} vehicle.brand - 品牌
 * @param {string} vehicle.model - 型号
 * @param {number} vehicle.year - 年份
 * @param {string} vehicle.color - 颜色
 * @param {string} vehicle.owner - 车主
 * @returns {boolean} 是否成功
 */
export function addVehicle(vehicle) {
    try {
        const vehicles = getVehicles();
        vehicles.push(vehicle);
        localStorage.setItem('vehicle_data', JSON.stringify(vehicles));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 更新车辆
 * @param {string} id - 车辆ID
 * @param {Object} data - 要更新的数据
 * @returns {boolean} 是否成功
 */
export function updateVehicle(id, data) {
    try {
        const vehicles = getVehicles();
        const index = vehicles.findIndex(v => v.id === id);
        if (index >= 0) {
            vehicles[index] = { ...vehicles[index], ...data };
            localStorage.setItem('vehicle_data', JSON.stringify(vehicles));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * 删除车辆
 * @param {string} id - 车辆ID
 * @returns {boolean} 是否成功
 */
export function deleteVehicle(id) {
    try {
        const vehicles = getVehicles();
        const filtered = vehicles.filter(v => v.id !== id);
        localStorage.setItem('vehicle_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 获取车辆品牌列表
 * @returns {Array<string>} 品牌数组
 */
export function getVehicleBrands() {
    try {
        const vehicles = getVehicles();
        const brands = new Set(vehicles.map(v => v.brand).filter(Boolean));
        return [...brands];
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getVehicles,
    getVehicleById,
    getVehicleByPlate,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleBrands
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('05-customers/vehicles DOM ready');
    init();
});