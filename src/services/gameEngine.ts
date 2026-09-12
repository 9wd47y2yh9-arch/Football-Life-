import { GameState, Position, MatchFixture, OffSeasonData } from '../types/footballLife';
import { generateDailyCPUSNSPosts } from './snsEngine';
import { checkForIncomingOffers, generateScoutInterests } from './transferEngine';
import { checkSchoolEvents, handleAgeTransition } from './schoolEngine';
import { getRandomInt, PLAYSTYLES } from '../data/worldData';
import { applyStatGainsAndRecalculateOvr } from './trainingEngine';
import { generateLeagueSeason, calculatePlayerOVR } from './matchEngine';

/**
 * Finds the next upcoming unplayed fixture
 */
export function getNextUpcomingMatch(gameState: GameState): MatchFixture | null {
  if (!gameState.leagueFixtures || gameState.leagueFixtures.length === 0) return null;

  const unplayedFuture = gameState.leagueFixtures.filter(
    f => !f.played && f.date >= gameState.currentDate
  );
  if (unplayedFuture.length > 0) {
    unplayedFuture.sort((a, b) => a.date.localeCompare(b.date));
    return unplayedFuture[0];
  }

  // Fallback to any unplayed
  const anyUnplayed = gameState.leagueFixtures.filter(f => !f.played);
  if (anyUnplayed.length > 0) {
    anyUnplayed.sort((a, b) => a.date.localeCompare(b.date));
    return anyUnplayed[0];
  }

  return null;
}

/**
 * Computes calendar days between two ISO date strings (fromDate -> toDate)
 */
export function getDaysBetweenDates(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 0;
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Adds integer days to an ISO YYYY-MM-DD date string using pure UTC calendar math
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + days));
  const ny = utcDate.getUTCFullYear();
  const nm = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/**
 * Formats an ISO YYYY-MM-DD date string to Japanese format (e.g. 2026年6月15日 (月))
 * Guaranteed 100% immune to client timezone offset issues.
 */
export function formatDateJapanese(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = daysOfWeek[utcDate.getUTCDay()];
  return `${year}年${month}月${day}日 (${dayOfWeek})`;
}

/**
 * Computes days remaining until the next match fixture
 */
export function getDaysUntilNextMatch(gameState: GameState): number {
  const next = getNextUpcomingMatch(gameState);
  if (!next) return 999;
  return getDaysBetweenDates(gameState.currentDate, next.date);
}

/**
 * Checks if all fixtures are played and initializes Off-Season transition
 */
export function checkAndTriggerOffSeason(gameState: GameState): GameState {
  if (gameState.activeOffSeason) return gameState;
  if (!gameState.leagueFixtures || gameState.leagueFixtures.length === 0) return gameState;

  const allPlayed = gameState.leagueFixtures.every(f => f.played);
  if (!allPlayed) return gameState;

  const standings = gameState.leagueStandings || [];
  const teamName = gameState.player.currentTeam.name;
  const playerRankIndex = standings.findIndex(s => s.teamName === teamName);
  const finalPosition = playerRankIndex >= 0 ? playerRankIndex + 1 : 4;
  const isChampion = finalPosition === 1;

  // Calculate player's individual season statistics
  const playerMatches = gameState.leagueFixtures.filter(f => f.playerPlayed);
  const playerGoals = playerMatches.reduce((acc, f) => acc + (f.playerGoals || 0), 0);
  const playerAssists = playerMatches.reduce((acc, f) => acc + (f.playerAssists || 0), 0);

  const offSeasonData: OffSeasonData = {
    seasonNumber: gameState.currentSeason,
    finalPosition,
    totalTeams: standings.length || 8,
    isChampion,
    playerMatchesPlayed: playerMatches.length,
    playerGoals,
    playerAssists,
    teamPoints: standings[playerRankIndex]?.points || 0,
    teamWon: standings[playerRankIndex]?.won || 0,
    teamDrawn: standings[playerRankIndex]?.drawn || 0,
    teamLost: standings[playerRankIndex]?.lost || 0
  };

  return {
    ...gameState,
    activeOffSeason: offSeasonData,
    dailyLogs: [
      {
        date: gameState.currentDate,
        text: `【シーズン終了】第${gameState.currentSeason}シーズンの全日程が終了！チーム最終順位: 第${finalPosition}位（${isChampion ? 'リーグ優勝達成！！' : 'シーズン閉幕'}）`,
        type: 'match'
      },
      ...gameState.dailyLogs
    ]
  };
}

