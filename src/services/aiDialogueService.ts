import { Person, GameState, Position } from '../types/footballLife';
import { DialogueReplyResult, processUserDialogue } from './dialogueEngine';
import { SNSPostAnalysisResult, analyzeAndPublishSNSPost } from './snsEngine';

/**
 * Checks whether the server-side Gemini AI service is configured and reachable
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.aiConfigured;
  } catch {
    return false;
  }
}

/**
 * Extracts a concise summary of the recent game context for the AI
 */
function buildGameStateContext(gameState: GameState) {
  const { player, currentDate, leagueFixtures, recentContext, dailyLogs, contacts, snsPosts } = gameState;

  // Build match summary
  let recentMatchSummary = '直近の公式戦はありません';
  if (recentContext?.lastMatchResult) {
    const m = recentContext.lastMatchResult;
    const res = m.isWin ? '勝利' : m.isDraw ? '引き分け' : '敗戦';
    recentMatchSummary = `${m.date} 対 ${m.opponent}。結果: ${res}。プレイヤー出場: ${m.playerRole}, ${m.playerGoals}得点, ${m.playerAssists}アシスト, 採点: ${m.playerRating}`;
  } else {
    const lastPlayed = [...leagueFixtures].reverse().find(f => f.played);
    if (lastPlayed) {
      recentMatchSummary = `${lastPlayed.homeTeam} vs ${lastPlayed.awayTeam} (${lastPlayed.homeScore}-${lastPlayed.awayScore})`;
    }
  }

  // Build practice summary
  let recentPracticeSummary = '通常のチーム練習';
  if (player.todayPracticeStatus === 'attended') {
    recentPracticeSummary = '本日のチーム練習に真面目に参加完了';
  } else if (player.todayPracticeStatus === 'missed') {
    recentPracticeSummary = `本日の練習を欠席 (${player.todayPracticeReason || '理由未申告'})`;
  } else if (recentContext?.lastPracticeEvent && !recentContext.lastPracticeEvent.attended) {
    recentPracticeSummary = `直前の練習を欠席 (${recentContext.lastPracticeEvent.reason || '無断'})。監督の信頼に影響あり`;
  }

  // Compute tomorrow's real schedule
  const today = new Date(currentDate);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowFixture = leagueFixtures.find(f => f.date === tomorrowStr && !f.played);
  const tomorrowDayOfWeek = tomorrow.getDay();
  const hasPracticeTomorrow = player.currentTeam.practiceSchedule.includes(tomorrowDayOfWeek);

  let tomorrowSchedule = {
    type: 'practice' as 'match' | 'practice' | 'off',
    time: '16:00',
    description: '明日は16時からグラウンドで全体練習。15分前（15:45）には用具の準備を済ませて集合。'
  };

  if (tomorrowFixture) {
    const opponent = tomorrowFixture.homeTeam === player.currentTeam.name ? tomorrowFixture.awayTeam : tomorrowFixture.homeTeam;
    tomorrowSchedule = {
      type: 'match',
      time: '09:00',
      description: `明日は公式戦当日（対 ${opponent}）。キックオフ2時間前の9:00にクラブハウス集合。用具準備と体調管理を徹底すること。`
    };
  } else if (!hasPracticeTomorrow) {
    tomorrowSchedule = {
      type: 'off',
      time: 'なし',
      description: '明日は全体練習は休み（完全オフ）。ストレッチと休養を優先し、各自疲労を抜くこと。'
    };
  }

  // Coaches & Teammates
  const coaches = contacts
    .filter(c => c.role === 'coach' || c.role === 'assistant_coach')
    .map(c => `${c.name}(${c.role === 'coach' ? '監督' : 'コーチ'})`)
    .join(', ') || '監督・コーチ陣';

  const teammates = contacts
    .filter(c => c.role === 'teammate' || c.role === 'rival')
    .map(c => c.name)
    .join(', ') || 'チームメイト';

  const recentSnsBuzz = snsPosts.slice(0, 2).map(p => `「${p.content}」(いいね:${p.likes})`).join(' / ') || '特になし';

  return {
    playerName: player.name,
    playerAge: player.age,
    playerPosition: player.currentPosition,
    playstyle: player.playstyle || 'バランス型',
    playerOvr: player.ovr,
    currentTeam: player.currentTeam.name,
    teamCategory: player.currentTeam.category,
    currentDate,
    currentLocation: player.currentTeam.name,
    school: player.schoolName || '所属校',
    coaches,
    teammates,
    coachTrust: player.coachTrust,
    practiceAttitude: player.practiceAttitude,
    fatigue: player.fatigue,
    condition: player.condition,
    isInjured: !!player.injury,
    injuryDescription: player.injury ? `${player.injury.name} (全治${player.injury.daysRemaining}日)` : 'なし',
    academicScore: player.academicScore,
    fans: player.fans,
    snsFollowers: player.snsFollowers,
    recentMatchSummary,
    recentPracticeSummary,
    tomorrowSchedule,
    recentSnsBuzz,
    transferDesire: gameState.timeline.some(t => t.title.includes('移籍希望') || t.title.includes('移籍相談')),
    recentLogs: dailyLogs.slice(0, 4).map(l => l.text),
  };
}

