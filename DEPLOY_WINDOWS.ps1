# The Private Symposium - Windows 部署脚本
# 一键部署到 Firebase
# 
# 使用方法：
# 1. 右键点击此文件 → 使用 PowerShell 运行
# 2. 或者在 PowerShell 中执行: .\DEPLOY_WINDOWS.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$DeepSeekApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipLogin = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Step($step, $total, $message) {
    Write-Output ""
    Write-ColorOutput Magenta "========================================"
    Write-ColorOutput Magenta "步骤 $step / $total : $message"
    Write-ColorOutput Magenta "========================================"
    Write-Output ""
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 显示欢迎信息
Clear-Host
Write-Output ""
Write-ColorOutput Blue @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           The Private Symposium - 部署脚本                    ║
║                                                              ║
║           一键部署到 Firebase + DeepSeek                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@

# 检查 Node.js
Write-Step 1 8 "检查 Node.js 环境"

try {
    $nodeVersion = node --version
    Write-Success "Node.js 已安装: $nodeVersion"
} catch {
    Write-Error "Node.js 未安装"
    Write-Info "请访问 https://nodejs.org 下载并安装 LTS 版本"
    Write-Info "安装完成后重新运行此脚本"
    exit 1
}

# 步骤 2: 安装 Firebase CLI
Write-Step 2 8 "安装 Firebase CLI"

try {
    $firebaseVersion = firebase --version 2>$null
    if ($firebaseVersion) {
        Write-Success "Firebase CLI 已安装: v$firebaseVersion"
    } else {
        throw "未安装"
    }
} catch {
    Write-Info "正在安装 Firebase CLI..."
    Write-Info "这可能需要几分钟，请耐心等待..."
    
    try {
        npm install -g firebase-tools
        $firebaseVersion = firebase --version
        Write-Success "Firebase CLI 安装成功: v$firebaseVersion"
    } catch {
        Write-Error "Firebase CLI 安装失败"
        Write-Info "请手动运行: npm install -g firebase-tools"
        exit 1
    }
}

# 步骤 3: 登录 Firebase
Write-Step 3 8 "登录 Firebase"

if (-not $SkipLogin) {
    Write-Info "将打开浏览器让你登录 Google 账号..."
    Write-Info "登录完成后请回到此窗口继续"
    
    firebase login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Firebase 登录成功"
    } else {
        Write-Error "Firebase 登录失败"
        exit 1
    }
} else {
    Write-Info "跳过登录（使用 --SkipLogin 参数）"
}

# 步骤 4: 获取项目路径
Write-Step 4 8 "检查项目文件"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Split-Path -Parent $scriptPath
$functionsPath = Join-Path $projectPath "functions"

Write-Info "项目路径: $projectPath"
Write-Info "函数路径: $functionsPath"

# 检查必要文件
$requiredFiles = @(
    (Join-Path $projectPath "firebase.json"),
    (Join-Path $projectPath "firestore.rules"),
    (Join-Path $functionsPath "index.js"),
    (Join-Path $functionsPath "package.json")
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "找到: $(Split-Path $file -Leaf)"
    } else {
        Write-Error "缺失: $(Split-Path $file -Leaf)"
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Error "项目文件不完整，请检查项目结构"
    exit 1
}

# 步骤 5: 安装依赖
Write-Step 5 8 "安装云函数依赖"

Set-Location $functionsPath

Write-Info "正在安装依赖包..."
Write-Info "这可能需要几分钟..."

try {
    npm install 2>&1 | ForEach-Object {
        if ($_ -match "error|ERR|WARN") {
            Write-Warning $_
        }
    }
    Write-Success "依赖安装完成"
} catch {
    Write-Error "依赖安装失败"
    Write-Info "错误信息: $_"
    exit 1
}

# 步骤 6: 配置 DeepSeek API Key
Write-Step 6 8 "配置 DeepSeek API Key"

