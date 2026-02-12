# The Private Symposium - Windows 详细部署步骤

> 手把手教你 15 分钟完成部署

---

## 准备事项

在开始之前，请确保：
- [ ] Windows 电脑（Win10/Win11）
- [ ] 已安装 Node.js（如未安装，脚本会自动提示）
- [ ] DeepSeek API Key（你已提供：`sk-0ab706...`）
- [ ] Google 账号（用于 Firebase）

---

## 第一步：运行部署脚本（自动完成大部分工作）

### 方法一：双击运行（最简单）

1. 打开 `symposium` 文件夹
2. **双击 `DEPLOY_SIMPLE.bat`**
3. 按提示操作：
   - 会打开浏览器让你登录 Google → 登录后关闭浏览器回到命令窗口
   - 输入 DeepSeek API Key
   - 等待部署完成

### 方法二：PowerShell（功能更全）

1. 右键点击 `DEPLOY_WINDOWS.ps1`
2. 选择「使用 PowerShell 运行」
3. 如果提示执行策略，输入：`Y`
4. 按提示完成部署

**脚本会自动完成：**
- ✅ 检查 Node.js
- ✅ 安装 Firebase CLI
- ✅ 登录 Firebase
- ✅ 安装依赖
- ✅ 设置 API Key
- ✅ 部署云函数

---

## 第二步：创建 Firebase 项目（如果脚本提示未创建）

如果脚本提示「未找到项目」，需要手动创建：

1. 访问 [console.firebase.google.com](https://console.firebase.google.com)
2. 点击「创建项目」
3. 项目名称：`private-symposium-prod`（或你喜欢的）
4. 关闭 Google Analytics
5. 等待创建完成
6. 在命令窗口中运行：
   ```bash
   firebase use --add
   ```
   选择你刚创建的项目

---

## 第三步：获取 Firebase 配置（关键步骤）

部署成功后，需要获取配置信息并更新到前端：

### 3.1 获取配置

1. 访问 [console.firebase.google.com](https://console.firebase.google.com)
2. 进入你的项目
3. 点击左上角 ⚙️「项目设置」
4. 向下滚动到「你的应用」
5. 点击 `</>` 图标（添加 Web 应用）
6. 应用昵称：`symposium-web`
7. 点击「注册应用」
8. **复制** `firebaseConfig` 代码块，类似：

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

### 3.2 更新前端配置

1. 打开 `symposium/js/firebase-config.js`
2. 找到 `const firebaseConfig = {`
3. **用你复制的配置替换整个对象**
4. 保存文件

---

## 第四步：配置 Firestore 数据库

### 4.1 启用 Firestore

1. 在 Firebase Console 左侧菜单点击「Firestore Database」
2. 点击「创建数据库」
3. 选择「以测试模式开始」
4. 区域选择：`asia-east1`（台湾，离大陆最近）
5. 点击「启用」

### 4.2 配置安全规则

1. 点击「规则」标签
2. 删除默认规则
3. 打开 `symposium/firestore.rules` 文件
4. **复制全部内容** 粘贴到 Firebase
5. 点击「发布」

---

## 第五步：部署前端到 GitHub Pages

### 5.1 创建 GitHub 仓库

1. 访问 [github.com](https://github.com)
2. 登录后点击右上角 `+` → `New repository`
3. 仓库名：`private-symposium`
4. 选择 `Public`（公开）
5. 勾选 `Add a README file`
6. 点击「Create repository」

### 5.2 上传代码

打开命令提示符或 PowerShell：

```bash
# 进入项目目录
cd symposium

# 初始化 git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 关联远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/private-symposium.git

# 推送
git branch -M main
git push -u origin main
```

### 5.3 启用 GitHub Pages

1. 在 GitHub 仓库页面点击「Settings」
2. 左侧点击「Pages」
3. Source 选择「Deploy from a branch」
4. Branch 选择「main」/「root」
5. 点击「Save」
6. 等待几分钟，访问显示的链接

---

## 第六步：验证部署

打开浏览器访问：
```
https://YOUR_USERNAME.github.io/private-symposium/symposium/
```

### 测试清单：
- [ ] 能看到登录界面
- [ ] 点击「登录/注册」，输入邮箱密码
- [ ] 成功登录后显示头像和 Token 用量
- [ ] 选择角色，发送消息
- [ ] 收到 AI 回复

---

## 常见问题

### Q: 脚本提示 "Firebase CLI 安装失败"

**解决：**
1. 以管理员身份运行 PowerShell
2. 执行：`npm install -g firebase-tools`
3. 如果还是失败，访问 https://firebase.google.com/docs/cli 手动下载安装

### Q: 部署时提示 "Project not found"

**解决：**
需要先创建 Firebase 项目：
```bash
firebase use --add
```
然后按提示选择或创建项目

### Q: 提示 "Please enable billing"

**解决：**
1. 访问 Firebase Console
2. 点击左侧「升级」或「Spark 计划」
3. 启用 Blaze 计划（按量付费，有免费额度）
4. 需要绑定信用卡，但免费额度内不收费

### Q: 网页打开后无法登录

**检查：**
1. Firebase 配置是否正确？（apiKey 等）
2. Firestore 规则是否已发布？
3. Authentication 是否启用了「邮箱/密码」？

### Q: 登录成功但无法对话

**检查：**
1. 云函数是否部署成功？运行：`firebase functions:log --tail`
2. DeepSeek API Key 是否正确设置？
3. Token 额度是否用完？

---

## 下一步

部署成功后，你可以：
1. 配置自定义域名
2. 接入支付系统（Stripe/Paddle）
3. 邀请朋友测试
4. 开始内容营销

详细商业化指南：`docs/BUSINESS_MODEL.md`

---

## 需要帮助？

如果遇到问题：
1. 查看完整文档：`docs/BACKEND_SETUP.md`
2. 检查 Firebase 日志：`firebase functions:log --tail`
3. 在 GitHub Issues 提问

**祝你部署顺利！** 🚀
