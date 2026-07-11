// 采购管理 模块
export function init(container) {
    console.log('✅ 采购管理 模块已初始化')
    
    // 更新加载时间
    const timeEl = container.querySelector('.load-time')
    if (timeEl) {
        timeEl.textContent = new Date().toLocaleString()
    }
    
    return {
        destroy: () => {
            console.log('🗑️ 采购管理 模块已卸载')
        }
    }
}

// 如果模块需要额外的初始化
export function onShow() {
    console.log('👁️ 采购管理 模块已显示')
}

export function onHide() {
    console.log('🙈 采购管理 模块已隐藏')
}
