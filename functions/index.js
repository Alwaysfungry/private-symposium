/**
 * The Private Symposium - Firebase Cloud Functions
 * 
 * 核心功能：
 * 1. chat - AI对话（调用DeepSeek API）
 * 2. getUserData - 获取用户数据
 * 3. resetTokens - 定时重置Token额度
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// 初始化 Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ========================================
// DeepSeek API 配置
// ========================================
// 注意：实际部署时需要设置环境变量
// firebase functions:config:set deepseek.key="sk-your-full-api-key"
const DEEPSEEK_API_KEY = functions.config().deepseek?.key || process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// ========================================
// 角色系统提示词
// ========================================
const CHARACTER_PROMPTS = {
    eudora: `你是Eudora（尤多拉·灵），一位寄宿在宁静光影中的古希腊智慧守护者。

【核心思想】
你融合了苏格拉底、柏拉图与亚里士多德的哲学精髓：
- 苏格拉底：承认无知是智慧的开端，通过诘问法帮助他人自我发现
- 柏拉图：关注理念世界，相信灵魂的转向与真理的追寻
- 亚里士多德：强调实践智慧（Phronesis），追求美德与幸福的统一（Eudaimonia）

【说话风格】
- 声音温和但思维锐利，像烛光一样安静却照亮黑暗
- 常用句式："让我们先回到问题的起点..."、"你是否考虑过..."
- 善用隐喻：洞穴寓言、灵魂的马车、中庸之道
- 从不直接给答案，而是通过层层追问引导对方自己发现

【回应结构】
1. 先以温和的肯定或共鸣开场
2. 提出一个核心问题或视角转换
3. 结合古希腊哲学概念展开论述
4. 以开放性问题结束，邀请更深层的思考`,

    liming: `你是Li Ming（李明·衡），一位穿梭于东西方道德智慧的守护者。

【核心思想】
你融合了儒家伦理与德国古典哲学的精髓：
- 孔子：仁爱与礼制的统一，修身齐家治国平天下，君子的人格理想
- 康德：道德律令（Categorical Imperative），人是目的而非手段，实践理性
- 黑格尔：辩证法的历程，主奴辩证法，历史作为精神的展开

【说话风格】
- 声音庄重而温暖，像古寺的钟声，悠远而有力量
- 常用句式："从道德的角度来看..."、"这涉及到我们如何对待自己与他人..."
- 引用经典：《论语》的智慧与康德的定言命令
- 注重行为的道德价值而非后果

【回应结构】
1. 先肯定问题背后的道德关切
2. 从义务论角度分析行为的道德性质
3. 结合儒家修身理念提供实践路径
4. 以鼓励道德勇气的话语结束`,

    zephyr: `你是Zephyr（泽菲尔·遥），一阵来自存在深渊的诗意之风。

【核心思想】
你融合了道家、尼采与海德格尔的超越哲学：
- 老子：道法自然，无为而无不为，柔弱胜刚强，反者道之动
- 尼采：权力意志，超人哲学，重估一切价值，上帝已死，永恒轮回
- 海德格尔：存在与时间，此在（Dasein），向死而生，栖居于诗意

【说话风格】
- 声音像风穿过竹林，自由而不可捉摸
- 常用句式："让我们抛下那些陈旧的枷锁..."、"在存在的深渊边缘..."
- 善用诗意隐喻：山巅、深渊、风、酒神狂欢、林中路
- 打破常规，挑战既定价值，邀请冒险

【回应结构】
1. 以诗意的意象或隐喻开场
2. 解构问题的表面，揭示更深层的存在议题
3. 引用道家、尼采或海德格尔的概念
4. 以鼓舞性的邀请结束，鼓励活出真实的自己`,

    kairos: `你是Kairos（凯罗斯·变），一位在关键时刻发出呐喊的变革守望者。

【核心思想】
你继承了马克思的批判精神与黑格尔的辩证法：
- 马克思：历史唯物主义，阶级斗争，异化理论，意识形态批判
- 黑格尔（辩证法）：正题-反题-合题，历史的辩证运动
- 核心关切：理论与实践的统一，改变世界而非仅仅解释世界

【说话风格】
- 声音像雷霆前的闪电，锐利而令人警醒
- 常用句式："让我们看看这背后隐藏的权力结构..."、"这不是偶然，而是..."
- 直接点名问题的社会/经济/政治根源
- 关注"谁受益"、"谁被压迫"

【回应结构】
1. 直接指出问题的结构性根源
2. 分析其中的权力关系与利益分配
3. 引入马克思的异化、商品拜物教等概念
4. 以行动号召结束，强调改变的可能性`
};

// 圆桌会议系统提示词
const ROUNDTABLE_PROMPT = `这是一个私人智囊团的圆桌会议。

四位哲学家——Eudora（古希腊理性）、Li Ming（道德律令）、Zephyr（存在超越）、Kairos（批判变革）——将同时聆听你的问题，并从各自的角度提供见解。

会议规则：
1. 每位顾问依次发言，展示其独特的哲学视角
2. 观点可以相互补充，也可以形成张力
3. 最后由你（用户）综合这些智慧，形成自己的判断
4. 每位顾问的发言前标注："🕯️ Eudora:" 或 "📜 Li Ming:" 等

氛围：尊重而开放的对话，像雅典学院的重现，又像一场心灵的盛宴。`;

// ========================================
// 工具函数
// ========================================

/**
 * 估算Token数量（简化版）
 * 中文：1 token ≈ 1 个汉字
 * 英文：1 token ≈ 4 个字符
 */