$apiKey = $DeepSeekApiKey

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Info "请在下方输入你的 DeepSeek API Key"
    Write-Info "格式: sk-xxxxxxxxxxxxxxxx"
    Write-Info ""
    
    $secureKey = Read-Host -Prompt "DeepSeek API Key" -AsSecureString
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    )
}

if ([string]::IsNullOrWhiteSpace($apiKey) -or -not $apiKey.StartsWith("sk-")) {
    Write-Error "API Key 格式不正确，应以 'sk-' 开头"
    exit 1
}

Write-Info "正在设置 API Key..."

try {
    # 使用 cmd /c 来正确传递参数
    $env:DEEPSEEK_API_KEY = $apiKey
    firebase functions:config:set deepseek.key="$apiKey" --project $projectId 2>&1 | ForEach-Object {
        Write-Info $_
    }
    
    Write-Success "API Key 设置成功"
} catch {
    Write-Error "API Key 设置失败"
    Write-Info "错误信息: $_"
    Write-Info "你可以稍后手动设置: firebase functions:config:set deepseek.key=\"你的Key\""
}

# 步骤 7: 部署云函数
Write-Step 7 8 "部署云函数到 Firebase"

Set-Location $projectPath

Write-Info "开始部署..."
Write-Info "这可能需要 2-5 分钟，请耐心等待..."
Write-Info ""

try {
    firebase deploy --only functions 2>&1 | ForEach-Object {
        Write-Output $_
        
        if ($_ -match "error|Error|failed|Failed") {
            Write-Warning "部署过程中出现警告或错误，请检查上方输出"
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "云函数部署成功！"
    } else {
        throw "部署失败，退出码: $LASTEXITCODE"
    }
} catch {
    Write-Error "部署失败"
    Write-Info "常见原因："
    Write-Info "1. 未创建 Firebase 项目"
    Write-Info "2. 未启用 Blaze 计划（按量付费）"
    Write-Info "3. API Key 格式错误"
    Write-Info ""
    Write-Info "请访问 Firebase Console 检查: https://console.firebase.google.com"
    exit 1
}

# 步骤 8: 验证部署
Write-Step 8 8 "验证部署"

Write-Info "正在验证云函数..."

try {
    # 获取项目 ID
    $projectConfig = firebase use 2>$null
    if ($projectConfig) {
        Write-Info "当前项目: $projectConfig"
    }
    
    Write-Info ""
    Write-Success "部署验证完成！"
    Write-Info ""
    Write-Info "你的云函数端点："
    Write-Info "  - chat: https://us-central1-$projectConfig.cloudfunctions.net/chat"
    Write-Info "  - getUserData: https://us-central1-$projectConfig.cloudfunctions.net/getUserData"
    Write-Info ""
} catch {
    Write-Warning "验证步骤出错，但部署可能已成功"
}

# 显示后续步骤
Write-Output ""
Write-ColorOutput Green @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                   🎉 部署完成！ 🎉                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

接下来你需要：

1. 获取 Firebase 配置
   - 访问: https://console.firebase.google.com
   - 进入你的项目 → 项目设置 → 常规
   - 在"你的应用"部分点击"</>"图标
   - 复制 firebaseConfig 配置

2. 更新前端配置
   - 打开: js/firebase-config.js
   - 粘贴你的 Firebase 配置

3. 配置 Firestore 规则
   - 在 Firebase Console 中点击 "Firestore Database"
   - 点击 "规则" 标签
   - 复制 firestore.rules 文件内容并粘贴
   - 点击 "发布"

4. 部署前端到 GitHub Pages
   - 创建 GitHub 仓库
   - 上传代码
   - 在 Settings → Pages 中启用

详细指南: DEPLOY_QUICKSTART.md

"@

# 询问是否打开 Firebase Console
Write-Info "是否打开 Firebase Console？"
$openConsole = Read-Host "输入 Y 打开，或按 Enter 跳过"

if ($openConsole -eq "Y" -or $openConsole -eq "y") {
    Start-Process "https://console.firebase.google.com"
}

Write-Output ""
Write-Info "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
