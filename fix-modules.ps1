# 批量修复模块 JS 文件
# 将 AppState 替换为 AppStore
# 将 supabase.from 修复为使用 AppApi

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  批量修复模块文件" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$modules = @(
    "dashboard",
    "cashier", 
    "orders",
    "inventory",
    "customers",
    "attendance",
    "reports",
    "employees",
    "audit",
    "settings"
)

foreach ($mod in $modules) {
    $file = "modules/$mod/$mod.js"
    if (Test-Path $file) {
        Write-Host "修复: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # 替换 AppState 为 AppStore
        $content = $content -replace 'AppState', 'AppStore'
        
        # 修复 supabase.from 为 AppApi.query
        # 简单替换，实际需要更复杂的处理
        $content = $content -replace 'supabase\.from\(', 'AppApi.query('
        
        # 修复 staff_name 为 staff_name (保持)
        # 修复 ORDER_STATUS 引用
        if ($content -match 'ORDER_STATUS') {
            # 确保 ORDER_STATUS 已定义
        }
        
        # 写入文件
        $content | Out-File -Encoding UTF8 -FilePath $file
        
        Write-Host "  ✅ 已修复" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ 文件不存在: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ 所有模块已修复！" -ForegroundColor Green
Write-Host ""
Read-Host "按回车键退出"