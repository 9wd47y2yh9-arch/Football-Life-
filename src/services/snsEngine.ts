import { SNSPost, GameState } from '../types/footballLife';
import { getRandomElement, getRandomInt } from '../data/worldData';

export interface SNSPostAnalysisResult {
  post: SNSPost;
  coachTrustDelta: number;
  fansDelta: number;
  followersDelta: number;
  worldReactionLog?: string;
  transferDesireTriggered?: boolean;
}

export function analyzeAndPublishSNSPost(
  content: string,
  gameState: GameState
): SNSPostAnalysisResult {
  const player = gameState.player;
  const text = content.trim();
  const lower = text.toLowerCase();

  let coachTrustDelta = 0;
  let fansDelta = 0;
  let followersDelta = 0;
  let worldReactionLog: string | undefined = undefined;
  let transferDesireTriggered = false;

  const generatedComments: Array<{
    id: string;
    authorName: string;
    authorHandle: string;
    content: string;
  }> = [];

  // Categorize intent
  // 1. Praise club / fans
  if (text.includes('クラブが好き') || text.includes('このチームが好き') || text.includes('サポーターに感謝') || text.includes('応援ありがとう')) {
    coachTrustDelta = +3;
    followersDelta = getRandomInt(2, 5);
    // Fans only grow if player is already somewhat known
    if (player.ovr > 60 || player.age >= 15) {
      fansDelta = getRandomInt(1, 4);
    }
    generatedComments.push(
      { id: 'c1', authorName: 'サポサポ君', authorHandle: '@football_supporter', content: 'これからも応援してます！熱いプレー見せてください！' },
      { id: 'c2', authorName: 'クラブ公式ファン', authorHandle: '@fan_club_voice', content: 'チーム愛が伝わってきて最高です🔥' }
    );
    worldReactionLog = 'SNSでクラブへの愛着を表明し、ファンとサポーターから温かい好意が集まりました。';
  }
  // 2. Praise Coach
  else if (text.includes('監督が好き') || text.includes('監督に感謝') || text.includes('監督の指導') || text.includes('監督ありがとう')) {
    coachTrustDelta = +8;
    followersDelta = getRandomInt(1, 3);
    generatedComments.push(
      { id: 'c1', authorName: 'チームメイト', authorHandle: '@teammate_voice', content: '監督の指導、身に染みるよな！明日も頑張ろうぜ！' }
    );
    worldReactionLog = 'SNSで監督への感謝と敬意を綴ったことで、監督からの信頼度が高まりました。';
  }
  // 3. Criticize Coach
  else if (text.includes('監督やめてくれ') || text.includes('監督最悪') || text.includes('監督無能') || text.includes('監督嫌い') || text.includes('采配ミス')) {
    coachTrustDelta = -18;
    followersDelta = getRandomInt(5, 15); // drama attracts followers
    generatedComments.push(
      { id: 'c1', authorName: 'サッカー通', authorHandle: '@tactical_eye', content: 'おいおい、公のSNSで監督批判はまずいだろ…' },
      { id: 'c2', authorName: '熱狂サポ', authorHandle: '@ultra_fan', content: '不満があるならピッチで結果を出して見返せよ！' }
    );
    worldReactionLog = '【SNS炎上注意】監督に対する不満を投稿したため、監督の激しい怒りを買い、信頼関係が急落しました。';
  }
  // 4. Dissatisfied with playing time
  else if (text.includes('もっと試合に出たい') || text.includes('出番が欲しい') || text.includes('ベンチは悔しい') || text.includes('使ってくれない')) {
    coachTrustDelta = -4;
    followersDelta = getRandomInt(1, 3);
    generatedComments.push(
      { id: 'c1', authorName: '少年サッカーファン', authorHandle: '@local_scout', content: '悔しさをバネにして自主練でアピールだ！' }
    );
    worldReactionLog = '出場機会への強い飢えを投稿。首脳陣にもそのアピールが伝わりました。';
  }
  // 5. Transfer desire
  else if (text.includes('このクラブを離れたい') || text.includes('移籍したい') || text.includes('海外に行きたい') || text.includes('新天地')) {
    coachTrustDelta = -10;
    transferDesireTriggered = true;
    followersDelta = getRandomInt(3, 8);
    generatedComments.push(
      { id: 'c1', authorName: 'フットボール速報', authorHandle: '@transfer_news_jp', content: '【移籍の噂】選手本人が移籍を示唆する発言か。今後の動向に注目が集まる。' }
    );
    worldReactionLog = '【移籍の憶測】SNSでの発言が波紋を呼び、スカウト陣やメディアが動向を注視し始めました。';
  }
  // 6. Hard work / Training
  else if (text.includes('自主練') || text.includes('筋トレ') || text.includes('練習頑張る') || text.includes('今日も走った')) {
    coachTrustDelta = +2;
    followersDelta = getRandomInt(1, 4);
    generatedComments.push(
      { id: 'c1', authorName: '幼馴染', authorHandle: '@childhood_friend', content: '今日もお疲れー！明日学校でな！' }
    );
    worldReactionLog = '日々の努力を投稿し、真摯な姿勢がチームメイトに伝わりました。';
  }
  // 7. General casual post
  else {
    followersDelta = getRandomInt(0, 2);
    generatedComments.push(
      { id: 'c1', authorName: '友達', authorHandle: '@school_pal', content: 'いいね！明日話そうぜー！' }
    );
  }

  // Base likes calculated from follower count
  const baseLikes = Math.max(1, Math.floor(player.snsFollowers * 0.15) + getRandomInt(1, 5));

  const post: SNSPost = {
    id: `post_${Date.now()}_${getRandomInt(100, 999)}`,
    authorId: player.id,
    authorName: player.name,
    authorHandle: player.snsHandle,
    authorRole: 'player',
    content: text,
    timestamp: 'たった今',
    likes: baseLikes,
    isLikedByPlayer: false,
    comments: generatedComments
  };

  return {
    post,
    coachTrustDelta,
    fansDelta,
    followersDelta,
    worldReactionLog,
    transferDesireTriggered
  };
}

