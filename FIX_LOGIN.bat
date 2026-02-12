@echo off
chcp 65001 >nul
title Firebase 登录修复
echo.
echo ============================================
echo   Firebase CLI 手动登录
echo ============================================
echo.
echo 由于浏览器登录失败，我们使用备用方法：
echo.
echo 步骤：
echo 1. 按任意键打开授权页面
echo 2. 在打开的页面中登录 Google 账号
echo 3. 复制页面显示的授权码（很长的字符串）
echo 4. 回到此窗口，粘贴授权码，回车
echo.
pause

echo.
echo 正在打开授权页面...
start https://accounts.google.com/o/oauth2/auth?client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com^&scope=email%%20openid%%20https://www.googleapis.com/auth/cloudplatformprojects.readonly%%20https://www.googleapis.com/auth/firebase%%20https://www.googleapis.com/auth/cloud-platform^&response_type=code^&state=123456789^&redirect_uri=http://localhost:9005

echo.
echo ============================================
echo 请在新打开的浏览器页面中：
echo 1. 登录你的 Google 账号
echo 2. 允许 Firebase CLI 访问权限
echo 3. 复制页面显示的授权码（Authorization Code）
echo ============================================
echo.
echo 注意：如果页面显示 "localhost 拒绝了连接"，
echo 没关系，只要看到授权码就复制它！
echo.

set /p AUTH_CODE="请粘贴授权码: "

if "%AUTH_CODE%"=="" (
    echo ❌ 授权码不能为空
    pause
    exit /b 1
)

echo.
echo 正在使用授权码登录...
call firebase login --token "%AUTH_CODE%"

if errorlevel 1 (
    echo ❌ 登录失败
    echo 请尝试直接运行：firebase login --reauth
    pause
    exit /b 1
)

echo.
echo ✅ 登录成功！
echo.
echo 现在可以继续部署了：
echo 1. 关闭此窗口
echo 2. 重新运行 DEPLOY_SIMPLE.bat
echo.
pause
