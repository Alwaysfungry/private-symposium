// Vercel Serverless Function - Chat API
// Path: /api/chat

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (使用环境变量)
if (!initializeApp.length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (e) {
    // Already initialized
  }
}

const db = getFirestore();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 角色系统提示词
const CHARACTER_PROMPTS = {
  eudora: `你是Eudora（尤多拉·灵），融合了苏格拉底、柏拉图与亚里士多德的哲学精髓。你温和追问，引导对方自我发现。说话风格：温和但思维锐利，善用反问和隐喻。`,
  
  liming: `你是Li Ming（李明·衡），融合了孔子、康德与黑格尔的道德智慧。你庄重而温暖，强调责任与修养。说话风格：引用经典，注重道德价值。`,
  
  zephyr: `你是Zephyr（泽菲尔·遥），融合了老子、尼采与海德格尔的存在哲学。你诗意自由，打破常规。说话风格：诗意隐喻，挑战既定价值。`,
  
  kairos: `你是Kairos（凯罗斯·变），继承了马克思的批判精神。你锐利真诚，解剖权力结构。说话风格：直接点名结构性根源。`
};

// CORS 处理
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// 主处理函数
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, character = 'eudora', userId, isRoundTable = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    if (!userId) {
      return res.status(400).json({ error: '需要用户ID' });
    }

    // 检查用户Token额度
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    let userData;
    if (!userDoc.exists) {
      // 初始化新用户
      userData = {
        email: req.body.email || 'anonymous',
        plan: 'free',
        tokenUsage: { used: 0, limit: 100000 },
        createdAt: new Date().toISOString(),
      };
      await userRef.set(userData);
    } else {
      userData = userDoc.data();
    }

    const tokenUsage = userData.tokenUsage || { used: 0, limit: 100000 };
    
    if (tokenUsage.used >= tokenUsage.limit) {
      return res.status(429).json({ 
        error: 'Token额度已用完，请升级套餐',
        code: 'QUOTA_EXCEEDED'
      });
    }

    // 获取对话历史
    const convRef = db.collection('conversations').doc(userId);
    const convDoc = await convRef.get();
    
    let messages = [];
    const conversationKey = isRoundTable ? 'roundtable' : character;
    
    if (convDoc.exists && convDoc.data()[conversationKey]) {
      messages = convDoc.data()[conversationKey];
    } else {
      messages = [{ 
        role: 'system', 
        content: CHARACTER_PROMPTS[character] || CHARACTER_PROMPTS.eudora 
      }];
    }

    // 只保留最近20轮
    if (messages.length > 40) {
      messages = [messages[0], ...messages.slice(-39)];
    }

    messages.push({ role: 'user', content: message });

    // 调用 DeepSeek API
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'API Key 未配置' });
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const result = await response.json();
    const assistantMessage = result.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('API返回数据异常');
    }

    // 保存对话
    messages.push({ role: 'assistant', content: assistantMessage });
    await convRef.set({ 
      [conversationKey]: messages,
      [`${conversationKey}_updatedAt`]: new Date().toISOString()
    }, { merge: true });

    // 更新Token使用量
    const tokensUsed = result.usage?.total_tokens || Math.ceil((message.length + assistantMessage.length) / 2);
    await userRef.update({
      'tokenUsage.used': tokenUsage.used + tokensUsed,
      'tokenUsage.lastUpdated': new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: assistantMessage,
      tokensUsed: tokensUsed,
      remainingTokens: tokenUsage.limit - tokenUsage.used - tokensUsed,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      error: error.message || '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = allowCors(handler);
