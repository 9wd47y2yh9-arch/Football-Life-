import { GameState, MatchFixture, LeagueStanding, MatchMoment, MatchEventLog, Position, PlayerStats } from '../types/footballLife';
import { COUNTRIES, getRandomElement, getRandomInt } from '../data/worldData';

/**
 * Calculates Position-Weighted OVR (Overall Rating)
 */
export function calculatePlayerOVR(stats: PlayerStats, position: Position): number {
  if (!stats) return 30;
  let total = 0;
  switch (position) {
    case 'CF':
    case 'ST':
      total = (stats.shooting || 30) * 0.30 + (stats.pace || 30) * 0.18 + (stats.dribbling || 30) * 0.16 + (stats.physical || 30) * 0.14 + (stats.tacticalSense || 30) * 0.11 + (stats.passing || 30) * 0.11;
      break;
    case 'WG':
      total = (stats.pace || 30) * 0.28 + (stats.dribbling || 30) * 0.25 + (stats.passing || 30) * 0.18 + (stats.shooting || 30) * 0.16 + (stats.stamina || 30) * 0.13;
      break;
    case 'OMF':
      total = (stats.passing || 30) * 0.26 + (stats.dribbling || 30) * 0.22 + (stats.tacticalSense || 30) * 0.20 + (stats.shooting || 30) * 0.16 + (stats.pace || 30) * 0.16;
      break;
    case 'CMF':
      total = (stats.passing || 30) * 0.25 + (stats.stamina || 30) * 0.20 + (stats.tacticalSense || 30) * 0.18 + (stats.dribbling || 30) * 0.14 + (stats.defending || 30) * 0.13 + (stats.physical || 30) * 0.10;
      break;
    case 'DMF':
      total = (stats.defending || 30) * 0.28 + (stats.physical || 30) * 0.22 + (stats.passing || 30) * 0.18 + (stats.tacticalSense || 30) * 0.18 + (stats.stamina || 30) * 0.14;
      break;
    case 'CB':
      total = (stats.defending || 30) * 0.35 + (stats.physical || 30) * 0.25 + (stats.tacticalSense || 30) * 0.18 + (stats.pace || 30) * 0.12 + (stats.stamina || 30) * 0.10;
      break;
    case 'SB':
      total = (stats.pace || 30) * 0.26 + (stats.stamina || 30) * 0.22 + (stats.defending || 30) * 0.20 + (stats.passing || 30) * 0.18 + (stats.dribbling || 30) * 0.14;
      break;
    case 'GK':
      total = (stats.defending || 30) * 0.40 + (stats.physical || 30) * 0.25 + (stats.mental || 30) * 0.20 + (stats.tacticalSense || 30) * 0.15;
      break;
    default:
      total = ((stats.pace || 30) + (stats.shooting || 30) + (stats.passing || 30) + (stats.dribbling || 30) + (stats.defending || 30) + (stats.physical || 30) + (stats.tacticalSense || 30) + (stats.mental || 30) + (stats.stamina || 30)) / 9;
  }
  return Math.max(20, Math.min(99, Math.round(total)));
}

/**
 * Robust, bug-free lineup role evaluation.
 * High coach trust (85-100), low fatigue, and healthy status guarantees starter!
 * Cured injuries restore immediate match eligibility without any permanent lockouts.
 */
