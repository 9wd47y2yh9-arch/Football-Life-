import { GameState, Injury, InjurySeverity, Condition, StatExp, PlayerStats, PracticeAbsenceReasonId, Player } from '../types/footballLife';
import { getRandomElement, getRandomInt, PRACTICE_ABSENCE_REASONS, PLAYSTYLES } from '../data/worldData';
import { calculatePlayerOVR } from './matchEngine';

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

/**
 * Calculates Growth Multiplier based on Age and Growth Type
 * (Golden age 15-24 accelerates growth, removes 40 OVR cap, enables scaling to 90+)
 */
export function getPlayerGrowthMultiplier(player: Player): number {
  const age = player.age || 15;
  const growthType = player.growthType || 'normal';

  let ageFactor = 1.0;
  if (age >= 10 && age <= 14) {
    ageFactor = 1.4; // Junior foundation
  } else if (age >= 15 && age <= 19) {
    ageFactor = 2.4; // Golden age explosive growth
  } else if (age >= 20 && age <= 24) {
    ageFactor = 2.0; // Early career prime expansion
  } else if (age >= 25 && age <= 28) {
    ageFactor = 1.5; // Peak mastery
  } else if (age >= 29 && age <= 33) {
    ageFactor = 1.1; // Veteran consolidation
  } else {
    ageFactor = 0.8; // Late career
  }

  let typeFactor = 1.0;
  switch (growthType) {
    case 'prodigy':
      typeFactor = 1.8;
      break;
    case 'early':
      typeFactor = age <= 21 ? 1.5 : 0.9;
      break;
    case 'late':
      typeFactor = age >= 20 ? 1.6 : 1.1;
      break;
    case 'normal':
    default:
      typeFactor = 1.2;
      break;
  }

  return ageFactor * typeFactor;
}

/**
 * Applies EXP gains, triggers stat level-ups when EXP >= 100, and recalculates OVR up to 99
 */
export function applyStatGainsAndRecalculateOvr(
  player: Player,
  expGained: Partial<StatExp>
): {
  updatedPlayer: Player;
  upgradedStats: string[];
  ovrChanged: boolean;
} {
  const updatedPlayer: Player = {
    ...player,
    stats: { ...player.stats },
    statExp: { ...player.statExp }
  };

  const multiplier = getPlayerGrowthMultiplier(player);
  const upgradedStats: string[] = [];
  const statKeys = Object.keys(expGained) as Array<keyof StatExp>;

  for (const stat of statKeys) {
    const rawGain = expGained[stat] || 0;
    if (rawGain <= 0) continue;

    // Apply age and growth multiplier
    const gain = Math.max(1, Math.round(rawGain * multiplier));
    const currentExp = updatedPlayer.statExp[stat] || 0;
    const currentVal = updatedPlayer.stats[stat] || 30;

    const totalExp = currentExp + gain;
    if (totalExp >= 100) {
      const levelsGained = Math.floor(totalExp / 100);
      updatedPlayer.statExp[stat] = totalExp % 100;
      // Allow growth up to 99 (no 40 cap!)
      updatedPlayer.stats[stat] = Math.min(99, currentVal + levelsGained);
      upgradedStats.push(stat);
    } else {
      updatedPlayer.statExp[stat] = totalExp;
    }
  }

  // Recalculate OVR whenever stats or level-ups happen
  const prevOvr = updatedPlayer.ovr;
  const newOvr = calculatePlayerOVR(updatedPlayer.stats, updatedPlayer.currentPosition);
  updatedPlayer.ovr = newOvr;

  return {
    updatedPlayer,
    upgradedStats,
    ovrChanged: newOvr !== prevOvr
  };
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

    // Stat Exp Gain: Position-tailored and comprehensive with playstyle bonuses
    const pos = player.currentPosition;
    const baseExp: Partial<StatExp> = {
      tacticalSense: getRandomInt(6, 12),
      stamina: getRandomInt(5, 10),
      mental: getRandomInt(4, 8)
    };

    if (pos === 'CF' || pos === 'ST') {
      baseExp.shooting = getRandomInt(10, 18);
      baseExp.pace = getRandomInt(6, 12);
      baseExp.dribbling = getRandomInt(6, 12);
      baseExp.physical = getRandomInt(5, 10);
    } else if (pos === 'WG') {
      baseExp.pace = getRandomInt(10, 18);
      baseExp.dribbling = getRandomInt(10, 16);
      baseExp.passing = getRandomInt(6, 12);
      baseExp.shooting = getRandomInt(6, 12);
    } else if (pos === 'OMF') {
      baseExp.passing = getRandomInt(10, 18);
      baseExp.dribbling = getRandomInt(8, 14);
      baseExp.shooting = getRandomInt(6, 12);
      baseExp.tacticalSense = getRandomInt(8, 15);
    } else if (pos === 'CMF' || pos === 'DMF') {
      baseExp.passing = getRandomInt(10, 16);
      baseExp.defending = getRandomInt(8, 14);
      baseExp.stamina = getRandomInt(8, 14);
      baseExp.physical = getRandomInt(6, 12);
    } else if (pos === 'CB' || pos === 'SB') {
      baseExp.defending = getRandomInt(12, 18);
      baseExp.physical = getRandomInt(8, 14);
      baseExp.pace = getRandomInt(6, 12);
      baseExp.stamina = getRandomInt(6, 12);
    } else if (pos === 'GK') {
      baseExp.defending = getRandomInt(14, 20);
      baseExp.physical = getRandomInt(8, 14);
      baseExp.mental = getRandomInt(8, 14);
    } else {
      baseExp.passing = getRandomInt(8, 14);
      baseExp.dribbling = getRandomInt(8, 14);
      baseExp.shooting = getRandomInt(8, 14);
    }

    // Apply playstyle growth bonuses!
    if (player.playstyle && PLAYSTYLES[player.playstyle]) {
      const pDef = PLAYSTYLES[player.playstyle];
      for (const bonusStat of pDef.growthBonus) {
        baseExp[bonusStat] = (baseExp[bonusStat] || 0) + getRandomInt(6, 12);
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

  if (player.rehabDoneToday) {
    return {
      daysReduced: 0,
      logText: '本日のリハビリはすでに終了しています。これ以上の無理は患部の悪化を招くため、十分な睡眠と休養を取ってください。'
    };
  }

  // Rehabilitation shortens recovery time slightly, but no instant cures (1 day max per session)
  const daysReduced = Math.random() < 0.65 ? 1 : 0;
  return {
    daysReduced,
    logText: daysReduced > 0
      ? `トレーナーの指導のもと慎重にリハビリを行い、患部の回復が順調に進みました！（全治が1日短縮）`
      : `アイシングとストレッチで患部のケアを行いました。無理のないペースで治癒を目指します。`
  };
}
