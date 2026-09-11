import { GameState, MatchFixture, LeagueStanding, MatchMoment, MatchEventLog, Position } from '../types/footballLife';
import { COUNTRIES, getRandomElement, getRandomInt } from '../data/worldData';

export function evaluateLineupRole(gameState: GameState): 'starter' | 'bench' | 'out_of_squad' {
  const { player } = gameState;

  // 1. If injured, strictly out of squad
  if (player.injury) {
    return 'out_of_squad';
  }

  // 2. High fatigue (>80) leads to bench or out of squad for rest
  if (player.fatigue >= 85) {
    return 'out_of_squad';
  }
  if (player.fatigue >= 72) {
    return 'bench';
  }

  // 3. Condition weighting
  let conditionBonus = 0;
  if (player.condition === 'superb') conditionBonus = 12;
  else if (player.condition === 'good') conditionBonus = 5;
  else if (player.condition === 'poor') conditionBonus = -8;
  else if (player.condition === 'terrible') conditionBonus = -18;

  // 4. Coach trust factor
  const trustScore = (player.coachTrust - 50) * 0.4;

  // 5. OVR vs Team level requirement
  // Team level 1-5 maps to expected OVR ~45-75
  const expectedOvr = 42 + player.currentTeam.level * 6;
  const ovrDiff = player.ovr - expectedOvr;

  // 6. Practice attitude & consecutive missed practices
  const attitudePenalty = player.consecutiveMissedPractices * 15;

  const totalEvaluation = ovrDiff * 1.5 + trustScore + conditionBonus - attitudePenalty;

  if (totalEvaluation >= 5) {
    return 'starter';
  } else if (totalEvaluation >= -12) {
    return 'bench';
  } else {
    return 'out_of_squad';
  }
}

export function generateLeagueSeason(teamName: string, countryId: string, currentYear: number): {
  fixtures: MatchFixture[];
  standings: LeagueStanding[];
} {
  const country = COUNTRIES[countryId] || COUNTRIES.japan;
  const allTeamNames = [
    teamName,
    ...country.youthTeams.map(t => t.name).filter(n => n !== teamName),
    ...country.famousClubs.slice(0, 4).map(c => `${c} ユース`)
  ];

  // Take unique 8 teams
  const uniqueTeams = Array.from(new Set(allTeamNames)).slice(0, 8);
  if (!uniqueTeams.includes(teamName)) {
    uniqueTeams[0] = teamName;
  }

  const opponents = uniqueTeams.filter(t => t !== teamName);

  const fixtures: MatchFixture[] = [];
  const totalMatchdays = opponents.length * 2; // Home and Away (e.g. 14 matchdays)

  let currentDate = new Date(`${currentYear}-04-14`);

  for (let md = 1; md <= totalMatchdays; md++) {
    const oppIndex = (md - 1) % opponents.length;
    const opponent = opponents[oppIndex];
    const isPlayerHome = md % 2 === 1;

    // Advance 7 to 14 days per matchday
    currentDate.setDate(currentDate.getDate() + 7);
    const dateString = currentDate.toISOString().split('T')[0];

    fixtures.push({
      id: `fixture_md_${md}_${Date.now()}_${getRandomInt(100, 999)}`,
      date: dateString,
      matchday: md,
      competitionName: `${country.name} 育成Uリーグ (第${md}節)`,
      competitionType: 'league',
      homeTeam: isPlayerHome ? teamName : opponent,
      awayTeam: isPlayerHome ? opponent : teamName,
      isPlayerHome,
      played: false
    });
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