export function evaluateLineupRole(gameState: GameState): 'starter' | 'bench' | 'out_of_squad' {
  const { player } = gameState;

  // 1. If currently injured, strictly out of squad
  if (player.injury && player.injury.daysRemaining > 0) {
    return 'out_of_squad';
  }

  // 2. Severe fatigue checks
  if (player.fatigue >= 88) {
    return 'out_of_squad';
  }
  if (player.fatigue >= 76) {
    return 'bench';
  }

  // 3. Absolute Guarantee Rule: Trust >= 85 and fatigue <= 45 with decent condition is GUARANTEED starter
  if (player.coachTrust >= 85 && player.fatigue <= 45 && player.condition !== 'terrible') {
    return 'starter';
  }

  // 4. Guaranteed at least Bench if Trust >= 65 and fatigue <= 60
  const guaranteedBench = player.coachTrust >= 65 && player.fatigue <= 60;

  // 5. Age-scaled expected OVR for fair progression:
  // Age 10-12 (Junior): ~28-32
  // Age 13-15 (Junior High): ~38-44
  // Age 16-18 (High School): ~50-58
  // Age 19+ (Pro/Adult): ~62-72
  let ageBaseline = 28;
  if (player.age >= 19) ageBaseline = 62;
  else if (player.age >= 16) ageBaseline = 50;
  else if (player.age >= 13) ageBaseline = 38;

  const teamLevel = player.currentTeam?.level || 1;
  const expectedOvr = ageBaseline + (teamLevel - 1) * 2.5;
  const ovrDiff = player.ovr - expectedOvr;

  // 6. Condition factor
  let conditionBonus = 0;
  if (player.condition === 'superb') conditionBonus = 10;
  else if (player.condition === 'good') conditionBonus = 4;
  else if (player.condition === 'poor') conditionBonus = -6;
  else if (player.condition === 'terrible') conditionBonus = -16;

  // 7. Trust bonus (scaled so 50 is neutral, 80+ is strong)
  const trustScore = (player.coachTrust - 50) * 0.55;

  // 8. Discipline: only penalize consecutive unexcused missed practices
  const attitudePenalty = Math.min(25, (player.consecutiveMissedPractices || 0) * 8);

  const totalScore = (ovrDiff * 1.2) + trustScore + conditionBonus - attitudePenalty;

  if (totalScore >= -2) {
    return 'starter';
  } else if (totalScore >= -20 || guaranteedBench) {
    return 'bench';
  } else {
    return 'out_of_squad';
  }
}

/**
 * Generates a full 14-matchday round-robin league schedule for all 8 clubs.
 * Creates matches for both the player's team and all other clubs.
 */
export function generateLeagueSeason(teamName: string, countryId: string, currentYear: number, playerAge = 10): {
  fixtures: MatchFixture[];
  standings: LeagueStanding[];
} {
  const country = COUNTRIES[countryId] || COUNTRIES.japan;

  // Age-based realistic competition name
  let competitionName = `${country.name} 全日本U-12育成リーグ`;
  if (playerAge >= 19) {
    competitionName = `${country.name} プロフェッショナルリーグ`;
  } else if (playerAge >= 16) {
    competitionName = `${country.name} U-18プレミア・プリンスリーグ`;
  } else if (playerAge >= 13) {
    competitionName = `${country.name} U-15クラブユース・高円宮杯`;
  }

  const candidateTeams = [
    teamName,
    ...country.youthTeams.map(t => t.name).filter(n => n !== teamName),
    ...country.famousClubs.slice(0, 4).map(c => `${c} ユース`)
  ];

  // Take unique 8 teams
  const uniqueTeams = Array.from(new Set(candidateTeams)).slice(0, 8);
  if (!uniqueTeams.includes(teamName)) {
    uniqueTeams[0] = teamName;
  }
  // If fewer than 8, pad with generic clubs
  while (uniqueTeams.length < 8) {
    uniqueTeams.push(`FC アカデミー ${uniqueTeams.length + 1}`);
  }

  const fixtures: MatchFixture[] = [];
  const numTeams = uniqueTeams.length; // 8
  const rounds = numTeams - 1; // 7 rounds per single round robin

  // Berger Round-Robin Pairing Algorithm for 8 teams
  // We do double round-robin: 14 matchdays
  let currentDate = new Date(`${currentYear}-04-14`);

  for (let cycle = 0; cycle < 2; cycle++) {
    for (let round = 0; round < rounds; round++) {
      const matchday = cycle * rounds + round + 1;
      // Advance 7 to 10 days per matchday
      currentDate.setDate(currentDate.getDate() + 7);
      const dateString = currentDate.toISOString().split('T')[0];

      // Form 4 pairs of matches for this round
      const roundTeams = [...uniqueTeams];
      // Polygon rotation: fix index 0, rotate indices 1..7 by 'round'
      const rotating = roundTeams.slice(1);
      const rotated: string[] = [];
      for (let i = 0; i < rotating.length; i++) {
        rotated.push(rotating[(i + round) % rotating.length]);
      }
      const teamsForRound = [roundTeams[0], ...rotated];

      for (let m = 0; m < numTeams / 2; m++) {
        let home = teamsForRound[m];
        let away = teamsForRound[numTeams - 1 - m];

        // Alternate home/away in second round-robin cycle
        if (cycle === 1 || (round + m) % 2 === 1) {
          const tmp = home;
          home = away;
          away = tmp;
        }

        const isPlayerTeamMatch = home === teamName || away === teamName;
        const isPlayerHome = home === teamName;

        fixtures.push({
          id: `fixture_md_${matchday}_${m}_${Date.now()}_${getRandomInt(100, 999)}`,
          date: dateString,
          matchday,
          competitionName: `${competitionName} (第${matchday}節)`,
          competitionType: 'league',
          homeTeam: home,
          awayTeam: away,
          isPlayerHome,
          played: false
        });
      }
    }
  }

  const standings: LeagueStanding[] = uniqueTeams.map(name => ({
    teamName: name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  }));

  return { fixtures, standings };
}

