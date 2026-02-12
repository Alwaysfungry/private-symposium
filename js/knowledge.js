/**
 * The Private Symposium - 知识库模块
 * 
 * 基于用户提供的核心语料库构建
 * 为每位角色提供准确的经典引用
 */

// ========================================
// 核心语料库 - 基于用户提供的 CSV 文件
// ========================================
const KNOWLEDGE_BASE = {
    socrates: {
        name: '苏格拉底',
        nameEn: 'Socrates',
        works: [
            {
                title: '申辩篇',
                titleEn: 'Apology',
                source: '柏拉图早期对话录',
                coreConcepts: ['苏格拉底方法', '伦理追问', '审判', '生活态度'],
                keyQuotes: [
                    '未经审视的人生不值得过。',
                    '我唯一知道的就是我一无所知。',
                    '认识你自己。'
                ]
            },
            {
                title: '克里托篇',
                titleEn: 'Crito',
                source: '柏拉图早期对话录',
                coreConcepts: ['守法', '契约', '道德一致性'],
                keyQuotes: [
                    '重要的不是活着，而是活得好。',
                    '人应该遵循道理，而非多数人的意见。'
                ]
            },
            {
                title: '斐多篇',
                titleEn: 'Phaedo',
                source: '柏拉图早期对话录',
                coreConcepts: ['灵魂不朽', '死亡观', '理念回忆说'],
                keyQuotes: [
                    '哲学家的一生就是在练习死亡。',
                    '灵魂是不朽的，它在我们的肉体出生之前就存在。'
                ]
            }
        ]
    },

    plato: {
        name: '柏拉图',
        nameEn: 'Plato',
        works: [
            {
                title: '理想国',
                titleEn: 'The Republic',
                source: '柏拉图中期对话',
                coreConcepts: ['理念论', '正义', '洞穴寓言', '灵魂三分', '哲学家王', '教育'],
                keyQuotes: [
                    '洞穴寓言：那些被锁链束缚的人只能看到墙上的影子，便以为那就是真实。',
                    '正义就是每个人都做适合他天性的事情。',
                    '哲学家应该成为统治者，或者统治者应该成为哲学家。',
                    '灵魂的三个部分：理性、激情、欲望。'
                ]
            },
            {
                title: '会饮篇',
                titleEn: 'Symposium',
                source: '柏拉图中期对话',
                coreConcepts: ['爱情', '美的阶梯', 'eros（爱欲）'],
                keyQuotes: [
                    '爱是对美本身的爱，而不是对具体美的形体或灵魂的爱。',
                    '爱是对不朽的渴望。',
                    '爱是贫乏与丰富之子。'
                ]
            }
        ]
    },

    aristotle: {
        name: '亚里士多德',
        nameEn: 'Aristotle',
        works: [
            {
                title: '尼各马可伦理学',
                titleEn: 'Nicomachean Ethics',
                source: '亚里士多德伦理学著作',
                coreConcepts: ['Eudaimonia（幸福）', '德性', '中庸之道', '实践智慧', '友爱'],
                keyQuotes: [
                    '人的善就是灵魂合乎德性的实现活动。',
                    '幸福是灵魂合乎完满德性的实现活动。',
                    '德性是两种恶行之间的中道。',
                    '卓越不是一种行为，而是一种习惯。'
                ]
            },
            {
                title: '形而上学',
                titleEn: 'Metaphysics',
                source: '亚里士多德第一哲学',
                coreConcepts: ['存在之为存在', '实体', '四因说', '形式与质料', '第一推动者'],
                keyQuotes: [
                    '求知是人类的天性。',
                    '实体是存在的第一意义。',
                    '思想思想它自身。'
                ]
            },
            {
                title: '政治学',
                titleEn: 'Politics',
                source: '亚里士多德政治哲学',
                coreConcepts: ['城邦', '政体分类', '正义', '最佳政体', '人是政治动物'],
                keyQuotes: [
                    '人是天生的政治动物。',
                    '城邦是自然的产物，人天生属于城邦。',
                    '中庸的政体是最好的政体。'
                ]
            }
        ]
    },

    laozi: {
        name: '老子',
        nameEn: 'Lao Tzu',
        works: [
            {
                title: '道德经',
                titleEn: 'Tao Te Ching',
                source: '道家经典',
                coreConcepts: ['道', '无为', '自然', '反者道之动', '柔弱胜刚强', '守静'],
                keyQuotes: [
                    '道可道，非常道；名可名，非常名。',
                    '上善若水。水善利万物而不争，处众人之所恶，故几于道。',
                    '致虚极，守静笃。',
                    '为学日益，为道日损。损之又损，以至于无为。',
                    '反者道之动，弱者道之用。',
                    '知人者智，自知者明。',
                    '天下万物生于有，有生于无。',
                    '柔弱胜刚强。'
                ]
            }
        ]
    },

    confucius: {
        name: '孔子',
        nameEn: 'Confucius',
        works: [
            {
                title: '论语',
                titleEn: 'The Analects',
                source: '儒家经典',
                coreConcepts: ['仁', '礼', '孝', '君子', '中庸', '修身', '为政'],
                keyQuotes: [
                    '学而时习之，不亦说乎？',
                    '己所不欲，勿施于人。',
                    '克己复礼为仁。',
                    '知之者不如好之者，好之者不如乐之者。',
                    '三人行，必有我师焉。',
                    '君子和而不同，小人同而不和。',
                    '己欲立而立人，己欲达而达人。',
                    '学而不思则罔，思而不学则殆。'
                ]
            }
        ]
    },

    descartes: {
        name: '笛卡尔',
        nameEn: 'René Descartes',
        works: [
            {
                title: '第一哲学沉思集',
                titleEn: 'Meditations on First Philosophy',
                source: '笛卡尔形而上学',
                coreConcepts: ['我思故我在', '方法论怀疑', '身心二元论', '上帝证明', '清楚明白'],
                keyQuotes: [
                    '我思故我在。',
                    '我可以怀疑一切，但我不能怀疑我正在怀疑这个事实。',
                    '清楚明白的观念是真理的标准。',
                    '心灵与肉体是两种根本不同的实体。',
                    '必须将我的信念全部推翻，从基础重新开始。'
                ]
            },
            {
                title: '谈谈方法',
                titleEn: 'Discourse on the Method',
                source: '笛卡尔方法论',
                coreConcepts: ['方法论', '科学方法', '理性主义', '普遍数学'],
                keyQuotes: [
                    '普遍怀疑是获得确定知识的方法。',
                    '我接受没有任何东西比我自己的精神更真实。',
                    '方法：分解问题、从简单到复杂、全面列举、普遍复查。'
                ]
            }
        ]
    },

    kant: {
        name: '康德',
        nameEn: 'Immanuel Kant',
        works: [
            {
                title: '纯粹理性批判',
                titleEn: 'Critique of Pure Reason',
                source: '康德认识论',
                coreConcepts: ['先验', '物自体', '现象与本体', '二律背反', '范畴', '先天综合判断'],
                keyQuotes: [
                    '我只能认识现象，不能认识物自体。',
                    '思维无内容是空的，直观无概念是盲的。',
                    '空间和时间不是物自体的属性，而是感性的先天形式。'
                ]
            },
            {
                title: '实践理性批判',
                titleEn: 'Critique of Practical Reason',
                source: '康德道德哲学',
                coreConcepts: ['道德律令', '绝对命令', '自由', '定言命令', '目的王国'],
                keyQuotes: [
                    '有两样东西，我愈是经常和持久地思考它们，对它们日久弥新和不断增长的魅力以及崇敬之情就愈是充实着我的心灵：头顶的星空和心中的道德律。',
                    '要只按照你同时认为也能成为普遍规律的准则去行动。',
                    '人是目的，而不仅仅是手段。',
                    '自由是道德法则的存在理由。'
                ]
            },
            {
                title: '判断力批判',
                titleEn: 'Critique of Judgment',
                source: '康德美学',
                coreConcepts: ['美', '崇高', '目的论', '无概念的普遍性', '无目的的合目的性'],
                keyQuotes: [
                    '美是无概念而普遍令人愉快的。',
                    '美是道德的象征。',
                    '无目的的合目的性。'
                ]
            }
        ]
    },

    hegel: {
        name: '黑格尔',
        nameEn: 'Georg Wilhelm Friedrich Hegel',
        works: [
            {
                title: '精神现象学',
                titleEn: 'Phenomenology of Spirit',
                source: '黑格尔辩证哲学',
                coreConcepts: ['辩证法', '绝对精神', '主奴辩证法', '意识发展史', '否定性'],
                keyQuotes: [
                    '真理是全体，但全体只是通过自身发展而达到完满的那种本质。',
                    '实体即主体。',
                    '凡是合乎理性的都是现实的，凡是现实的都是合乎理性的。'
                ]
            },
            {
                title: '逻辑学',
                titleEn: 'Science of Logic',
                source: '黑格尔逻辑体系',
                coreConcepts: ['辩证逻辑', '正-反-合', '存在与本质', '概念论'],
                keyQuotes: [
                    '存在就是无，无就是存在。',
                    '矛盾是运动的根源。'
                ]
            }
        ]
    },

    marx: {
        name: '马克思',
        nameEn: 'Karl Marx',
        works: [
            {
                title: '共产党宣言',
                titleEn: 'The Communist Manifesto',
                source: '马克思政治宣言',
                coreConcepts: ['阶级斗争', '历史唯物主义', '资产阶级与无产阶级', '共产主义'],
                keyQuotes: [
                    '一个幽灵，共产主义的幽灵，在欧洲游荡。',
                    '至今一切社会的历史都是阶级斗争的历史。',
                    '全世界无产者，联合起来！',
                    '无产阶级失去的只是锁链，他们获得的将是整个世界。'
                ]
            },
            {
                title: '资本论',
                titleEn: 'Capital, Volume 1',
                source: '马克思主义经济学',
                coreConcepts: ['剩余价值', '异化', '商品拜物教', '资本积累', '劳动价值论'],
                keyQuotes: [
                    '商品拜物教：人与人的社会关系表现为物与物的社会关系。',
                    '异化劳动：工人与自己的劳动产品、劳动活动、类本质以及他人相异化。',
                    '资本来到世间，从头到脚，每个毛孔都滴着血和肮脏的东西。',
                    '哲学家们只是用不同的方式解释世界，而问题在于改变世界。'
                ]
            },
            {
                title: '1844年经济学哲学手稿',
                titleEn: 'Economic and Philosophic Manuscripts of 1844',
                source: '马克思早期著作',
                coreConcepts: ['异化', '类本质', '私有财产', '共产主义'],
                keyQuotes: [
                    '劳动的异化意味着人的类本质的丧失。',
                    '共产主义是私有财产即人的自我异化的积极的扬弃。'
                ]
            }
        ]
    },

    nietzsche: {
        name: '尼采',
        nameEn: 'Friedrich Nietzsche',
        works: [
            {
                title: '查拉图斯特拉如是说',
                titleEn: 'Thus Spoke Zarathustra',
                source: '尼采诗性哲学',
                coreConcepts: ['超人', '上帝已死', '永恒轮回', '权力意志', '骆驼-狮子-孩童'],
                keyQuotes: [
                    '上帝已死！上帝永远死了！是我们把他杀死的！',
                    '超人是大地的意义。',
                    '人是应该被超越的某种东西。',
                    '精神有三种变形：精神如何变成骆驼，骆驼如何变成狮子，最后狮子如何变成小孩。',
                    '这就是生命吗？好吧，再来一次！',
                    '对待生命不妨大胆一点，因为终要失去它。'
                ]
            },
            {
                title: '善恶的彼岸',
                titleEn: 'Beyond Good and Evil',
                source: '尼采道德批判',
                coreConcepts: ['主人道德与奴隶道德', '权力意志', '透视主义', '重估一切价值'],
                keyQuotes: [
                    '从药草和恶草中都能提炼出良药，从善与恶中都能提炼出真正的智慧。',
                    '生命本身就是权力意志。',
                    '没有事实，只有解释。'
                ]
            },
            {
                title: '论道德的谱系',
                titleEn: 'On the Genealogy of Morality',
                source: '尼采道德谱系学',
                coreConcepts: ['怨恨道德', '内疚与良心', '禁欲主义理想', '惩罚'],
                keyQuotes: [
                    '奴隶道德是弱者发明来限制强者的道德。',
                    '内疚产生于 creditor-debtor（债权人-债务人）的关系。',
                    '人宁愿追求虚无，也不愿不追求。'
                ]
            },
            {
                title: '悲剧的诞生',
                titleEn: 'The Birth of Tragedy',
                source: '尼采早期美学',
                coreConcepts: ['阿波罗精神', '酒神精神', '悲剧的消亡', '音乐与神话'],
                keyQuotes: [
                    '酒神精神：在醉的状态中，人不再是个体，而是与宇宙的生命意志融为一体。',
                    '阿波罗精神：以美的形象来克服存在的痛苦。',
                    '只有作为审美现象，存在与世界才是永恒合理的。'
                ]
            }
        ]
    },

    heidegger: {
        name: '海德格尔',
        nameEn: 'Martin Heidegger',
        works: [
            {
                title: '存在与时间',
                titleEn: 'Being and Time',
                source: '海德格尔基础存在论',
                coreConcepts: ['此在（Dasein）', '存在论', '在世', '向死而生', '操心', '本真性'],
                keyQuotes: [
                    '此在是一种存在者，它在它的存在中，对存在有所领会。',
                    '向死而生：面对死亡的不可避免性，此在才能本真地存在。',
                    '此在的本真状态是先行向死存在。',
                    '操心是此在的基本存在结构。',
                    '此在总是我的此在。',
                    '存在被遗忘是西方形而上学的命运。'
                ]
            },
            {
                title: '人，诗意地栖居',
                titleEn: 'Poetically Man Dwells',
                source: '海德格尔后期思想',
                coreConcepts: ['诗意栖居', '语言', '技术', '天地神人'],
                keyQuotes: [
                    '人诗意地栖居在这片大地上。',
                    '语言是存在的家。',
                    '技术的本质绝非技术性的。',
                    '诗人创建持存。'
                ]
            }
        ]
    }
};

