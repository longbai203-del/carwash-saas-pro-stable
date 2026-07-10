/**
 * @file vehicles.js
 * @module vehicles
 * @description 车辆管理模块 - 车辆信息的CRUD操作和数据管理
 * 
 * @example
 * import { init } from './vehicles.js';
 * await init();
 * 
 * @author Carwash Pro Team
 * @version 1.0.0
 */

import { store } from '../../../js/core/store.js';
import { showToast } from '../../../js/core/init.js';

/**
 * @typedef {Object} Vehicle
 * @property {string} id - 车辆ID
 * @property {string} plate - 车牌号
 * @property {string} brand - 品牌
 * @property {string} model - 型号
 * @property {number} year - 年份
 * @property {string} color - 颜色
 * @property {string} owner - 车主
 * @property {string} [ownerPhone] - 车主电话
 * @property {string} [vin] - 车架号
 * @property {string} [engine] - 发动机号
 * @property {string} [notes] - 备注
 * @property {string} status - 状态 (active/inactive)
 * @property {number} serviceCount - 服务次数
 * @property {string} lastService - 最近服务时间
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 */

/**
 * @typedef {Object} VehicleState
 * @property {Vehicle[]} vehicles - 车辆列表
 * @property {Vehicle[]} filteredVehicles - 过滤后的车辆列表
 * @property {string} searchQuery - 搜索关键词
 * @property {string} brandFilter - 品牌筛选
 * @property {string} statusFilter - 状态筛选
 * @property {string[]} brands - 品牌列表
 * @property {number} page - 页码
 * @property {number} limit - 每页数量
 * @property {string|null} editingId - 编辑中的车辆ID
 */

/** @type {VehicleState} 状态 */
const state = {
    vehicles: [],
    filteredVehicles: [],
    searchQuery: '',
    brandFilter: 'all',
    statusFilter: 'all',
    brands: [],
    page: 1,
    limit: 10,
    editingId: null
};

/**
 * 车辆颜色配置
 */
const COLOR_MAP = {
    '白色': '#FFFFFF',
    '黑色': '#1A1A1A',
    '红色': '#DC2626',
    '蓝色': '#3B82F6',
    '银色': '#9CA3AF',
    '灰色': '#6B7280',
    '金色': '#F59E0B',
    '绿色': '#10B981'
};

/**
 * @private
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

/**
 * @private
 * @returns {Vehicle[]} 模拟车辆数据
 */