export function generateMatchMoments(playerRole: 'starter' | 'bench', position: Position): MatchMoment[] {
  const isStarter = playerRole === 'starter';
  const moments: MatchMoment[] = [];

  // Moment 1 (Early match or 1st half)
  if (isStarter) {
    moments.push({
      id: 'moment_1',
      minute: getRandomInt(18, 38),
      title: '前半の決定機演出',
      situation: '中盤で味方から縦パスを受ける。前線にスペースがあるが、相手DFが激しく寄せてきている！',
      options: [
        {
          text: 'ダイレクトで裏へスルーパスを送る',
          statUsed: 'passing',
          risk: 'medium',
          successOutcome: '見事な軌道のスルーパスがFWに通り、決定的なチャンスを創出！',
          failOutcome: '相手DFにコースを読まれ、パスカットされてしまった。',
          points: 2
        },
        {
          text: '鋭いターンで相手DFをかわして前を向く',
          statUsed: 'dribbling',
          risk: 'medium',
          successOutcome: '華麗なターンで相手を置き去りにし、一気に攻撃を加速させる！',
          failOutcome: 'トラップが大きくなり、相手にボールを突かれてしまった。',
          points: 2
        },
        {
          text: '無理せずキープして後方の味方に預ける',
          statUsed: 'tacticalSense',
          risk: 'low',
          successOutcome: '落ち着いたボールキープでリズムを作り、ポゼッションを安定させた。',
          failOutcome: '相手のプレッシャーを受け、苦しいバックパスになってしまった。',
          points: 1
        }
      ]
    });
  }

  // Moment 2 (Crucial situation in 2nd half)
  moments.push({
    id: 'moment_2',
    minute: getRandomInt(62, 85),
    title: 'ゴール前の緊迫した攻防',
    situation: 'ゴール前20m付近。味方の折り返しが足元に転がってきた！DFがブロックに飛んでくる！',
    options: [
      {
        text: '思い切って右足を振り抜くミドルシュート！',
        statUsed: 'shooting',
        risk: 'high',
        successOutcome: '強烈なシュートがゴールネットを揺らし、劇的な得点を記録！！',
        failOutcome: '相手DFの決死のブロックに阻まれ、枠を外れてしまった。',
        points: 3
      },
      {
        text: 'フェイントでDFを滑らせ、フリーの味方へラストパス',
        statUsed: 'tacticalSense',
        risk: 'medium',
        successOutcome: '完璧なお膳立て！味方が無人のゴールへ流し込み、見事なアシスト！',
        failOutcome: 'ラストパスがわずかにズレ、相手GKにキャッチされた。',
        points: 2
      },
      {
        text: '狭いスペースを細かなタッチでこじ開ける',
        statUsed: 'dribbling',
        risk: 'high',
        successOutcome: '相手DFの間を鮮やかにすり抜け、GKと1対1に持ち込んだ！',
        failOutcome: '相手のカバーリングに挟まれ、ボールを失ってしまった。',
        points: 3
      }
    ]
  });

  return moments;
}

