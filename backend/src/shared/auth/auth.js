// backend/src/api/routes/index.js
import { authService } from '../../shared/auth/index.js'

// 登录路由
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  
  // 使用统一验证
  if (!validateAuth.email(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  // 使用统一Auth服务
  const user = await userService.findByEmail(email)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const isValid = await authService.comparePassword(password, user.password_hash)
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = authService.generateToken({ id: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// 需要认证的路由
router.get('/profile', authService.authenticate, async (req, res) => {
  const user = await userService.findById(req.user.id)
  res.json(user)
})

// 需要权限的路由
router.delete('/orders/:id', 
  authService.authenticate,
  authService.requirePermission('orders', 'delete'),
  async (req, res) => {
    await orderService.delete(req.params.id)
    res.json({ success: true })
  }
)