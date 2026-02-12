# The Private Symposium - 部署指南

> 从零到上线的完整部署流程

---

## 🚀 部署架构概览

```
用户浏览器
    ↓
GitHub Pages (免费前端托管)
    ↓ HTTPS
Firebase Cloud Functions (API代理)
    ↓
DeepSeek API (AI服务)
```

---

## 第一步：准备代码

### 1.1 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 仓库名：`private-symposium`
4. 选择 `Public`（免费）或 `Private`（付费账户）
5. 勾选 `Add a README file`
6. 点击 `Create repository`

### 1.2 上传代码

```bash
# 克隆仓库到本地
git clone https://github.com/YOUR_USERNAME/private-symposium.git
cd private-symposium

# 复制你的 symposium 代码
# 假设你的代码在 ../symposium 目录
cp -r ../symposium/* .

# 提交代码
git add .
git commit -m "Initial commit: The Private Symposium v1.0"
git push origin main
```

### 1.3 目录结构

```
private-symposium/
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 自动部署
├── docs/                    # 文档
│   ├── BUSINESS_MODEL.md
│   ├── BACKEND_SETUP.md
│   └── DEPLOY.md
├── functions/               # Firebase 云函数
│   ├── index.js
│   └── package.json
├── symposium/               # 前端代码
│   ├── index.html
│   ├── js/
│   └── assets/
├── firebase.json            # Firebase 配置
└── README.md
```

---

## 第二步：配置 GitHub Pages

### 2.1 启用 Pages

1. 进入 GitHub 仓库
2. 点击 `Settings` 标签
3. 左侧菜单选择 `Pages`
4. **Source** 选择 `Deploy from a branch`
5. **Branch** 选择 `main` / `root`
6. 点击 `Save`

### 2.2 配置自定义域名（可选）

如果你有域名（如：`symposium.yourdomain.com`）：

1. 在 Pages 设置中，Custom domain 输入你的域名
2. 在你的域名 DNS 添加 CNAME 记录：
   - 主机记录：`symposium`
   - 记录值：`YOUR_USERNAME.github.io`
3. 等待 DNS 生效（通常几分钟到几小时）

### 2.3 启用 HTTPS

GitHub Pages 自动提供 HTTPS，确保勾选 `Enforce HTTPS`。

---

## 第三步：配置 Firebase

详细步骤见 [BACKEND_SETUP.md](./BACKEND_SETUP.md)，这里简述关键步骤：

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录
firebase login

# 初始化
firebase init

# 选择 Firestore 和 Functions

# 部署
firebase deploy
```

---

## 第四步：配置 CORS

由于前端和后端域名不同，需要配置跨域：

### 4.1 获取 GitHub Pages 域名

- 默认：`https://YOUR_USERNAME.github.io`
- 自定义：`https://symposium.yourdomain.com`

### 4.2 配置 Firebase 云函数 CORS

在 `functions/index.js` 中：

```javascript
const cors = require('cors')({ 
    origin: [
        'https://YOUR_USERNAME.github.io',
        'https://symposium.yourdomain.com'  // 如果有自定义域名
    ]
});
```

重新部署：
```bash
firebase deploy --only functions
```

---

## 第五步：配置 GitHub Actions（自动部署）

创建文件 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install Firebase CLI
      run: npm install -g firebase-tools
      
    - name: Deploy to Firebase
      run: |
        cd functions
        npm install
        firebase deploy --token "${{ secrets.FIREBASE_TOKEN }}"
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./symposium
```

### 配置 Secrets

1. 在 GitHub 仓库，点击 `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. 添加 `FIREBASE_TOKEN`：
   - 本地运行 `firebase login:ci` 获取 token
   - 复制 token 粘贴到 GitHub

---

## 第六步：测试部署

### 6.1 访问前端

打开浏览器访问：
```
https://YOUR_USERNAME.github.io/private-symposium
```

### 6.2 测试登录

1. 点击「登录/注册」
2. 输入测试邮箱和密码
3. 应该成功登录（Firebase Auth 会自动创建用户）

### 6.3 测试对话

1. 选择角色
2. 输入消息
3. 检查是否能收到回复

