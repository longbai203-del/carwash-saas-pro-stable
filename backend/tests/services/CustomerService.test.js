/**
 * CustomerService 单元测试
 * 
 * @module tests/services/CustomerService.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import CustomerService from '../../src/services/CustomerService.js'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  })
}))

describe('CustomerService', () => {
  let customerService

  beforeEach(() => {
    customerService = new CustomerService()
  })

  describe('validateData', () => {
    it('should validate valid customer data', () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1 234-567-8900'
      }
      
      expect(() => customerService.validateData(validData)).not.toThrow()
    })

    it('should reject invalid email', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email'
      }
      
      expect(() => customerService.validateData(invalidData)).toThrow('Invalid email format')
    })

    it('should reject empty first name', () => {
      const invalidData = {
        first_name: '',
        last_name: 'Doe'
      }
      
      expect(() => customerService.validateData(invalidData)).toThrow('First name is required')
    })
  })

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(customerService.isValidEmail('test@example.com')).toBe(true)
      expect(customerService.isValidEmail('user.name@domain.co')).toBe(true)
    })

    it('should return false for invalid email', () => {
      expect(customerService.isValidEmail('invalid')).toBe(false)
      expect(customerService.isValidEmail('test@')).toBe(false)
      expect(customerService.isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should return true for valid phone', () => {
      expect(customerService.isValidPhone('+1 234-567-8900')).toBe(true)
      expect(customerService.isValidPhone('1234567890')).toBe(true)
    })

    it('should return false for invalid phone', () => {
      expect(customerService.isValidPhone('')).toBe(false)
      expect(customerService.isValidPhone('123')).toBe(false)
    })
  })
})