/**
 * Requests an in-character response from Conversational AI (Gemini) via /api/chat.
 * If server is offline, key is missing, or network fails, gracefully falls back to the
 * rich rule-based dialogue engine.
 */
export async function getConversationalAIReply(
  userMessage: string,
  person: Person,
  gameState: GameState
): Promise<DialogueReplyResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const gameStateContext = buildGameStateContext(gameState);
    const recentDialogueHistory = (person.chatHistory || []).slice(-6).map(m => ({
      sender: m.sender,
      text: m.text,
    }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        person,
        gameStateContext,
        recentDialogueHistory,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || !json.data || !json.data.reply) {
      throw new Error('Invalid AI response structure');
    }

    const aiData = json.data;

    // Build clamped and game-safe DialogueReplyResult
    const result: DialogueReplyResult = {
      replyText: aiData.reply.trim(),
    };

    // Safe bounds for coach trust delta (-4 to +4)
    if (typeof aiData.manager_trust_change === 'number') {
      result.coachTrustDelta = Math.max(-4, Math.min(4, Math.round(aiData.manager_trust_change)));
    }

    // Safe bounds for relationship/affinity delta (-4 to +4)
    if (typeof aiData.relationship_change === 'number') {
      result.affinityDelta = Math.max(-4, Math.min(4, Math.round(aiData.relationship_change)));
      result.trustDelta = Math.max(-4, Math.min(4, Math.round(aiData.relationship_change)));
    }

    // Handle high-level events identified by the AI
    if (aiData.event === 'transfer_discussion') {
      result.transferDesireNoted = true;
    } else if (aiData.event === 'starter_promise') {
      result.playingTimePromise = true;
    } else if (aiData.event === 'romance_progress') {
      if (person.affinity >= 60) {
        result.romanceProgression = 'confession_accept';
      }
    } else if (aiData.event === 'position_talk') {
      // Check if user specified a position
      const positions: Position[] = ['CF', 'ST', 'WG', 'OMF', 'CMF', 'DMF', 'CB', 'SB', 'GK'];
      const matched = positions.find(p => userMessage.toUpperCase().includes(p));
      if (matched && gameState.player.coachTrust >= 40) {
        result.positionChangeGranted = matched;
      }
    }

    // Save memory if provided
    if (aiData.eventDetail && typeof aiData.eventDetail === 'string' && aiData.eventDetail.trim().length > 0) {
      result.memoryAdded = aiData.eventDetail.trim();
    }

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    console.info('Conversational AI unavailable or failed, using local dialogue engine fallback:', err);
    // Seamless fallback to our rich local dialogue engine
    return processUserDialogue(userMessage, person, gameState);
  }
}

/**
 * Analyzes and publishes an SNS post using Conversational AI for dynamic reactions.
 * Falls back to local rule-based analysis if AI is offline.
 */
export async function getAISNSPostResult(
  content: string,
  gameState: GameState
): Promise<SNSPostAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const gameStateContext = buildGameStateContext(gameState);

    const response = await fetch('/api/sns-reactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postContent: content,
        gameStateContext,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error('Invalid SNS AI response');
    }

    const aiData = json.data;
    const player = gameState.player;

    const postComments = Array.isArray(aiData.comments)
      ? aiData.comments.map((c: any, index: number) => ({
          id: `c_ai_${Date.now()}_${index}`,
          authorName: c.authorName || 'サッカーファン',
          authorHandle: `@${(c.authorName || 'user').toLowerCase().replace(/\s+/g, '_')}`,
          content: c.content || '応援してます！',
        }))
      : [];

    const newPost = {
      id: `post_${Date.now()}`,
      authorId: player.id,
      authorName: player.name,
      authorHandle: player.snsHandle,
      authorRole: 'player' as const,
      content,
      timestamp: 'たった今',
      likes: Math.max(1, Number(aiData.likesDelta) || 12),
      isLikedByPlayer: false,
      comments: postComments,
    };

    return {
      post: newPost,
      coachTrustDelta: Math.max(-15, Math.min(10, Number(aiData.coachTrustImpact) || 0)),
      fansDelta: Math.max(0, Number(aiData.fanDelta) || 1),
      followersDelta: Math.max(1, Number(aiData.followerDelta) || 5),
      worldReactionLog: `AI生成による世間のリアルタイム反応: ${postComments.length}件のコメントが寄せられました。`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.info('SNS AI reaction failed or unavailable, using local engine:', err);
    return analyzeAndPublishSNSPost(content, gameState);
  }
}
