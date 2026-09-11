import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check & AI status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat API - In-character Conversational AI CPU Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userMessage, person, gameStateContext, recentDialogueHistory } = req.body;

    if (!userMessage || !person) {
      return res.status(400).json({ error: 'userMessage and person are required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on server',
        fallbackNeeded: true,
      });
    }

    // Format chat history for context
    const formattedHistory = Array.isArray(recentDialogueHistory)
      ? recentDialogueHistory
          .slice(-6)
          .map((m: { sender: string; text: string }) => `${m.sender === 'player' ? 'プレイヤー' : person.name}: ${m.text}`)
          .join('\n')
      : 'なし';

    // Format system instruction for this specific person & world state
    const systemInstruction = `あなたはサッカー人生シミュレーションゲーム「FOOTBALL LIFE」に登場する人物「${person.name}」です。
プレイヤー（主人公）からスマートフォンのチャットメッセージが送られてきました。
あなたの役職、性格、年齢、立場、プレイヤーとの関係、そしてゲーム内の現在状況を深く理解し、実在する人物として最も自然で感情のこもった日本語の返信を生成してください。

【あなたのプロフィール】
・名前: ${person.name}
・役職/立場: ${person.role === 'coach' ? '所属チームの監督・指導者' : person.role === 'friend' ? '友人・クラスメイト' : person.role === 'rival' ? 'ライバル選手' : person.role === 'teacher' ? '学校の担任教師' : person.role === 'parent' ? '保護者・家族' : '知人'}
・性格: ${person.personality} (${person.personality === 'strict' ? '厳しい・規律と結果を最重視' : person.personality === 'passionate' ? '熱血・情熱的・やる気重視' : person.personality === 'cheerful' ? '明るく社交的・冗談好き' : person.personality === 'cool' ? '冷静沈着・感情をあまり表に出さない' : person.personality === 'gentle' ? '温和・思いやりが深い' : '野心的・向上心が高い'})
・年齢: ${person.age}歳
・所属: ${person.schoolOrClub}
・プレイヤーとの関係性: ${person.relationship} (親密度: ${person.affinity}/100, 信頼度: ${person.trust}/100)
・これまでの記憶・メモ: ${person.memories && person.memories.length > 0 ? person.memories.join(' / ') : '特になし'}

【ゲーム内の現在の状況】
・現在日付: ${gameStateContext?.currentDate || '不明'}
・プレイヤー名前: ${gameStateContext?.playerName || 'プレイヤー'} (${gameStateContext?.playerAge || 10}歳, ポジション: ${gameStateContext?.playerPosition || 'FW'}, OVR: ${gameStateContext?.playerOvr || 30})
・所属チーム: ${gameStateContext?.currentTeam || 'チーム'} (${gameStateContext?.teamCategory || '部活動'})
・監督信頼度: ${gameStateContext?.coachTrust ?? 50}/100
・疲労度: ${gameStateContext?.fatigue ?? 0}/100 (${gameStateContext?.isInjured ? '【負傷治療中！】' : '健康'})
・コンディション: ${gameStateContext?.condition || '普通'}
・学校学力スコア: ${gameStateContext?.academicScore ?? 60}/100
・直近の試合結果: ${gameStateContext?.recentMatchSummary || '特になし'}
・直近の練習状況: ${gameStateContext?.recentPracticeSummary || '通常練習実施'}
・移籍希望状況: ${gameStateContext?.transferDesire ? 'プレイヤーは移籍・退団を希望中' : '現所属チームに専念中'}
・直近の出来事ログ: ${Array.isArray(gameStateContext?.recentLogs) ? gameStateContext.recentLogs.slice(0, 3).join(' / ') : '平穏'}

【直前の会話履歴】
${formattedHistory}

【厳守すべき会話ルール】
1. プレイヤーの発言内容・感情・質問・要求（スタメン直訴、移籍相談、挨拶、雑談、悩み相談、弱音など）を深く理解し、正面から応答してください。定型文や質問を無視した返信は厳禁です。
2. あなたの人格（監督なら監督らしく、友人なら同年代のフランクな口調で、ライバルなら負けず嫌いに、先生なら学業も心配しつつ）に徹してください。
3. 実際のスマートフォンチャットの返信として自然な長さ（1〜3文程度、長すぎず短すぎず）にしてください。
4. 過去の会話や直近の試合・練習の出来事に自然と言及してください。
5. 必ず以下のJSON形式のみを出力してください。Markdownのバッククォートを含めず、JSON文字列のみを返してください。

{
  "reply": "プレイヤーに表示する自然な会話文",
  "emotion": "normal" | "happy" | "serious" | "strict" | "worried" | "angry" | "excited",
  "relationship_change": -3から+3の整数（好感度の変化目安）,
  "manager_trust_change": -3から+3の整数（監督信頼度の変化目安。監督との会話や真摯な態度で上下、無礼なら下がる）,
  "event": "none" | "transfer_discussion" | "position_talk" | "starter_promise" | "friend_hangout" | "romance_progress" | "practice_warning",
  "eventDetail": "この会話で生じた重要な合意や記憶メモ（1文、なければ空文字）"
}`;

    const prompt = `プレイヤーの発言:\n「${userMessage}」\n\n上記の発言に対して、あなたの人物像・現在の状況を踏まえたJSON形式の返信を生成してください。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    const text = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // Clean possible backticks
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    return res.status(500).json({
      error: error?.message || 'Gemini API call failed',
      fallbackNeeded: true,
    });
  }
});

// 3. SNS Reactions API - Generate realistic dynamic comments & reactions for player SNS posts
app.post('/api/sns-reactions', async (req, res) => {
  try {
    const { postContent, gameStateContext } = req.body;

    if (!postContent) {
      return res.status(400).json({ error: 'postContent is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured',
        fallbackNeeded: true,
      });
    }

    const systemInstruction = `あなたはサッカー界のソーシャルメディア（SNS「Footter」）のリアクションシミュレーターです。