export function simulateMatchResults(
  fixture: MatchFixture,
  gameState: GameState,
  momentChoices: Array<{ momentId: string; optionIndex: number; success: boolean }>
): {
  updatedFixture: MatchFixture;
  playerRating: number;
  playerGoals: number;
  playerAssists: number;
  coachTrustDelta: number;
  fansGained: number;
  ovrIncreased: boolean;
  fatigueCost: number;
  logs: MatchEventLog[];
} {
  const { player } = gameState;
  const role = fixture.playerRole || 'bench';
  const isStarter = role === 'starter';
  const isBench = role === 'bench';

  const logs: MatchEventLog[] = [];
  let playerPlayed = false;
  let playerMinutes = 0;
  let playerGoals = 0;
  let playerAssists = 0;
  let totalScoreBonus = 0;

  logs.push({ minute: 0, text: 'キックオフ！熱気あふれる試合が始まった。', type: 'chance' });

  if (isStarter) {
    playerPlayed = true;
    playerMinutes = getRandomInt(75, 90);
  } else if (isBench) {
    // 60% chance to be subbed on
    if (Math.random() < 0.65) {
      playerPlayed = true;
      playerMinutes = getRandomInt(15, 35);
      logs.push({
        minute: 90 - playerMinutes,
        text: `【選手交代】監督の指示を受け、${player.name}が途中出場！ピッチへ駆け込む！`,
        type: 'sub',
        isPlayerInvolved: true
      });
    } else {
      playerPlayed = false;
      playerMinutes = 0;
      logs.push({ minute: 90, text: `${player.name}はベンチでチームの戦況を見守った。`, type: 'sub' });
    }
  }

  // Calculate moment successes
  for (const choice of momentChoices) {
    if (choice.success) {
      totalScoreBonus += 1.2;
      if (Math.random() < 0.5) {
        playerGoals += 1;
        logs.push({
          minute: getRandomInt(30, 85),
          text: `【GOAL!!】${player.name}が自らの決定機を冷静に仕留め、値千金のゴール！`,
          type: 'goal',
          isPlayerInvolved: true
        });
      } else {
        playerAssists += 1;
        logs.push({
          minute: getRandomInt(25, 80),
          text: `【ASSIST!】${player.name}の鮮やかな演出から味方がゴール！アシストを記録！`,
          type: 'assist',
          isPlayerInvolved: true
        });
      }
    } else {
      totalScoreBonus -= 0.3;
    }
  }

  // Determine scores
  let homeScore = getRandomInt(0, 3);
  let awayScore = getRandomInt(0, 2);

  if (playerPlayed) {
    if (fixture.isPlayerHome) {
      homeScore += playerGoals;
    } else {
      awayScore += playerGoals;
    }
  }

  // Calculate Player Rating (1.0 - 10.0)
  let baseRating = 6.0;
  if (playerPlayed) {
    baseRating = 6.2 + totalScoreBonus + (playerGoals * 0.8) + (playerAssists * 0.5);
    // Condition bonus
    if (player.condition === 'superb') baseRating += 0.4;
    if (player.condition === 'poor') baseRating -= 0.4;
  } else {
    baseRating = 0; // Did not play
  }

  const playerRating = playerPlayed ? Math.min(9.8, Math.max(5.0, Number(baseRating.toFixed(1)))) : 0;

  // Coach Trust Delta
  let coachTrustDelta = 0;
  if (playerPlayed) {
    if (playerRating >= 7.5) coachTrustDelta = +5;
    else if (playerRating >= 6.5) coachTrustDelta = +2;
    else coachTrustDelta = -1;
  }

  // Fans Gained: Strictly realistic. 10yo gets 0-3 fans for good performance.
  let fansGained = 0;
  if (playerPlayed && playerRating >= 7.0) {
    if (player.age <= 12) {
      fansGained = getRandomInt(1, 3) + playerGoals;
    } else if (player.age <= 15) {
      fansGained = getRandomInt(3, 10) + playerGoals * 4;
    } else {
      fansGained = getRandomInt(15, 60) + playerGoals * 20;
    }
  }

  // OVR Increase chance (only on high rating 8.0+ or big multi-goal impact, not every match)
  let ovrIncreased = false;
  if (playerPlayed && playerRating >= 8.0 && Math.random() < 0.4) {
    ovrIncreased = true;
  }

  const fatigueCost = playerPlayed ? Math.floor(playerMinutes * 0.28) + getRandomInt(5, 10) : 3;

  logs.push({
    minute: 90,
    text: `試合終了のホイッスル！スコアは ${homeScore} - ${awayScore}。`,
    type: 'chance'
  });

  const updatedFixture: MatchFixture = {
    ...fixture,
    played: true,
    homeScore,
    awayScore,
    playerPlayed,
    playerMinutes,
    playerGoals,
    playerAssists,
    playerRating,
    logs
  };

  return {
    updatedFixture,
    playerRating,
    playerGoals,
    playerAssists,
    coachTrustDelta,
    fansGained,
    ovrIncreased,
    fatigueCost,
    logs
  };
}

