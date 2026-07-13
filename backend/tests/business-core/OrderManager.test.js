/**
 * OrderManager 单元测试
 * 
 * @module tests/business-core/OrderManager.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import OrderManager from '../../business-core/orders/OrderManager.js'

describe('OrderManager', () => {
  let orderManager

  beforeEach(() => {
    orderManager = new OrderManager()
  })

  describe('validateStatusTransition', () => {
    it('should allow valid status transitions', () => {
      expect(() => orderManager.validateStatusTransition('pending', 'processing')).not.toThrow()
      expect(() => orderManager.validateStatusTransition('pending', 'cancelled')).not.toThrow()
      expect(() => orderManager.validateStatusTransition('processing', 'completed')).not.toThrow()
      expect(() => orderManager.validateStatusTransition('completed', 'refunded')).not.toThrow()
    })

    it('should reject invalid status transitions', () => {
      expect(() => orderManager.validateStatusTransition('pending', 'refunded')).toThrow()
      expect(() => orderManager.validateStatusTransition('cancelled', 'processing')).toThrow()
      expect(() => orderManager.validateStatusTransition('completed', 'processing')).toThrow()
    })

    it('should reject same status', () => {
      expect(() => orderManager.validateStatusTransition('pending', 'pending')).toThrow('Status already pending')
    })

    it('should reject invalid source status', () => {
      expect(() => orderManager.validateStatusTransition('unknown', 'pending')).toThrow('Invalid source status: unknown')
    })
  })
})