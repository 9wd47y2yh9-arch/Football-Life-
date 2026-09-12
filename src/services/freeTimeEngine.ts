import { GameState, FreeTimeActivity, Condition, StatExp, FaceToFaceEvent } from '../types/footballLife';
import { getRandomInt, getRandomElement } from '../data/worldData';

export interface FreeTimeResult {
  fatigueDelta: number;
  conditionChange?: Condition;
  academicDelta?: number;
  statExpGained?: Partial<StatExp>;
  friendAffinityDelta?: { personId: string; delta: number; becameBestFriend?: boolean };
  coachTrustDelta?: number;
  rehabDaysReduced?: number;
  faceToFaceTriggered?: FaceToFaceEvent;
  logText: string;
}

export function executeFreeTimeActivity(
  activity: string,
  gameState: GameState,
  options?: {
    targetStat?: keyof StatExp;
    friendId?: string;
    sleepHours?: number;
  }
): FreeTimeResult {
  try {
    const player = gameState.player || ({} as any);
    const contacts = Array.isArray(gameState.contacts) ? gameState.contacts : [];

    switch (activity) {
      case 'individual_practice':
      case 'solo_practice': {
        const stat: keyof StatExp = options?.targetStat || 'shooting';
        const statLabels: Record<keyof StatExp, string> = {
          shooting: 'シュート練習',
          passing: 'パス・ロングキック練習',
          dribbling: 'コーンドリブル特訓',
          pace: 'スプリント・アジリティ強化',
          defending: '対人守備・ポジショニング',
          physical: '体幹強化・自重トレーニング',
          tacticalSense: '戦術研究・視野拡大',
          mental: 'メンタルトレーニング',
          stamina: 'インターバル走・持久力'
        };

        const expGain = getRandomInt(4, 7);
        const fatigueCost = getRandomInt(8, 12);

        return {
          fatigueDelta: fatigueCost,
          statExpGained: { [stat]: expGain },
          coachTrustDelta: +1,
          logText: `放課後の自主練で『${statLabels[stat] || '個人技術'}』を磨きました。（${statLabels[stat] || stat} EXP +${expGain}% / 疲労 +${fatigueCost}%）`
        };
      }

      case 'physical_workout': {
        const workoutType = options?.targetStat === 'pace' ? 'sprint' : options?.targetStat === 'stamina' ? 'stamina' : 'core';
        let statKey: keyof StatExp = 'physical';
        let workoutName = '体幹トレーニング＆自重筋力強化';

        if (workoutType === 'sprint') {
          statKey = 'pace';
          workoutName = '短距離スプリント＆ラダードリル';
        } else if (workoutType === 'stamina') {
          statKey = 'stamina';
          workoutName = 'インターバルシャトルラン＆有酸素トレ';
        }

        const expGain = getRandomInt(5, 8);
        const fatigueCost = getRandomInt(10, 15);

        return {
          fatigueDelta: fatigueCost,
          statExpGained: { [statKey]: expGain },
          coachTrustDelta: +1,
          logText: `フィジカル強化として『${workoutName}』を敢行。（${statKey.toUpperCase()} EXP +${expGain}% / 疲労 +${fatigueCost}%）`
        };
      }

      case 'shooting_practice': {
        const expGain = getRandomInt(5, 8);
        const fatigueCost = getRandomInt(8, 13);
        return {
          fatigueDelta: fatigueCost,
          statExpGained: { shooting: expGain },
          coachTrustDelta: +1,
          logText: `様々な角度や距離からシュート練習を繰り返し、決定力を研ぎ澄ましました。（SHOOTING EXP +${expGain}% / 疲労 +${fatigueCost}%）`
        };
      }

      case 'condition_tuning': {
        // Condition promotion
        const currCond = player.condition || 'normal';
        let nextCond: Condition = 'good';
        if (currCond === 'terrible') nextCond = 'poor';
        else if (currCond === 'poor') nextCond = 'normal';
        else if (currCond === 'normal') nextCond = 'good';
        else if (currCond === 'good') nextCond = 'superb';
        else nextCond = 'superb';

        return {
          fatigueDelta: -12,
          conditionChange: nextCond,
          logText: `入念なストレッチと交代浴でコンディションを整えました。（疲労 -12% / コンディション: ${nextCond.toUpperCase()}へ上昇）`
        };
      }

      case 'rehab_session': {
        if (!player.injury) {
          return {
            fatigueDelta: -6,
            logText: '現在は怪我をしていないため、予防のアイシングと柔軟運動を行いました。'
          };
        }

        // 1 day reduction chance (65%)
        const reduced = Math.random() < 0.65 ? 1 : 0;
        return {
          fatigueDelta: -4,
          rehabDaysReduced: reduced,
          logText: reduced > 0
            ? `トレーナーの指導のもと慎重にリハビリを行い、患部の回復が1日早まりました！（復帰まで前進）`
            : `痛む患部のアイシングとマッサージを受け、無理のないペースで治癒を目指します。`
        };
      }

      case 'coach_consult': {
        const coach = contacts.find(c => c.role === 'coach') || contacts.find(c => c.role === 'assistant_coach');
        const coachName = coach ? coach.name : '監督';

        const faceToFace: FaceToFaceEvent = {
          id: `ftf_consult_${Date.now()}`,
          speakerName: coachName,
          speakerRole: coach?.role === 'coach' ? 'coach' : 'assistant_coach',
          speakerTitle: `${coachName}（指導者面談）`,
          situation: '練習前、グラウンド脇で監督・コーチに直接話しかけました。',
          dialogueText: `「お前か。どうした？練習や次の試合について、何か話したいことでもあるのか？」`,
          options: [
            {
              text: '「次の試合、先発スタメンで使ってください！」と直訴する',
              response: '「いい気迫だ。その積極性は嫌いじゃない。練習での動きと戦術理解が伴っていれば、ピッチに立たせてやる。」',
              trustDelta: player.fatigue < 40 ? 4 : 1,
              attitudeDelta: 3
            },
            {
              text: '「今の自分の課題や、改善すべき点を教えてください」と助言を乞う',
              response: '「真摯に成長しようとする姿勢は素晴らしい。基礎技術の正確さと、ボールを持たない時のポジショニングをさらに磨け。」',
              trustDelta: 3,
              attitudeDelta: 4
            },
            {
              text: '「コンディションを万全にして、チームの勝利に貢献します」と意気込みを伝える',
              response: '「うむ、頼もしいな。怪我や過度の疲労にだけは気をつけて、チームを引っ張ってくれ。」',
              trustDelta: 2,
              attitudeDelta: 2
            }
          ]
        };

        return {
          fatigueDelta: 0,
          coachTrustDelta: +1,
          faceToFaceTriggered: faceToFace,
          logText: `指導者に直接声をかけ、真摯に対面で面談を行いました。`
        };
      }

      case 'study': {
        const academicGain = Math.random() < 0.75 ? 1 : 0;
        return {
          fatigueDelta: +2,
          academicDelta: academicGain,
          logText: academicGain > 0
            ? `机に向かって学校の予習・復習に取り組みました。（学力 +1点 / 現在: ${(player.academicScore || 60) + 1}点）`
            : `教科書を開いて自習しましたが、集中が続かずあまり身に入りませんでした。（学力変動なし）`
        };
      }

      case 'videogame':
      case 'game_relax': {
        return {
          fatigueDelta: 0,
          conditionChange: player.condition === 'terrible' ? 'poor' : player.condition,
          logText: '部屋でサッカーゲームや映画を鑑賞してリフレッシュしました。（精神的リフレッシュ）'
        };
      }

      case 'hangout_friend': {
        const friend = contacts.find(c => c.id === options?.friendId) || contacts.find(c => c.role === 'friend') || contacts[0];
        if (!friend) {
          return {
            fatigueDelta: 0,
            logText: '友達に声をかけましたが都合が合わず、一人で近所を散歩して過ごしました。'
          };
        }

        const affinityGain = getRandomInt(4, 8);
        const newAffinity = Math.min(100, (friend.affinity || 50) + affinityGain);
        const becameBestFriend = friend.role === 'friend' && friend.relationship !== 'best_friend' && newAffinity >= 80;

        return {
          fatigueDelta: +2,
          friendAffinityDelta: {
            personId: friend.id,
            delta: affinityGain,
            becameBestFriend
          },
          logText: becameBestFriend
            ? `【親友誕生！】${friend.name}と語り合い、お互いにとってかけがえのない『親友』になりました！`
            : `${friend.name}と一緒に楽しく過ごしました。（親密度 +${affinityGain}）`
        };
      }

      case 'sleep': {
        const hours = options?.sleepHours ?? 8;
        if (hours >= 7 && hours <= 9) {
          return {
            fatigueDelta: -18,
            conditionChange: 'good',
            logText: `8時間の質の高い睡眠を取りました。（疲労 -18% / コンディション良好）`
          };
        } else if (hours < 6) {
          return {
            fatigueDelta: +5,
            conditionChange: 'poor',
            logText: `夜更かしをして睡眠不足になってしまいました。（疲労 +5% / コンディション低下）`
          };
        } else {
          return {
            fatigueDelta: -10,
            conditionChange: 'normal',
            coachTrustDelta: -1,
            logText: `昼過ぎまで寝すぎてしまい、体が少し重く感じられます。（疲労 -10%）`
          };
        }
      }

      case 'rest': {
        return {
          fatigueDelta: -14,
          conditionChange: 'normal',
          logText: '自宅でアイシングと静かな休養を取り、疲労を抜きました。（疲労 -14%）'
        };
      }

      case 'tactics_study': {
        return {
          fatigueDelta: +2,
          statExpGained: { tacticalSense: 6 },
          coachTrustDelta: +1,
          logText: 'トッププロの試合映像を戦術ノートを取りながら分析しました。（戦術眼 EXP +6% / 監督信頼度 +1）'
        };
      }

      case 'sns_post': {
        return {
          fatigueDelta: 0,
          logText: 'スマートフォンを開いてSNSの反響をチェックしました。'
        };
      }

      default: {
        return {
          fatigueDelta: -8,
          conditionChange: 'normal',
          logText: '放課後の時間をのんびりと過ごしてリフレッシュしました。（疲労 -8%）'
        };
      }
    }
  } catch (error) {
    console.error('Safe error recovery in executeFreeTimeActivity:', error);
    return {
      fatigueDelta: -5,
      logText: '穏やかな時間を過ごして体力を整えました。（安全処理完了）'
    };
  }
}