/**
 * Transitions from Off-Season into a brand new season
 */
export function startNewSeason(gameState: GameState): GameState {
  const nextSeason = gameState.currentSeason + 1;
  const currentYear = new Date(gameState.currentDate).getFullYear();
  const nextYear = currentYear + 1;
  const nextDateStr = `${nextYear}-04-01`;

  // Age transition & school check
  const ageUpdates = handleAgeTransition({
    ...gameState,
    currentDate: nextDateStr
  });
  let updatedPlayer = ageUpdates.player ? { ...gameState.player, ...ageUpdates.player } : { ...gameState.player };
  let updatedTimeline = ageUpdates.timeline ? ageUpdates.timeline : [...gameState.timeline];

  // Refresh fresh 14-matchday league season for all 8 clubs
  const { fixtures, standings } = generateLeagueSeason(
    updatedPlayer.currentTeam.name,
    updatedPlayer.currentCountry,
    nextYear,
    updatedPlayer.age
  );

  // Full physical reset & injury clearance for the new season
  updatedPlayer.fatigue = 0;
  updatedPlayer.condition = 'superb';
  updatedPlayer.consecutiveMissedPractices = 0;
  updatedPlayer.injury = null;
  updatedPlayer.todayPracticeStatus = null;
  updatedPlayer.todayPracticeReason = undefined;

  updatedTimeline.unshift({
    id: `tl_season_${nextSeason}_${Date.now()}`,
    age: updatedPlayer.age,
    date: nextDateStr,
    title: `新シーズン（シーズン${nextSeason}）開幕！`,
    description: `${updatedPlayer.schoolName}・${updatedPlayer.currentTeam.name}での新シーズンが幕を開けた。新たな全14節の戦いに挑む。`,
    type: 'trophy'
  });

  return {
    ...gameState,
    currentSeason: nextSeason,
    currentMatchday: 1,
    currentDate: nextDateStr,
    leagueFixtures: fixtures,
    leagueStandings: standings,
    player: updatedPlayer,
    timeline: updatedTimeline,
    activeOffSeason: null,
    activeMatch: null,
    freeTimeUsedToday: false,
    dailyLogs: [
      {
        date: nextDateStr,
        text: `【新シーズン開幕】シーズン${nextSeason}がスタート！心身ともに万全の状態で新たな1年が始まりました。`,
        type: 'match'
      },
      ...gameState.dailyLogs
    ]
  };
}

/**
 * Advances a single day with full simulation logic
 */