プレイヤー（選手）がSNSに投稿した文章を読み、その内容（試合への感謝、愚痴、監督批判、移籍示唆、日常、意気込みなど）に応じて、
フォロワー数・いいね数・本物ファン数の変動および、2〜4件のリアルな返信コメントを生成してください。

プレイヤーの現在の情報:
・名前: ${gameStateContext?.playerName || 'プレイヤー'} (${gameStateContext?.playerAge || 10}歳)
・所属チーム: ${gameStateContext?.currentTeam || '所属チーム'}
・直近の試合: ${gameStateContext?.recentMatchSummary || '特になし'}
・監督信頼度: ${gameStateContext?.coachTrust || 50}/100

返信コメントは様々な立場（チームメイト、熱心なサポーター、ライバル選手、地元メディア記者、一般サッカーファン）から選んでください。
必ず以下のJSON形式のみを出力してください:

{
  "likesDelta": 5〜200の整数,
  "followerDelta": -10〜150の整数,
  "fanDelta": -5〜30の整数,
  "coachTrustImpact": -5〜+3の整数（監督批判や不穏な投稿はマイナス、感謝やチーム愛はプラス、通常は0）,
  "comments": [
    {
      "authorName": "コメント者名",
      "authorRole": "fan" | "teammate" | "rival" | "media",
      "content": "自然でリアルな短文コメント"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `プレイヤーのSNS投稿:\n「${postContent}」\n\nこの投稿に対するSNS上の反応をJSON形式で生成してください。`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.85,
      },
    });

    const text = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini SNS API Error:', error);
    return res.status(500).json({
      error: error?.message || 'Gemini SNS call failed',
      fallbackNeeded: true,
    });
  }
});

// Vite Middleware setup for full-stack SPA
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FOOTBALL LIFE Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
