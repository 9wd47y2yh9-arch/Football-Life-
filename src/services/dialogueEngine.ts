import { Person, GameState, Position, PracticeAbsenceReason } from '../types/footballLife';
import { getRandomElement, PRACTICE_ABSENCE_REASONS } from '../data/worldData';

export interface DialogueReplyResult {
  replyText: string;
  coachTrustDelta?: number;
  affinityDelta?: number;
  trustDelta?: number;
  positionChangeGranted?: Position;
  transferDesireNoted?: boolean;
  playingTimePromise?: boolean;
  memoryAdded?: string;
  romanceProgression?: 'confession_accept' | 'confession_reject' | 'confession_hold' | 'date_agreed';
}

/**
 * Helper to pick a response variant that has not appeared in recent history
 */
function pickUniqueReply(candidates: string[], person: Person): string {
  const pastTexts = (person.chatHistory || []).slice(-10).map(m => m.text);
  const fresh = candidates.filter(c => !pastTexts.includes(c));
  if (fresh.length > 0) {
    return getRandomElement(fresh);
  }
  // If all candidates have been seen, append a natural small variation
  const chosen = getRandomElement(candidates);
  return chosen;
}

/**
 * Generates natural, non-repetitive, context-aware spontaneous CPU messages
 * based on role, personality, age, recent matches, practice absences, injuries, and transfers.
 */