function getMockVehicles() {
    const brands = ['Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ford'];
    const models = ['Camry', 'Accord', 'Altima', '3 Series', 'C-Class', 'A4', 'Passat', 'Mustang'];
    const colors = ['白色', '黑色', '红色', '蓝色', '银色', '灰色', '金色', '绿色'];
    const owners = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵明', '孙丽', '周涛'];
    const years = [2020, 2021, 2022, 2023, 2024];
    
    const vehicles = [];
    for (let i = 0; i < 15; i++) {
        const brandIdx = Math.floor(Math.random() * brands.length);
        const year = years[Math.floor(Math.random() * years.length)];
        const dayOffset = Math.floor(Math.random() * 60);
        
        vehicles.push({
            id: `VEH-${String(i + 1).padStart(6, '0')}`,
            plate: `京A${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            brand: brands[brandIdx],
            model: models[brandIdx],
            year: year,
            color: colors[Math.floor(Math.random() * colors.length)],
            owner: owners[i % owners.length],
            ownerPhone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
            vin: `VIN${String(Math.floor(Math.random() * 1000000000000000)).padStart(17, '0')}`,
            engine: `ENG${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            notes: Math.random() > 0.7 ? '常客车辆，需重点关注' : '',
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            serviceCount: Math.floor(Math.random() * 20) + 1,
            lastService: new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return vehicles;
}

/**
 * @private
 * @description 加载车辆数据
 */
function loadVehicles() {
    try {
        const saved = localStorage.getItem('vehicle_data');
        if (saved) {
            state.vehicles = JSON.parse(saved);
        } else {
            state.vehicles = getMockVehicles();
            localStorage.setItem('vehicle_data', JSON.stringify(state.vehicles));
        }
    } catch (e) {
        console.warn('加载车辆数据失败:', e);
        state.vehicles = getMockVehicles();
    }
    extractBrands();
    applyFilters();
}

/**
 * @private
 * @description 提取品牌列表
 */
function extractBrands() {
    const brands = new Set(state.vehicles.map(v => v.brand).filter(Boolean));
    state.brands = [...brands].sort();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFilters() {
    let filtered = state.vehicles;
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
            v.plate.toLowerCase().includes(query) ||
            v.brand.toLowerCase().includes(query) ||
            v.model.toLowerCase().includes(query) ||
            v.owner.toLowerCase().includes(query)
        );
    }
    
    if (state.brandFilter !== 'all') {
        filtered = filtered.filter(v => v.brand === state.brandFilter);
    }
    
    if (state.statusFilter !== 'all') {
        filtered = filtered.filter(v => v.status === state.statusFilter);
    }
    
    state.filteredVehicles = filtered;
    renderVehicles();
    updateStats();
    renderPagination();
}

/**
 * @private
 * @description 保存车辆数据
 */
function saveVehicles() {
    try {
        localStorage.setItem('vehicle_data', JSON.stringify(state.vehicles));
    } catch (e) {
        console.warn('保存车辆数据失败:', e);
    }
}

/**
 * @private
 * @description 渲染车辆列表
 */
function renderVehicles() {
    const container = document.getElementById('vehicleListBody');
    if (!container) return;
    
    const start = (state.page - 1) * state.limit;
    const end = start + state.limit;
    const paginated = state.filteredVehicles.slice(start, end);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-car" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                    暂无车辆数据
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = paginated.map(vehicle => {
        const colorHex = COLOR_MAP[vehicle.color] || '#6B7280';
        
        return `
            <tr style="border-bottom:1px solid #F3F4F6;transition:background 0.2s;"
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background=''">
                <td style="padding:10px 16px;font-weight:600;font-family:monospace;">${vehicle.plate}</td>
                <td style="padding:10px 16px;">
                    <div style="font-weight:500;">${vehicle.brand}</div>
                    <div style="font-size:12px;color:#6B7280;">${vehicle.model}</div>
                </td>
                <td style="padding:10px 16px;text-align:center;">${vehicle.year}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${colorHex};border:1px solid #D1D5DB;vertical-align:middle;"></span>
                    <span style="margin-left:6px;">${vehicle.color}</span>
                </td>
                <td style="padding:10px 16px;">${vehicle.owner}</td>
                <td style="padding:10px 16px;text-align:center;">${vehicle.serviceCount || 0}</td>
                <td style="padding:10px 16px;">
                    <span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${vehicle.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${vehicle.status === 'active' ? '#065F46' : '#991B1B'};">
                        ${vehicle.status === 'active' ? '启用' : '禁用'}
                    </span>
                </td>
                <td style="padding:10px 16px;">
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="window.VehiclesModule.editVehicle('${vehicle.id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.VehiclesModule.viewVehicle('${vehicle.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.VehiclesModule.deleteVehicle('${vehicle.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * @private
 * @description 渲染分页
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const total = state.filteredVehicles.length;
    const totalPages = Math.ceil(total / state.limit);
    
    if (totalPages <= 1) {
        container.innerHTML = `
            <div style="padding:8px 16px;text-align:center;font-size:14px;color:#6B7280;">
                共 ${total} 辆车
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;color:#6B7280;">共 ${total} 辆车，第 ${state.page}/${totalPages} 页</span>
            <div style="display:flex;gap:4px;">
    `;
    
    html += `
        <button onclick="window.VehiclesModule.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''} 
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page <= 1 ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    
    if (startPage > 1) {
        html += `<button onclick="window.VehiclesModule.goToPage(1)" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">1</button>`;
        if (startPage > 2) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === state.page;
        html += `
            <button onclick="window.VehiclesModule.goToPage(${i})" 
                    style="padding:4px 12px;border:1px solid ${isActive ? '#4F46E5' : '#D1D5DB'};border-radius:4px;background:${isActive ? '#4F46E5' : 'white'};color:${isActive ? 'white' : '#374151'};cursor:pointer;">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span style="padding:0 4px;color:#9CA3AF;">...</span>';
        html += `<button onclick="window.VehiclesModule.goToPage(${totalPages})" style="padding:4px 10px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;">${totalPages}</button>`;
    }
    
    html += `
        <button onclick="window.VehiclesModule.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}
                style="padding:4px 12px;border:1px solid #D1D5DB;border-radius:4px;background:white;cursor:pointer;${state.page >= totalPages ? 'opacity:0.5;cursor:not-allowed;' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * @private
 * @description 更新统计数据
 */
function updateStats() {
    const total = state.vehicles.length;
    const active = state.vehicles.filter(v => v.status === 'active').length;
    const inactive = state.vehicles.filter(v => v.status === 'inactive').length;
    const brands = state.brands.length;
    
    const elements = {
        'statTotal': total,
        'statActive': active,
        'statInactive': inactive,
        'statBrands': brands
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * @private
 * @param {string} id - 车辆ID
 * @description 查看车辆详情
 */
function viewVehicle(id) {
    const vehicle = state.vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast('车辆不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('vehicleDetailModal');
    if (modal) {
        const content = document.getElementById('vehicleDetailContent');
        if (content) {
            const colorHex = COLOR_MAP[vehicle.color] || '#6B7280';
            content.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="grid-column:span 2;text-align:center;padding:16px 0;">
                        <div style="font-size:48px;color:#4F46E5;">
                            <i class="fas fa-car"></i>
                        </div>
                        <h3 style="margin:8px 0 0 0;">${vehicle.brand} ${vehicle.model}</h3>
                        <div style="font-size:14px;color:#6B7280;">${vehicle.plate}</div>
                    </div>
                    <div><span style="color:#6B7280;">车辆ID</span><br><strong>${vehicle.id}</strong></div>
                    <div><span style="color:#6B7280;">年份</span><br><strong>${vehicle.year}</strong></div>
                    <div><span style="color:#6B7280;">颜色</span><br><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${colorHex};border:1px solid #D1D5DB;vertical-align:middle;"></span> ${vehicle.color}</div>
                    <div><span style="color:#6B7280;">状态</span><br><span style="display:inline-block;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:500;background:${vehicle.status === 'active' ? '#D1FAE5' : '#FEE2E2'};color:${vehicle.status === 'active' ? '#065F46' : '#991B1B'};">${vehicle.status === 'active' ? '启用' : '禁用'}</span></div>
                    <div><span style="color:#6B7280;">车主</span><br><strong>${vehicle.owner}</strong></div>
                    <div><span style="color:#6B7280;">车主电话</span><br><strong>${vehicle.ownerPhone || '-'}</strong></div>
                    <div><span style="color:#6B7280;">服务次数</span><br><strong>${vehicle.serviceCount || 0}</strong></div>
                    <div><span style="color:#6B7280;">最近服务</span><br><strong>${vehicle.lastService ? formatDate(vehicle.lastService) : '-'}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">车架号</span><br><strong>${vehicle.vin || '-'}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">发动机号</span><br><strong>${vehicle.engine || '-'}</strong></div>
                    <div style="grid-column:span 2;"><span style="color:#6B7280;">备注</span><br><strong>${vehicle.notes || '无'}</strong></div>
                </div>
            `;
        }
        modal.style.display = 'flex';
        return;
    }
    
    // 降级方案
    alert(`车辆详情：
车牌: ${vehicle.plate}
品牌: ${vehicle.brand}
型号: ${vehicle.model}
年份: ${vehicle.year}
颜色: ${vehicle.color}
车主: ${vehicle.owner}
电话: ${vehicle.ownerPhone || '-'}
状态: ${vehicle.status === 'active' ? '启用' : '禁用'}`);
}

/**
 * @private
 * @param {string} id - 车辆ID
 * @description 编辑车辆
 */
function editVehicle(id) {
    const vehicle = state.vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast('车辆不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('vehicleModal');
    if (modal) {
        state.editingId = id;
        document.getElementById('modalTitle').textContent = '编辑车辆';
        document.getElementById('vehiclePlate').value = vehicle.plate;
        document.getElementById('vehicleBrand').value = vehicle.brand;
        document.getElementById('vehicleModel').value = vehicle.model;
        document.getElementById('vehicleYear').value = vehicle.year;
        document.getElementById('vehicleColor').value = vehicle.color;
        document.getElementById('vehicleOwner').value = vehicle.owner;
        document.getElementById('vehicleOwnerPhone').value = vehicle.ownerPhone || '';
        document.getElementById('vehicleVin').value = vehicle.vin || '';
        document.getElementById('vehicleEngine').value = vehicle.engine || '';
        document.getElementById('vehicleNotes').value = vehicle.notes || '';
        document.getElementById('vehicleStatus').value = vehicle.status || 'active';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const plate = prompt('车牌号：', vehicle.plate);
        if (plate === null) return;
        const brand = prompt('品牌：', vehicle.brand);
        if (brand === null) return;
        const model = prompt('型号：', vehicle.model);
        if (model === null) return;
        const year = parseInt(prompt('年份：', vehicle.year));
        const color = prompt('颜色：', vehicle.color) || vehicle.color;
        const owner = prompt('车主：', vehicle.owner) || vehicle.owner;
        
        vehicle.plate = plate.trim().toUpperCase() || vehicle.plate;
        vehicle.brand = brand.trim() || vehicle.brand;
        vehicle.model = model.trim() || vehicle.model;
        vehicle.year = isNaN(year) ? vehicle.year : year;
        vehicle.color = color;
        vehicle.owner = owner;
        vehicle.updatedAt = new Date().toISOString();
        
        saveVehicles();
        applyFilters();
        showToast('车辆已更新', 'success');
    }
}

/**
 * @private
 * @param {string} id - 车辆ID
 * @description 删除车辆
 */
function deleteVehicle(id) {
    const vehicle = state.vehicles.find(v => v.id === id);
    if (!vehicle) {
        showToast('车辆不存在', 'error');
        return;
    }
    
    if (!confirm(`确认删除车辆 "${vehicle.plate}"？`)) return;
    
    state.vehicles = state.vehicles.filter(v => v.id !== id);
    saveVehicles();
    extractBrands();
    applyFilters();
    showToast('车辆已删除', 'success');
}

/**
 * @private
 * @description 保存车辆（弹窗）
 */
function saveVehicle() {
    const plate = document.getElementById('vehiclePlate').value.trim().toUpperCase();
    const brand = document.getElementById('vehicleBrand').value.trim();
    const model = document.getElementById('vehicleModel').value.trim();
    const year = parseInt(document.getElementById('vehicleYear').value);
    const color = document.getElementById('vehicleColor').value.trim();
    const owner = document.getElementById('vehicleOwner').value.trim();
    const ownerPhone = document.getElementById('vehicleOwnerPhone').value.trim();
    const vin = document.getElementById('vehicleVin').value.trim();
    const engine = document.getElementById('vehicleEngine').value.trim();
    const notes = document.getElementById('vehicleNotes').value.trim();
    const status = document.getElementById('vehicleStatus').value;

    if (!plate) { showToast('请输入车牌号', 'warning'); return; }
    if (!brand) { showToast('请输入品牌', 'warning'); return; }
    if (!model) { showToast('请输入型号', 'warning'); return; }
    if (!owner) { showToast('请输入车主', 'warning'); return; }

    const data = { plate, brand, model, year, color, owner, ownerPhone, vin, engine, notes, status };

    if (state.editingId) {
        const vehicle = state.vehicles.find(v => v.id === state.editingId);
        if (vehicle) {
            Object.assign(vehicle, data);
            vehicle.updatedAt = new Date().toISOString();
            showToast('车辆已更新', 'success');
        }
    } else {
        const newVehicle = {
            id: `VEH-${String(Date.now()).slice(-6)}`,
            ...data,
            serviceCount: 0,
            lastService: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.vehicles.push(newVehicle);
        showToast('车辆已创建', 'success');
    }

    closeModal();
    saveVehicles();
    extractBrands();
    applyFilters();
}

/**
 * @private
 * @description 显示新建车辆弹窗
 */
function showCreateModal() {
    state.editingId = null;
    const modal = document.getElementById('vehicleModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = '新建车辆';
        document.getElementById('vehiclePlate').value = '';
        document.getElementById('vehicleBrand').value = '';
        document.getElementById('vehicleModel').value = '';
        document.getElementById('vehicleYear').value = new Date().getFullYear();
        document.getElementById('vehicleColor').value = '';
        document.getElementById('vehicleOwner').value = '';
        document.getElementById('vehicleOwnerPhone').value = '';
        document.getElementById('vehicleVin').value = '';
        document.getElementById('vehicleEngine').value = '';
        document.getElementById('vehicleNotes').value = '';
        document.getElementById('vehicleStatus').value = 'active';
        modal.style.display = 'flex';
    } else {
        // 降级方案
        const plate = prompt('车牌号：');
        if (!plate) return;
        const brand = prompt('品牌：');
        if (!brand) return;
        const model = prompt('型号：');
        if (!model) return;
        const year = parseInt(prompt('年份：', new Date().getFullYear()));
        const color = prompt('颜色：') || '白色';
        const owner = prompt('车主：');
        if (!owner) return;
        
        const newVehicle = {
            id: `VEH-${String(Date.now()).slice(-6)}`,
            plate: plate.trim().toUpperCase(),
            brand: brand.trim(),
            model: model.trim(),
            year: isNaN(year) ? new Date().getFullYear() : year,
            color: color,
            owner: owner.trim(),
            ownerPhone: '',
            vin: '',
            engine: '',
            notes: '',
            status: 'active',
            serviceCount: 0,
            lastService: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.vehicles.push(newVehicle);
        saveVehicles();
        extractBrands();
        applyFilters();
        showToast('车辆已创建', 'success');
    }
}

/**
 * @private
 * @description 关闭弹窗
 */
function closeModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) modal.style.display = 'none';
}

/**
 * @private
 * @param {number} page - 页码
 * @description 跳转到指定页
 */
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredVehicles.length / state.limit);
    if (page < 1 || page > totalPages) return;
    state.page = page;
    renderVehicles();
    renderPagination();
}

/**
 * @private
 * @description 搜索车辆
 */
function searchVehicles(query) {
    state.searchQuery = query;
    state.page = 1;
    applyFilters();
}

/**
 * @private
 * @description 应用筛选
 */
function applyFiltersAndRender() {
    applyFilters();
}

/**
 * @private
 * @description 重置筛选
 */
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const brandFilter = document.getElementById('brandFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (brandFilter) brandFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    
    state.searchQuery = '';
    state.brandFilter = 'all';
    state.statusFilter = 'all';
    state.page = 1;
    applyFilters();
}

/**
 * @private
 * @description 刷新数据
 */
function refresh() {
    loadVehicles();
    showToast('数据已刷新', 'success');
}

/**
 * @private
 * @description 绑定事件
 */
function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                searchVehicles(this.value);
            }, 300);
        });
    }
    
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        brandFilter.addEventListener('change', applyFiltersAndRender);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFiltersAndRender);
    }
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    const refreshBtn = document.getElementById('refreshVehicles');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refresh);
    }
    
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateModal);
    }
}

/**
 * @private
 * @description 初始化弹窗事件
 */
function initModalEvents() {
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const cancelBtn = document.getElementById('cancelModal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const saveBtn = document.getElementById('saveVehicle');
    if (saveBtn) saveBtn.addEventListener('click', saveVehicle);
    
    const modal = document.getElementById('vehicleModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    const detailModal = document.getElementById('vehicleDetailModal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
}

/**
 * @public
 * @param {Object} options - 初始化选项
 * @param {Vehicle[]} options.data - 初始数据
 * @returns {Promise<void>}
 */
export async function init(options) {
    console.log('🚗 车辆管理 初始化...');
    
    if (options?.data) {
        state.vehicles = options.data;
        localStorage.setItem('vehicle_data', JSON.stringify(state.vehicles));
    }
    
    loadVehicles();
    bindEvents();
    initModalEvents();
    updateBrandFilter();
    
    window.VehiclesModule = {
        state,
        loadVehicles,
        renderVehicles,
        renderPagination,
        updateStats,
        viewVehicle,
        editVehicle,
        deleteVehicle,
        goToPage,
        showCreateModal,
        closeModal,
        searchVehicles,
        applyFilters: applyFiltersAndRender,
        resetFilters,
        refresh,
        saveVehicles,
        extractBrands,
        updateBrandFilter: () => {
            const filter = document.getElementById('brandFilter');
            if (filter) {
                const currentValue = filter.value;
                filter.innerHTML = `<option value="all">全部品牌</option>${state.brands.map(b => `<option value="${b}">${b}</option>`).join('')}`;
                filter.value = currentValue;
            }
        }
    };
    
    console.log('✅ 车辆管理 初始化完成');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default {
    init,
    loadVehicles,
    viewVehicle,
    editVehicle,
    deleteVehicle,
    goToPage,
    showCreateModal,
    saveVehicle,
    refresh,
    saveVehicles
};