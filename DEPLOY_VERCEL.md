# The Private Symposium - Vercel 部署指南

> 5分钟搞定，无需信用卡，比 Firebase 更简单！

---

## ✅ Vercel 优势

| 对比项 | Firebase | Vercel |
|--------|----------|--------|
| 信用卡 | 必须绑定 | **不需要** |
| 结算设置 | 复杂 | **极简** |
| 部署难度 | 中等 | **超简单** |
| 免费额度 | 有 | **慷慨** |
| 国内访问 | 一般 | **较快** |

---

## 📋 部署步骤

### 第1步：创建 Firebase 服务账号（3分钟）

Vercel 需要连接 Firebase 数据库，所以要创建服务账号：

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 选择项目 **symposium**
3. 左侧菜单 → **IAM 和管理** → **服务账号**
4. 点击顶部 **"创建服务账号"**
5. 名称：`vercel-deploy`
6. 角色选择：
   - `Cloud Datastore User`（Firestore 读写）
   - `Firebase Admin`（可选，更全面）
7. 点击 **"完成"**

### 第2步：生成密钥文件

1. 在服务账号列表中找到刚创建的 `vercel-deploy`
2. 点击 **"操作"** 列的三个点 ⋮
3. 选择 **"管理密钥"**
4. 点击 **"添加密钥"** → **"创建新密钥"**
5. 选择 **JSON** 格式
6. 点击 **"创建"**，会自动下载 `.json` 文件

### 第3步：获取密钥信息

打开下载的 JSON 文件，找到以下字段：

```json
{
  "project_id": "symposium",
  "client_email": "vercel-deploy@symposium.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
}
```

**复制这三个值**，部署时要用：
- `project_id` → FIREBASE_PROJECT_ID
- `client_email` → FIREBASE_CLIENT_EMAIL  
- `private_key` → FIREBASE_PRIVATE_KEY

### 第4步：注册 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"Sign Up"**
3. 选择 **"Continue with GitHub"**（推荐）
4. 授权 GitHub 登录

### 第5步：导入项目

1. Vercel  dashboard 点击 **"Add New Project"**
2. 选择 **"Import Git Repository"**
3. 选择你的 **private-symposium** 仓库
4. 点击 **"Import"**

### 第6步：配置环境变量（关键！）

在项目配置页面，找到 **"Environment Variables"**，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DEEPSEEK_API_KEY` | `sk-0ab706...` | 你的完整 DeepSeek API Key |
| `FIREBASE_PROJECT_ID` | `symposium` | 从 JSON 文件复制 |
| `FIREBASE_CLIENT_EMAIL` | `vercel-deploy@...` | 从 JSON 文件复制 |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN...` | 从 JSON 文件复制整个 private_key |

**注意：**
- `FIREBASE_PRIVATE_KEY` 包含多行，需要完整复制（包括 `-----BEGIN` 和 `-----END`）
- Vercel 会自动处理换行符

### 第7步：部署！

1. 点击 **"Deploy"**
2. 等待 1-2 分钟
3. 看到 **"Congratulations!"** 表示成功！

**你的 API 地址：**
```
https://your-project.vercel.app/api/chat
https://your-project.vercel.app/api/user
https://your-project.vercel.app/api/conversation
```

### 第8步：更新前端配置

打开 `js/firebase-config.js`，修改 API 端点：

```javascript
// 替换为你的 Vercel 域名
const API_BASE_URL = 'https://your-project.vercel.app';

async function callChatAPI(message, character, userId) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message, 
      character, 
      userId,
      email: AppState.user?.email 
    })
  });
  return response.json();
}
```

### 第9步：部署前端到 GitHub Pages

跟之前一样：
1. push 代码到 GitHub
2. Settings → Pages → 启用
3. 访问 `https://yourname.github.io/private-symposium`

---

## 🆘 常见问题

### 部署失败，提示 "Build Failed"

**解决：**
```bash
# 本地安装依赖测试
cd symposium
npm install
```
检查是否有错误。

### 提示 "FIREBASE_PRIVATE_KEY" 格式错误

**解决：**
- 确保复制完整的 private_key（包括 `-----BEGIN PRIVATE KEY-----`）
- 不要删除任何 `\n` 字符

### API 调用返回 500 错误

**解决：**
1. Vercel Dashboard → 你的项目 → **Functions**
2. 查看错误日志
3. 通常是 Firebase 权限问题，检查服务账号角色

---

## 🎉 完成！

Vercel 部署完成！现在你有：
- ✅ 后端 API（Vercel Serverless）
- ✅ 前端（GitHub Pages）
- ✅ 数据库（Firebase Firestore）
- ✅ 无需信用卡，免费额度充足

**开始邀请朋友测试吧！** 🚀
