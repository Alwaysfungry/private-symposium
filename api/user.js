// Vercel Serverless Function - User Data API
// Path: /api/user

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
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

const handler = async (req, res) => {
  if (req.method === 'GET') {
    // 获取用户数据
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: '需要用户ID' });
      }

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // 初始化新用户
        const newUser = {
          email: req.query.email || 'anonymous',
          plan: 'free',
          tokenUsage: {
            used: 0,
            limit: 100000,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await userRef.set(newUser);
        return res.status(200).json({ success: true, user: newUser, isNewUser: true });
      }

      // 更新最后登录时间
      await userRef.update({
        lastLoginAt: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        user: userDoc.data(),
        isNewUser: false,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    // 更新用户数据
    try {
      const { userId, data } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: '需要用户ID' });
      }

      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        ...data,
        updatedAt: new Date().toISOString(),
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

module.exports = allowCors(handler);
