// 扩展原有 ModuleBase，增加路由注册能力
import { ModuleBase } from './module-base.js';  // 保留原基类

export class ModuleV2 extends ModuleBase {
  constructor(config) {
    super(config);
    this.routes = config.routes || [];
    this.initFn = config.init || (() => {});
  }

  // 注册路由（由 router 调用）
  registerRoutes(router) {
    if (typeof this.routes === 'function') {
      this.routes(router);
    } else if (Array.isArray(this.routes)) {
      this.routes.forEach(route => {
        router.addRoute(route.path, route.component, route.meta || {});
      });
    }
  }

  // 初始化（可异步）
  async init() {
    if (this.initFn) await this.initFn();
  }
}