export function advanceToNextDay(gameState: GameState): GameState {
  if (gameState.isRetired) {
    return gameState;
  }

  // Calculate next date safely using pure UTC calendar math
  const nextDateStr = addDaysToDateStr(gameState.currentDate, 1);
  const dayCount = gameState.dayCount + 1;

  let player = { ...gameState.player };
  let contacts = [...gameState.contacts];
  let timeline = [...gameState.timeline];
  let dailyLogs = [...gameState.dailyLogs];
  let pendingEvents = [...gameState.pendingEvents];
  let updatedRecentContext = { ...(gameState.recentContext || {}) };

  // 1. Practice handling for concluding day
  const [currY, currM, currD] = gameState.currentDate.split('-').map(Number);
  const concludingDateObj = new Date(Date.UTC(currY, currM - 1, currD));
  const concludingDayOfWeek = concludingDateObj.getUTCDay();
  const concludingIsMatch = gameState.leagueFixtures.some(f => f.date === gameState.currentDate);
  const concludingHadPractice = !concludingIsMatch && player.currentTeam?.practiceSchedule?.includes(concludingDayOfWeek);

  if (concludingHadPractice && !player.injury) {
    if (!player.todayPracticeStatus) {
      // Mild decay if left unselected in manual mode, but avoid excessive destruction
      player.coachTrust = Math.max(0, player.coachTrust - 2);
    }
  }

  // 2. Natural overnight slight fatigue recovery
  const naturalRecovery = player.fatigue > 20 ? getRandomInt(5, 8) : getRandomInt(3, 5);
  player.fatigue = Math.max(0, player.fatigue - naturalRecovery);

  // 3. Natural Injury progression
  if (player.injury) {
    const remaining = player.injury.daysRemaining - 1;
    if (remaining <= 0) {
      dailyLogs.unshift({
        date: nextDateStr,
        text: `【怪我完治】『${player.injury.name}』が完治しました！全体練習への復帰および公式戦出場資格が回復しました！`,
        type: 'training'
      });
      player.injury = null;
    } else {
      player.injury = {
        ...player.injury,
        daysRemaining: remaining
      };
    }
  }

  // 4. Age Check
  const [bY, bM, bD] = player.birthDate.split('-').map(Number);
  const [nY, nM, nD] = nextDateStr.split('-').map(Number);
  if (bM === nM && bD === nD) {
    const ageUpdates = handleAgeTransition({ ...gameState, currentDate: nextDateStr, player, timeline });
    if (ageUpdates.player) player = { ...player, ...ageUpdates.player };
    if (ageUpdates.timeline) timeline = ageUpdates.timeline;

    if (player.age === 13) {
      let highestPos: Position = player.currentPosition;
      let highestCount = 0;
      for (const [pos, count] of Object.entries(player.positionPlayCounts || {})) {
        if (count > highestCount) {
          highestCount = count;
          highestPos = pos as Position;
        }
      }
      player.basePosition = highestPos;
      timeline.unshift({
        id: `pos_lock_${Date.now()}`,
        age: 13,
        date: nextDateStr,
        title: '基本ポジションの確立',
        description: `10〜12歳の育成年代で最も経験を積んだ『${highestPos}』が正式な基本ポジションとして確立された。`,
        type: 'milestone'
      });
    }

    if (player.age >= 60) {
      return {
        ...gameState,
        currentDate: nextDateStr,
        dayCount,
        player,
        timeline,
        isRetired: true
      };
    }
  }

  // 5. Daily CPU SNS posts (No spontaneous unsolicited direct messages!)
  const newCPUSNSPosts = generateDailyCPUSNSPosts({ ...gameState, player, contacts, currentDate: nextDateStr });
  const allPosts = [...newCPUSNSPosts, ...gameState.snsPosts].slice(0, 30);

  // 6. Transfer offers and scout interests
  const newOffers = checkForIncomingOffers({ ...gameState, player });
  const allOffers = [...newOffers, ...gameState.transferOffers];
  const updatedScouts = generateScoutInterests({ ...gameState, player });

  // 7. School events
  const schoolEvent = checkSchoolEvents(nextDateStr);
  if (schoolEvent) {
    pendingEvents.push({
      id: `school_${schoolEvent.id}_${Date.now()}`,
      title: schoolEvent.name,
      description: schoolEvent.description,
      category: 'school',
      options: schoolEvent.choices.map(c => ({
        label: c.text,
        actionType: 'school_choice',
        payload: c
      }))
    });
  }

  // 8. Match fixture for today
  let activeMatch = gameState.activeMatch;
  const todayFixture = gameState.leagueFixtures.find(f => f.date === nextDateStr && !f.played);
  if (todayFixture && !activeMatch) {
    activeMatch = todayFixture;
  }

  let nextState: GameState = {
    ...gameState,
    currentDate: nextDateStr,
    dayCount,
    freeTimeUsedToday: false,
    player: {
      ...player,
      todayPracticeStatus: null,
      todayPracticeReason: undefined
    },
    contacts,
    recentContext: updatedRecentContext,
    snsPosts: allPosts,
    transferOffers: allOffers,
    scoutInterests: updatedScouts,
    timeline,
    dailyLogs,
    pendingEvents,
    activeMatch
  };

  // Check if off-season should trigger
  nextState = checkAndTriggerOffSeason(nextState);

  return nextState;
}