// ========================================
// 角色与哲学家的映射关系
// ========================================
const CHARACTER_PHILOSOPHER_MAP = {
    eudora: ['socrates', 'plato', 'aristotle'],
    liming: ['confucius', 'kant', 'hegel'],
    zephyr: ['laozi', 'nietzsche', 'heidegger'],
    kairos: ['marx', 'hegel', 'descartes']
};

// ========================================
// 知识检索函数
// ========================================

/**
 * 根据查询获取相关的知识引用
 * @param {string} query - 用户查询
 * @param {string} characterId - 角色ID
 * @param {number} limit - 返回的最大引用数
 * @returns {Array} - 相关知识引用
 */
function retrieveRelevantKnowledge(query, characterId, limit = 3) {
    const philosopherIds = CHARACTER_PHILOSOPHER_MAP[characterId] || [];
    const results = [];
    
    // 简单的关键词匹配（实际应用中应使用向量数据库）
    const keywords = extractKeywords(query);
    
    philosopherIds.forEach(philId => {
        const philosopher = KNOWLEDGE_BASE[philId];
        if (!philosopher) return;
        
        philosopher.works.forEach(work => {
            // 检查核心概念匹配
            work.coreConcepts.forEach(concept => {
                if (keywords.some(kw => concept.toLowerCase().includes(kw.toLowerCase()))) {
                    results.push({
                        philosopher: philosopher.name,
                        work: work.title,
                        type: 'concept',
                        content: concept,
                        relevance: 0.9
                    });
                }
            });
            
            // 检查引文匹配
            work.keyQuotes.forEach(quote => {
                if (keywords.some(kw => quote.toLowerCase().includes(kw.toLowerCase()))) {
                    results.push({
                        philosopher: philosopher.name,
                        work: work.title,
                        type: 'quote',
                        content: quote,
                        relevance: 0.85
                    });
                }
            });
        });
    });
    
    // 按相关性排序并限制数量
    return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
}