export function generateContextualSpontaneousMessage(
  person: Person,
  gameState: GameState
): string | null {
  const { player, currentDate, activeMatch, leagueFixtures, recentContext } = gameState;
  const recentChatTexts = person.chatHistory.slice(-4).map(m => m.text);

  // Check if today is a match day
  const todayFixture = activeMatch || leagueFixtures.find(f => f.date === currentDate && !f.played);

  // Helper to ensure text isn't in recent chat history
  const pickFresh = (candidates: string[]): string => {
    const fresh = candidates.filter(c => !recentChatTexts.includes(c));
    return getRandomElement(fresh.length > 0 ? fresh : candidates);
  };

  // Helper for personality suffix adjustment
  const styleText = (base: string): string => {
    if (person.personality === 'cheerful') {
      return base.replace(/だ。/g, 'だよ！').replace(/だな。/g, 'じゃん！');
    }
    if (person.personality === 'cool') {
      return base.replace(/！/g, '。').replace(/よな/g, 'ぞ');
    }
    if (person.personality === 'gentle') {
      return base.replace(/だ。/g, 'ね。').replace(/ぞ/g, 'よ');
    }
    return base;
  };

  // 1. COACH (監督)
  if (person.role === 'coach') {
    // Priority A: Player missed practice recently
    if (recentContext?.lastPracticeEvent && !recentContext.lastPracticeEvent.attended) {
      const reasonKey = recentContext.lastPracticeEvent.reason;
      if (reasonKey === 'unexcused_abandoned') {
        return pickFresh([
          `昨日の全体練習、何の連絡もなく放置していたな。チームの規律を守れない選手を試合で起用することはできない。自分の甘さを猛省しなさい。`,
          `無断での不参加は最悪の行為だ。チームメイトやスタッフにどう顔向けするつもりだ？信頼を失ったことを自覚しなさい。`
        ]);
      }
      if (reasonKey === 'overslept') {
        return pickFresh([
          `昨日は寝坊での欠席だったな。プロを目指す選手としての生活リズムと自己管理を今一度見直しなさい。`,
          `朝の遅刻・寝坊はチーム全体の士気に関わる。二度と繰り返さないよう目覚ましを徹底しろよ。`
        ]);
      }
      if (reasonKey === 'unexcused_slacking' || reasonKey === 'play_with_friends') {
        return pickFresh([
          `無断や個人的な遊びでの練習欠席はチームの規律に反する。信頼を取り戻すにはグラウンドでの姿勢しかないぞ。`,
          `プロになる選手は練習をサボったりしない。自分が何のためにサッカーをしているのか自覚してくれ。`
        ]);
      }
      if (reasonKey === 'illness' || reasonKey === 'hospital_visit') {
        return pickFresh([
          `体調を崩していたようだが熱は下がったか？焦って無理に動くと長引くぞ。完治を優先しなさい。`,
          `身体の具合はどうだ？健康管理も一流選手の基礎だ。しっかり栄養を摂って休むんだぞ。`
        ]);
      }
      if (reasonKey === 'severe_fatigue') {
        return pickFresh([
          `疲労が溜まって休んでいたな。休養の使い方は合っている。リフレッシュした状態で次の練習に挑め。`,
          `身体の重さは抜けたか？常に100%で動けるコンディションを維持する術を学んでいこう。`
        ]);
      }
      if (reasonKey === 'exam_study') {
        return pickFresh([
          `テスト勉強での欠席は連絡を受けている。文武両道は大切だが、戦術の復習も各自で進めておいてくれ。`,
          `勉強もサッカーも集中力が鍵だ。学問を疎かにしない姿勢は将来必ず生きるぞ。`
        ]);
      }
    }

    // Priority B: Match day today
    if (todayFixture) {
      const isStarter = player.coachTrust >= 50 && player.fatigue < 80;
      if (isStarter) {
        return pickFresh([
          `今日はお前をスタメンで送り出す。立ち上がりから相手の隙を突いてアグレッシブに仕掛けてこい。`,
          `本日の公式戦、頼んだぞ。お前の武器を存分に発揮してチームを勝利に導け。`,
          `相手のスカウティングは済んでいる。お前のところで前を向ければ必ずチャンスになる。自信を持ってピッチに立て。`
        ]);
      } else {
        return pickFresh([
          `今日はベンチスタートだが、試合の展開次第でお前を投入する。常に身体を温めて流れを見ておけよ。`,
          `交代で入った時にお前の推進力が必要になる。外から相手DFの弱点を見極めておきなさい。`
        ]);
      }
    }

    // Priority C: Recent Match Result Reaction
    if (recentContext?.lastMatchResult) {
      const { isWin, isLoss, playerGoals, playerAssists, playerRating, opponent } = recentContext.lastMatchResult;
      if (playerGoals >= 2) {
        return pickFresh([
          `${opponent}戦でのマルチゴール、見事だったぞ！決定力の高さがチームを救った。次の試合も継続してくれ。`,
          `前節の複数得点で周囲の評価も高まっている。だがマークが厳しくなるぞ。さらに動き出しの質を高めろ。`
        ]);
      }
      if (playerGoals === 1) {
        return pickFresh([
          `前節のゴールは落ち着いた素晴らしいフィニッシュだった。シュートの意識を常に持ち続けてくれ。`,
          `ゴールという目に見える結果を出したのは大きな収穫だ。次の練習でも貪欲にシュートを打ち込め。`
        ]);
      }
      if (isLoss) {
        return pickFresh([
          `前節の敗戦は全員が重く受け止めなければならない。敗戦から何を学び、どう成長するかが問われているぞ。`,
          `悔しい結果に終わったが、下を向いている暇はない。次の試合に向けて戦術の修正を急ごう。`
        ]);
      }
      if (isWin && (playerRating || 6) >= 7.0) {
        return pickFresh([
          `前節の勝利はお前の攻守にわたる貢献が大きかった。この調子でチームの牽引役になってくれ。`,
          `素晴らしい勝利だった。練習で取り組んできた連携が試合でしっかり表現できていたぞ。`
        ]);
      }
    }

    // Priority D: High Fatigue or Consecutive Absences
    if (player.fatigue >= 75) {
      return pickFresh([
        `練習の動きを見る限り、身体に重さが見える。怪我をしてからでは遅い。睡眠とアイシングを徹底しろ。`,
        `疲労がピークに達しているようだ。無理をして怪我をするなよ。休養も選手の大事な仕事だ。`
      ]);
    }
    if (player.consecutiveMissedPractices >= 2) {
      return `連続で練習を休んでいるようだが、何か悩みでもあるのか？プロになりたいなら日々の姿勢を正しなさい。`;
    }

    // Priority E: General Trust-Based
    if (player.coachTrust >= 75) {
      return pickFresh([
        `日々の練習態度は他の選手の模範になっている。このチームの中心はお前だ。`,
        `戦術の理解度が深まってきたな。グラウンドでもっと味方に指示を出してリーダーシップを発揮しろ。`
      ]);
    }
    if (player.coachTrust < 40) {
      return pickFresh([
        `今のプレー水準ではベンチ入りも厳しい。基礎練習から誰よりも泥臭く取り組んでくれ。`,
        `チーム戦術に対する献身性がまだ足りない。自分本位なプレーになっていないか振り返りなさい。`
      ]);
    }

    return pickFresh([
      `次の試合は攻守の切り替えスピードが鍵になる。トラップの向きを意識して自主練しておけ。`,
      `ポジショニングの修正について、放課後少しビデオを見せたい。時間はあるか？`,
      `今日の練習での集中力は良かったぞ。常に実戦を想定したパススピードを意識し続けろ。`
    ]);
  }

  // 2. RIVAL (ライバル)
  if (person.role === 'rival') {
    if (todayFixture) {
      return styleText(pickFresh([
        `おい、今日はいよいよ試合だな。どっちがピッチで目立つか勝負だぞ。絶対に俺が先に結果を出すからな。`,
        `今日の相手、かなり手強そうだぞ。だがスタメンの座はお前にも譲らない。ピッチで証明してやる。`,
        `ウォーミングアップから集中しろよ。隙を見せたらすぐ監督に直訴してポジション奪ってやるからな。`
      ]));
    }

    if (recentContext?.lastMatchResult && recentContext.lastMatchResult.playerGoals > 0) {
      return styleText(pickFresh([
        `前節のゴール見たぞ。…チッ、悔しいが綺麗なコースだったな。だが次は俺がハットトリックしてやる！`,
        `得点取って調子乗ってんじゃないぞ！次の紅白戦では俺がお前を完全に抑え込んでやるからな！`
      ]));
    }

    if (recentContext?.lastPracticeEvent && !recentContext.lastPracticeEvent.attended) {
      if (recentContext.lastPracticeEvent.reason === 'overslept') {
        return styleText(`おいおい、今朝寝坊したんだって？笑 監督めちゃくちゃ呆れてたぞ。そんな緩んだヤツにスタメン奪われたら腹立つから、シャキッとしろよ！`);
      }
      return styleText(`昨日練習休んでただろ？体調崩したのか？お前がいないと紅白戦の張り合いがないんだよ。早く戻ってこいよな。`);
    }

    if (player.injury) {
      return styleText(`足の怪我、無理すんなよ。万全じゃないお前に勝っても嬉しくないからな。しっかり治してまたグラウンドで勝負だ。`);
    }

    return styleText(pickFresh([
      `自主練どれくらいやってる？俺は今日シュート練100本打ち込んできたぞ。置いていかれないようにしろよな。`,
      `お前の最近のキレ、正直警戒してる。だが次の紅白戦では俺のドリブルで抜き去ってやるから覚悟しろよ。`,
      `次の試合のスタメン発表、楽しみだな。監督がお前と俺のどっちを頼りにするか、ハッキリさせようぜ。`
    ]));
  }

  // 3. BEST FRIEND / FRIEND (親友・友人)
  if (person.role === 'friend' || person.relationship === 'best_friend') {
    const isBest = person.relationship === 'best_friend';

    if (todayFixture) {
      return styleText(pickFresh([
        `今日試合だな！！スタンドの最前列から大声で応援するからな！絶対ゴール決めろよ！！`,
        `いよいよキックオフだな！昨日の自主練の成果、思う存分相手に見せつけてやれ！ファイトだ！！`
      ]));
    }

    if (recentContext?.lastMatchResult) {
      const { isWin, isLoss, playerGoals, opponent } = recentContext.lastMatchResult;
      if (playerGoals >= 2) {
        return styleText(`おいおいマジかよ！！${opponent}戦のスーパーゴール！！学校でもみんな大騒ぎしてたぞ！サイン今のうちにちょうだい！笑`);
      }
      if (playerGoals === 1) {
        return styleText(`昨日のゴール、マジでかっこよかったわ！あのシュートの瞬間、鳥肌立ったもん！おめでとう！！`);
      }
      if (isLoss) {
        return styleText(`昨日の試合、惜しかったな…！でも最後まで諦めずに走ってたの、ちゃんと見てたぞ！次は絶対リベンジしようぜ！`);
      }
    }

    if (recentContext?.lastPracticeEvent && !recentContext.lastPracticeEvent.attended) {
      return styleText(`昨日練習休んでたけど大丈夫だった？無理しすぎて倒れたのかと思って心配したんだぞ！何かあったら話せよな！`);
    }

    if (player.injury) {
      return styleText(`怪我大丈夫か！？歩くの痛くない？部室の荷物運ぶの手伝うから、無理しないで何でも言ってくれよな！`);
    }

    if (isBest) {
      return styleText(pickFresh([
        `なぁ、将来プロになったら一番高いシートのチケットくれよな！オレ、お前の専属サポーターだからさ！`,
        `今日ちょっと一緒にサッカーショップ寄らない？新色のスパイク出てて見に行きたいんだよね！`,
        `お前が自主練頑張ってるの見ると、オレもテスト勉強サボってらんないなって思うわ笑 いつも刺激もらってるよ！`
      ]));
    }

    return styleText(pickFresh([
      `今日の放課後、ちょっとグラウンドでリフティング対決しようぜ！負けた方が売店のジュース奢りな！`,
      `明日の小テスト勉強した？数学が難しすぎて頭爆発しそうなんだけど助けてー！笑`,
      `新しいサッカーゲーム買ったんだよ！今度オフの日にオレの家に対戦しに来ない？`
    ]));
  }

  // 4. ROMANCE (恋愛・クラスメイト)
  if (person.role === 'romance') {
    const isDating = person.relationship === 'dating';

    if (todayFixture) {
      if (isDating) {
        return `今日はいよいよ試合だね！お守り持った？怪我しないように、思いっきり楽しんで走ってきてね！ずっと応援してるよ！`;
      }
      return `今日の試合、頑張ってね！怪我のないように祈ってるよ。いい結果が出るといいね！`;
    }

    if (recentContext?.lastMatchResult && recentContext.lastMatchResult.playerGoals > 0) {
      if (isDating) {
        return `昨日の試合のゴール、すごくかっこよかった…！周りのみんなも大歓声で、私すっごく誇らしかったよ！お疲れ様！`;
      }
      return `昨日のゴール見たよ！シュートすごく綺麗だったね！クラスでもみんな話題にしてたよ、おめでとう！`;
    }

    if (player.injury) {
      return `怪我したって聞いてすごく心配だよ…痛む？焦らずにちゃんと安静にしてね。何か手伝えることがあったら遠慮なく言ってね！`;
    }

    if (isDating) {
      return pickFresh([
        `いつも練習お疲れ様！遅くまでボール蹴ってて風邪ひかないようにね。帰ったら温かいお風呂に入ってね。`,
        `次のオフの日、少しだけでも会えるかな？話したいこといっぱいあるんだ！`,
        `今日、グラウンドの近く通ったとき一生懸命走ってる姿が見えたよ。やっぱりサッカーしてる姿が一番好きだな！`
      ]);
    }

    if (person.affinity >= 50) {
      return pickFresh([
        `今日、授業のノートまとめたからもしよかったら写していいよ！サッカーと勉強の両立、応援してるね！`,
        `今週末の試合、応援に行ってもいいかな？がんばってるところ見たいな！`
      ]);
    }

    return pickFresh([
      `明日の日直の仕事、一緒だからよろしくね！`,
      `放課後いつもグラウンドに走っていくのすごいね！いつも遠くから応援してるよ。`
    ]);
  }

  // 5. FAMILY (保護者・家族)
  if (person.role === 'family') {
    if (todayFixture) {
      return `今日はいよいよ公式戦だね！消化にいいお弁当にしておいたからね。緊張しないで、いつも通り楽しんでおいで！`;
    }
    if (recentContext?.lastMatchResult?.playerGoals) {
      return `昨日の試合、シュートが決まった時お父さんと飛び跳ねて喜んじゃったよ！本当に立派だったね。夜はお祝いのご馳走にするね！`;
    }
    if (player.injury) {
      return `怪我の具合はどう？病院の先生の言いつけを守って、痛いときは絶対無理しちゃダメよ。湿布貼り替えようね。`;
    }
    if (player.fatigue >= 70) {
      return `最近顔色が疲れてるみたいだよ。今夜は早くお風呂に入って、宿題が終わったらすぐ寝なさいね。`;
    }
    return pickFresh([
      `泥だらけのユニフォーム、綺麗に洗っておいたよ！今日も怪我しないように気をつけて頑張っておいで！`,
      `今夜はお前の好きなハンバーグだよ！いっぱい食べてスタミナつけなさいね。`,
      `靴箱に新しいすね当て届いてるよ。大事に使いなさいね。`
    ]);
  }

  // 6. TEACHER (先生)
  if (person.role === 'teacher') {
    if (player.academicScore < 45) {
      return `前回の小テスト、点数が少し心配です。サッカーで忙しいのもわかりますが、放課後少し補習を受けていきませんか？`;
    }
    if (player.academicScore >= 80) {
      return `ハードな部活動の中でも学業成績をしっかり維持していて素晴らしいですね。文武両道の模範です！`;
    }
    return `来週は学校行事の準備があります。クラスの活動にも積極的に参加して、仲間との協調性を高めましょう。`;
  }

  return null;
}

