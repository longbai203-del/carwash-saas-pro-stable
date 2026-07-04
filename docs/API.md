# CarWash SaaS Pro - API 文档

## 概述

- **Base URL**: `/api`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

## 认证

### POST /auth/login
用户登录

**请求体:**
```json
{
  "username": "admin",
  "password": "123456"
}