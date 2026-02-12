# Vercel 部署 - 快速参考

## 3 分钟快速部署

### 1. 准备 Firebase 服务账号（1分钟）

```bash
# 访问 Google Cloud Console
# https://console.cloud.google.com/iam-admin/serviceaccounts

# 1. 选择项目 symposium
# 2. 创建服务账号: vercel-deploy
# 3. 角色: Cloud Datastore User
# 4. 创建密钥(JSON格式)
# 5. 下载保存
```

### 2. 部署到 Vercel（1分钟）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd symposium
vercel --prod
```

### 3. 配置环境变量（1分钟）

在 Vercel Dashboard → 项目 → Settings → Environment Variables：

```
DEEPSEEK_API_KEY = sk-0ab706你的完整密钥
FIREBASE_PROJECT_ID = symposium
FIREBASE_CLIENT_EMAIL = vercel-deploy@symposium.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

### 4. 重新部署

```bash
vercel --prod
```

---

## 完成！

**API 地址：** `https://your-project.vercel.app/api/chat`

**测试：**
```bash
curl -X POST https://your-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好","character":"eudora","userId":"test123"}'
```

---

## 详细步骤

见 `DEPLOY_VERCEL.md`

**遇到问题？** 查看 DEPLOY_VERCEL.md 的常见问题部分