---

## 第七步：配置支付（商业化）

### 7.1 Stripe 配置

1. 注册 [Stripe](https://stripe.com)
2. 获取 API Keys
3. 配置 webhook

```javascript
// functions/index.js
const stripe = require('stripe')(functions.config().stripe.secret);

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'alipay'],
        line_items: [{
            price_data: {
                currency: 'cny',
                product_data: { name: '畅聊版套餐' },
                unit_amount: 2990, // ¥29.90
                recurring: { interval: 'month' }
            },
            quantity: 1
        }],
        mode: 'subscription',
        success_url: 'https://yourdomain.github.io/success',
        cancel_url: 'https://yourdomain.github.io/cancel'
    });
    
    return { sessionId: session.id };
});
```

### 7.2 Paddle 配置（推荐，更简单）

1. 注册 [Paddle](https://paddle.com)
2. 创建产品
3. 复制 checkout URL
4. 在前端直接跳转

```javascript
// 前端调用
function upgradePlan(plan) {
    const checkoutUrls = {
        lite: 'https://checkout.paddle.com/product/lite',
        pro: 'https://checkout.paddle.com/product/pro'
    };
    window.location.href = checkoutUrls[plan];
}
```

---

## 第八步：域名与品牌

### 8.1 购买域名

推荐平台：
- [阿里云](https://wanwang.aliyun.com)（国内访问快）
- [Cloudflare](https://dash.cloudflare.com)（国外访问快）

### 8.2 配置 CDN（Cloudflare）

1. 添加域名到 Cloudflare
2. 修改 DNS 为 Cloudflare 提供的
3. 配置 Page Rules
4. 开启 HTTPS 强制

---

## 第九步：监控与维护

### 9.1 设置监控

```bash
# 查看 Firebase 函数日志
firebase functions:log --tail

# 查看 Firestore 使用情况
firebase firestore:databases:get
```

### 9.2 设置告警

在 Firebase Console：
- Monitoring → Alerting → Create Policy
- 设置条件：
  - 错误率 > 5%
  - 响应时间 > 3秒
  - 日活跃用户 < 100（如果持续下降）

---

## 📋 部署检查清单

上线前确认：

- [ ] GitHub 仓库已创建
- [ ] 代码已 push 到 main 分支
- [ ] GitHub Pages 已启用
- [ ] 能正常访问 `https://xxx.github.io`
- [ ] Firebase 项目已创建
- [ ] 云函数已部署
- [ ] DeepSeek API Key 已配置
- [ ] CORS 已正确配置
- [ ] 登录功能正常
- [ ] 对话功能正常
- [ ] Token 计费正常
- [ ] 支付系统已测试
- [ ] 错误页面已配置（404/500）
- [ ] 隐私政策页面已添加
- [ ] 联系邮箱已设置

---

## 🆘 故障排查

### 页面空白

检查浏览器控制台：
- JS 错误？
- 资源加载失败？
- CORS 错误？

### 登录失败

1. 检查 Firebase Auth 是否启用
2. 检查 Firestore 规则
3. 检查浏览器 Console 错误

### API 调用失败

```bash
# 查看函数日志
firebase functions:log --tail

# 测试函数
firebase functions:shell
chat({ message: "test", character: "eudora" }, { auth: { uid: "test" } })
```

### 额度计算错误

检查 Firestore 中的用户数据结构：
```javascript
{
    plan: 'free',
    tokenUsage: {
        used: 50000,
        limit: 100000,
        resetDate: Timestamp
    }
}
```

---

## 🎉 上线后

### 第一周
- [ ] 监控错误率
- [ ] 收集首批用户反馈
- [ ] 修复明显 bug

### 第一个月
- [ ] 分析用户行为数据
- [ ] 优化角色提示词
- [ ] 准备推广内容

### 持续
- [ ] 定期查看成本
- [ ] 监控 DeepSeek API 稳定性
- [ ] 根据反馈迭代功能

---

**恭喜！你的 AI 哲学家私董会已上线！** 🕯️

如有问题，查看 [BACKEND_SETUP.md](./BACKEND_SETUP.md) 或联系技术支持。