/**
 * 提取查询关键词（简化版）
 */
function extractKeywords(query) {
    // 移除常见停用词
    const stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '怎么', '为什么'];
    
    return query
        .toLowerCase()
        .replace(/[，。？！、；：""''（）【】]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.includes(word));
}

/**
 * 获取角色的核心著作列表（用于系统提示词增强）
 */
function getCharacterCoreWorks(characterId) {
    const philosopherIds = CHARACTER_PHILOSOPHER_MAP[characterId] || [];
    const works = [];
    
    philosopherIds.forEach(philId => {
        const philosopher = KNOWLEDGE_BASE[philId];
        if (philosopher) {
            philosopher.works.forEach(work => {
                works.push({
                    philosopher: philosopher.name,
                    philosopherEn: philosopher.nameEn,
                    title: work.title,
                    titleEn: work.titleEn,
                    coreConcepts: work.coreConcepts,
                    quotes: work.keyQuotes.slice(0, 3) // 只取前3个引用
                });
            });
        }
    });
    
    return works;
}

/**
 * 为系统提示词添加知识库增强
 */
function enhanceSystemPromptWithKnowledge(basePrompt, characterId) {
    const works = getCharacterCoreWorks(characterId);
    
    if (works.length === 0) return basePrompt;
    
    let knowledgeSection = '\n\n【核心著作与引用】\n在回答中，你可以引用以下著作中的智慧（但不要过度引用，保持自然）：\n\n';
    
    works.forEach(work => {
        knowledgeSection += `${work.philosopher}《${work.title}》：\n`;
        knowledgeSection += `  核心概念：${work.coreConcepts.join('、')}\n`;
        knowledgeSection += `  经典引用：\n`;
        work.quotes.forEach(quote => {
            knowledgeSection += `    - "${quote}"\n`;
        });
        knowledgeSection += '\n';
    });
    
    knowledgeSection += '\n【引用原则】\n';
    knowledgeSection += '1. 只有当引用确实能支持你的观点时才引用\n';
    knowledgeSection += '2. 引用要自然融入你的论述，不要生硬堆砌\n';
    knowledgeSection += '3. 可以意译或融入自己的表达，不必逐字引用\n';
    knowledgeSection += '4. 优先使用与你当下论述最贴切的内容\n';
    
    return basePrompt + knowledgeSection;
}

/**
 * 获取随机引用（用于欢迎消息等）
 */
function getRandomQuote(characterId) {
    const philosopherIds = CHARACTER_PHILOSOPHER_MAP[characterId] || [];
    const allQuotes = [];
    
    philosopherIds.forEach(philId => {
        const philosopher = KNOWLEDGE_BASE[philId];
        if (philosopher) {
            philosopher.works.forEach(work => {
                work.keyQuotes.forEach(quote => {
                    allQuotes.push({
                        philosopher: philosopher.name,
                        work: work.title,
                        quote: quote
                    });
                });
            });
        }
    });
    
    if (allQuotes.length === 0) return null;
    
    return allQuotes[Math.floor(Math.random() * allQuotes.length)];
}

// ========================================
// 导出模块
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        KNOWLEDGE_BASE,
        CHARACTER_PHILOSOPHER_MAP,
        retrieveRelevantKnowledge,
        getCharacterCoreWorks,
        enhanceSystemPromptWithKnowledge,
        getRandomQuote
    };
}
