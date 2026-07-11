// frontend/src/components/Layout/Sidebar.js
import { getSortedModules, getModulePath } from '../../config/modules.js'
import { Router } from '../../core/router.js'

export class UnifiedSidebar {
  constructor(options = {}) {
    this.container = options.container || '#sidebar'
    this.currentModule = options.currentModule || null
    this.modules = getSortedModules()
    this.router = Router.getInstance()
    
    this.init()
  }

  init() {
    this.render()
    this.bindEvents()
  }

  render() {
    const menuItems = this.modules.map(module => `
      <li class="nav-item ${this.currentModule === module.id ? 'active' : ''}" 
          data-module-id="${module.id}">
        <a href="${module.path}" class="nav-link" data-navigate="${module.id}">
          <i class="fas fa-${module.icon}"></i>
          <span>${module.name}</span>
        </a>
      </li>
    `).join('')

    const html = `
      <div class="sidebar-wrapper">
        <div class="sidebar-brand">
          <h2>洗车SaaS</h2>
          <span>v2.0</span>
        </div>
        <nav class="sidebar-nav">
          <ul class="nav flex-column">
            ${menuItems}
          </ul>
        </nav>
      </div>
    `

    const container = document.querySelector(this.container)
    if (container) {
      container.innerHTML = html
    }
  }

  bindEvents() {
    // 使用事件委托处理导航点击
    document.querySelector(this.container).addEventListener('click', (e) => {
      const link = e.target.closest('[data-navigate]')
      if (link) {
        e.preventDefault()
        const moduleId = link.dataset.navigate
        this.navigateTo(moduleId)
      }
    })
  }

  navigateTo(moduleId) {
    const module = this.modules.find(m => m.id === moduleId)
    if (!module) return

    // 更新URL
    window.history.pushState({ module: moduleId }, '', module.path)
    
    // 更新激活状态
    this.setActive(moduleId)
    
    // 触发路由变化
    this.router.navigate(module.path)
  }

  setActive(moduleId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.moduleId === moduleId)
    })
  }
}

// 导出单例
export const sidebar = new UnifiedSidebar()