/**
 * The Private Symposium - Vercel 版本配置
 * 
 * 使用 Vercel Serverless Functions 作为后端
 * 比 Firebase Functions 更简单，无需复杂认证
 */

// ========================================
// API 配置
// ========================================

// 本地开发时使用 localhost，生产环境使用 Vercel 域名
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

// 替换为你的 Vercel 部署地址
const VERCEL_API_URL = isDevelopment 
    ? 'http://localhost:3000/api'  // 本地开发
    : 'https://private-symposium.vercel.app/api';  // 生产环境（部署后修改）

// ========================================
// API 调用函数
// ========================================

/**
 * 调用聊天 API
 */
async function callChatAPI(message, character, userId) {
    const response = await fetch(`${VERCEL_API_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            character: character,
            userId: userId || generateUserId(),
            email: AppState.user?.email || 'anonymous',
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '请求失败');
    }

    return response.json();
}

/**
 * 获取用户数据
 */
async function fetchUserData(userId) {
    const response = await fetch(
        `${VERCEL_API_URL}/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('获取用户数据失败');
    }

    return response.json();
}

/**
 * 获取对话历史
 */
async function fetchConversation(userId, character) {
    const response = await fetch(
        `${VERCEL_API_URL}/conversation?userId=${userId}&character=${character}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('获取对话历史失败');
    }

    return response.json();
}

/**
 * 生成临时用户ID
 */
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// ========================================
// 演示模式（开发测试用）
// ========================================

const demoMode = {
    isEnabled: false,
    user: null,
    tokenUsage: {
        used: 0,
        limit: 100000,
    },

    enable() {
        this.isEnabled = true;
        this.user = {
            uid: 'demo-user-001',
            email: 'demo@example.com',
        };
        console.log('Demo mode enabled');
    },

    disable() {
        this.isEnabled = false;
        this.user = null;
    },

    async chat(message, character) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const responses = {
            eudora: `感谢你的提问。让我们深入思考一下这个问题...\n\n（演示模式：这是模拟回复，真实回复需要部署 Vercel 后端）`,
            liming: `从道德的角度来看，这确实是一个值得探讨的问题...\n\n（演示模式）`,
            zephyr: `放下那些"应该"的枷锁，让我们直面存在的深渊...\n\n（演示模式）`,
            kairos: `让我们看看这背后隐藏的权力结构...\n\n（演示模式）`
        };

        return {
            success: true,
            message: responses[character] || responses.eudora,
            tokensUsed: 500,
            remainingTokens: this.tokenUsage.limit - this.tokenUsage.used - 500
        };
    }
};

// ========================================
// 导出
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VERCEL_API_URL,
        callChatAPI,
        fetchUserData,
        fetchConversation,
        demoMode,
    };
}
