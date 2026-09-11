import { GameState, FreeTimeActivity, Person, Condition, StatExp } from '../types/footballLife';
import { getRandomElement, getRandomInt } from '../data/worldData';

export interface FreeTimeResult {
  fatigueDelta: number;
  conditionChange?: Condition;
  academicDelta?: number;
  statExpGained?: Partial<StatExp>;
  friendAffinityDelta?: { personId: string; delta: number; becameBestFriend?: boolean };
  coachTrustDelta?: number;
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
  const { player, contacts } = gameState;

  switch (activity) {
    case 'individual_practice':
    case 'solo_practice': {
      const stat: keyof StatExp = options?.targetStat || 'shooting';
      const statLabels: Record<keyof StatExp, string> = {
        shooting: 'シュート練習',
        passing: 'ロングキック・パス練習',
        dribbling: 'コーンドリブル練習',
        pace: 'ダッシュ・アジリティ強化',
        defending: '対人ディフェンス・ステップ練習',
        physical: '体幹トレーニング・筋力強化',
        tacticalSense: '戦術ノート・ポジショニング研究',
        mental: 'メンタルトレーニング',
        stamina: '長距離走・インターバル走'
      };

      const expGain = getRandomInt(3, 6);
      const fatigueCost = getRandomInt(8, 14);

      return {
        fatigueDelta: fatigueCost,
        statExpGained: { [stat]: expGain },
        coachTrustDelta: +1,
        logText: `放課後にグラウンドで『${statLabels[stat] || '自主トレ'}』の自主練を行いました。（経験値+${expGain}% / 疲労+${fatigueCost}%）`
      };
    }

    case 'study': {
      const academicGain = Math.random() < 0.7 ? 1 : 0;
      return {
        fatigueDelta: +2,
        academicDelta: academicGain,
        logText: academicGain > 0
          ? `机に向かって予習・復習に取り組みました。コツコツとした勉強の成果で学力が1点上がりました！（現在: ${player.academicScore + 1}点）`
          : `教科書を開いて勉強しましたが、難しい単元でなかなか頭に入りませんでした。（学力変動なし）`
      };
    }

    case 'videogame':
    case 'game_relax': {
      return {
        fatigueDelta: 0,
        conditionChange: player.condition === 'terrible' ? 'poor' : player.condition,
        logText: '部屋でサッカーゲームや新作アクションゲームに熱中しました。気分転換になりましたが、体の疲労はそのままです。'
      };
    }

    case 'hangout_friend': {
      const friend = contacts.find(c => c.id === options?.friendId) || contacts.find(c => c.role === 'friend');
      if (!friend) {
        return {
          fatigueDelta: 0,
          logText: '友達と遊ぼうと誘いましたが、都合が合わず一人で近所を散歩して過ごしました。'
        };
      }

      const affinityGain = getRandomInt(4, 8);
      const newAffinity = Math.min(100, friend.affinity + affinityGain);
      let becameBestFriend = false;

      if (friend.role === 'friend' && friend.relationship !== 'best_friend' && newAffinity >= 80) {
        becameBestFriend = true;
      }

      return {
        fatigueDelta: +2,
        friendAffinityDelta: {
          personId: friend.id,
          delta: affinityGain,
          becameBestFriend
        },
        logText: becameBestFriend
          ? `【親友誕生！】${friend.name}と公園でボールを蹴りながら互いの本音を語り合い、かけがえのない『親友』になりました！`
          : `${friend.name}と一緒に遊んで楽しい時間を過ごしました。（親密度+${affinityGain}）`
      };
    }

    case 'sleep': {
      const hours = options?.sleepHours ?? 8;
      if (hours >= 7 && hours <= 9) {
        return {
          fatigueDelta: -16,
          conditionChange: 'good',
          logText: `8時間の質の高い睡眠をとりました。疲労が抜け、体調と集中力が充実しています！（疲労-16%）`
        };
      } else if (hours < 6) {
        return {
          fatigueDelta: +6,
          conditionChange: 'poor',
          logText: `夜更かしをして睡眠不足になってしまいました。体が重く、集中力が散漫です。（疲労+6% / コンディション低下）`
        };
      } else {
        return {
          fatigueDelta: -8,
          conditionChange: 'normal',
          coachTrustDelta: -1,
          logText: `昼過ぎまで11時間以上寝てしまい、体がだるく生活リズムが崩れてしまいました。`
        };
      }
    }

    case 'rest': {
      return {
        fatigueDelta: -10,
        conditionChange: 'normal',
        logText: '家でストレッチをして静かに休養を取りました。徐々に疲労が癒やされていきます。（疲労-10%）'
      };
    }

    case 'tactics_study': {
      return {
        fatigueDelta: +3,
        statExpGained: { tacticalSense: 5 },
        coachTrustDelta: +1,
        logText: '過去の試合映像や世界のトップリーグの試合をノートを取りながら研究しました。（戦術眼EXP+5% / 監督信頼度+1）'
      };
    }

    case 'sns_post': {
      return {
        fatigueDelta: 0,
        logText: 'スマートフォンを開いてSNSのタイムラインや仲間の投稿をチェックしました。'
      };
    }

    default: {
      return {
        fatigueDelta: -6,
        conditionChange: 'normal',
        logText: '放課後の時間をのんびりと過ごしてリフレッシュしました。（疲労-6%）'
      };
    }
  }
}
