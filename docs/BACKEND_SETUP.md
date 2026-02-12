# The Private Symposium - 后端部署指南

> 将前端应用升级为完整的 SaaS 服务

---

## 🏗️ 架构选择

### 推荐方案：Firebase（最快上线）

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Pages                           │
│                   （前端静态托管 - 免费）                      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Authentication │  │ Cloud Firestore │  │ Cloud Functions  │  │
│  │    (用户认证)    │  │   (数据存储)    │  │    (API代理)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│                   ┌──────────────┐                          │
│                   │   DeepSeek   │                          │
│                   │     API      │                          │
│                   └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 备选方案对比

| 方案 | 优点 | 缺点 | 适合 |
|------|------|------|------|
| **Firebase** | 一站式、文档全、免费额度多 |  vendor lock-in | 快速启动 |
| **Supabase** | 开源、PostgreSQL | 生态稍弱 | 技术爱好者 |
| **Vercel + PlanetScale** | 现代、快速 | 需组合多个服务 | 全栈开发者 |
| **阿里云/腾讯云** | 国内访问快 | 配置复杂 | 国内大规模用户 |

---

## 📋 部署清单

### 第一步：创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击「创建项目」
3. 输入项目名称：`private-symposium-prod`
4. 关闭 Google Analytics（可选）
5. 等待项目创建完成

### 第二步：启用服务

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录
firebase login

# 初始化项目
firebase init

# 选择以下服务：
# ✔ Firestore (数据库)
# ✔ Functions (云函数)
# ✔ Hosting (可选，如果用GitHub Pages则不需要)
```

### 第三步：配置 Authentication

在 Firebase Console 中：

1. 点击左侧「Authentication」
2. 点击「开始使用」
3. 启用「邮箱/密码」登录
4. （可选）启用「Google」登录

### 第四步：配置 Firestore 数据库

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /conversations/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Token使用记录
    match /tokenUsage/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // 仅通过云函数写入
    }
  }
}
```

### 第五步：部署云函数（API代理）

```bash
# 进入functions目录
cd functions

# 安装依赖
npm install

# 部署
firebase deploy --only functions
```

云函数代码见：`functions/index.js`（下方提供完整代码）

---

## 💻 云函数代码

创建文件 `functions/index.js`：

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// DeepSeek API配置（从环境变量读取）
const DEEPSEEK_API_KEY = functions.config().deepseek.key;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 角色系统提示词映射
const CHARACTER_PROMPTS = {
    eudora: `你是Eudora（尤多拉·灵）...`, // 完整提示词
    liming: `你是Li Ming（李明·衡）...`,
    zephyr: `你是Zephyr（泽菲尔·遥）...`,
    kairos: `你是Kairos（凯罗斯·变）...`
};

// 主聊天云函数
exports.chat = functions.https.onCall(async (data, context) => {
    // 1. 验证用户已登录
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '请先登录');
    }
    
    const userId = context.auth.uid;
    const { message, character = 'eudora' } = data;
    
    // 2. 检查用户Token额度
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用户不存在');
    }
    
    const userData = userDoc.data();
    const { tokenUsage = { used: 0, limit: 100000 }, plan = 'free' } = userData;
    
    if (tokenUsage.used >= tokenUsage.limit) {
        throw new functions.https.HttpsError('resource-exhausted', 
            'Token额度已用完，请升级套餐');
    }
    
    // 3. 获取对话历史
    const convRef = db.collection('conversations').doc(userId);
    const convDoc = await convRef.get();
    let messages = [];
    
    if (convDoc.exists && convDoc.data()[character]) {
        messages = convDoc.data()[character];
    } else {
        // 初始化新对话
        messages = [
            { role: 'system', content: CHARACTER_PROMPTS[character] }
        ];
    }
    
    // 添加用户消息
    messages.push({ role: 'user', content: message });
    
    // 4. 调用 DeepSeek API
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const result = await response.json();
        const assistantMessage = result.choices[0].message.content;
        
        // 估算Token使用量（简单估算：中文字符数/2）
        const tokensUsed = Math.ceil((message.length + assistantMessage.length) / 2);
        
        // 5. 保存对话历史
        messages.push({ role: 'assistant', content: assistantMessage });
        await convRef.set({ [character]: messages }, { merge: true });
        
        // 6. 更新Token使用量
        await userRef.update({
            'tokenUsage.used': admin.firestore.FieldValue.increment(tokensUsed),
            'tokenUsage.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
        });
        
        return {
            message: assistantMessage,
            tokensUsed: tokensUsed,
            remainingTokens: tokenUsage.limit - tokenUsage.used - tokensUsed
        };
        
    } catch (error) {
        console.error('Chat error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 获取用户数据云函数
exports.getUserData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '请先登录');
    }
    
    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
        // 初始化新用户
        const newUser = {
            email: context.auth.token.email,
            plan: 'free',
            tokenUsage: {
                used: 0,
                limit: 100000,
                resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(userId).set(newUser);
        return newUser;
    }
    
    return userDoc.data();
});

