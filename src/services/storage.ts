import { GameState, Position, Gender, Team, Playstyle } from '../types/footballLife';
import { COUNTRIES, getRandomElement, PLAYSTYLES, getClubHomeBase, findRealProClubByName } from '../data/worldData';
import { generateInitialCharacters } from './characterEngine';
import { generateLeagueSeason, calculatePlayerOVR } from './matchEngine';
import { getPlayerMaxOvrForAge } from './trainingEngine';

const STORAGE_KEY = 'FOOTBALL_LIFE_SAVE_DATA_V1';

/**
 * Non-destructive safe migration function for existing save files.
 * Preserves all NPC relationships, stats, match history, and transfer logs,
 * while repairing inconsistencies (Chelsea with Madrid homebase, 18yo with 99 OVR, decimal coach trust).
 */
export function migrateGameState(data: any): GameState {
  if (!data || !data.player) return data;

  const player = data.player;

  // 1. Repair coachTrust to strictly integer (0-100)
  if (typeof player.coachTrust === 'number') {
    player.coachTrust = Math.round(Math.max(0, Math.min(100, player.coachTrust)));
  } else {
    player.coachTrust = 50;
  }

  // 2. Clamp all player stats to maximum 100, never 101+
  if (player.stats) {
    const isPro = (player.wage && player.wage > 0) || player.schoolStage === 'none' || (player.currentTeam && player.currentTeam.category === 'pro_club');
    const statCap = (!isPro && player.age <= 18) ? (player.age <= 12 ? 35 : player.age <= 15 ? 42 : 50) : 100;
    
    for (const key of Object.keys(player.stats) as Array<keyof typeof player.stats>) {
      player.stats[key] = Math.min(statCap, Math.min(100, Math.max(1, player.stats[key] || 30)));
    }
  }

  // 3. Re-calculate and clamp OVR according to age
  const maxOvr = getPlayerMaxOvrForAge(player);
  const rawOvr = calculatePlayerOVR(player.stats, player.currentPosition);
  player.ovr = Math.min(maxOvr, rawOvr);

  // 4. Synchronize homeBase and currentCountry with currentTeam
  const teamName = player.currentTeam?.name || '';
  player.homeBase = getClubHomeBase(teamName);

  const realClub = findRealProClubByName(teamName);
  if (realClub) {
    player.currentCountry = realClub.country;
  }

  // 5. Initialize funds and inventory if absent
  if (typeof player.funds !== 'number') {
    // Generous natural starting funds based on stage
    if (player.wage && player.wage > 0) {
      player.funds = Math.round(player.wage / 12);
    } else if (player.age >= 16) {
      player.funds = 50000;
    } else {
      player.funds = 20000;
    }
  }
  if (!Array.isArray(player.inventory)) {
    player.inventory = [];
  }
  if (!player.equippedGear) {
    player.equippedGear = {};
  }

  // 6. Ensure arrays and structures exist without resetting progress
  if (!data.activeFaceToFace) data.activeFaceToFace = null;
  if (!data.activeOffSeason) data.activeOffSeason = null;
  if (!Array.isArray(data.contacts)) data.contacts = [];
  if (!Array.isArray(data.timeline)) data.timeline = [];
  if (!Array.isArray(data.dailyLogs)) data.dailyLogs = [];
  if (!Array.isArray(data.snsPosts)) data.snsPosts = [];
  if (!Array.isArray(data.transferOffers)) data.transferOffers = [];
  if (!Array.isArray(data.scoutInterests)) data.scoutInterests = [];
  if (!Array.isArray(data.adminFeedbackLogs)) data.adminFeedbackLogs = [];
  if (!data.recentContext) data.recentContext = {};

  return data as GameState;
}