/**
 * Executes a single daily simulation step during auto-advancement
 */
export function advanceSingleAutoStep(state: GameState): GameState {
  let nextState = { ...state };
  const [sY, sM, sD] = nextState.currentDate.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(sY, sM - 1, sD)).getUTCDay();
  const isPracticeDay = nextState.player.currentTeam?.practiceSchedule?.includes(dayOfWeek);

  if (!nextState.player.injury && isPracticeDay) {
    const baseExp = {
      tacticalSense: 2,
      stamina: 2,
      passing: 1,
      dribbling: 1
    };

    if (nextState.player.playstyle && PLAYSTYLES[nextState.player.playstyle]) {
      for (const bonusStat of PLAYSTYLES[nextState.player.playstyle].growthBonus) {
        (baseExp as any)[bonusStat] = ((baseExp as any)[bonusStat] || 0) + 2;
      }
    }

    const { updatedPlayer } = applyStatGainsAndRecalculateOvr(nextState.player, baseExp);
    updatedPlayer.fatigue = Math.min(35, Math.max(10, updatedPlayer.fatigue + 5));
    updatedPlayer.coachTrust = Math.min(100, updatedPlayer.coachTrust + 0.5);
    updatedPlayer.todayPracticeStatus = 'attended';
    nextState.player = updatedPlayer;
  }

  return advanceToNextDay(nextState);
}

/**
 * Automates daily progression until 5 days before the next match fixture or until interrupted
 * by important milestones (offers, injury cure, special face-to-face events).
 */
export function advanceUntilDaysBeforeNextMatch(
  initialState: GameState,
  targetDaysBefore = 5
): {
  finalState: GameState;
  daysAdvanced: number;
  stoppedReason: 'match_prep' | 'injury_cured' | 'transfer_offer' | 'event_pending' | 'season_end' | 'already_within_5_days';
} {
  let state = { ...initialState };
  let daysAdvanced = 0;
  const initialInjuryStatus = state.player.injury !== null;
  const initialOffersCount = (state.transferOffers || []).length;

  // If already 5 days or fewer until next match, strictly do NOT advance
  const initialDaysUntil = getDaysUntilNextMatch(state);
  if (initialDaysUntil <= targetDaysBefore) {
    return { finalState: state, daysAdvanced: 0, stoppedReason: 'already_within_5_days' };
  }

  while (daysAdvanced < 60) {
    // 1. Check if season has ended or is in off-season
    if (state.activeOffSeason || (state.leagueFixtures && state.leagueFixtures.every(f => f.played))) {
      state = checkAndTriggerOffSeason(state);
      return { finalState: state, daysAdvanced, stoppedReason: 'season_end' };
    }

    // 2. Advance 1 day
    state = advanceSingleAutoStep(state);
    daysAdvanced++;

    // 3. Check for interrupts: pending events with choices
    if ((state.pendingEvents || []).length > 0) {
      return { finalState: state, daysAdvanced, stoppedReason: 'event_pending' };
    }

    // 4. Check for interrupts: new transfer offers
    if ((state.transferOffers || []).length > initialOffersCount) {
      return { finalState: state, daysAdvanced, stoppedReason: 'transfer_offer' };
    }

    // 5. Check if injury just healed during auto-advance
    if (initialInjuryStatus && state.player.injury === null) {
      return { finalState: state, daysAdvanced, stoppedReason: 'injury_cured' };
    }

    // 6. Check distance to next match: stop precisely at 5 days before!
    const daysUntil = getDaysUntilNextMatch(state);
    if (daysUntil <= targetDaysBefore) {
      return { finalState: state, daysAdvanced, stoppedReason: 'match_prep' };
    }
  }

  return {
    finalState: state,
    daysAdvanced,
    stoppedReason: 'match_prep'
  };
}
