/**
 * 应用启动入口
 * 
 * @module main
 * 
 * @example
 * // 在HTML中引用
 * <script type="module" src="./src/main.js"></script>
 */

import app from './App.js'
import { store } from './store/index.js'
import { api } from './services/api.js'

/**
 * 启动应用
 */
async function bootstrap() {
  try {
    // 显示启动状态
    console.log('📦 Loading application...')

    // 检查环境
    const isDevelopment = window.location.hostname === 'localhost'
    if (isDevelopment) {
      console.log('🔧 Development mode enabled')
    }

    // 初始化应用
    await app.init()

    // 设置开发工具
    if (isDevelopment) {
      window.__APP__ = {
        app,
        store,
        api,
        version: app.version
      }
      console.log('🛠️  Development tools available: window.__APP__')
    }

    // 隐藏加载状态
    const loader = document.getElementById('app-loader')
    if (loader) {
      loader.style.display = 'none'
    }

    console.log('✅ Application ready')
  } catch (error) {
    console.error('❌ Failed to start application:', error)
    
    // 显示错误
    const container = document.getElementById('content-container')
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <h2 style="color: #d32f2f;">启动失败</h2>
          <p style="color: #666;">${error.message || 'Unknown error'}</p>
          <button onclick="location.reload()" 
                  style="padding: 10px 24px; background: #4fc3f7; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-top: 12px;">
            重试
          </button>
        </div>
      `
    }
  }
}

// 等待DOM加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}

export default bootstrap