export function createNewGame(config: {
  name: string;
  gender: Gender;
  nationality: string;
  dualNationality?: string;
  birthplace: string;
  startingCountry: string;
  initialPosition: Position;
  playstyle: Playstyle;
  initialTeamIndex?: number;
}): GameState {
  const countryData = COUNTRIES[config.startingCountry] || COUNTRIES.japan;
  const teamIndex = config.initialTeamIndex ?? 0;
  const teamConfig = countryData.youthTeams[teamIndex] || countryData.youthTeams[0];

  const team: Team = {
    id: `team_start_${Date.now()}`,
    name: teamConfig.name,
    country: countryData.name,
    category: teamConfig.category,
    level: teamConfig.level,
    practiceDaysPerWeek: teamConfig.practiceDaysPerWeek,
    practiceSchedule: teamConfig.practiceSchedule,
    tactic: teamConfig.tactic,
    coachName: teamConfig.coachName,
    coachStyle: teamConfig.coachStyle
  };

  const schoolName = getRandomElement(countryData.schools.elementary);

  const initialPositionsCount: Record<Position, number> = {
    GK: 0, CB: 0, SB: 0, DMF: 0, CMF: 0, OMF: 0, WG: 0, ST: 0, CF: 0
  };
  initialPositionsCount[config.initialPosition] = 1;

  const initialStats = {
    pace: 30,
    shooting: 29,
    passing: 30,
    dribbling: 30,
    defending: 29,
    physical: 30,
    tacticalSense: 29,
    mental: 31,
    stamina: 32
  };

  // Apply minor playstyle flavor (+1)
  const pDef = PLAYSTYLES[config.playstyle];
  if (pDef) {
    for (const st of pDef.growthBonus) {
      if (initialStats[st] !== undefined) {
        initialStats[st] += 1;
      }
    }
  }

  // Position-specific base tuning (+1)
  if (config.initialPosition === 'GK') {
    initialStats.defending += 2;
  } else if (config.initialPosition === 'CB' || config.initialPosition === 'DMF') {
    initialStats.defending += 1;
  } else if (config.initialPosition === 'CF' || config.initialPosition === 'ST') {
    initialStats.shooting += 1;
  } else if (config.initialPosition === 'OMF' || config.initialPosition === 'CMF') {
    initialStats.passing += 1;
  } else if (config.initialPosition === 'WG' || config.initialPosition === 'SB') {
    initialStats.pace += 1;
  }

  // Overall rating: calculated from stats
  const ovr = calculatePlayerOVR(initialStats, config.initialPosition);

  const initialExp = {
    pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0, tacticalSense: 0, mental: 0, stamina: 0
  };

  const initialContacts = generateInitialCharacters(
    config.startingCountry,
    config.gender,
    schoolName,
    team.name,
    config.initialPosition,
    team.coachName,
    team.coachStyle as any
  );

  // Automatic Age 10: Start year is 2024
  const startYear = 2024;
  const birthYear = startYear - 10;
  const birthDate = `${birthYear}-04-01`;
  const startDate = `${startYear}-04-01`;

  const { fixtures, standings } = generateLeagueSeason(team.name, config.startingCountry, startYear, 10);
  const maxMatchday = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.matchday)) : 14;

  const snsHandle = `@${config.name.replace(/\s+/g, '').toLowerCase()}_10`;

  const initialTimeline = [
    {
      id: `tl_start_${Date.now()}`,
      age: 10,
      date: startDate,
      title: 'フットボール人生の幕開け',
      description: `10歳。${countryData.name}の地元にて『${team.name}』に加入。得意のプレースタイル『${pDef?.name || 'オールラウンド'}』を武器に、サッカー選手としての第一歩を踏み出した。`,
      type: 'start' as const
    }
  ];

  return {
    player: {
      id: `player_${Date.now()}`,
      name: config.name,
      gender: config.gender,
      birthDate,
      age: 10,
      nationality: config.nationality,
      dualNationality: config.dualNationality || undefined,
      birthplace: config.birthplace,
      startingCountry: config.startingCountry,
      currentCountry: config.startingCountry,
      basePosition: config.initialPosition,
      currentPosition: config.initialPosition,
      playstyle: config.playstyle,
      positionPlayCounts: initialPositionsCount,
      ovr,
      stats: initialStats,
      statExp: initialExp,
      fatigue: 15,
      condition: 'good',
      injury: null,
      todayPracticeStatus: null,
      todayPracticeReason: undefined,
      totalMissedPractices: 0,
      consecutiveMissedPractices: 0,
      practiceAttitude: 85,
      schoolName,
      schoolStage: 'elementary',
      academicScore: 65,
      schoolReputation: 50,
      currentTeam: team,
      coachTrust: 55,
      teamRole: 'starter',
      isLoaned: false,
      homeBase: getClubHomeBase(team.name),
      funds: 30000,
      inventory: [],
      equippedGear: {},
      fans: 3,
      snsFollowers: 22,
      snsHandle,
      wage: 0,
      marketValue: 100000,
      nationalTeamCaps: 0,
      nationalTeamGoals: 0,
      selectedNationalTeam: undefined,
      currentNationalTier: null
    },
    currentDate: startDate,
    dayCount: 1,
    currentSeason: 1,
    freeTimeUsedToday: false,
    contacts: initialContacts,
    activeChatPersonId: null,
    recentContext: {},
    snsPosts: [
      {
        id: 'post_init_1',
        authorId: 'media_init',
        authorName: '少年サッカーマガジン',
        authorHandle: '@junior_football_mag',
        authorRole: 'media',
        content: `新年度のジュニア年代が開幕！未来のスター候補たちが各地でボールを追いかけます。`,
        timestamp: '3日前',
        likes: 54,
        isLikedByPlayer: false,
        comments: []
      }
    ],
    leagueFixtures: fixtures,
    leagueStandings: standings,
    currentMatchday: 1,
    totalMatchdays: maxMatchday,
    activeMatch: null,
    activeFaceToFace: null,
    activeOffSeason: null,
    transferOffers: [],
    scoutInterests: [],
    adminFeedbackLogs: [],
    timeline: initialTimeline,
    dailyLogs: [
      {
        date: startDate,
        text: `10歳。${team.name}に入団しました。大きな夢に向かってキャリアがスタートします。`,
        type: 'event'
      }
    ],
    activePressConference: null,
    pendingEvents: [],
    isRetired: false
  };
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save game state to localStorage:', err);
  }
}

export function loadGameState(): GameState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return migrateGameState(parsed);
  } catch (err) {
    console.error('Failed to load game state from localStorage:', err);
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}
