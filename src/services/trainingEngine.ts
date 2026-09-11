import { GameState, Injury, InjurySeverity, Condition, StatExp, PlayerStats, PracticeAbsenceReasonId } from '../types/footballLife';
import { getRandomElement, getRandomInt, PRACTICE_ABSENCE_REASONS, PLAYSTYLES } from '../data/worldData';

export interface DailyTrainingResult {
  attended: boolean;
  fatigueDelta: number;
  coachTrustDelta: number;
  attitudeDelta: number;
  statExpGained: Partial<StatExp>;
  statUpgraded?: string[];
  injuryOccurred?: Injury;
  logText: string;
  coachComment?: string;
}

export function processDailyTeamPractice(
  gameState: GameState,
  attend: boolean,
  absenceReasonId?: PracticeAbsenceReasonId,
  customReasonText?: string
): DailyTrainingResult {
  const { player } = gameState;
  const currentTeam = player.currentTeam;

  // Check if player is currently injured
  if (player.injury) {
    return {
      attended: false,
      fatigueDelta: -2,
      coachTrustDelta: 0,
      attitudeDelta: 0,
      statExpGained: {},
      logText: `負傷療養中のため、チーム練習は見学・治療に専念しました。（全治あと${player.injury.daysRemaining}日）`,
      coachComment: '焦るなよ。まずは怪我を治すことが第一優先だ。'
    };
  }

  if (attend) {
    // Attendance
    let fatigueCost = 10 + currentTeam.level * 2;
    // Tactic modifies physical load
    if (currentTeam.tactic === 'high_press') fatigueCost += 4;

    const newFatigue = Math.min(100, player.fatigue + fatigueCost);

    // Injury check based on fatigue
    let injuryOccurred: Injury | undefined = undefined;
    if (newFatigue >= 70) {
      const injuryChance = newFatigue >= 100 ? 1.0 : (newFatigue - 65) * 0.025;
      if (Math.random() < injuryChance) {
        const severity: InjurySeverity = newFatigue >= 90
          ? (Math.random() < 0.35 ? 'severe' : 'moderate')
          : (Math.random() < 0.7 ? 'minor' : 'moderate');

        const injuryNames = {
          minor: ['足首の軽い捻挫', '太ももの打撲', '軽い筋肉痛と張り'],
          moderate: ['ハムストリングの肉離れ', '膝の靭帯損傷（軽〜中度）', '足首の重い捻挫'],
          severe: ['前十字靭帯断裂', '足首骨折', '半月板損傷']
        };

        const days = severity === 'minor' ? getRandomInt(3, 6) : severity === 'moderate' ? getRandomInt(12, 20) : getRandomInt(35, 60);

        injuryOccurred = {
          name: getRandomElement(injuryNames[severity]),
          severity,
          daysRemaining: days,
          initialDays: days
        };
      }
    }

    // Stat Exp Gain: with playstyle bonuses
    const baseExp: Partial<StatExp> = {
      tacticalSense: getRandomInt(1, 3),
      stamina: getRandomInt(1, 3),
      passing: getRandomInt(1, 2),
      dribbling: getRandomInt(1, 2)
    };

    // Apply playstyle growth bonuses!
    if (player.playstyle && PLAYSTYLES[player.playstyle]) {
      const pDef = PLAYSTYLES[player.playstyle];
      for (const bonusStat of pDef.growthBonus) {
        baseExp[bonusStat] = (baseExp[bonusStat] || 0) + getRandomInt(2, 3);
      }
    }

    return {
      attended: true,
      fatigueDelta: fatigueCost,
      coachTrustDelta: +1,
      attitudeDelta: +2,
      statExpGained: baseExp,
      injuryOccurred,
      logText: injuryOccurred
        ? `【怪我発生】激しいチーム練習中、疲労困憊の体で接触し『${injuryOccurred.name}』を発症してしまいました。（全治${injuryOccurred.daysRemaining}日）`
        : `チーム全体練習（${currentTeam.name}）に参加。プレースタイル（${PLAYSTYLES[player.playstyle]?.name || '基本'}）を意識した反復練習に取り組みました。`,
      coachComment: 'いい集中力だったぞ。この調子を明日の練習にも繋げろ。'
    };
  } else {
    // Detailed Missed Practice handling
    const reasonKey = absenceReasonId || 'personal';
    const reasonDef = PRACTICE_ABSENCE_REASONS[reasonKey] || PRACTICE_ABSENCE_REASONS.other;
    const reasonLabel = reasonKey === 'other' && customReasonText?.trim()
      ? `その他（${customReasonText.trim()}）`
      : reasonDef.label;

    let trustPenalty = reasonDef.baseTrustImpact;
    let attitudePenalty = reasonDef.baseAttitudeImpact;

    // Consecutive absence escalating penalty even for legitimate reasons!
    const consecutive = player.consecutiveMissedPractices + 1;
    const totalMissed = player.totalMissedPractices + 1;

    if (consecutive >= 3) {
      trustPenalty -= (consecutive - 2) * 2;
      attitudePenalty -= 2;
    }
    if (totalMissed >= 8) {
      trustPenalty -= 1;
    }

    let log = `【練習欠席】理由: 『${reasonLabel}』により本日のチーム練習を不参加としました。`;
    let coachComment = reasonDef.coachMessage;

    if (consecutive >= 3) {
      coachComment = `連続で練習を休む（${consecutive}回目）のは、理由が何であれチームへのコミットメントに影響するぞ。自己管理を見直せ。`;
      log += `（連続欠席${consecutive}回目につき監督の懸念が高まりました）`;
    }

    return {
      attended: false,
      fatigueDelta: -6,
      coachTrustDelta: trustPenalty,
      attitudeDelta: attitudePenalty,
      statExpGained: {},
      logText: log,
      coachComment
    };
  }
}

export function performRehabilitation(gameState: GameState): {
  daysReduced: number;
  logText: string;
} {
  const { player } = gameState;
  if (!player.injury) {
    return { daysReduced: 0, logText: '現在怪我はしていません。' };
  }

  // Rehabilitation shortens recovery time slightly, but no instant cures
  const daysReduced = Math.random() < 0.65 ? 1 : 0;
  return {
    daysReduced,
    logText: daysReduced > 0
      ? `トレーナーの指導のもと慎重にリハビリを行い、患部の回復が順調に進みました！（復帰まで1日短縮）`
      : `アイシングとストレッチで患部のケアを行いました。無理のないペースで治癒を目指します。`
  };
}