export function generateDailyCPUSNSPosts(gameState: GameState): SNSPost[] {
  const posts: SNSPost[] = [];
  const player = gameState.player;
  const contacts = gameState.contacts;

  // Chance of a media news post
  if (Math.random() < 0.35) {
    const newsHeadlines = [
      `【ユース年代展望】今季注目の育成年代タレント特集。将来を嘱望される若き選手たちの競い合いが白熱。`,
      `【育成コラム】「技術か、フィジカルか」現代フットボールにおける10代の最適な練習量とは。`,
      `【欧州移籍動向】ビッグクラブが世界中のアカデミーにスカウト網を拡充。青田買い競争が過熱。`,
      `【高校サッカー・ユース】各地区のリーグ戦が開幕。熱戦が各地で繰り広げられる。`
    ];
    posts.push({
      id: `media_${Date.now()}_${getRandomInt(1, 999)}`,
      authorId: 'media_official',
      authorName: 'フットボールデイリー速報',
      authorHandle: '@football_daily_news',
      authorRole: 'media',
      content: getRandomElement(newsHeadlines),
      timestamp: '1時間前',
      likes: getRandomInt(45, 180),
      isLikedByPlayer: false,
      comments: [
        { id: 'mc1', authorName: 'サッカーファンA', authorHandle: '@fan_a', content: 'これからの若手の活躍が楽しみだな！' }
      ]
    });
  }

  // Teammate or Rival post
  const rivalOrTeammate = contacts.find(c => c.role === 'rival' || c.role === 'friend');
  if (rivalOrTeammate && Math.random() < 0.4) {
    const postTexts = rivalOrTeammate.role === 'rival' ? [
      '今日の自主練終了。誰にも負けないシュートを磨く。次は絶対オレが主役になる。',
      'グラウンドで10kmラン。スタミナだけは誰にも負けない。'
    ] : [
      '今日の練習めちゃくちゃ疲れたー！早く帰って寝よう！',
      '新しいスパイク買った！めっちゃ軽くて最高！明日履くの楽しみ！'
    ];

    posts.push({
      id: `cpu_post_${Date.now()}_${getRandomInt(1, 999)}`,
      authorId: rivalOrTeammate.id,
      authorName: rivalOrTeammate.name,
      authorHandle: `@${rivalOrTeammate.name.replace(/\s+/g, '').toLowerCase()}`,
      authorRole: rivalOrTeammate.role === 'rival' ? 'rival' : 'teammate',
      content: getRandomElement(postTexts),
      timestamp: '3時間前',
      likes: getRandomInt(3, 15),
      isLikedByPlayer: false,
      comments: []
    });
  }

  return posts;
}
