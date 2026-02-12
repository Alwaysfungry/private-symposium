/**
 * The Private Symposium - 商业版核心应用逻辑
 * 
 * V2.0 - SaaS 架构
 * - 用户认证系统（Firebase Auth）
 * - 云端数据存储（Firestore）
 * - 后端API代理（Cloud Functions）
 * - Token计费系统
 */

// ========================================
// 应用状态管理
// ========================================
const AppState = {
    currentCharacter: 'eudora',
    isRoundTableMode: false,
    isDarkTheme: false,
    isGenerating: false,
    conversations: {},
    
    // 用户状态
    user: null,
    userPlan: 'free', // free, lite, pro, unlimited
    tokenUsage: {
        used: 0,
        limit: 100000, // 免费版100K tokens
        resetDate: null
    },
    
    // API配置（从后端获取，不在前端暴露）
    apiConfig: {
        endpoint: null, // 从后端动态获取
        token: null     // 从后端动态获取
    }
};

// ========================================
// 初始化与加载
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    bindEvents();
    applyTheme();
    
    // 检查用户登录状态（Firebase Auth）
    checkAuthState();
});

// 检查认证状态
function checkAuthState() {
    // 使用 Firebase Auth
    if (typeof onAuthStateChanged === 'function') {
        onAuthStateChanged(async (user) => {
            if (user) {
                AppState.user = user;
                
                try {
                    // 获取用户数据
                    const userData = await fetchUserData();
                    if (userData.success) {
                        AppState.userPlan = userData.user.plan || 'free';
                        AppState.tokenUsage = userData.user.tokenUsage || { used: 0, limit: 100000 };
                        await loadCloudConversations(user.uid);
                    }
                } catch (error) {
                    console.error('Failed to load user data:', error);
                }
                
                updateAuthUI();
                updateTokenDisplay();
            } else {
                AppState.user = null;
                updateAuthUI();
            }
        });
    } else {
        // 显示登录按钮（等待配置）
        updateAuthUI();
    }
}

// 加载用户数据（预留接口）
async function loadUserData(userId) {
    // TODO: 从 Firestore 加载：
    // - 用户套餐信息
    // - Token使用情况
    // - 聊天记录
    // - 设置偏好
    
    // 模拟数据
    AppState.userPlan = 'free';
    AppState.tokenUsage = {
        used: 0,
        limit: 100000,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    
    updateAuthUI();
    updateTokenDisplay();
    
    // 加载云端对话历史
    await loadCloudConversations(userId);
}

// ========================================
// 用户认证 UI
// ========================================
function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    
    if (AppState.user) {
        userInfo.style.display = 'flex';
        loginBtn.style.display = 'none';
        
        document.getElementById('userAvatar').textContent = 
            AppState.user.displayName?.[0] || AppState.user.email[0].toUpperCase();
        document.getElementById('userName').textContent = 
            AppState.user.displayName || AppState.user.email.split('@')[0];
        
        const planNames = {
            free: '免费版',
            lite: '轻享版',
            pro: '畅聊版',
            unlimited: '专业版'
        };
        document.getElementById('userPlan').textContent = planNames[AppState.userPlan] || '免费版';
    } else {
        userInfo.style.display = 'none';
        loginBtn.style.display = 'flex';
    }
}

function updateTokenDisplay() {
    const tokenUsage = document.getElementById('tokenUsage');
    if (tokenUsage && AppState.user) {
        const percent = (AppState.tokenUsage.used / AppState.tokenUsage.limit * 100).toFixed(1);
        tokenUsage.textContent = `已用 ${percent}%`;
        tokenUsage.style.color = percent > 80 ? '#ef4444' : 'var(--accent-eudora)';
    }
}

