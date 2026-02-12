@echo off
chcp 65001 >nul
title The Private Symposium - 最终部署脚本
echo.
echo ============================================
echo   The Private Symposium - 部署脚本
echo   项目ID: symposium
echo ============================================
echo.

:: 进入项目目录
cd /d "%~dp0"

:: 检查 service-account.json
echo [1/5] 检查服务账号密钥...
if not exist "service-account.json" (
    echo ❌ 未找到 service-account.json 文件
    echo 请确保已将下载的 JSON 密钥文件放在此目录，并重命名为 service-account.json
    pause
    exit /b 1
)
echo ✅ 找到 service-account.json

:: 设置环境变量
echo.
echo [2/5] 配置认证信息...
set GOOGLE_APPLICATION_CREDENTIALS=%CD%\service-account.json
echo ✅ 认证环境变量已设置

:: 尝试使用 gcloud 部署
echo.
echo [3/5] 尝试使用 gcloud 部署...
echo.

:: 激活服务账号
gcloud auth activate-service-account --key-file=service-account.json 2>nul
if errorlevel 1 (
    echo ⚠️  gcloud 服务账号激活可能有问题，继续尝试部署...
)

:: 设置项目
gcloud config set project symposium 2>nul

:: 进入函数目录
cd functions

echo [4/5] 部署云函数（这可能需要 3-5 分钟）...
echo.

:: 部署 chat 函数
echo 正在部署 chat 函数...
gcloud functions deploy chat --runtime nodejs18 --trigger-http --allow-unauthenticated --region asia-east1 --entry-point chat --source . --quiet

if errorlevel 1 (
    echo ⚠️  chat 函数部署可能有问题
) else (
    echo ✅ chat 函数部署成功
)

echo.

:: 部署 getUserData 函数
echo 正在部署 getUserData 函数...
gcloud functions deploy getUserData --runtime nodejs18 --trigger-http --allow-unauthenticated --region asia-east1 --entry-point getUserData --source . --quiet

if errorlevel 1 (
    echo ⚠️  getUserData 函数部署可能有问题
) else (
    echo ✅ getUserData 函数部署成功
)

echo.

:: 部署 getConversation 函数
echo 正在部署 getConversation 函数...
gcloud functions deploy getConversation --runtime nodejs18 --trigger-http --allow-unauthenticated --region asia-east1 --entry-point getConversation --source . --quiet

if errorlevel 1 (
    echo ⚠️  getConversation 函数部署可能有问题
) else (
    echo ✅ getConversation 函数部署成功
)

echo.

:: 返回上级目录
cd ..

:: 检查部署结果
echo [5/5] 检查部署状态...
echo.
gcloud functions list --project=symposium --region=asia-east1 2>nul

echo.
echo ============================================
if errorlevel 1 (
    echo   ⚠️  部署可能未完成
    echo ============================================
    echo.
    echo 可能的原因：
    echo 1. 项目ID不正确（当前使用: symposium）
    echo 2. 服务账号权限不足
    echo 3. 需要启用 Cloud Functions API
    echo.
    echo 请访问 Firebase Console 检查：
    echo https://console.firebase.google.com/project/symposium/functions
) else (
    echo   🎉 部署完成！
    echo ============================================
    echo.
    echo 你的云函数已部署到：
    echo   - https://asia-east1-symposium.cloudfunctions.net/chat
    echo   - https://asia-east1-symposium.cloudfunctions.net/getUserData
    echo   - https://asia-east1-symposium.cloudfunctions.net/getConversation
    echo.
    echo 下一步：
    echo 1. 获取 Firebase 配置并更新 js/firebase-config.js
    echo 2. 配置 Firestore 规则
    echo 3. 部署前端到 GitHub Pages
    echo.
    echo 详细步骤见: DEPLOY_STEPS.md
)

echo.
pause
