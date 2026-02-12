# The Private Symposium - 快速部署指南

> 15分钟完成 Firebase 部署

---

## 📋 部署前准备

### 你需要：
1. ✅ DeepSeek API Key（你已提供：`sk-0ab706...`）
2. ✅ Google 账号（用于 Firebase）
3. ✅ GitHub 账号（用于托管前端）
4. ⏱️ 15分钟时间

---

## 第一步：创建 Firebase 项目（3分钟）

### 1.1 访问 Firebase Console
1. 打开 [console.firebase.google.com](https://console.firebase.google.com)
2. 点击「创建项目」
3. 项目名称：`private-symposium-prod`（或你喜欢的名字）
4. 关闭 Google Analytics（可选）
5. 等待创建完成

### 1.2 启用 Authentication
1. 左侧菜单点击「Authentication」
2. 点击「开始使用」
3. 启用「邮箱/密码」登录方式
4. 点击「保存」

### 1.3 启用 Firestore
1. 左侧菜单点击「Firestore Database」
2. 点击「创建数据库」
3. 选择「以测试模式开始」（后续可改规则）
4. 选择就近的区域（如 `asia-east1` 台湾）
5. 点击「启用」

---

## 第二步：获取 Firebase 配置（2分钟）

### 2.1 获取配置信息
1. 点击项目设置（齿轮图标）
2. 向下滚动到「您的应用」
3. 点击「</>」添加 Web 应用
4. 应用昵称：`symposium-web`
5. 点击「注册应用」
6. **复制 firebaseConfig 代码块**

你会看到类似这样的配置：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCxxxxxxxxxxxxxxxx",
  authDomain: "private-symposium-prod.firebaseapp.com",
  projectId: "private-symposium-prod",
  storageBucket: "private-symposium-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 2.2 更新前端配置
1. 打开 `symposium/js/firebase-config.js`
2. 用你复制的配置替换 `YOUR_API_KEY` 等占位符
3. 保存文件

---

## 第三步：部署云函数（5分钟）

### 3.1 安装 Firebase CLI
```bash
# 在命令行执行
npm install -g firebase-tools
```

### 3.2 登录 Firebase
```bash
firebase login
# 会打开浏览器让你登录 Google 账号
```

### 3.3 进入函数目录
```bash
cd symposium/functions
```

### 3.4 安装依赖
```bash
npm install
```

### 3.5 设置 API Key（重要！）
```bash
# 设置你的 DeepSeek API Key
firebase functions:config:set deepseek.key="sk-0ab706..."

# 验证设置
firebase functions:config:get
```

### 3.6 部署云函数
```bash
# 回到 symposium 目录
cd ..

# 部署
firebase deploy --only functions
```

等待部署完成，你会看到类似输出：
```
✔  functions[chat(us-central1)] Successful create operation.
✔  functions[getUserData(us-central1)] Successful create operation.
```

---

## 第四步：配置 Firestore 规则（2分钟）

### 4.1 更新安全规则
1. 在 Firebase Console，点击「Firestore Database」
2. 点击「规则」标签
3. 复制 `symposium/firestore.rules` 文件内容
4. 粘贴到规则编辑器
5. 点击「发布」

---

## 第五步：部署前端到 GitHub Pages（3分钟）

### 5.1 创建 GitHub 仓库
1. 访问 [github.com](https://github.com)
2. 点击 `+` → `New repository`
3. 仓库名：`private-symposium`
4. 选择 `Public`
5. 点击「Create repository」

### 5.2 上传代码
```bash
# 在 symposium 目录的父目录执行
cd symposium

# 初始化 git
git init
git add .
git commit -m "Initial commit"

# 关联远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/private-symposium.git
git branch -M main
git push -u origin main
```

### 5.3 启用 GitHub Pages
1. 在 GitHub 仓库页面，点击「Settings」
2. 左侧点击「Pages」
3. Source 选择「Deploy from a branch」
4. Branch 选择「main」/「root」
5. 点击「Save」

等待几分钟，访问：
```
https://YOUR_USERNAME.github.io/private-symposium/symposium/
```

---

## ✅ 验证部署

### 测试清单：
- [ ] 打开网页，看到登录界面
- [ ] 点击「登录/注册」，输入邮箱密码
- [ ] 成功登录后看到用户头像和 Token 用量
- [ ] 选择角色，发送消息
- [ ] 收到 AI 回复
- [ ] 刷新页面，对话历史仍在

---

## 🆘 常见问题

### Q: 部署后页面空白？
检查浏览器控制台是否有错误：
- Firebase 配置是否正确？
- GitHub Pages 路径是否正确？

### Q: 登录失败？
- 检查 Firebase Auth 是否启用
- 检查 firestore.rules 是否已发布

### Q: API 调用失败？
```bash
# 查看函数日志
firebase functions:log --tail
```

常见原因：
- DeepSeek API Key 未设置
- API Key 格式错误
- Token 额度已用完

### Q: 如何更新 API Key？
```bash
firebase functions:config:set deepseek.key="sk-new-key"
firebase deploy --only functions
```

---

## 💰 成本提醒

### Firebase 免费额度（Spark 计划）：
- Authentication: 50K 用户/月
- Firestore: 50K 读/天, 20K 写/天
- Functions: 2M 调用/月
- 出站流量: 10GB/月

**超出后才收费，前期完全免费！**

### DeepSeek API 成本：
- 约 ¥0.005/1K tokens
- 100K tokens = ¥0.5

---

## 🎉 完成！

你的 **The Private Symposium** 已成功部署！

### 接下来可以：
1. 配置自定义域名
2. 接入支付系统（Stripe/Paddle）
3. 邀请朋友测试使用
4. 开始内容营销

### 需要帮助？
查看完整文档：
- `docs/BACKEND_SETUP.md` - 后端详细配置
- `docs/BUSINESS_MODEL.md` - 商业化指南
- `docs/DEPLOY.md` - 部署完整流程

---

**恭喜！你的 AI 哲学家私董会已上线！** 🕯️