// 升级套餐云函数（需接入支付后实现）
exports.upgradePlan = functions.https.onCall(async (data, context) => {
    // TODO: 接入 Stripe/Paddle 支付
    // 验证支付成功后更新用户套餐
});

// 定时任务：每月重置Token额度（仅免费版）
exports.resetTokens = functions.pubsub.schedule('0 0 1 * *')
    .timeZone('Asia/Shanghai')
    .onRun(async (context) => {
        const usersSnapshot = await db.collection('users')
            .where('plan', '==', 'free')
            .get();
        
        const batch = db.batch();
        usersSnapshot.forEach(doc => {
            batch.update(doc.ref, {
                'tokenUsage.used': 0,
                'tokenUsage.resetDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
        });
        
        await batch.commit();
        console.log(`Reset tokens for ${usersSnapshot.size} users`);
    });
```

创建 `functions/package.json`：

```json
{
  "name": "symposium-functions",
  "version": "1.0.0",
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0"
  },
  "engines": {
    "node": "18"
  }
}
```

---

## 🔐 环境变量配置

```bash
# 设置 DeepSeek API Key
firebase functions:config:set deepseek.key="sk-your-api-key-here"

# 设置其他密钥（如Stripe）
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

---

## 🌐 前端配置

修改 `symposium/js/config.js`：

```javascript
// Firebase 配置（从 Firebase Console 获取）
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "private-symposium-prod.firebaseapp.com",
    projectId: "private-symposium-prod",
    storageBucket: "private-symposium-prod.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 云函数实例
const functions = firebase.functions();

// API调用改为云函数
async function callCloudAPI(message, character) {
    const chatFunction = functions.httpsCallable('chat');
    const result = await chatFunction({ message, character });
    return result.data;
}
```

---

## 📊 监控与日志

### 查看日志

```bash
# 实时查看函数日志
firebase functions:log --tail

# 查看特定期限的日志
firebase functions:log --start-time 2024-01-01
```

### 设置告警

在 Firebase Console：
1. 点击「Monitoring」
2. 设置以下告警：
   - 错误率 > 5%
   - 响应时间 > 3秒
   - 云函数执行次数异常

---

## 💰 费用预估

### Firebase 免费额度（Spark计划）

| 服务 | 免费额度 | 超出价格 |
|------|---------|---------|
| Authentication | 50K 用户/月 | $0.01/验证 |
| Firestore | 50K 读/天, 20K 写/天 | $0.06/100K 读 |
| Functions | 2M 调用/月 | $0.40/百万 |
| Hosting | 10GB/月 | $0.15/GB |

### 预估月费（1000活跃用户）

| 项目 | 估算费用 |
|------|---------|
| Firebase (Blaze计划) | ¥50-100 |
| DeepSeek API | ¥300-500 |
| **总计** | **¥350-600** |
| 收入（按5%付费转化率） | ¥1,500+ |
| **利润** | **¥900+** |

---

## ✅ 部署检查清单

部署前确认：

- [ ] Firebase 项目已创建
- [ ] Authentication 已启用
- [ ] Firestore 数据库规则已配置
- [ ] 云函数已部署
- [ ] DeepSeek API Key 已设置
- [ ] 前端 Firebase 配置已更新
- [ ] GitHub Pages 已配置 CORS
- [ ] 支付系统已测试
- [ ] 错误处理已完善
- [ ] 监控告警已设置

---

## 🆘 常见问题

### Q: CORS 错误怎么办？

在 `functions/index.js` 开头添加：

```javascript
const cors = require('cors')({ origin: true });

exports.chat = functions.https.onCall((data, context) => {
    return cors(req, res, async () => {
        // ... 函数逻辑
    });
});
```

### Q: 如何限制特定域名访问？

```javascript
// 在云函数中验证来源
const allowedOrigins = ['https://yourdomain.github.io'];
const origin = context.rawRequest.headers.origin;

if (!allowedOrigins.includes(origin)) {
    throw new functions.https.HttpsError('permission-denied', '非法来源');
}
```

### Q: 冷启动慢怎么办？

```javascript
// 设置最小实例数
exports.chat = functions
    .runWith({
        minInstances: 1,  // 保持1个实例常驻
        memory: '256MB'
    })
    .https.onCall(async (data, context) => {
        // ...
    });
```

---

**下一步**：配置支付系统 → 测试完整流程 → 软启动 → 正式推广
