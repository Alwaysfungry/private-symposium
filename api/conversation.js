// Vercel Serverless Function - Conversation API
// Path: /api/conversation

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
    // 获取对话历史
    try {
      const { userId, character = 'eudora' } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: '需要用户ID' });
      }

      const convRef = db.collection('conversations').doc(userId);
      const convDoc = await convRef.get();

      if (!convDoc.exists || !convDoc.data()[character]) {
        return res.status(200).json({ 
          success: true, 
          messages: [], 
          exists: false 
        });
      }

      return res.status(200).json({
        success: true,
        messages: convDoc.data()[character],
        exists: true,
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    // 保存对话历史（通常由 chat.js 自动处理，这里提供备用）
    try {
      const { userId, character, messages } = req.body;
      
      if (!userId || !character || !messages) {
        return res.status(400).json({ error: '参数不完整' });
      }

      const convRef = db.collection('conversations').doc(userId);
      await convRef.set({
        [character]: messages,
        [`${character}_updatedAt`]: new Date().toISOString(),
      }, { merge: true });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Save conversation error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

module.exports = allowCors(handler);