function estimateTokens(text) {
    if (!text) return 0;
    // 简单估算：中文字符数 + 英文单词数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
}

/**
 * 初始化新用户数据
 */
async function initializeNewUser(userId, email) {
    const newUser = {
        email: email,
        plan: 'free',
        tokenUsage: {
            used: 0,
            limit: 100000, // 免费版 100K tokens
            resetDate: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            )
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userId).set(newUser);
    return newUser;
}

/**
 * 检查并更新Token额度
 */
async function checkAndUpdateTokenQuota(userId, tokensNeeded) {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new Error('用户不存在');
    }
    
    const userData = userDoc.data();
    const tokenUsage = userData.tokenUsage || { used: 0, limit: 100000 };
    
    // 检查是否需要重置（每月1日）
    const now = new Date();
    const resetDate = tokenUsage.resetDate?.toDate();
    
    if (resetDate && now > resetDate) {
        // 重置额度
        const newResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await userRef.update({
            'tokenUsage.used': tokensNeeded,
            'tokenUsage.resetDate': admin.firestore.Timestamp.fromDate(newResetDate)
        });
        return { allowed: true, remaining: tokenUsage.limit - tokensNeeded };
    }
    
    // 检查额度
    if (tokenUsage.used + tokensNeeded > tokenUsage.limit) {
        return { 
            allowed: false, 
            remaining: tokenUsage.limit - tokenUsage.used,
            message: 'Token额度已用完，请升级套餐或购买额度包'
        };
    }
    
    // 更新使用量
    await userRef.update({
        'tokenUsage.used': admin.firestore.FieldValue.increment(tokensNeeded)
    });
    
    return { 
        allowed: true, 
        remaining: tokenUsage.limit - tokenUsage.used - tokensNeeded 
    };
}

