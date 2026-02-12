@echo off
chcp 65001 >nul
title Vercel 快速部署
echo.
echo ============================================
echo   The Private Symposium - Vercel 部署
echo ============================================
echo.
echo 此脚本将引导你完成 Vercel 部署
echo.
pause

echo.
echo [1/4] 检查环境...

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

:: 检查 Vercel CLI
call vercel --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 Vercel CLI...
    call npm install -g vercel
    if errorlevel 1 (
        echo ❌ 安装失败
        pause
        exit /b 1
    )
)
echo ✅ Vercel CLI 已就绪

echo.
echo [2/4] 安装依赖...
cd "%~dp0"
call npm install
if errorlevel 1 (
    echo ⚠️  依赖安装可能有问题，继续尝试...
)

echo.
echo [3/4] 配置环境变量
echo.
echo ⚠️  你需要提前准备好以下信息：
echo   1. DeepSeek API Key (sk-...)
echo   2. Firebase Project ID (symposium)
echo   3. Firebase Client Email
.ech o   4. Firebase Private Key
echo.
echo 如果还没有，请按 Ctrl+C 取消，先查看 DEPLOY_VERCEL.md
echo.
pause

echo.
echo 请选择操作：
echo 1. 首次部署（会提示登录 Vercel）
echo 2. 更新部署（已登录过）
echo.
set /p choice="输入 1 或 2: "

if "%choice%"=="1" (
    echo.
    echo [4/4] 首次部署...
    echo 将打开浏览器让你登录 Vercel...
    call vercel
) else if "%choice%"=="2" (
    echo.
    echo [4/4] 更新部署...
    call vercel --prod
) else (
    echo 无效选择
    pause
    exit /b 1
)

echo.
if errorlevel 1 (
    echo ❌ 部署失败
    echo 请检查错误信息，或查看 DEPLOY_VERCEL.md 手动部署
) else (
    echo ✅ 部署成功！
    echo.
    echo 请访问 Vercel Dashboard 查看你的项目：
    echo https://vercel.com/dashboard
    echo.
    echo 下一步：
    echo 1. 在 Vercel 项目设置中添加环境变量
    echo 2. 更新 js/firebase-config.js 中的 API 地址
    echo 3. 部署前端到 GitHub Pages
)

echo.
pause