export function updateStandingsWithResult(standings: LeagueStanding[], fixture: MatchFixture): LeagueStanding[] {
  if (fixture.homeScore === undefined || fixture.awayScore === undefined) return standings;

  const hScore = fixture.homeScore;
  const aScore = fixture.awayScore;

  return standings.map(s => {
    if (s.teamName === fixture.homeTeam) {
      const won = hScore > aScore ? 1 : 0;
      const drawn = hScore === aScore ? 1 : 0;
      const lost = hScore < aScore ? 1 : 0;
      const points = won * 3 + drawn;
      return {
        ...s,
        played: s.played + 1,
        won: s.won + won,
        drawn: s.drawn + drawn,
        lost: s.lost + lost,
        gf: s.gf + hScore,
        ga: s.ga + aScore,
        gd: s.gd + (hScore - aScore),
        points: s.points + points
      };
    } else if (s.teamName === fixture.awayTeam) {
      const won = aScore > hScore ? 1 : 0;
      const drawn = hScore === aScore ? 1 : 0;
      const lost = aScore < hScore ? 1 : 0;
      const points = won * 3 + drawn;
      return {
        ...s,
        played: s.played + 1,
        won: s.won + won,
        drawn: s.drawn + drawn,
        lost: s.lost + lost,
        gf: s.gf + aScore,
        ga: s.ga + hScore,
        gd: s.gd + (aScore - hScore),
        points: s.points + points
      };
    }
    return s;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

/**
 * Simulates all other league fixtures scheduled on this matchday, ensuring all 8 teams
 * play simultaneously and have equal matches played in the standings.
 */
export function simulateMatchdayForAllTeams(
  standings: LeagueStanding[],
  allFixtures: MatchFixture[],
  matchday: number,
  playerFixtureResult: MatchFixture
): {
  updatedStandings: LeagueStanding[];
  updatedFixtures: MatchFixture[];
} {
  let updatedStandings = [...standings];

  // 1. Process player match
  updatedStandings = updateStandingsWithResult(updatedStandings, playerFixtureResult);

  // 2. Process other fixtures of the same matchday
  const updatedFixtures = allFixtures.map(f => {
    if (f.id === playerFixtureResult.id) {
      return playerFixtureResult;
    }
    if (f.matchday === matchday && !f.played) {
      // Simulate CPU vs CPU match
      const hScore = getRandomInt(0, 3);
      const aScore = getRandomInt(0, 2);
      const cpuResult: MatchFixture = {
        ...f,
        played: true,
        homeScore: hScore,
        awayScore: aScore
      };
      updatedStandings = updateStandingsWithResult(updatedStandings, cpuResult);
      return cpuResult;
    }
    return f;
  });

  return { updatedStandings, updatedFixtures };
}
