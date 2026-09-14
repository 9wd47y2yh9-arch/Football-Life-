import { GameState, Injury, InjurySeverity, Condition, StatExp, PlayerStats, PracticeAbsenceReasonId, Player, Position } from '../types/footballLife';
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
/**
 * Calculates Growth Multiplier based on Age and Category
 * Strict age curve:
 * Elementary (10-12): ~30
 * Middle school (13-15): ~35
 * High school (16-18): ~43, strictly capped at 45!
 * Pro (20-33): gradual professional growth
 * Stats absolute hard cap: 100
 */
export function getPlayerGrowthMultiplier(player: Player): number {
  const age = player.age || 15;
  const isPro = (player.wage && player.wage > 0) || player.schoolStage === 'pro' || (player.currentTeam && player.currentTeam.category === 'pro');

  let ageFactor = 1.0;
  if (age >= 10 && age <= 12) {
    ageFactor = 0.8; // Elementary foundation
  } else if (age >= 13 && age <= 15) {
    ageFactor = 0.9; // Middle school gradual development
  } else if (age >= 16 && age <= 18) {
    // High school development - steady but disciplined so it reaches ~43 and never exceeds 45
    ageFactor = isPro ? 1.4 : 1.0;
  } else if (age >= 19 && age <= 23) {
    ageFactor = 1.6; // Early pro prime growth
  } else if (age >= 24 && age <= 29) {
    ageFactor = 1.8; // Professional peak prime
  } else if (age >= 30 && age <= 33) {
    ageFactor = 0.8; // Veteran maintenance
  } else {
    ageFactor = 0.4; // Late veteran gradual decline
  }

  let typeFactor = 1.0;
  switch (player.growthType) {
    case 'prodigy':
      typeFactor = 1.3;
      break;
    case 'early':
      typeFactor = age <= 21 ? 1.2 : 0.8;
      break;
    case 'late':
      typeFactor = age >= 23 ? 1.3 : 0.9;
      break;
    case 'normal':
    default:
      typeFactor = 1.0;
      break;
  }

  return ageFactor * typeFactor;
}

/**
 * Returns the strict maximum OVR permissible for the player's age and stage.
 * High School is strictly capped at 45.
 */
export function getPlayerMaxOvrForAge(player: Player): number {
  const age = player.age || 15;
  const isPro = (player.wage && player.wage > 0) || player.schoolStage === 'pro' || (player.currentTeam && player.currentTeam.category === 'pro');

  if (age <= 12) return 32;
  if (age <= 15 && !isPro) return 38;
  // High schoolers (16-18) non-pro strictly capped at 45
  if (age <= 18 && !isPro) return 45;
  if (age <= 18 && isPro) return 60;
  if (age <= 20) return 65;
  if (age <= 22) return 75;
  if (age <= 24) return 82;
  if (age <= 33) return 99; // Top pro peak
  return 99;
}