/**
 * Enhanced context-aware dialogue engine.
 * Understands user intent, past conversation flow, game context (dates, matches, practices, school, stats),
 * personality, and ensures non-repetitive dialogue.
 */
export function processUserDialogue(
  userInput: string,
  person: Person,
  gameState: GameState
): DialogueReplyResult {
  const text = userInput.trim();
  const lower = text.toLowerCase();
  const player = gameState.player;
  const role = person.role;
  const personality = person.personality;
  const recentContext = gameState.recentContext;
  const currentDate = gameState.currentDate;

  // Find the last CPU message in this chat history to maintain conversational flow
  const lastCpuMsg = (person.chatHistory || [])
    .filter(m => m.sender === 'cpu')
    .slice(-1)[0];
  const lastCpuText = lastCpuMsg ? lastCpuMsg.text : '';

  // Calculate tomorrow's day of week & whether tomorrow has practice
  const currDateObj = new Date(currentDate);
  const tomorrowDateObj = new Date(currDateObj);
  tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
  const tomorrowDayOfWeek = tomorrowDateObj.getDay();
  const tomorrowDateStr = tomorrowDateObj.toISOString().split('T')[0];

  const tomorrowIsMatch = gameState.leagueFixtures.some(f => f.date === tomorrowDateStr);
  const tomorrowHasPractice = !tomorrowIsMatch && player.currentTeam.practiceSchedule.includes(tomorrowDayOfWeek);

  // ═══════════════════════════════════════════════════════════════
  // SECTION A: MULTI-TURN CONTINUATION (直前の発言を受けての会話)
  // ═══════════════════════════════════════════════════════════════
  const isPositiveAffirmation = (
    text.includes('頑張り') || text.includes('がんばり') || text.includes('はい') ||
    text.includes('わかりました') || text.includes('そっか') || text.includes('了解') ||
    text.includes('任せて') || text.includes('やってやり') || text.includes('アピール')
  );

  // Flow 1: Responding to Coach's selection / practice requirement
  if (role === 'coach' && lastCpuText && (lastCpuText.includes('練習') || lastCpuText.includes('スタメン') || lastCpuText.includes('チャンス') || lastCpuText.includes('結果') || lastCpuText.includes('見てから'))) {
    if (isPositiveAffirmation) {
      const replies = personality === 'strict' ? [
        `その意気だ。言葉だけでなく、明日のグラウンドでプレーの質を見せてみろ。期待しているぞ。`,
        `口で言うのは簡単だ。明日の練習でチームで一番走る姿を見せてみろ。`,
        `いい返事だ。自分の言葉に責任を持って、一歩も引かずにやり切れ。`
      ] : [
        `その意気だな！明日のお前の動きを楽しみにしているぞ。怪我だけは気をつけて挑め。`,
        `おう、その熱い気持ちがあれば大丈夫だ。明日のピッチでお前の良さを存分に出してくれ！`,
        `よし！その集中力を保ったまま明日の練習に入ろう。期待しているぞ。`
      ];
      return {
        replyText: pickUniqueReply(replies, person),
        coachTrustDelta: +2,
        affinityDelta: +1,
        memoryAdded: '監督からの激励に応え、強い意気込みを示した'
      };
    }
  }

  // Flow 2: Responding to Friend's / Crush's invitation to hang out / game / study
  if ((role === 'friend' || role === 'romance') && lastCpuText && (lastCpuText.includes('？') || lastCpuText.includes('遊ぶ') || lastCpuText.includes('来ない') || lastCpuText.includes('行かない') || lastCpuText.includes('会える'))) {
    if (text.includes('行く') || text.includes('行こう') || text.includes('遊ぼう') || text.includes('いいよ') || text.includes('賛成') || text.includes('ぜひ') || text.includes('是非')) {
      if (role === 'romance') {
        return {
          replyText: pickUniqueReply([
            `本当！？嬉しい…！じゃあ次のオフの日、駅前のカフェで待ち合わせしようね！今からすっごく楽しみ！`,
            `やったぁ！約束だよ！美味しいケーキのお店見つけておくね！練習も応援してるよ！`
          ], person),
          affinityDelta: +10,
          trustDelta: +6,
          romanceProgression: 'date_agreed',
          memoryAdded: 'オフの日に一緒に出かける約束をした'
        };
      } else {
        return {
          replyText: pickUniqueReply([
            `よっしゃ決まり！じゃあ放課後校門前集合な！売店のジュース賭けてPK対決もしようぜ！`,
            `サンキュー！新しいゲーム対戦できるの超楽しみだわ！負けねーからな！笑`
          ], person),
          affinityDelta: +8,
          trustDelta: +6
        };
      }
    }
    if (text.includes('無理') || text.includes('ごめん') || text.includes('行けない') || text.includes('忙しい') || text.includes('練習がある')) {
      if (role === 'romance') {
        return {
          replyText: pickUniqueReply([
            `そっか、サッカー忙しいもんね…！全然気にしないで！体調に気をつけて練習頑張ってね！`,
            `うん、無理しないで！また時間ができた時にいつでも声かけてね！`
          ], person),
          affinityDelta: +1
        };
      } else {
        return {
          replyText: pickUniqueReply([
            `そっか、練習あるもんな！プロ目指して頑張ってるお前の邪魔はしねーよ！また今度な！`,
            `了解！サッカー第一優先でいいんだぜ！今度オフの日にまた誘うわ！`
          ], person),
          affinityDelta: +2
        };
      }
    }
  }

  // Flow 3: Responding to Injury / Condition inquiry
  if (lastCpuText && (lastCpuText.includes('怪我') || lastCpuText.includes('痛む') || lastCpuText.includes('具合') || lastCpuText.includes('疲れてる'))) {
    if (text.includes('大丈夫') || text.includes('平気') || text.includes('治り') || text.includes('問題ない') || text.includes('いけます')) {
      if (role === 'coach') {
        return {
          replyText: pickUniqueReply([
            `そうか。だが無理は絶対に禁物だ。違和感が出たらすぐにトレーナーか私に申告しなさい。`,
            `動けるなら結構だ。だがウォーミングアップで慎重に様子を見ながら強度を上げていこう。`
          ], person),
          coachTrustDelta: +1
        };
      }
      if (role === 'family') {
        return {
          replyText: pickUniqueReply([
            `本当？強がりはダメよ。少しでも痛んだらすぐ湿布貼り替えて、無理せずゆっくり休むのよ。`,
            `そう言ってくれると安心するけど、油断しないでね。栄養のあるご飯たくさん作っておくからね。`
          ], person),
          affinityDelta: +3
        };
      }
      return {
        replyText: pickUniqueReply([
          `本当！？よかったー！心配したんだからね！でもぶり返さないように気をつけてね！`,
          `無事ならよかったよ！お前がグラウンドにいないと寂しいからな！無理すんなよ！`
        ], person),
        affinityDelta: +4
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION B: INTENT 1 - GREETINGS & COURTESIES (挨拶・新任挨拶・締め)
  // ═══════════════════════════════════════════════════════════════
  const isGreeting = (
    text.includes('よろしく') || text.includes('初めまして') || text.includes('はじめまして') ||
    text.includes('おはよう') || text.includes('こんにちは') || text.includes('こんばんは') ||
    text.includes('お疲れ様') || text.includes('おつかれ') || text.includes('また明日') ||
    text.includes('バイバイ') || text.includes('おやすみ')
  );

  if (isGreeting) {
    if (role === 'coach') {
      const replies = personality === 'strict' ? [
        `よろしく。まずは明日の練習でしっかり取り組んでくれ。挨拶の声が出ているのは悪くない。`,
        `おう。日々の規律と礼儀はピッチの判断にも直結する。気を引き締めて練習に来なさい。`,
        `よろしく。グラウンドの上でどれだけ自分を表現できるか、期待して見ているぞ。`
      ] : [
        `こちらこそよろしくな！チーム一丸となって勝利を目指そう。明日の練習も頑張っていこう！`,
        `おう、よろしく！挨拶ができる選手は伸びるぞ。何か悩みがあればいつでも相談に来なさい。`,
        `こちらこそよろしく！お前のポテンシャルを存分に引き出せるよう、私も全力で指導するぞ。`
      ];
      return {
        replyText: pickUniqueReply(replies, person),
        coachTrustDelta: +1,
        affinityDelta: +1
      };
    }

    if (role === 'teacher') {
      return {
        replyText: pickUniqueReply([
          `こちらこそよろしくお願いします。明日の授業も忘れないように準備してくださいね。文武両道を目指しましょう。`,
          `丁寧な挨拶ですね。サッカーで疲れていても、朝の予習復習を怠らないようにしましょう。`,
          `こちらこそ。部活動と学業のバランスを取りながら、充実した学校生活を送ってくださいね。`
        ], person),
        affinityDelta: +2,
        trustDelta: +2
      };
    }

    if (role === 'romance') {
      const isDating = person.relationship === 'dating';
      const replies = isDating ? [
        `こちらこそよろしくね！メッセージくれてすごく嬉しいな！明日学校で会えるの楽しみにしてるね！`,
        `お疲れ様！今日もサッカー頑張ったね。明日も一緒に登校できたら嬉しいな！おやすみ！`,
        `ふふ、メッセージありがとう！いつも応援してるからね。明日も笑顔で頑張ろうね！`
      ] : [
        `こちらこそよろしくお願いします！メッセージありがとう！明日の学校でもよろしくね！`,
        `お疲れ様！毎日遅くまでボール蹴ってて本当にすごいね！明日も頑張ってね！`,
        `メッセージありがとう！明日も元気な姿が見られるといいな！`
      ];
      return {
        replyText: pickUniqueReply(replies, person),
        affinityDelta: +4,
        trustDelta: +3
      };
    }

    if (role === 'rival') {
      return {
        replyText: pickUniqueReply([
          `おう、よろしくな！だがピッチに立ったら遠慮はしないからな！明日もどっちが上か勝負だ！`,
          `フッ、丁寧な挨拶だな。だが実力主義のサッカー界、ピッチの上で負けるつもりはないぞ！`,
          `よろしくな。お前が手を抜いたらすぐポジション奪うから、明日もしっかり気合入れてこいよ！`
        ], person),
        affinityDelta: +2,
        trustDelta: +2
      };
    }

    if (role === 'family') {
      return {
        replyText: pickUniqueReply([
          `おかえり！今日も元気に頑張っておいでね！ご飯作って待ってるよ。`,
          `お疲れ様！靴やユニフォームは綺麗に出しておきなさいね。明日も怪我しないようにね！`,
          `いつも頑張ってて偉いね！今夜は好きなものいっぱい食べてスタミナつけなさいね！`
        ], person),
        affinityDelta: +3
      };
    }

    // Friend / Best Friend
    if (person.relationship === 'best_friend') {
      return {
        replyText: pickUniqueReply([
          `こちらこそよろしく笑 明日の部活終わったらどっか寄る？ジュース奢ってよ！`,
          `おう！明日も練習頑張ろうぜ！終わったらまた新しい戦術について語ろうな！`,
          `こちらこそよろしくな相棒！明日もピッチでお前と俺のコンビ見せつけてやろうぜ！`
        ], person),
        affinityDelta: +4,
        trustDelta: +3
      };
    }

    return {
      replyText: pickUniqueReply([
        `おう！こちらこそよろしく！明日の練習も一緒に気合入れて頑張ろうぜ！`,
        `お疲れー！明日も放課後グラウンドで会おうな！`,
        `こちらこそよろしく！明日も暑いけどバテずに走りきろうぜ！`
      ], person),
      affinityDelta: +3
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION C: INTENT 2 - MATCH INQUIRY (今日の試合見てた？・試合どうだった？)
  // ═══════════════════════════════════════════════════════════════
  const isMatchInquiry = (
    text.includes('試合見てた') || text.includes('試合見') || text.includes('今日の試合') ||
    text.includes('昨日の試合') || text.includes('ゴール見た') || text.includes('試合どう') ||
    text.includes('プレーどう') || text.includes('結果見た')
  );

  if (isMatchInquiry) {
    const lastResult = recentContext?.lastMatchResult;
    if (lastResult) {
      if (lastResult.playerGoals >= 2) {
        if (role === 'coach') {
          return {
            replyText: pickUniqueReply([
              `見ていたぞ。あのマルチゴールはお前のシュート技術と冷静な判断の賜物だ。この決定力を維持してくれ。`,
              `しっかり見ていた。得点感覚が研ぎ澄まされていたな。だが満足せず、次の試合でも貪欲にネットを揺らせ。`
            ], person),
            coachTrustDelta: +3,
            affinityDelta: +2
          };
        }
        if (role === 'rival') {
          return {
            replyText: pickUniqueReply([
              `見てたよ。…チッ、あんなゴール決めやがって悔しいぜ。次は俺がハットトリックして見せつけるからな！`,
              `見てたに決まってんだろ！お前だけ目立って調子狂うわ！次は俺にボール集めろよな！`
            ], person),
            affinityDelta: +3,
            trustDelta: +4
          };
        }
        return {
          replyText: pickUniqueReply([
            `見てたよ！後半のあのゴール、マジで鳥肌立ったわ！あんなコース狙えるの凄すぎるって！`,
            `見てたよ！ゴール決まった瞬間、立ち上がって大声で叫んじゃったよ！本当にかっこよかった！`,
            `もちろん見てた！学校でもみんなその話題で持ちきりだったぞ！スーパープレーだったな！`
          ], person),
          affinityDelta: +6,
          trustDelta: +4
        };
      }

      if (lastResult.playerGoals === 1) {
        if (role === 'coach') {
          return {
            replyText: pickUniqueReply([
              `見ていたぞ。相手DFの背後を取る動き出しが見事だった。あの1点はチームにとって非常に価値がある。`,
              `ゴールシーンはしっかり確認した。思い切りの良いシュートだったな。次は守備への戻りも徹底しろよ。`
            ], person),
            coachTrustDelta: +2,
            affinityDelta: +1
          };
        }
        return {
          replyText: pickUniqueReply([
            `見てたよ！後半かなり良かったじゃん！あのゴール決まった瞬間めちゃくちゃ盛り上がったぞ！`,
            `見てたよ！シュートすごく綺麗だったね！おめでとう！次の試合も絶対応援するね！`,
            `見てたぞ！お前のゴールでチームが一気に勢いづいたな！ナイスシュートだった！`
          ], person),
          affinityDelta: +5,
          trustDelta: +3
        };
      }

      if (lastResult.isWin) {
        if (role === 'coach') {
          return {
            replyText: pickUniqueReply([
              `見ていたぞ。献身的なフリーランと守備への切り替えがチームの勝利を支えた。よく走ったな。`,
              `全員の勝利だ。お前のポジショニングも戦術通り機能していたぞ。この勢いを維持しよう。`
            ], person),
            coachTrustDelta: +2,
            affinityDelta: +1
          };
        }
        return {
          replyText: pickUniqueReply([
            `見てたよ！チーム全体が連動してて最高の試合だったじゃん！勝てて本当によかったな！`,
            `見てたよ！みんなで掴んだ勝利、本当におめでとう！応援しててすっごく楽しかった！`
          ], person),
          affinityDelta: +4,
          trustDelta: +2
        };
      }

      if (lastResult.isLoss) {
        if (role === 'coach') {
          return {
            replyText: pickUniqueReply([
              `見ていたぞ。悔しい敗戦だが、課題はハッキリしている。明日の練習で失点パターンを徹底的に見直すぞ。`,
              `結果は残念だったが、最後まで足を止めなかった点は評価する。次は必ず結果でリベンジしよう。`
            ], person),
            coachTrustDelta: +1
          };
        }
        return {
          replyText: pickUniqueReply([
            `見てたよ。惜しかったけど、最後まで諦めずに走りきってたのは伝わってきた。次は勝とうぜ！`,
            `見てたよ…すごく悔しかったね。でもみんな一生懸命で感動したよ。次は絶対勝てるって信じてる！`,
            `見てたぞ！惜しいシーン何回もあったし、次は絶対いけるって！切り替えていこうぜ！`
          ], person),
          affinityDelta: +3,
          trustDelta: +2
        };
      }
    }

    // No recent match found
    if (role === 'coach') {
      return {
        replyText: pickUniqueReply([
          `次の公式戦は日程表の通りだ。今は目の前の練習に100%集中し、試合で最高のパフォーマンスを出せるよう準備しろ。`,
          `試合に向けたスカウティングと準備は順調だ。お前もコンディションを整えておきなさい。`
        ], person),
        coachTrustDelta: +1
      };
    }
    return {
      replyText: pickUniqueReply([
        `え、今日って試合あったっけ？笑 次の公式戦はスケジュール表の通りじゃない？楽しみにしてるよ！`,
        `次が試合日だよね！日程に合わせて応援に行く準備してるから、頑張ってね！`
      ], person),
      affinityDelta: +2
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION D: INTENT 3 - PRACTICE SCHEDULE (明日の練習何時？・時間・場所)
  // ═══════════════════════════════════════════════════════════════
  const isScheduleInquiry = (
    text.includes('何時') || text.includes('練習時間') || text.includes('明日の練習') ||
    text.includes('練習って何時') || text.includes('オフ') || text.includes('休み') ||
    text.includes('グラウンド') || text.includes('集合')
  );

  if (isScheduleInquiry) {
    if (tomorrowIsMatch) {
      if (role === 'coach') {
        return {
          replyText: pickUniqueReply([
            `明日は公式戦当日だ。キックオフ2時間前にクラブハウス集合だ。用具の準備と睡眠を徹底しろ。`,
            `明日は公式リーグ戦だ。遅刻は絶対に許さんぞ。各自朝食をしっかり取って集合しなさい。`
          ], person),
          coachTrustDelta: +1
        };
      }
      return {
        replyText: pickUniqueReply([
          `明日は公式戦当日だよ！いつもより集合早いから気をつけてな！絶対勝とうぜ！`,
          `明日は試合だよ！ユニフォーム忘れずに持っていってね！応援してるからね！`
        ], person),
        affinityDelta: +2
      };
    }

    if (tomorrowHasPractice) {
      if (role === 'coach') {
        return {
          replyText: pickUniqueReply([
            `明日は16時から第1グラウンドで全体練習だ。10分前には用具の準備を済ませて集合しておくように。`,
            `明日は16時集合だ。戦術確認とミニゲームを中心に行う。遅刻するなよ。`
          ], person),
          coachTrustDelta: +1
        };
      }
      if (role === 'romance') {
        return {
          replyText: pickUniqueReply([
            `明日の部活は16時からって聞いてるよ！いつもより少し早いから気をつけてね！終わったら一緒に帰れたらいいな！`,
            `明日は16時からグラウンドで練習だよね！放課後、遠くから少し見学していこうかな！`
          ], person),
          affinityDelta: +3
        };
      }
      return {
        replyText: pickUniqueReply([
          `明日は16時からだよ。いつもより少し早いから気をつけて！遅刻したらグラウンド10周だぞ！笑`,
          `明日は16時集合だよ！ボールとビブスの準備当番、忘れずにやろうな！`
        ], person),
        affinityDelta: +2
      };
    } else {
      if (role === 'coach') {
        return {
          replyText: pickUniqueReply([
            `明日は全体練習は休み（完全オフ）だ。各自ストレッチをして疲労を抜き、明後日に備えなさい。`,
            `明日はオフ日だ。しっかり身体を休めることも一流選手の重要なコンディショニングだぞ。`
          ], person),
          coachTrustDelta: +1
        };
      }
      return {
        replyText: pickUniqueReply([
          `明日は全体練習は休み（オフ）だよ！ゆっくり休むか、自主練するなら付き合うぜ！`,
          `明日は部活休みだよ！たまには家でゆっくりゲームでもしてリフレッシュしようぜ！`,
          `明日はオフの日だね！少し身体を休めてリフレッシュしてね！`
        ], person),
        affinityDelta: +2
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION E: INTENT 4 - ANXIETY / FRUSTRATION (出られなくて悔しい・悩み)
  // ═══════════════════════════════════════════════════════════════
  const isFrustrated = (
    text.includes('悔しい') || text.includes('出られない') || text.includes('出番がない') ||
    text.includes('ベンチ') || text.includes('辛い') || text.includes('つらい') ||
    text.includes('自信なくした') || text.includes('落ち込') || text.includes('悩んで')
  );

  if (isFrustrated) {
    if (role === 'coach') {
      return {
        replyText: pickUniqueReply([
          `そう思っていたんだな。その悔しさを忘れるな。焦らず練習でアピールしていこう。ピッチで結果を出せば私は必ず使う。`,
          `悔しがる心があるならまだ伸びる。ただ不満を溜めるのではなく、今の課題である戦術理解と持久力を練習で示してみろ。`,
          `その悔しさは全員が通る道だ。腐らずに泥臭くボールを追い続けられる選手だけが最後にレギュラーを掴むんだぞ。`
        ], person),
        coachTrustDelta: +3,
        affinityDelta: +2,
        memoryAdded: '試合に出られない悔しさを監督に打ち明け、成長への課題を共有した'
      };
    }

    if (role === 'rival') {
      return {
        replyText: pickUniqueReply([
          `悔しがってる暇があるならボール蹴れよ。お前がベンチで下向いてたら、俺がスタメン取っても張り合いがねえんだよ！`,
          `フン、悔しいのはお前だけじゃないぞ。だがピッチに立つのは結果を出したヤツだけだ。次の紅白戦、受けて立つからな！`
        ], person),
        affinityDelta: +4,
        trustDelta: +5,
        memoryAdded: '出番への悔しさをぶつけ合い、ライバルとしての闘志を再燃させた'
      };
    }

    if (role === 'romance') {
      return {
        replyText: pickUniqueReply([
          `悔しいよね…でも一生懸命練習してるの私ずっと知ってるよ。努力は絶対に嘘をつかないから、諦めないで！ずっと一番に応援してるからね！`,
          `そんなに落ち込まないで…！あなたがグラウンドで一番かっこいいの、私よく分かってるよ。次は絶対チャンスが来るよ！`
        ], person),
        affinityDelta: +8,
        trustDelta: +6,
        memoryAdded: '試合に出られない辛さを優しく励まされ、強い心の支えになった'
      };
    }

    if (role === 'family') {
      return {
        replyText: pickUniqueReply([
          `悔しい思いをした分だけ、人は優しく強く成長できるのよ。焦らず前を向いて、今日のご飯たくさん食べて元気出しなさい！`,
          `頑張ってる姿はお父さんもお母さんもちゃんと見てるよ。大丈夫、お前ならいつか必ずチャンスを掴めるよ。`
        ], person),
        affinityDelta: +5,
        trustDelta: +5
      };
    }

    // Friend
    return {
      replyText: pickUniqueReply([
        `お前の悔しさ、オレも隣で見てて痛いほどわかるよ。放課後自主練付き合うからさ、絶対ポジション奪い返そうぜ！`,
        `腐るなよ相棒！お前の実力はみんな知ってるって！次の練習から猛アピールして監督を黙らせようぜ！`
      ], person),
      affinityDelta: +7,
      trustDelta: +7,
      memoryAdded: '出番がない悔しさを分かち合い、自主トレで這い上がることを誓った'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION F: INTENT 5 - PLAYING TIME / STARTER INQUIRY (スタメン・出場直訴)
  // ═══════════════════════════════════════════════════════════════
  if (text.includes('スタメン') || text.includes('出たい') || text.includes('出場') || text.includes('使って') || text.includes('起用')) {
    if (role === 'coach') {
      if (player.fatigue >= 75) {
        return {
          replyText: `気持ちはよくわかる。だが今のデータとお前の体の疲労度（${player.fatigue}%）を見る限り、ここで無理をさせて大怪我をさせるわけにはいかない。まずはしっかり休んでコンディションを戻せ。`,
          coachTrustDelta: -1,
          memoryAdded: '出場を直訴したが、疲労のため休養を促された'
        };
      }
      if (player.coachTrust >= 60 && player.ovr >= 35) {
        return {
          replyText: `その意気込みは素晴らしい。お前の練習でのひたむきさと技術の向上はコーチ陣もしっかり見ている。次の試合、スタメンもしくは早い時間からの交代出場でチャンスを与える。結果で応えてくれ。`,
          coachTrustDelta: +5,
          affinityDelta: +3,
          playingTimePromise: true,
          memoryAdded: '監督に出場を直訴し、チャンスを与える約束を取り付けた'
        };
      } else if (player.coachTrust < 45) {
        return {
          replyText: `まだ決めてない。練習を見てからかな。最近の練習態度や戦術理解度にはまだ甘さが見える。「出たい」と口にする前に、まずは紅白戦や日々の練習で誰が見ても納得するプレーを見せてくれ。`,
          coachTrustDelta: -3,
          memoryAdded: '出場を直訴したが、日々の練習態度を指摘された'
        };
      } else {
        return {
          replyText: `まだ決めてない。練習を見てからかな。チーム内のポジション争いは激しい。お前には強い期待をかけているからこそ、課題であるスタミナと戦術判断の質をもう一段上げてほしい。今週の練習次第でメンバーを考える。`,
          coachTrustDelta: +1,
          affinityDelta: +1,
          memoryAdded: '監督と出場機会について面談し、課題を共有した'
        };
      }
    }

    return {
      replyText: pickUniqueReply([
        `スタメン発表まだだけど、お前の最近のキレなら絶対名前呼ばれると思うぜ！一緒にピッチに立とうな！`,
        `監督も練習見てるはずだからチャンスあるって！自信持ってアピールしようぜ！`
      ], person),
      affinityDelta: +3
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION G: INTENT 6 - POSITION CHANGE (ポジション変更・相談)
  // ═══════════════════════════════════════════════════════════════
  const positionMatches: Array<{ keyword: string; pos: Position }> = [
    { keyword: 'cf', pos: 'CF' },
    { keyword: 'フォワード', pos: 'CF' },
    { keyword: 'ストライカー', pos: 'CF' },
    { keyword: 'トップ下', pos: 'OMF' },
    { keyword: 'omf', pos: 'OMF' },
    { keyword: 'ウイング', pos: 'WG' },
    { keyword: 'wg', pos: 'WG' },
    { keyword: 'サイド', pos: 'WG' },
    { keyword: 'ボランチ', pos: 'DMF' },
    { keyword: 'dmf', pos: 'DMF' },
    { keyword: 'cmf', pos: 'CMF' },
    { keyword: 'センターバック', pos: 'CB' },
    { keyword: 'cb', pos: 'CB' },
    { keyword: 'サイドバック', pos: 'SB' },
    { keyword: 'sb', pos: 'SB' },
    { keyword: 'キーパー', pos: 'GK' },
    { keyword: 'gk', pos: 'GK' }
  ];

  const matchedPos = positionMatches.find(p => lower.includes(p.keyword) || text.includes(p.keyword));

  if (text.includes('ポジション') || matchedPos || text.includes('適性') || text.includes('役割')) {
    if (role === 'coach') {
      if (matchedPos && matchedPos.pos !== player.currentPosition) {
        if (player.coachTrust >= 55) {
          return {
            replyText: `なるほど、${matchedPos.pos}でプレーしてみたいという熱意があるのか。よし、お前の挑戦する姿勢は認める。今週の紅白戦で${matchedPos.pos}のテスト起用を試してみよう。そこで結果を出せるかだな。`,
            coachTrustDelta: +3,
            positionChangeGranted: matchedPos.pos,
            memoryAdded: `監督に${matchedPos.pos}へのポジション変更を直訴し、テスト起用が承認された`
          };
        } else {
          return {
            replyText: `お前が${matchedPos.pos}をやりたい気持ちは聞いた。だが現時点では現在のポジション（${player.currentPosition}）での基礎技術と戦術浸透が最優先だ。まずは今の場所で絶対的な存在になってくれ。`,
            coachTrustDelta: -1,
            memoryAdded: `${matchedPos.pos}への変更を希望したが、現ポジションでの結果を求められた`
          };
        }
      }
      return {
        replyText: `お前を${player.currentPosition}で起用しているのは、お前の特徴を一番活かせると判断しているからだ。チームの戦術的バランスも考えての配置だぞ。自分の役割を信じてくれ。`,
        coachTrustDelta: +2,
        memoryAdded: '監督から現在のポジション起用の戦術的意図を説明された'
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION H: INTENT 7 - TRANSFERS & FUTURE (移籍・プロ・将来の夢)
  // ═══════════════════════════════════════════════════════════════
  if (text.includes('移籍') || text.includes('プロ') || text.includes('海外') || text.includes('オファー') || text.includes('スカウト') || text.includes('代表')) {
    if (role === 'coach') {
      if (player.coachTrust >= 65) {
        return {
          replyText: `将来プロを目指し、より高いレベルへ進みたいという野心は素晴らしい。お前の才能ならいつか声がかかるはずだ。だが正式なオファーが届く最後の日まで、このクラブのために全力で戦ってくれよ。`,
          coachTrustDelta: +1,
          transferDesireNoted: true,
          memoryAdded: '監督に移籍や将来の野心を打ち明け、理解と激励を得た'
        };
      } else {
        return {
          replyText: `うちのクラブで確固たるレギュラーにも定着していない段階で先の話を口にするのか？外に行けば今よりさらに厳しい競争が待っているぞ。逃げるのではなく、まずここで壁を乗り越えるべきではないか？`,
          coachTrustDelta: -5,
          memoryAdded: '監督に移籍を相談したが、現状での足元を固めるよう厳しく諭された'
        };
      }
    }

    if (role === 'friend' || person.relationship === 'best_friend') {
      return {
        replyText: pickUniqueReply([
          `お前なら絶対にプロになれるよ！オレ、お前のファン第一号だからな！海外移籍した時は絶対現地まで試合観に行くからな！`,
          `プロかー！かっこよすぎるだろ！お前が世界で活躍する姿、想像するだけでワクワクするわ！ずっと応援してるぞ！`
        ], person),
        affinityDelta: +8,
        trustDelta: +8,
        memoryAdded: '将来のプロサッカー選手への夢を熱く語り合い、応援を約束してもらった'
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION I: INTENT 8 - ROMANCE & CONFESSIONS (恋愛・告白・好意)
  // ═══════════════════════════════════════════════════════════════
  if (role === 'romance') {
    if (text.includes('好き') || text.includes('付き合って') || text.includes('付き合いたい') || text.includes('恋人') || text.includes('愛してる')) {
      if (player.age < 12) {
        return {
          replyText: `えっ…！？あ、ありがとう…！でも、私たちまだ小学生だし…！今はすごく仲良しのお友達でいたいな…！でも、そう言ってくれてすっごく嬉しいよ…！`,
          affinityDelta: +10,
          romanceProgression: 'confession_hold',
          memoryAdded: '小学生の頃に告白したが、仲の良い友達として絆が深まった'
        };
      } else if (person.affinity >= 65 && person.trust >= 50) {
        return {
          replyText: `…！本当に…？私もずっと、一生懸命サッカー頑張ってる姿を見てて…大好きだったの！私でよければ、ぜひ付き合ってください…！これからも一番近くで応援させてね！`,
          affinityDelta: +25,
          trustDelta: +20,
          romanceProgression: 'confession_accept',
          memoryAdded: '気持ちを伝えて両思いになり、交際をスタートした'
        };
      } else if (person.affinity < 40) {
        return {
          replyText: `えっ…！？急にどうしたの…？ごめんね、まだそういう風には考えられなくて…これからも普通のお友達でいてくれると嬉しいな…！`,
          affinityDelta: -5,
          romanceProgression: 'confession_reject',
          memoryAdded: '告白したが、友達のままでいたいと断られた'
        };
      } else {
        return {
          replyText: `ええっ…！びっくりした…！気持ちはすっごく嬉しいんだけど、今はお互い部活や勉強も大事だし…少し考えさせてほしいな…！`,
          affinityDelta: +5,
          romanceProgression: 'confession_hold',
          memoryAdded: '告白の返事を保留にされ、少し意識する関係になった'
        };
      }
    }

    if (text.includes('遊ぼ') || text.includes('デート') || text.includes('どこか') || text.includes('カフェ') || text.includes('一緒に')) {
      if (person.affinity >= 45) {
        return {
          replyText: pickUniqueReply([
            `うん、行きたい！次のオフの日、一緒にカフェ行ったり散歩しよう！楽しみにしてるね！`,
            `やったぁ！約束だよ！美味しいお店探しておくね！`
          ], person),
          affinityDelta: +8,
          trustDelta: +5,
          romanceProgression: 'date_agreed',
          memoryAdded: '放課後やオフの日に一緒に出かける約束をした'
        };
      } else {
        return {
          replyText: `今週末はちょっと家の用事があって行けないんだ、ごめんね！また今度みんなで遊ぼう！`,
          affinityDelta: +1
        };
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION J: INTENT 9 - APOLOGY (すいません・ごめんなさい・反省)
  // ═══════════════════════════════════════════════════════════════
  if (text.includes('すいません') || text.includes('すみません') || text.includes('ごめんなさい') || text.includes('反省') || text.includes('申し訳')) {
    if (role === 'coach') {
      return {
        replyText: pickUniqueReply([
          `失敗やミスは誰にでもある。大事なのはそこから何を学んで、次の練習でどう修正するかだ。切り替えていこう。`,
          `謝る必要はない。その反省をピッチでの全力プレーに変えてくれればそれでいい。次は期待しているぞ。`
        ], person),
        coachTrustDelta: +2,
        affinityDelta: +1
      };
    }
    return {
      replyText: pickUniqueReply([
        `気にすんなって！ミスはお互い様だろ！明日また頑張ろうぜ！`,
        `全然気にしてないよ！お互い助け合っていこう！`
      ], person),
      affinityDelta: +3
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION K: INTENT 10 - THANKS (ありがとう・感謝)
  // ═══════════════════════════════════════════════════════════════
  if (text.includes('ありがとう') || text.includes('感謝') || text.includes('助かり')) {
    if (role === 'coach') {
      return {
        replyText: pickUniqueReply([
          `その前向きな姿勢をグラウンドで体現してくれ。お前の成長がこのチームを強くするんだ。期待しているぞ。`,
          `礼には及ばん。お前の成長を見るのが私の喜びだ。これからも高みを目指していこう。`
        ], person),
        coachTrustDelta: +2,
        affinityDelta: +2
      };
    }
    return {
      replyText: pickUniqueReply([
        `どういたしまして！水臭いこと言うなよ、仲間だろ！`,
        `ふふ、喜んでもらえてよかった！いつでも頼ってね！`,
        `こちらこそいつもありがとう！これからもよろしくね！`
      ], person),
      affinityDelta: +4
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION L: INTENT 11 - STUDY & ACADEMICS (勉強・宿題・テスト)
  // ═══════════════════════════════════════════════════════════════
  if (text.includes('勉強') || text.includes('テスト') || text.includes('宿題') || text.includes('赤点') || text.includes('授業')) {
    if (role === 'teacher') {
      return {
        replyText: pickUniqueReply([
          `勉強への向上心が見えて嬉しいですね。わからない問題があれば放課後いつでも質問に来てください。文武両道を目指しましょう！`,
          `テスト勉強、計画的に進めていますか？サッカーと同じで日々の積み重ねが一番大切ですよ。`
        ], person),
        affinityDelta: +5,
        trustDelta: +5
      };
    }
    if (role === 'friend') {
      return {
        replyText: pickUniqueReply([
          `テスト勉強マジで終わらんわ…！笑 一緒にノート見せ合って乗り切ろうぜ！`,
          `宿題手つけてねー！笑 明日の朝、見せてくれたりしない…？お願い！笑`
        ], person),
        affinityDelta: +4
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION M: NATURAL PERSONALITY-SPECIFIC FALLBACK
  // (No robotic quotes, totally natural replies adhering to context)
  // ═══════════════════════════════════════════════════════════════
  if (role === 'coach') {
    const fallbacks = personality === 'strict' ? [
      `しっかり受け止めた。グラウンドの上では年齢も言い訳も通用しない。自分を信じて日々の練習に打ち込め。`,
      `分かった。日々のトレーニングに対する集中力を切らすなよ。グラウンドで結果を見せてくれ。`
    ] : [
      `受け止めたぞ。お前が真剣にサッカーと向き合っているのは伝わっている。次の練習も一緒に頑張ろう！`,
      `しっかり読んだぞ。何か迷うことがあれば遠慮なく話に来なさい。お前の成長を楽しみにしているぞ。`
    ];
    return {
      replyText: pickUniqueReply(fallbacks, person),
      coachTrustDelta: +1
    };
  }

  if (role === 'rival') {
    return {
      replyText: pickUniqueReply([
        `へぇ、お前も色々考えてるんだな。だけどピッチに立てば手加減なしだからな！覚悟しとけよ！`,
        `お前の意気込みは分かった。だが次の勝負は絶対に俺が勝つからな！楽しみにしてるぜ！`
      ], person),
      affinityDelta: +2,
      trustDelta: +2
    };
  }

  if (role === 'romance') {
    return {
      replyText: pickUniqueReply([
        `メッセージありがとう！いつもサッカーで忙しいのに連絡くれてすっごく嬉しいな！明日学校で話そうね！`,
        `ふふ、メッセージ読んだよ！いつもあなたのこと応援してるからね！明日も頑張ってね！`
      ], person),
      affinityDelta: +3,
      trustDelta: +2
    };
  }

  if (role === 'family') {
    return {
      replyText: pickUniqueReply([
        `メッセージ読んだよ！怪我しないように気をつけて、ご飯たくさん食べて早く寝るのよ！`,
        `いつも応援してるからね。困ったことがあったらいつでもお父さんとお母さんに話しなさいね。`
      ], person),
      affinityDelta: +3
    };
  }

  if (role === 'teacher') {
    return {
      replyText: pickUniqueReply([
        `連絡ありがとうございます。健康管理には十分注意して、学校生活もサッカーも充実させてくださいね。`,
        `メッセージ確認しました。困ったことがあればいつでも職員室に相談に来てくださいね。`
      ], person),
      affinityDelta: +2,
      trustDelta: +2
    };
  }

  // General Friend fallback
  return {
    replyText: pickUniqueReply([
      `メッセージありがとな！明日も学校と部活、一緒に気合入れて頑張ろうぜ！`,
      `読んだ読んだ！明日学校でまた詳しく話そうぜ！練習遅刻すんなよ！笑`
    ], person),
    affinityDelta: +2
  };
}
