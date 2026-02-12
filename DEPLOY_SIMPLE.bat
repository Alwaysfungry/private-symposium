@echo off
chcp 65001 >nul
title The Private Symposium - 部署脚本
echo.
echo ============================================
echo   The Private Symposium - 一键部署
echo ============================================
echo.

:: 检查 Node.js
echo [1/6] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    echo 请访问 https://nodejs.org 下载安装 LTS 版本
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

:: 安装 Firebase CLI
echo.
echo [2/6] 安装 Firebase CLI...
call firebase --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 Firebase CLI...
    call npm install -g firebase-tools
    if errorlevel 1 (
        echo ❌ 安装失败，请手动运行: npm install -g firebase-tools
        pause
        exit /b 1
    )
)
echo ✅ Firebase CLI 已就绪

:: 登录 Firebase
echo.
echo [3/6] 登录 Firebase...
echo 将打开浏览器让你登录 Google 账号...
call firebase login
if errorlevel 1 (
    echo ❌ 登录失败
    pause
    exit /b 1
)
echo ✅ 登录成功

:: 进入函数目录
echo.
echo [4/6] 安装依赖...
cd functions
if errorlevel 1 (
    echo ❌ 未找到 functions 目录
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo ✅ 依赖安装完成
cd ..

:: 输入 API Key
echo.
echo [5/6] 配置 DeepSeek API Key
echo.
echo 请输入你的 DeepSeek API Key（格式: sk-xxxxxxxx）
echo.
set /p API_KEY="API Key: "

if "%API_KEY%"=="" (
    echo ❌ API Key 不能为空
    pause
    exit /b 1
)

echo 正在设置 API Key...
call firebase functions:config:set deepseek.key="%API_KEY%"
if errorlevel 1 (
    echo ⚠️ API Key 设置可能失败，请稍后手动设置
)
echo ✅ API Key 设置完成

:: 部署
echo.
echo [6/6] 部署云函数...
echo 这可能需要 2-5 分钟，请耐心等待...
echo.

call firebase deploy --only functions
if errorlevel 1 (
    echo.
    echo ❌ 部署失败
    echo 请检查：
    echo 1. 是否已创建 Firebase 项目
    echo 2. 是否已启用 Blaze 计划
    echo 3. API Key 格式是否正确
    pause
    exit /b 1
)

echo.
echo ============================================
echo   🎉 部署成功！
echo ============================================
echo.
echo 接下来：
echo 1. 获取 Firebase 配置并更新 js/firebase-config.js
echo 2. 配置 Firestore 规则
echo 3. 部署前端到 GitHub Pages
echo.
echo 详细指南: DEPLOY_QUICKSTART.md
echo.
pause