// 登录弹窗
function openAuthModal() {
    document.getElementById('authModal').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// 登录/注册
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('请填写邮箱和密码');
        return;
    }
    
    try {
        // 使用 Firebase Auth
        if (typeof signInWithEmail === 'function') {
            const result = await signInWithEmail(email, password);
            AppState.user = result.user;
            closeAuthModal();
            
            // 获取用户数据
            const userData = await fetchUserData();
            if (userData.success) {
                AppState.userPlan = userData.user.plan || 'free';
                AppState.tokenUsage = userData.user.tokenUsage || { used: 0, limit: 100000 };
                updateAuthUI();
                updateTokenDisplay();
                
                // 加载对话历史
                await loadCloudConversations(result.user.uid);
            }
        } else {
            // 演示模式
            alert('Firebase 未配置，当前为演示模式\n\n请先按照 docs/BACKEND_SETUP.md 部署后端');
            
            // 启用演示模式
            if (typeof demoMode !== 'undefined') {
                demoMode.enable();
                AppState.user = demoMode.user;
                AppState.userPlan = 'free';
                AppState.tokenUsage = demoMode.tokenUsage;
                updateAuthUI();
                closeAuthModal();
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('登录失败：' + (error.message || '未知错误'));
    }
}

// 退出登录
async function handleLogout() {
    try {
        if (typeof signOut === 'function') {
            await signOut();
        }
        
        // 禁用演示模式
        if (typeof demoMode !== 'undefined') {
            demoMode.disable();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    AppState.user = null;
    AppState.conversations = {};
    updateAuthUI();
    initializeUI(); // 重置UI到初始状态
}

// ========================================
// API调用（通过后端代理）
// ========================================
async function callAPI() {
    // 检查Token额度
    if (AppState.tokenUsage.used >= AppState.tokenUsage.limit) {
        throw new Error('Token额度已用完，请升级套餐或购买额外额度');
    }
    
    // 使用 Firebase Cloud Functions
    if (typeof callChatAPI === 'function') {
        try {
            const result = await callChatAPI(
                AppState.conversations[AppState.currentCharacter].slice(-1)[0]?.content || '',
                AppState.currentCharacter,
                AppState.isRoundTableMode
            );
            
            if (result.success) {
                // 更新Token使用量
                await recordTokenUsage(result.tokensUsed);
                return result.message;
            } else {
                throw new Error(result.message || '请求失败');
            }
        } catch (error) {
            console.error('Cloud function error:', error);
            throw error;
        }
    }
    
    // 如果 Firebase 不可用，使用演示模式
    if (typeof demoMode !== 'undefined' && demoMode.isEnabled) {
        const result = await demoMode.chat(
            AppState.conversations[AppState.currentCharacter].slice(-1)[0]?.content || '',
            AppState.currentCharacter
        );
        return result.message;
    }
    
    throw new Error('后端服务未配置，请先部署 Firebase 云函数\n\n详见文档：docs/BACKEND_SETUP.md');
}

// ========================================
// Token计费
// ========================================
async function recordTokenUsage(tokens) {
    if (!AppState.user) return;
    
    AppState.tokenUsage.used += tokens;
    updateTokenDisplay();
    
    // Token使用量已在云函数中自动更新
    // 如果需要，可以定期从后端同步最新数据
}

// ========================================
// 云端数据存储
// ========================================
async function loadCloudConversations(userId) {
    if (!userId) return;
    
    try {
        // 从云端加载所有角色的对话历史
        const characters = ['eudora', 'liming', 'zephyr', 'kairos', 'roundtable'];
        
        for (const character of characters) {
            try {
                if (typeof fetchConversation === 'function') {
                    const result = await fetchConversation(character);
                    if (result.success && result.exists && result.messages.length > 0) {
                        AppState.conversations[character] = result.messages;
                    }
                }
            } catch (error) {
                console.warn(`Failed to load conversation for ${character}:`, error);
            }
        }
        
        // 重新渲染当前角色的对话
        renderConversation();
    } catch (error) {
        console.error('Failed to load conversations:', error);
        // 失败时使用本地默认对话
        initializeDefaultConversations();
    }
}

async function saveCloudConversations() {
    // 云端保存已在云函数中自动完成
    // 如果需要本地备份，可以保存到 localStorage
    localStorage.setItem('symposium_conversations_backup', JSON.stringify(AppState.conversations));
}

// ========================================
// UI 初始化与更新（复用原有代码）
// ========================================
function initializeUI() {
    renderCharacterList();
    updateChatHeader();
    renderWelcomeMessage();
    initializeDefaultConversations();
    renderConversation();
}

function initializeDefaultConversations() {
    // 为每个角色初始化默认对话
    Object.keys(CHARACTERS).forEach(id => {
        if (!AppState.conversations[id]) {
            const enhancedPrompt = typeof enhanceSystemPromptWithKnowledge === 'function' 
                ? enhanceSystemPromptWithKnowledge(CHARACTERS[id].systemPrompt, id)
                : CHARACTERS[id].systemPrompt;
            
            AppState.conversations[id] = [
                { role: 'system', content: enhancedPrompt },
                { role: 'assistant', content: CHARACTERS[id].greeting }
            ];
        }
    });
    
    // 初始化圆桌会议
    if (!AppState.conversations['roundtable']) {
        AppState.conversations['roundtable'] = [
            { role: 'system', content: generateRoundTableSystemPrompt() },
            { role: 'assistant', content: ROUNDTABLE_CONFIG.greeting }
        ];
    }
}

function generateRoundTableSystemPrompt() {
    let prompt = ROUNDTABLE_CONFIG.systemPrompt + '\n\n【顾问角色定义】\n\n';
    Object.values(CHARACTERS).forEach(char => {
        prompt += `${char.avatar} ${char.name} (${char.nameCN}): ${char.school}\n`;
        prompt += `核心关切：${char.keyConcepts.slice(0, 3).join('、')}\n`;
        prompt += `风格：${char.personality.voice}\n\n`;
    });
    prompt += `\n【圆桌会议发言规则】\n`;
    prompt += `1. 当用户提出问题时，四位顾问依次发言\n`;
    prompt += `2. 每位顾问的发言前标注："${CHARACTERS.eudora.avatar} Eudora:" 等\n`;
    prompt += `3. 顾问之间可以形成对话和辩论\n`;
    prompt += `4. 最后邀请用户综合这些观点形成自己的判断\n`;
    prompt += `5. 保持尊重和开放的氛围，像雅典学院的重现\n`;
    return prompt;
}

function renderCharacterList() {
    const container = document.getElementById('characterList');
    container.innerHTML = '';
    
    Object.values(CHARACTERS).forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.character = char.id;
        if (char.id === AppState.currentCharacter && !AppState.isRoundTableMode) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <div class="character-avatar">${char.avatar}</div>
            <div class="character-info">
                <div class="character-name">${char.name}</div>
                <div class="character-role">${char.school}</div>
            </div>
        `;
        
        card.addEventListener('click', () => selectCharacter(char.id));
        container.appendChild(card);
    });
    
    const roundtableCard = document.getElementById('roundtableCard');
    if (AppState.isRoundTableMode) {
        roundtableCard.classList.add('active');
    } else {
        roundtableCard.classList.remove('active');
    }
}

function selectCharacter(characterId) {
    saveCloudConversations();
    AppState.currentCharacter = characterId;
    AppState.isRoundTableMode = false;
    renderCharacterList();
    updateChatHeader();
    renderWelcomeMessage();
    renderConversation();
}

function selectRoundTable() {
    saveCloudConversations();
    AppState.isRoundTableMode = true;
    AppState.currentCharacter = 'roundtable';
    renderCharacterList();
    updateChatHeader();
    renderWelcomeMessage();
    renderConversation();
}

function updateChatHeader() {
    let avatar, name, role;
    
    if (AppState.isRoundTableMode) {
        avatar = ROUNDTABLE_CONFIG.avatar;
        name = ROUNDTABLE_CONFIG.name;
        role = ROUNDTABLE_CONFIG.description;
    } else {
        const char = CHARACTERS[AppState.currentCharacter];
        avatar = char.avatar;
        name = char.name;
        role = char.school;
    }
    
    document.getElementById('headerAvatar').textContent = avatar;
    document.getElementById('headerName').textContent = name;
    document.getElementById('headerRole').textContent = role;
}

function renderWelcomeMessage() {
    let avatar, title, text, quote;
    
    if (AppState.isRoundTableMode) {
        avatar = ROUNDTABLE_CONFIG.avatar;
        title = ROUNDTABLE_CONFIG.name;
        text = ROUNDTABLE_CONFIG.greeting;
        quote = '';
    } else {
        const char = CHARACTERS[AppState.currentCharacter];
        avatar = char.avatar;
        title = char.nameCN;
        text = char.greeting;
        
        if (typeof getRandomQuote === 'function') {
            const randomQuote = getRandomQuote(AppState.currentCharacter);
            if (randomQuote) {
                quote = `${randomQuote.quote}\n\n—— ${randomQuote.philosopher}《${randomQuote.work}》`;
            } else {
                quote = char.quote;
            }
        } else {
            quote = char.quote;
        }
    }
    
    document.getElementById('welcomeAvatar').textContent = avatar;
    document.getElementById('welcomeTitle').textContent = title;
    document.getElementById('welcomeText').textContent = text;
    document.getElementById('welcomeQuote').textContent = quote;
    document.getElementById('welcomeQuote').style.display = quote ? 'block' : 'none';
}

function renderConversation() {
    const container = document.getElementById('messagesContainer');
    const conversation = AppState.conversations[AppState.currentCharacter] || [];
    
    const welcomeMessage = document.getElementById('welcomeMessage');
    container.innerHTML = '';
    container.appendChild(welcomeMessage);
    
    if (conversation.length > 2) {
        welcomeMessage.style.display = 'none';
    } else {
        welcomeMessage.style.display = 'block';
    }
    
    conversation.slice(2).forEach(msg => {
        if (msg.role === 'user') {
            appendUserMessage(msg.content, false);
        } else if (msg.role === 'assistant') {
            appendAssistantMessage(msg.content, false);
        }
    });
    
    scrollToBottom();
}

// ========================================
// 消息渲染（复用原有代码）
// ========================================
function appendUserMessage(content, animate = true) {
    const container = document.getElementById('messagesContainer');
    const messageEl = document.createElement('div');
    messageEl.className = 'message user';
    if (!animate) messageEl.style.animation = 'none';
    
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.innerHTML = `
        <div class="message-avatar">我</div>
        <div class="message-content">
            <div class="message-bubble">${escapeHtml(content)}</div>
            <span class="message-time">${time}</span>
        </div>
    `;
    
    container.appendChild(messageEl);
    scrollToBottom();
}

function appendAssistantMessage(content, animate = true) {
    const container = document.getElementById('messagesContainer');
    
    if (AppState.isRoundTableMode) {
        const rolePattern = /([🕯️📜🍃⚡]\s*)?(Eudora|Li\sMing|Zephyr|Kairos)[:：]\s*/g;
        const parts = content.split(rolePattern);
        
        if (parts.length > 1) {
            for (let i = 1; i < parts.length; i += 3) {
                const emoji = parts[i] || '';
                const name = parts[i + 1];
                const text = parts[i + 2];
                
                if (name && text) {
                    const charId = name.toLowerCase().replace(' ', '');
                    const char = CHARACTERS[charId];
                    if (char) {
                        appendCharacterMessage(char, text.trim(), animate);
                    }
                }
            }
        } else {
            appendSingleAssistantMessage(content, animate);
        }
    } else {
        appendSingleAssistantMessage(content, animate);
    }
}

function appendCharacterMessage(character, content, animate = true) {
    const container = document.getElementById('messagesContainer');
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    if (!animate) messageEl.style.animation = 'none';
    
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.innerHTML = `
        <div class="message-avatar">${character.avatar}</div>
        <div class="message-content">
            <div class="message-role">
                <span class="role-dot" style="background: ${character.accentColor}"></span>
                ${character.name}
            </div>
            <div class="message-bubble">${formatMessage(content)}</div>
            <span class="message-time">${time}</span>
        </div>
    `;
    
    container.appendChild(messageEl);
    scrollToBottom();
}

function appendSingleAssistantMessage(content, animate = true) {
    const container = document.getElementById('messagesContainer');
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    if (!animate) messageEl.style.animation = 'none';
    
    const char = AppState.isRoundTableMode ? null : CHARACTERS[AppState.currentCharacter];
    const avatar = char ? char.avatar : (AppState.isRoundTableMode ? '🔮' : '🤖');
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-bubble">${formatMessage(content)}</div>
            <span class="message-time">${time}</span>
        </div>
    `;
    
    container.appendChild(messageEl);
    scrollToBottom();
}

function showTypingIndicator() {
    const container = document.getElementById('messagesContainer');
    const indicator = document.createElement('div');
    indicator.className = 'message typing-message';
    indicator.id = 'typingIndicator';
    
    const char = AppState.isRoundTableMode ? null : CHARACTERS[AppState.currentCharacter];
    const avatar = char ? char.avatar : (AppState.isRoundTableMode ? '🔮' : '🤖');
    
    indicator.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function formatMessage(content) {
    let formatted = escapeHtml(content);
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// ========================================
// 消息发送
// ========================================
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || AppState.isGenerating) return;
    
    // 检查登录状态
    if (!AppState.user) {
        openAuthModal();
        return;
    }
    
    // 检查Token额度
    if (AppState.tokenUsage.used >= AppState.tokenUsage.limit) {
        alert('Token额度已用完，请升级套餐');
        // TODO: 显示升级弹窗
        return;
    }
    
    input.value = '';
    input.style.height = 'auto';
    
    document.getElementById('welcomeMessage').style.display = 'none';
    appendUserMessage(content);
    
    AppState.conversations[AppState.currentCharacter].push({
        role: 'user',
        content: content
    });
    
    showTypingIndicator();
    AppState.isGenerating = true;
    updateSendButton();
    
    try {
        const response = await callAPI();
        hideTypingIndicator();
        
        appendAssistantMessage(response);
        
        AppState.conversations[AppState.currentCharacter].push({
            role: 'assistant',
            content: response
        });
        
        // 估算Token使用量并记录
        const estimatedTokens = Math.ceil((content.length + response.length) / 2);
        await recordTokenUsage(estimatedTokens);
        
        saveCloudConversations();
        
    } catch (error) {
        hideTypingIndicator();
        appendAssistantMessage(`抱歉，发生了错误：${error.message}`);
        console.error('API Error:', error);
    } finally {
        AppState.isGenerating = false;
        updateSendButton();
    }
}

function updateSendButton() {
    const btn = document.getElementById('sendBtn');
    btn.disabled = AppState.isGenerating;
}

// ========================================
// 事件绑定
// ========================================
function bindEvents() {
    // 消息发送
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('messageInput').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
    
    // 圆桌会议
    document.getElementById('roundtableCard').addEventListener('click', selectRoundTable);
    
    // 用户认证
    document.getElementById('loginBtn').addEventListener('click', openAuthModal);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('closeAuth').addEventListener('click', closeAuthModal);
    document.getElementById('loginSubmit').addEventListener('click', handleLogin);
    document.getElementById('overlay').addEventListener('click', () => {
        closeAuthModal();
        closeCharacterModal();
    });
    
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // 角色详情
    document.getElementById('infoBtn').addEventListener('click', openCharacterModal);
    document.getElementById('closeModal').addEventListener('click', closeCharacterModal);
}

function toggleTheme() {
    AppState.isDarkTheme = !AppState.isDarkTheme;
    localStorage.setItem('symposium_theme', AppState.isDarkTheme ? 'dark' : 'light');
    applyTheme();
}

function applyTheme() {
    const savedTheme = localStorage.getItem('symposium_theme');
    AppState.isDarkTheme = savedTheme === 'dark';
    
    if (AppState.isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeIcon').innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
}

// 角色详情弹窗
function openCharacterModal() {
    const modal = document.getElementById('characterModal');
    const content = document.getElementById('modalContent');
    
    let char;
    if (AppState.isRoundTableMode) {
        content.innerHTML = `
            <div class="character-detail-section">
                <h4>模式说明</h4>
                <p>${ROUNDTABLE_CONFIG.description}</p>
            </div>
            <div class="character-detail-section">
                <h4>参与的顾问</h4>
                <div class="philosopher-tags">
                    ${Object.values(CHARACTERS).map(c => `<span class="philosopher-tag">${c.avatar} ${c.name}</span>`).join('')}
                </div>
            </div>
        `;
        document.getElementById('modalAvatar').textContent = ROUNDTABLE_CONFIG.avatar;
        document.getElementById('modalName').textContent = ROUNDTABLE_CONFIG.name;
        document.getElementById('modalOrigin').textContent = ROUNDTABLE_CONFIG.nameCN;
    } else {
        char = CHARACTERS[AppState.currentCharacter];
        content.innerHTML = `
            <div class="character-detail-section">
                <h4>融合的哲学家</h4>
                <div class="philosopher-tags">
                    ${char.philosophers.map(p => `<span class="philosopher-tag">${p}</span>`).join('')}
                </div>
            </div>
            <div class="character-detail-section">
                <h4>思想流派</h4>
                <p>${char.school} · ${char.era}</p>
            </div>
            <div class="character-detail-section">
                <h4>核心概念</h4>
                <div class="concept-tags">
                    ${char.keyConcepts.map(c => `<span class="concept-tag">${c}</span>`).join('')}
                </div>
            </div>
        `;
        document.getElementById('modalAvatar').textContent = char.avatar;
        document.getElementById('modalName').textContent = char.name;
        document.getElementById('modalOrigin').textContent = char.nameOrigin;
    }
    
    modal.classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeCharacterModal() {
    document.getElementById('characterModal').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}
