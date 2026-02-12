/**
 * The Private Symposium - Firebase Configuration
 * 
 * 使用说明：
 * 1. 在 Firebase Console 创建项目
 * 2. 复制配置信息替换下方的占位符
 * 3. 部署后前端将自动连接到你的后端
 */

// ========================================
// Firebase 配置（需要你填写）
// ========================================
const firebaseConfig = {
    // TODO: 替换为你自己的 Firebase 配置
    // 从 Firebase Console → 项目设置 → 常规 → 你的应用 → SDK 配置
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ========================================
// 初始化 Firebase（如果可用）
// ========================================
let firebaseApp = null;
let firebaseAuth = null;
let firebaseFunctions = null;
let firebaseFirestore = null;

// 检查 Firebase SDK 是否已加载
if (typeof firebase !== 'undefined') {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        firebaseFunctions = firebase.functions();
        firebaseFirestore = firebase.firestore();
        
        // 开发环境可使用模拟器
        if (location.hostname === "localhost") {
            // firebaseFunctions.useEmulator("localhost", 5001);
            // firebaseFirestore.useEmulator("localhost", 8080);
            // firebaseAuth.useEmulator("http://localhost:9099");
        }
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
} else {
    console.warn('Firebase SDK not loaded. Running in demo mode.');
}

// ========================================
// 认证相关函数
// ========================================

/**
 * 用户注册/登录（邮箱+密码）
 * 如果用户不存在则自动创建
 */
async function signInWithEmail(email, password) {
    if (!firebaseAuth) {
        throw new Error('Firebase Auth 未初始化');
    }
    
    try {
        // 尝试登录
        const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
        return { user: result.user, isNewUser: false };
    } catch (error) {
        // 用户不存在，尝试注册
        if (error.code === 'auth/user-not-found') {
            const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            return { user: result.user, isNewUser: true };
        }
        throw error;
    }
}

/**
 * 退出登录
 */
async function signOut() {
    if (!firebaseAuth) return;
    await firebaseAuth.signOut();
}

/**
 * 监听登录状态变化
 */
function onAuthStateChanged(callback) {
    if (!firebaseAuth) {
        callback(null);
        return () => {};
    }
    return firebaseAuth.onAuthStateChanged(callback);
}

// ========================================
// 云函数调用
// ========================================

/**
 * 调用聊天云函数
 */
async function callChatAPI(message, character, isRoundTable = false) {
    if (!firebaseFunctions) {
        throw new Error('Firebase Functions 未初始化');
    }
    
    const chatFunction = firebaseFunctions.httpsCallable('chat');
    const result = await chatFunction({
        message: message,
        character: character,
        isRoundTable: isRoundTable
    });
    
    return result.data;
}

/**
 * 获取用户数据
 */
async function fetchUserData() {
    if (!firebaseFunctions) {
        throw new Error('Firebase Functions 未初始化');
    }
    
    const getUserDataFunction = firebaseFunctions.httpsCallable('getUserData');
    const result = await getUserDataFunction({});
    return result.data;
}

/**
 * 获取对话历史
 */
async function fetchConversation(character) {
    if (!firebaseFunctions) {
        throw new Error('Firebase Functions 未初始化');
    }
    
    const getConversationFunction = firebaseFunctions.httpsCallable('getConversation');
    const result = await getConversationFunction({ character: character });
    return result.data;
}

// ========================================
// 演示模式（Firebase未配置时使用）
// ========================================

const demoUser = {
    uid: 'demo-user-001',
    email: 'demo@example.com',
    displayName: '演示用户'
};

const demoMode = {
    isEnabled: false,
    user: null,
    tokenUsage: {
        used: 0,
        limit: 100000,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    
    enable() {
        this.isEnabled = true;
        this.user = demoUser;
        console.log('Demo mode enabled');
    },
    
    disable() {
        this.isEnabled = false;
        this.user = null;
    },
    
    async chat(message, character) {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟回复
        const responses = {
            eudora: `感谢你的提问。让我们深入思考一下这个问题...\n\n（演示模式：这是模拟回复）`,
            liming: `从道德的角度来看，这确实是一个值得探讨的问题...\n\n（演示模式：这是模拟回复）`,
            zephyr: `放下那些"应该"的枷锁，让我们直面存在的深渊...\n\n（演示模式：这是模拟回复）`,
            kairos: `让我们看看这背后隐藏的权力结构...\n\n（演示模式：这是模拟回复）`
        };
        
        return {
            success: true,
            message: responses[character] || responses.eudora,
            tokensUsed: 500,
            remainingTokens: this.tokenUsage.limit - this.tokenUsage.used - 500
        };
    }
};

// 如果 Firebase 未加载，启用演示模式
if (!firebaseAuth) {
    console.log('Firebase not available, demo mode ready');
}

// ========================================
// 导出模块
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        firebaseApp,
        firebaseAuth,
        firebaseFunctions,
        firebaseFirestore,
        signInWithEmail,
        signOut,
        onAuthStateChanged,
        callChatAPI,
        fetchUserData,
        fetchConversation,
        demoMode
    };
}
