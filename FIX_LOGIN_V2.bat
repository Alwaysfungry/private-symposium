@echo off
chcp 65001 >nul
title Firebase 登录修复 V2
echo.
echo ============================================
echo   Firebase CLI 登录 - 无本地服务器模式
echo ============================================
echo.
echo 由于 localhost 无法访问，使用备用方案...
echo.

:: 使用 --no-localhost 参数登录
echo 正在启动登录流程（不使用本地服务器）...
echo.
echo 请留意：
echo 1. 会弹出一个链接
echo 2. 在浏览器中打开这个链接
echo 3. 登录 Google 账号
echo 4. 页面会显示一个授权码
echo 5. 复制授权码
echo 6. 回到这里粘贴
echo.
pause

echo.
echo 正在打开登录链接...
call firebase login --no-localhost

echo.
if errorlevel 1 (
    echo ❌ 登录失败
    echo.
    echo 尝试最终方案：
    echo 1. 访问 https://console.firebase.google.com
    echo 2. 登录你的 Google 账号
    echo 3. 回到命令行，运行：firebase projects:list
    echo 4. 如果显示项目列表，说明已登录
    pause
) else (
    echo ✅ 登录成功！
    echo.
    echo 请重新运行 DEPLOY_SIMPLE.bat 继续部署
    pause
)
