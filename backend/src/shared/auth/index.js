// backend/src/shared/auth/index.js
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabase } from '../supabase/index.js'

class AuthService {
  constructor() {
    this.secret = process.env.JWT_SECRET
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  }

  // JWT相关
  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn })
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret)
    } catch (error) {
      return null
    }
  }

  // 密码相关
  async hashPassword(password) {
    return await bcrypt.hash(password, 10)
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  // 权限相关
  async hasPermission(userId, resource, action) {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('resource', resource)
        .eq('action', action)
        .single()

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }

  async hasRole(userId, role) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', role)
        .single()

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Role check failed:', error)
      return false
    }
  }

  // 中间件
  authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = this.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = decoded
    next()
  }

  requirePermission(resource, action) {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const hasPermission = await this.hasPermission(req.user.id, resource, action)
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    }
  }

  requireRole(roles) {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const hasRole = await this.hasRole(req.user.id, roles)
      if (!hasRole) {
        return res.status(403).json({ error: 'Insufficient role' })
      }

      next()
    }
  }
}

// 统一导出所有验证函数
export const validateAuth = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  password: (password) => password.length >= 8,
  username: (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

export const authService = new AuthService()