/**
 * Applies EXP gains, triggers stat level-ups when EXP >= 100, and recalculates OVR.
 * Enforces hard caps: stat <= 100, and age-based OVR caps (High school <= 45).
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
  const isPro = (player.wage && player.wage > 0) || player.schoolStage === 'pro' || (player.currentTeam && player.currentTeam.category === 'pro');
  
  // Stat ceiling based on stage:
  // Non-pro high schoolers cap individual stats at 50 so OVR never exceeds 45
  const statMax = (!isPro && updatedPlayer.age <= 18) ? (updatedPlayer.age <= 12 ? 35 : updatedPlayer.age <= 15 ? 42 : 50) : 100;

  for (const stat of statKeys) {
    const rawGain = expGained[stat] || 0;
    if (rawGain <= 0) continue;

    const currentVal = updatedPlayer.stats[stat] || 30;
    // Hard cap at 100 (and stage ceiling)
    if (currentVal >= statMax || currentVal >= 100) {
      updatedPlayer.statExp[stat] = 0;
      continue;
    }

    // Apply multiplier, with natural resistance as stat approaches ceiling
    const resistance = currentVal >= 85 ? 0.4 : currentVal >= 70 ? 0.7 : 1.0;
    const gain = Math.max(1, Math.round(rawGain * multiplier * resistance));
    const currentExp = updatedPlayer.statExp[stat] || 0;

    const totalExp = currentExp + gain;
    if (totalExp >= 100) {
      const levelsGained = Math.floor(totalExp / 100);
      updatedPlayer.statExp[stat] = totalExp % 100;
      // Absolute hard cap at 100, never 101+
      const newVal = Math.min(statMax, Math.min(100, currentVal + levelsGained));
      if (newVal > currentVal) {
        updatedPlayer.stats[stat] = newVal;
        upgradedStats.push(stat);
      }
    } else {
      updatedPlayer.statExp[stat] = totalExp;
    }
  }

  // Recalculate OVR whenever stats or level-ups happen
  const prevOvr = updatedPlayer.ovr;
  let rawOvr = calculatePlayerOVR(updatedPlayer.stats, updatedPlayer.currentPosition);
  
  // Strict age cap enforcement
  const maxOvr = getPlayerMaxOvrForAge(updatedPlayer);
  const cappedOvr = Math.min(maxOvr, Math.min(99, rawOvr));
  updatedPlayer.ovr = cappedOvr;

  return {
    updatedPlayer,
    upgradedStats,
    ovrChanged: cappedOvr !== prevOvr
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

    // Stat Exp Gain: Position-tailored and comprehensive with balanced team development
    const pos = player.currentPosition;
    const baseExp: Partial<StatExp> = {
      tacticalSense: getRandomInt(2, 5),
      stamina: getRandomInt(2, 4),
      mental: getRandomInt(1, 3)
    };

    if (pos === 'CF' || pos === 'ST') {
      baseExp.shooting = getRandomInt(3, 7);
      baseExp.pace = getRandomInt(2, 5);
      baseExp.dribbling = getRandomInt(2, 5);
      baseExp.physical = getRandomInt(2, 4);
    } else if (pos === 'WG') {
      baseExp.pace = getRandomInt(3, 7);
      baseExp.dribbling = getRandomInt(3, 6);
      baseExp.passing = getRandomInt(2, 5);
      baseExp.shooting = getRandomInt(2, 5);
    } else if (pos === 'OMF') {
      baseExp.passing = getRandomInt(3, 7);
      baseExp.dribbling = getRandomInt(3, 6);
      baseExp.shooting = getRandomInt(2, 5);
      baseExp.tacticalSense = getRandomInt(3, 6);
    } else if (pos === 'CMF' || pos === 'DMF') {
      baseExp.passing = getRandomInt(3, 6);
      baseExp.defending = getRandomInt(3, 6);
      baseExp.stamina = getRandomInt(3, 6);
      baseExp.physical = getRandomInt(2, 5);
    } else if (pos === 'CB' || pos === 'SB') {
      baseExp.defending = getRandomInt(4, 7);
      baseExp.physical = getRandomInt(3, 6);
      baseExp.pace = getRandomInt(2, 5);
      baseExp.stamina = getRandomInt(2, 5);
    } else if (pos === 'GK') {
      baseExp.defending = getRandomInt(4, 7);
      baseExp.physical = getRandomInt(3, 5);
      baseExp.mental = getRandomInt(3, 5);
    } else {
      baseExp.passing = getRandomInt(3, 6);
      baseExp.dribbling = getRandomInt(3, 6);
      baseExp.shooting = getRandomInt(3, 6);
    }

    // Apply playstyle growth bonuses!
    if (player.playstyle && PLAYSTYLES[player.playstyle]) {
      const pDef = PLAYSTYLES[player.playstyle];
      for (const bonusStat of pDef.growthBonus) {
        baseExp[bonusStat] = (baseExp[bonusStat] || 0) + getRandomInt(2, 4);
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

/**
 * Self Training (居残り自主練習):
 * Focuses on 1 or 2 specific attributes with higher exp gains,
 * but at cost of increased fatigue (+18 to +25) and risk of injury.
 */