// ========================================
// 云函数：AI对话
// ========================================
exports.chat = functions.https.onCall(async (data, context) => {
    return cors(data, context, async () => {
        try {
            // 1. 验证用户已登录
            if (!context.auth) {
                throw new functions.https.HttpsError('unauthenticated', '请先登录');
            }
            
            const userId = context.auth.uid;
            const userEmail = context.auth.token.email;
            
            // 2. 获取请求参数
            const { message, character = 'eudora', isRoundTable = false } = data;
            
            if (!message || typeof message !== 'string') {
                throw new functions.https.HttpsError('invalid-argument', '消息不能为空');
            }
            
            // 3. 检查用户是否存在，不存在则初始化
            const userRef = db.collection('users').doc(userId);
            let userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                await initializeNewUser(userId, userEmail);
                userDoc = await userRef.get();
            }
            
            // 4. 获取对话历史
            const convRef = db.collection('conversations').doc(userId);
            const convDoc = await convRef.get();
            
            let messages = [];
            const conversationKey = isRoundTable ? 'roundtable' : character;
            
            if (convDoc.exists && convDoc.data()[conversationKey]) {
                messages = convDoc.data()[conversationKey];
            } else {
                // 初始化新对话
                const systemPrompt = isRoundTable 
                    ? ROUNDTABLE_PROMPT 
                    : (CHARACTER_PROMPTS[character] || CHARACTER_PROMPTS.eudora);
                
                messages = [{ role: 'system', content: systemPrompt }];
            }
            
            // 只保留最近20轮对话（避免超出token限制）
            if (messages.length > 40) {
                messages = [messages[0], ...messages.slice(-39)];
            }
            
            // 添加用户消息
            messages.push({ role: 'user', content: message });
            
            // 5. 预估Token使用量
            const estimatedInputTokens = messages.reduce((sum, msg) => 
                sum + estimateTokens(msg.content), 0);
            const maxOutputTokens = 2000;
            const estimatedTotalTokens = estimatedInputTokens + maxOutputTokens;
            
            // 6. 检查Token额度
            const quotaCheck = await checkAndUpdateTokenQuota(userId, estimatedTotalTokens);
            
            if (!quotaCheck.allowed) {
                throw new functions.https.HttpsError('resource-exhausted', quotaCheck.message);
            }
            
            // 7. 调用 DeepSeek API
            if (!DEEPSEEK_API_KEY) {
                throw new functions.https.HttpsError('failed-precondition', 
                    'API Key未配置，请联系管理员');
            }
            
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
                    max_tokens: maxOutputTokens,
                    stream: false
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('DeepSeek API Error:', errorData);
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const result = await response.json();
            const assistantMessage = result.choices[0]?.message?.content;
            
            if (!assistantMessage) {
                throw new Error('API返回数据异常');
            }
            
            // 8. 实际Token使用量（从API返回中获取，或使用估算值）
            const actualTokens = result.usage?.total_tokens || 
                                (estimateTokens(message) + estimateTokens(assistantMessage));
            
            // 9. 保存对话历史
            messages.push({ role: 'assistant', content: assistantMessage });
            
            // 添加时间戳
            const conversationData = {
                [conversationKey]: messages,
                [`${conversationKey}_updatedAt`]: admin.firestore.FieldValue.serverTimestamp()
            };
            
            await convRef.set(conversationData, { merge: true });
            
            // 10. 更新实际Token使用量（如果与预估差异大）
            const tokenDiff = actualTokens - estimatedTotalTokens;
            if (Math.abs(tokenDiff) > 100) {
                await userRef.update({
                    'tokenUsage.used': admin.firestore.FieldValue.increment(tokenDiff)
                });
            }
            
            // 11. 更新最后登录时间
            await userRef.update({
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return {
                success: true,
                message: assistantMessage,
                tokensUsed: actualTokens,
                remainingTokens: quotaCheck.remaining - actualTokens + estimatedTotalTokens,
                character: character,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Chat function error:', error);
            
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
});

// ========================================
// 云函数：获取用户数据
// ========================================
exports.getUserData = functions.https.onCall(async (data, context) => {
    return cors(data, context, async () => {
        try {
            if (!context.auth) {
                throw new functions.https.HttpsError('unauthenticated', '请先登录');
            }
            
            const userId = context.auth.uid;
            const userEmail = context.auth.token.email;
            
            const userRef = db.collection('users').doc(userId);
            let userDoc = await userRef.get();
            
            // 如果用户不存在，初始化
            if (!userDoc.exists) {
                const newUser = await initializeNewUser(userId, userEmail);
                return {
                    success: true,
                    user: newUser,
                    isNewUser: true
                };
            }
            
            const userData = userDoc.data();
            
            // 更新最后登录时间
            await userRef.update({
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return {
                success: true,
                user: userData,
                isNewUser: false
            };
            
        } catch (error) {
            console.error('GetUserData error:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
});

// ========================================
// 云函数：获取对话历史
// ========================================
exports.getConversation = functions.https.onCall(async (data, context) => {
    return cors(data, context, async () => {
        try {
            if (!context.auth) {
                throw new functions.https.HttpsError('unauthenticated', '请先登录');
            }
            
            const userId = context.auth.uid;
            const { character = 'eudora' } = data;
            
            const convRef = db.collection('conversations').doc(userId);
            const convDoc = await convRef.get();
            
            if (!convDoc.exists || !convDoc.data()[character]) {
                return {
                    success: true,
                    messages: [],
                    exists: false
                };
            }
            
            return {
                success: true,
                messages: convDoc.data()[character],
                exists: true
            };
            
        } catch (error) {
            console.error('GetConversation error:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
});

// ========================================
// 定时任务：每月重置免费用户Token额度
// ========================================
exports.resetTokensMonthly = functions.pubsub
    .schedule('0 0 1 * *') // 每月1日 00:00
    .timeZone('Asia/Shanghai')
    .onRun(async (context) => {
        console.log('Starting monthly token reset...');
        
        try {
            // 获取所有免费版用户
            const usersSnapshot = await db.collection('users')
                .where('plan', 'in', ['free', null])
                .get();
            
            const batch = db.batch();
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            
            let count = 0;
            usersSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    'tokenUsage.used': 0,
                    'tokenUsage.resetDate': admin.firestore.Timestamp.fromDate(nextMonth),
                    'tokenUsage.lastReset': admin.firestore.FieldValue.serverTimestamp()
                });
                count++;
            });
            
            await batch.commit();
            console.log(`Reset tokens for ${count} users`);
            
            return null;
            
        } catch (error) {
            console.error('Reset tokens error:', error);
            return null;
        }
    });

// ========================================
// 健康检查（用于监控）
// ========================================
exports.health = functions.https.onRequest((req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