export function processSelfPractice(
  gameState: GameState,
  targetStat: keyof PlayerStats,
  secondaryStat?: keyof PlayerStats
): {
  fatigueCost: number;
  statExpGained: Partial<StatExp>;
  injuryOccurred?: Injury;
  logText: string;
} {
  const { player } = gameState;
  const fatigueCost = getRandomInt(18, 25);
  const newFatigue = Math.min(100, player.fatigue + fatigueCost);

  let injuryOccurred: Injury | undefined = undefined;
  if (newFatigue >= 75) {
    const injuryChance = newFatigue >= 95 ? 0.7 : 0.25;
    if (Math.random() < injuryChance) {
      injuryOccurred = {
        name: '居残り練習での筋肉損傷・肉離れ',
        severity: 'moderate',
        daysRemaining: getRandomInt(7, 14),
        initialDays: 14
      };
    }
  }

  const expGained: Partial<StatExp> = {
    [targetStat]: getRandomInt(12, 18)
  };
  if (secondaryStat && secondaryStat !== targetStat) {
    expGained[secondaryStat] = getRandomInt(6, 10);
  }

  return {
    fatigueCost,
    statExpGained: expGained,
    injuryOccurred,
    logText: injuryOccurred
      ? `【居残り練習で負傷】疲労が蓄積した状態での居残り自主練習中、無理がたたり『${injuryOccurred.name}』を発症しました。`
      : `居残り自主練習を実施。自身の課題である重点項目（${targetStat}）の技術鍛錬に励みました。（疲労 +${fatigueCost}）`
  };
}

/**
 * Calculates EXP gains from match participation and performance.
 * (Goals, assists, defensive stops, match rating)
 */
export function calculateMatchExpGains(
  minutesPlayed: number,
  goals: number,
  assists: number,
  rating: number,
  position: Position
): Partial<StatExp> {
  if (minutesPlayed <= 0) return {};

  const exp: Partial<StatExp> = {
    stamina: getRandomInt(4, 8),
    tacticalSense: getRandomInt(3, 7)
  };

  // Performance bonuses
  if (goals > 0) {
    exp.shooting = (exp.shooting || 0) + goals * 12;
    exp.mental = (exp.mental || 0) + goals * 5;
  }
  if (assists > 0) {
    exp.passing = (exp.passing || 0) + assists * 10;
    exp.tacticalSense = (exp.tacticalSense || 0) + assists * 6;
  }
  if (rating >= 8.0) {
    exp.mental = (exp.mental || 0) + 6;
    exp.tacticalSense = (exp.tacticalSense || 0) + 6;
  } else if (rating >= 7.0) {
    exp.tacticalSense = (exp.tacticalSense || 0) + 3;
  }

  // Position-based match experience
  if (position === 'CF' || position === 'ST') {
    exp.shooting = (exp.shooting || 0) + getRandomInt(4, 8);
    exp.physical = (exp.physical || 0) + getRandomInt(2, 5);
  } else if (position === 'WG') {
    exp.pace = (exp.pace || 0) + getRandomInt(3, 7);
    exp.dribbling = (exp.dribbling || 0) + getRandomInt(3, 7);
  } else if (position === 'OMF') {
    exp.passing = (exp.passing || 0) + getRandomInt(4, 8);
    exp.dribbling = (exp.dribbling || 0) + getRandomInt(3, 6);
  } else if (position === 'CMF' || position === 'DMF') {
    exp.passing = (exp.passing || 0) + getRandomInt(3, 6);
    exp.defending = (exp.defending || 0) + getRandomInt(3, 6);
    exp.stamina = (exp.stamina || 0) + getRandomInt(3, 6);
  } else if (position === 'CB' || position === 'SB') {
    exp.defending = (exp.defending || 0) + getRandomInt(4, 8);
    exp.physical = (exp.physical || 0) + getRandomInt(3, 6);
  } else if (position === 'GK') {
    exp.defending = (exp.defending || 0) + getRandomInt(5, 9);
    exp.mental = (exp.mental || 0) + getRandomInt(3, 6);
  }

  return exp;
}
