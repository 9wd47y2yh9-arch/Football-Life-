import { GameState, TransferOffer, TransferType, Team, Position, LoanTerms, MatchFixture, LeagueStanding } from '../types/footballLife';
import { COUNTRIES, REAL_PRO_CLUBS, RealProClub, getRandomElement, getRandomInt, findRealProClubByName } from '../data/worldData';
import { generateInitialCharacters } from './characterEngine';
import { generateLeagueSeason } from './matchEngine';

export function generateScoutInterests(gameState: GameState): Array<{ clubName: string; country: string; interestLevel: string; lastSeen: string }> {
  const { player } = gameState;
  const currentCountry = COUNTRIES[player.currentCountry] || COUNTRIES.japan;
  const interests: Array<{ clubName: string; country: string; interestLevel: string; lastSeen: string }> = [];

  // Scouts watch if player OVR >= 50 or has goals/high rating
  if (player.ovr >= 48) {
    const domesticClubs = currentCountry.famousClubs.filter(c => !player.currentTeam.name.includes(c));
    if (domesticClubs.length > 0) {
      interests.push({
        clubName: `${getRandomElement(domesticClubs)} スカウト部門`,
        country: currentCountry.name,
        interestLevel: player.ovr >= 65 ? '極めて高い（正式プロ契約・獲得を検討中）' : '視察継続中（将来性を評価）',
        lastSeen: '直近の公式戦にて視察'
      });
    }
  }

  // Overseas scout interest if player is exceptional
  if (player.ovr >= 58 || (player.age <= 15 && player.ovr >= 54)) {
    const overseasCountries = Object.values(COUNTRIES).filter(c => c.id !== player.currentCountry);
    const targetCountry = getRandomElement(overseasCountries);
    const overseasClub = getRandomElement(targetCountry.famousClubs);
    interests.push({
      clubName: `${overseasClub} 国際スカウト`,
      country: targetCountry.name,
      interestLevel: player.age === 15 ? '新神童として重点マーク（15歳プロ特例契約候補）' : '重点モニタリング（将来の引き抜き・獲得候補）',
      lastSeen: '国際大会・選抜視察'
    });
  }

  return interests;
}

export function checkForIncomingOffers(gameState: GameState): TransferOffer[] {
  const { player, transferOffers, currentDate } = gameState;
  const existingClubNames = new Set(transferOffers.map(o => o.clubName));
  const newOffers: TransferOffer[] = [];

  // 15-Year-Old Pro Contract Evaluation
  if (player.age === 15) {
    // Evaluation criteria: OVR, stats, match performance, team level, coach trust, scout presence
    let proLeverageScore = 0;

    // OVR impact (max 40 pts)
    if (player.ovr >= 65) proLeverageScore += 45; // Wunderkind
    else if (player.ovr >= 60) proLeverageScore += 35;
    else if (player.ovr >= 55) proLeverageScore += 25;
    else if (player.ovr >= 50) proLeverageScore += 15;
    else if (player.ovr >= 46) proLeverageScore += 8;

    // Key Stats impact (max 20 pts)
    const statsSum = player.stats.pace + player.stats.dribbling + player.stats.shooting + player.stats.passing + player.stats.physical + player.stats.tacticalSense;
    if (statsSum >= 360) proLeverageScore += 20;
    else if (statsSum >= 300) proLeverageScore += 12;

    // Coach trust (max 15 pts)
    if (player.coachTrust >= 75) proLeverageScore += 15;
    else if (player.coachTrust >= 60) proLeverageScore += 10;

    // Team Role / Starter (max 10 pts)
    if (player.teamRole === 'starter') proLeverageScore += 10;

    // Match Performance (goals / assists) (max 15 pts)
    const playerPlayedMatches = (gameState.leagueFixtures || []).filter(f => f.playerPlayed);
    const goalsScored = playerPlayedMatches.reduce((acc, f) => acc + (f.playerGoals || 0), 0);
    const assistsScored = playerPlayedMatches.reduce((acc, f) => acc + (f.playerAssists || 0), 0);
    if (goalsScored + assistsScored >= 5) proLeverageScore += 15;
    else if (goalsScored + assistsScored >= 2) proLeverageScore += 8;

    // Scouts actively watching
    if ((gameState.scoutInterests || []).length > 0) proLeverageScore += 10;

    // Threshold check for 15yo pro offer:
    // Need at least 40 points total to even be considered by pro clubs
    if (proLeverageScore >= 40 && Math.random() < 0.35) {
      // Find suitable real pro clubs
      const eligibleProClubs = REAL_PRO_CLUBS.filter(c => {
        if (existingClubNames.has(c.name)) return false;
        if (player.currentTeam.name.includes(c.name)) return false;
        // World class clubs require high OVR (60+)
        if (c.tier === 'world_class') return player.ovr >= c.minOvr15yo;
        // Domestic or top flight clubs require around 48-55+
        return player.ovr >= c.minOvr15yo - 2;
      });

      if (eligibleProClubs.length > 0) {
        const chosenClub = getRandomElement(eligibleProClubs);
        const isWorldClass = chosenClub.tier === 'world_class';
        const wage = isWorldClass
          ? getRandomInt(2000, 4800) * 10000 // 2000万〜4800万円
          : getRandomInt(480, 1200) * 10000;  // 480万〜1200万円 (J-League / Top Flight standard)

        const rolePromise = isWorldClass
          ? (player.ovr >= 64 ? 'トップチーム即戦力帯同・新神童枠' : 'トップ昇格前提・U-19主力起用')
          : (player.ovr >= 54 ? 'トップチーム即戦力（2種登録・ベンチ入り保証）' : 'プロ育成特別指定・将来の主力');

        newOffers.push({
          id: `offer_15pro_${Date.now()}_${getRandomInt(100, 999)}`,
          clubName: chosenClub.name,
          country: chosenClub.country,
          level: chosenClub.level,
          transferType: 'permanent',
          step: 'contact',
          rolePromise,
          wage,
          transferFee: 0, // Youth solidarity, 0 transfer fee at age 15
          isProContract: true,
          isFifteenYoOffer: true,
          proLeagueName: chosenClub.leagueName,
          notes: `【15歳プロ特例契約オファー】実在のプロクラブ『${chosenClub.name}（${chosenClub.country} / ${chosenClub.leagueName}）』の強化スカウト部があなたの卓越した能力（OVR: ${player.ovr}）と公式戦での活躍を高く評価し、15歳プロ特例契約（プロ契約）の打診を行いました！`,
          negotiationRound: 0
        });

        return newOffers;
      }
    }
  }

  // Standard Offer Flow (for older players or general youth/pro offers)
  const offerChance = player.ovr >= 68 ? 0.35 : player.ovr >= 56 ? 0.22 : 0.1;
  if (Math.random() > offerChance) return [];

  const currentCountry = COUNTRIES[player.currentCountry] || COUNTRIES.japan;
  const overseasCountries = Object.values(COUNTRIES).filter(c => c.id !== player.currentCountry);

  // Pro players or age >= 18 MUST use real pro clubs!
  if (player.age >= 18 || player.wage > 0) {
    const eligibleProClubs = REAL_PRO_CLUBS.filter(c => !existingClubNames.has(c.name) && !c.name.includes(player.currentTeam.name));
    if (eligibleProClubs.length > 0) {
      const chosen = getRandomElement(eligibleProClubs);
      const isTop = chosen.tier === 'world_class' || chosen.tier === 'top_flight';
      const wage = isTop ? getRandomInt(3500, 12000) * 10000 : getRandomInt(1000, 3000) * 10000;
      const transferFee = Math.floor(player.marketValue * getRandomInt(90, 160) / 100);

      newOffers.push({
        id: `offer_pro_${Date.now()}_${getRandomInt(100, 999)}`,
        clubName: chosen.name,
        country: chosen.country,
        level: chosen.level,
        transferType: 'permanent',
        step: 'contact',
        rolePromise: player.ovr >= 70 ? '主力スタメン確約' : 'ローテーション・戦力枠',
        wage,
        transferFee,
        isProContract: true,
        isFifteenYoOffer: false,
        proLeagueName: chosen.leagueName,
        notes: `実在プロクラブ『${chosen.name}（${chosen.country} / ${chosen.leagueName}）』より、正式な完全移籍・プロ獲得オファーが届きました。`,
        negotiationRound: 0
      });
      return newOffers;
    }
  }

  // Youth age below 18 (and under 15 without pro contract)
  const isOverseas = player.ovr >= 65 && Math.random() < 0.4;
  const targetCountryData = isOverseas ? getRandomElement(overseasCountries) : currentCountry;

  const clubNameCandidates = [
    ...targetCountryData.youthTeams.map(t => t.name),
    ...targetCountryData.famousClubs.map(c => `${c} アカデミー`)
  ].filter(c => !c.includes(player.currentTeam.name) && !existingClubNames.has(c));

  if (clubNameCandidates.length === 0) return [];

  const targetClubName = getRandomElement(clubNameCandidates);
  const targetLevel = getRandomInt(3, 5);

  const isYouthAge = player.age <= 15 || player.schoolStage === 'elementary' || player.schoolStage === 'middle';
  const transferFee = isYouthAge ? 0 : Math.floor(player.marketValue * getRandomInt(80, 150) / 100);
  const wage = 0;

  let transferType: TransferType = 'permanent';
  const loanRandom = Math.random();

  if (!player.isLoaned && (player.teamRole !== 'starter' || player.age <= 20)) {
    if (loanRandom < 0.45) {
      transferType = 'developmental_loan';
    } else if (loanRandom < 0.7) {
      transferType = 'loan';
    } else {
      transferType = 'permanent';
    }
  }

  const curr = new Date(currentDate);
  const durationMonths = getRandomElement([6, 12]);
  curr.setMonth(curr.getMonth() + durationMonths);
  const returnDateStr = curr.toISOString().split('T')[0];
  const durationLabel = durationMonths === 6 ? '6_months' as const : '1_year' as const;

  const rolePromises = ['starter' as const, 'rotation' as const, 'backup' as const];
  const selectedRole = transferType === 'developmental_loan' ? 'starter' : getRandomElement(rolePromises);
  const roleText = selectedRole === 'starter' ? 'スタメン確約（毎試合出場保証）' : selectedRole === 'rotation' ? '即戦力ローテーション枠' : 'バックアップ・成長育成枠';

  const devPolicies = [
    'match_experience' as const,
    'position_mastery' as const,
    'tactical_growth' as const,
    'physical_strengthening' as const
  ];
  const selectedPolicy = getRandomElement(devPolicies);

  const devGoals = [
    `公式戦${durationMonths === 6 ? 10 : 20}試合以上の先発出場`,
    `プレースタイルを活かした決定機創出`,
    `親クラブ復帰に向けた総合OVRの向上`
  ];

  let notes = '';
  if (transferType === 'developmental_loan') {
    notes = `${targetClubName}より、選手の出場機会確保と実戦経験の蓄積を目的とした『育成型期限付き移籍（期間: ${durationMonths === 6 ? '半年' : '1年'}）』のオファーが届きました。親クラブへの復帰が保証されています。`;
  } else if (transferType === 'loan') {
    notes = `${targetClubName}より、期限付き移籍（期間: ${durationMonths === 6 ? '半年' : '1年'}・復帰予定日: ${returnDateStr}）の正式オファーが届きました。`;
  } else {
    notes = `${targetClubName}より、更なる育成環境とステップアップを目指す加入打診が届きました。（育成年代のため移籍金0円）`;
  }

  newOffers.push({
    id: `offer_${Date.now()}_${getRandomInt(100, 999)}`,
    clubName: targetClubName,
    country: targetCountryData.name,
    level: targetLevel,
    transferType,
    step: 'contact',
    rolePromise: roleText,
    wage,
    transferFee,
    notes,
    loanTerms: transferType !== 'permanent' ? {
      duration: durationLabel,
      durationDays: durationMonths === 6 ? 180 : 365,
      returnDate: returnDateStr,
      rolePromise: selectedRole,
      promisedPlayingTimeText: roleText,
      developmentPolicy: selectedPolicy,
      targetPosition: player.currentPosition,
      parentClubWageSharePercent: 50,
      developmentGoals: devGoals
    } : undefined
  });

  return newOffers;
}

// Negotiate Offer Terms (User Request 6: "交渉する")
export function negotiateOfferTerms(
  gameState: GameState,
  offerId: string,
  demandType: 'higher_wage' | 'guaranteed_starter'
): { updatedOffers: TransferOffer[]; feedback: string; success: boolean } {
  const { player, transferOffers } = gameState;
  const targetOffer = transferOffers.find(o => o.id === offerId);

  if (!targetOffer) {
    return { updatedOffers: transferOffers, feedback: '対象のオファーが見つかりませんでした。', success: false };
  }

  const currentRound = targetOffer.negotiationRound || 0;
  if (currentRound >= 2) {
    return {
      updatedOffers: transferOffers,
      feedback: '『これ以上の条件変更はクラブの予算・方針上不可能です。提示条件で合意するか判断してください。』',
      success: false
    };
  }

  // Leverage depends on player OVR and recent achievements
  const leverage = player.ovr + (player.coachTrust > 70 ? 5 : 0);
  let success = false;
  let feedback = '';
  let updatedOffer = { ...targetOffer, negotiationRound: currentRound + 1 };

  if (demandType === 'higher_wage') {
    if (leverage >= 54 || targetOffer.isFifteenYoOffer) {
      const wageIncrease = Math.round((targetOffer.wage || 5000000) * 0.25);
      updatedOffer.wage = (targetOffer.wage || 5000000) + wageIncrease;
      success = true;
      feedback = `【交渉成立】クラブ強化部「君の才能とポテンシャルを高く再評価した。年俸を ${(updatedOffer.wage / 10000).toLocaleString()} 万円に引き上げよう！」`;
    } else {
      feedback = `【交渉難航】クラブ強化部「現在の実績ではこれ以上の年俸提示は難しい。まずはピッチで結果を出してインセンティブを掴んでほしい。」`;
    }
  } else if (demandType === 'guaranteed_starter') {
    if (player.ovr >= 58 || player.teamRole === 'starter') {
      updatedOffer.rolePromise = 'スタメン確約（毎試合60分以上出場保証）';
      success = true;
      feedback = `【交渉成立】クラブ監督「君を即戦力スタメンとして起用するプランを受け入れた。主力として期待しているぞ。」`;
    } else {
      feedback = `【条件据え置き】クラブ監督「スタメン確約はチーム内の競争原理を崩すため約束できない。だが実力次第でチャンスは十分に与える。」`;
    }
  }

  updatedOffer.negotiationFeedback = feedback;

  const updatedOffers = transferOffers.map(o => o.id === offerId ? updatedOffer : o);
  return { updatedOffers, feedback, success };
}

// Decline and Stay With Current Club (User Request 6: "現在のクラブに残る")
export function declineAndStayWithCurrentClub(
  gameState: GameState,
  offerId: string
): Partial<GameState> {
  const { player, transferOffers } = gameState;
  const offer = transferOffers.find(o => o.id === offerId);
  const clubName = offer ? offer.clubName : 'プロクラブ';

  const updatedOffers = transferOffers.filter(o => o.id !== offerId);
  const newCoachTrust = Math.min(100, player.coachTrust + 10);

  return {
    transferOffers: updatedOffers,
    player: {
      ...player,
      coachTrust: newCoachTrust
    },
    dailyLogs: [
      {
        date: gameState.currentDate,
        text: `【残留決断】${clubName}からのオファーを固辞し、現在の所属クラブ『${player.currentTeam.name}』への残留と忠誠を宣言しました！監督とチームメイトからの信頼度が大きく上昇しました（信頼度: +10）。`,
        type: 'event'
      },
      ...gameState.dailyLogs
    ],
    timeline: [
      {
        id: `tl_stay_${Date.now()}`,
        age: player.age,
        date: gameState.currentDate,
        title: `${player.currentTeam.name} への残留と忠誠を誓う`,
        description: `${clubName}からの加入打診を断り、現在のクラブで仲間と共に戦い抜く道を選択。指揮官からの絶大な信頼を獲得した。`,
        type: 'milestone'
      },
      ...gameState.timeline
    ]
  };
}

// Player-initiated Loan Request to Coach
export function requestPlayerLoanOffer(
  gameState: GameState,
  options: {
    type: 'developmental_loan' | 'loan';
    reasonText: string;
    duration: '6_months' | '1_year' | 'season_end';
  }
): { success: boolean; coachResponse: string; newOffer?: TransferOffer } {
  const { player, currentDate } = gameState;
  const currentCountry = COUNTRIES[player.currentCountry] || COUNTRIES.japan;

  // Coach evaluates player loan request
  let success = false;
  let coachResponse = '';

  if (player.isLoaned) {
    return {
      success: false,
      coachResponse: 'お前は現在すでに期限付き移籍の武者修行中だ。まずはここで全力を尽くせ。'
    };
  }

  if (player.coachTrust >= 55 || player.teamRole !== 'starter') {
    success = true;
    coachResponse = options.type === 'developmental_loan'
      ? `「『${options.reasonText}』という熱意、しっかり受け止めた。うちでベンチに置いておくよりも、他クラブでスタメンとして揉まれて実戦経験を積む方が将来のためになる。提携クラブへ育成型期限付き移籍を打診しよう。」`
      : `「出場機会を求めて他クラブへ一時的に挑戦したいんだな。お前の意思を尊重し、期限付き移籍の手続きを進めよう。」`;
  } else if (player.coachTrust < 40) {
    return {
      success: false,
      coachResponse: `「外に行く前に、まずはうちの日々の練習でレギュラーを奪い取る気概を見せろ。逃げるような移籍は認めん。」`
    };
  } else {
    // Negotiation / discussion
    return {
      success: false,
      coachResponse: `「お前の気持ちは理解できる。だが今のチームにとっても大事な戦力なんだ。もう少しここで紅白戦の結果を見てから判断させてくれ。」`
    };
  }

  // Generate an attractive loan offer matching request
  const candidates = currentCountry.youthTeams.filter(t => !t.name.includes(player.currentTeam.name));
  const chosenTeam = candidates.length > 0 ? getRandomElement(candidates) : null;
  const clubName = chosenTeam ? chosenTeam.name : `${currentCountry.famousClubs[0]} サテライト`;

  const curr = new Date(currentDate);
  const months = options.duration === '6_months' ? 6 : 12;
  curr.setMonth(curr.getMonth() + months);
  const returnDateStr = curr.toISOString().split('T')[0];

  const newOffer: TransferOffer = {
    id: `req_loan_${Date.now()}`,
    clubName,
    country: currentCountry.name,
    level: 3,
    transferType: options.type,
    step: 'review', // already through initial contact
    rolePromise: 'スタメン確約（毎試合60分以上出場保証）',
    wage: player.wage,
    transferFee: 0,
    notes: `監督の承認とクラブ間調整により、『${clubName}』への${options.type === 'developmental_loan' ? '育成型期限付き移籍' : '期限付き移籍'}が手配されました。実戦経験の蓄積が最優先されます。`,
    loanTerms: {
      duration: options.duration,
      durationDays: months * 30,
      returnDate: returnDateStr,
      rolePromise: 'starter',
      promisedPlayingTimeText: 'スタメン確約（毎試合60分以上出場保証）',
      developmentPolicy: 'match_experience',
      targetPosition: player.currentPosition,
      parentClubWageSharePercent: 50,
      developmentGoals: [
        '公式戦でのスタメン出場機会の確保',
        'プレースタイルを活かした実戦での経験値獲得',
        '親クラブへの逞しい復帰'
      ]
    },
    playerConsultedCoach: true,
    coachAdvice: '監督承認済み。出場機会を増やして一回り成長してこい。'
  };

  return { success: true, coachResponse, newOffer };
}

// Synchronize League Schedule and Standings upon Transfer or Loan Return
export function syncTransferLeagueSchedule(
  existingFixtures: MatchFixture[],
  existingStandings: LeagueStanding[],
  newTeamName: string,
  countryId: string,
  currentDate: string,
  age: number,
  currentMatchday = 1,
  division: 1 | 2 = 1,
  isPro = false
): {
  syncedFixtures: MatchFixture[];
  syncedStandings: LeagueStanding[];
  syncedMatchday: number;
} {
  const currentYear = new Date(currentDate).getFullYear();
  const baselineMatchday = Math.max(1, Math.min(14, currentMatchday || 1));
  const [currY, currM, currD] = currentDate.split('-').map(Number);
  const currentUtcTime = Date.UTC(currY, currM - 1, currD);

  // 1. Check if newTeam is already in the existing league standings
  const teamInExistingLeague = (existingStandings || []).some(s => s.teamName === newTeamName);

  if (teamInExistingLeague && existingFixtures && existingFixtures.length > 0) {
    // Retain existing fixtures and switch player's perspective to new team
    const updatedFixtures = existingFixtures.map(f => {
      const isHome = f.homeTeam === newTeamName;
      const isAway = f.awayTeam === newTeamName;
      const isNewTeamMatch = isHome || isAway;

      // If this was an unplayed past match prior to transfer date, simulate its completion
      let wasPlayed = f.played;
      let hScore = f.homeScore ?? 0;
      let aScore = f.awayScore ?? 0;

      if (!wasPlayed && f.date < currentDate) {
        wasPlayed = true;
        hScore = getRandomInt(0, 3);
        aScore = getRandomInt(0, 2);
      }

      return {
        ...f,
        played: wasPlayed,
        homeScore: hScore,
        awayScore: aScore,
        isPlayerHome: isHome,
        // Player did not participate in matches prior to transfer
        playerPlayed: wasPlayed ? false : undefined,
        playerGoals: wasPlayed ? 0 : undefined,
        playerAssists: wasPlayed ? 0 : undefined,
        playerRating: undefined
      };
    });

    // Recalculate standings accurately from all played matches
    const syncedStandings: LeagueStanding[] = existingStandings.map(s => ({
      ...s,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    }));

    updatedFixtures.filter(f => f.played).forEach(f => {
      const homeStanding = syncedStandings.find(s => s.teamName === f.homeTeam);
      const awayStanding = syncedStandings.find(s => s.teamName === f.awayTeam);
      const hGoals = f.homeScore ?? 0;
      const aGoals = f.awayScore ?? 0;

      if (homeStanding && awayStanding) {
        homeStanding.played += 1;
        homeStanding.gf += hGoals;
        homeStanding.ga += aGoals;
        homeStanding.gd += (hGoals - aGoals);

        awayStanding.played += 1;
        awayStanding.gf += aGoals;
        awayStanding.ga += hGoals;
        awayStanding.gd += (aGoals - hGoals);

        if (hGoals > aGoals) {
          homeStanding.won += 1;
          homeStanding.points += 3;
          awayStanding.lost += 1;
        } else if (hGoals < aGoals) {
          awayStanding.won += 1;
          awayStanding.points += 3;
          homeStanding.lost += 1;
        } else {
          homeStanding.drawn += 1;
          homeStanding.points += 1;
          awayStanding.drawn += 1;
          awayStanding.points += 1;
        }
      }
    });

    syncedStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    // Find new team's next upcoming unplayed match on or after currentDate
    const nextUnplayedForNewTeam = updatedFixtures.find(
      f => !f.played && (f.homeTeam === newTeamName || f.awayTeam === newTeamName)
    );

    const syncedMatchday = nextUnplayedForNewTeam ? nextUnplayedForNewTeam.matchday : baselineMatchday;

    return {
      syncedFixtures: updatedFixtures,
      syncedStandings,
      syncedMatchday
    };
  }

  // 2. Transferred to a different league / country / tier:
  // Generate a full league season for the new club, strictly synchronizing progress with currentMatchday!
  const { fixtures: rawFixtures, standings: rawStandings } = generateLeagueSeason(
    newTeamName,
    countryId,
    currentYear,
    age,
    division,
    isPro
  );

  const totalRounds = 14;
  const roundsToMarkPlayed = Math.min(totalRounds - 1, baselineMatchday - 1);

  const syncedStandings = rawStandings.map(s => ({
    ...s,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  }));

  const syncedFixtures: MatchFixture[] = rawFixtures.map(f => {
    const isRoundPlayed = f.matchday <= roundsToMarkPlayed;
    let fixtureDateStr = f.date;

    if (isRoundPlayed) {
      // Past dates: 7 days intervals before currentDate
      const daysAgo = (roundsToMarkPlayed - f.matchday + 1) * 7;
      const pastTime = currentUtcTime - daysAgo * 86400000;
      fixtureDateStr = new Date(pastTime).toISOString().split('T')[0];
    } else {
      // Upcoming match starts 6 days after currentDate (allowing 5-day auto advance to cleanly stop 5 days before!)
      const daysAhead = 6 + (f.matchday - (roundsToMarkPlayed + 1)) * 7;
      const futureTime = currentUtcTime + daysAhead * 86400000;
      fixtureDateStr = new Date(futureTime).toISOString().split('T')[0];
    }

    if (isRoundPlayed) {
      const hGoals = getRandomInt(0, 3);
      const aGoals = getRandomInt(0, 2);

      const homeStanding = syncedStandings.find(s => s.teamName === f.homeTeam);
      const awayStanding = syncedStandings.find(s => s.teamName === f.awayTeam);
      if (homeStanding && awayStanding) {
        homeStanding.played += 1;
        homeStanding.gf += hGoals;
        homeStanding.ga += aGoals;
        homeStanding.gd += (hGoals - aGoals);

        awayStanding.played += 1;
        awayStanding.gf += aGoals;
        awayStanding.ga += hGoals;
        awayStanding.gd += (aGoals - hGoals);

        if (hGoals > aGoals) {
          homeStanding.won += 1;
          homeStanding.points += 3;
          awayStanding.lost += 1;
        } else if (hGoals < aGoals) {
          awayStanding.won += 1;
          awayStanding.points += 3;
          homeStanding.lost += 1;
        } else {
          homeStanding.drawn += 1;
          homeStanding.points += 1;
          awayStanding.drawn += 1;
          awayStanding.points += 1;
        }
      }

      return {
        ...f,
        date: fixtureDateStr,
        played: true,
        homeScore: hGoals,
        awayScore: aGoals,
        isPlayerHome: f.homeTeam === newTeamName,
        playerPlayed: false,
        playerGoals: 0,
        playerAssists: 0
      };
    } else {
      return {
        ...f,
        date: fixtureDateStr,
        played: false,
        isPlayerHome: f.homeTeam === newTeamName
      };
    }
  });

  syncedStandings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  const nextUnplayedForNewTeam = syncedFixtures.find(
    f => !f.played && (f.homeTeam === newTeamName || f.awayTeam === newTeamName)
  );
  const syncedMatchday = nextUnplayedForNewTeam ? nextUnplayedForNewTeam.matchday : Math.min(totalRounds, roundsToMarkPlayed + 1);

  return {
    syncedFixtures,
    syncedStandings,
    syncedMatchday
  };
}

// Complete a Transfer or Loan
export function completeTransfer(
  gameState: GameState,
  offer: TransferOffer
): Partial<GameState> {
  const { player } = gameState;

  // Find country id from country name
  const countryEntry = Object.entries(COUNTRIES).find(([k, v]) => v.name === offer.country);
  const countryId = countryEntry ? countryEntry[0] : player.currentCountry;
  const countryData = COUNTRIES[countryId] || COUNTRIES.japan;

  const proClub = findRealProClubByName(offer.clubName);
  const targetDivision: 1 | 2 = (offer.division as (1 | 2)) || proClub?.division || 1;
  const isPro = offer.isProContract || player.age >= 18 || offer.wage > 0 || Boolean(proClub);

  // Generate new team details
  const newTeam: Team = {
    id: `team_${Date.now()}`,
    name: offer.clubName,
    country: offer.country,
    category: isPro ? (offer.country !== '日本' ? 'overseas_youth' : 'j_youth') : (offer.country !== '日本' ? 'overseas_youth' : 'club_team'),
    level: offer.level,
    division: targetDivision,
    leagueName: proClub?.leagueName || offer.proLeagueName || (targetDivision === 1 ? `${offer.country} 1部リーグ` : `${offer.country} 2部リーグ`),
    practiceDaysPerWeek: getRandomInt(4, 5),
    practiceSchedule: [1, 2, 3, 5, 6],
    tactic: getRandomElement(['possession', 'high_press', 'counter', 'direct']),
    coachName: countryId === 'japan' ? `${getRandomElement(countryData.lastNames)} 監督` : `Mister ${getRandomElement(countryData.firstNamesMale)} ${getRandomElement(countryData.lastNames)}`,
    coachStyle: getRandomElement(['strict', 'tactical', 'passionate', 'nurturing'])
  };

  // Generate new characters for new club
  const newContacts = generateInitialCharacters(
    countryId,
    player.gender,
    player.schoolName,
    newTeam.name,
    player.currentPosition,
    newTeam.coachName,
    newTeam.coachStyle as any
  );

  // SYNCHRONIZE LEAGUE SCHEDULE AND STANDINGS:
  // Never reset to Matchday 1! Keep player's current date and progress in exact sync.
  const {
    syncedFixtures,
    syncedStandings,
    syncedMatchday
  } = syncTransferLeagueSchedule(
    gameState.leagueFixtures || [],
    gameState.leagueStandings || [],
    newTeam.name,
    countryId,
    gameState.currentDate,
    player.age,
    gameState.currentMatchday || 1,
    targetDivision,
    isPro
  );

  let updatedPlayer = { ...player };
  let newTimelineEntry;

  const hasStarterPromise = offer.rolePromise.includes('スタメン') || offer.rolePromise.includes('レギュラー');

  if (offer.transferType === 'permanent') {
    // Complete permanent transfer
    const timelineTitle = offer.isFifteenYoOffer
      ? `15歳で ${offer.clubName} とプロ特例契約！`
      : isPro
      ? `${offer.clubName} へプロ契約移籍`
      : `${offer.clubName} へ完全移籍`;

    const timelineDesc = offer.isFifteenYoOffer
      ? `類まれなる才能と公式戦での実績が認められ、15歳の若さで名門実在クラブ『${offer.clubName}（${offer.country}）』とプロ特例契約を締結！プロサッカー選手としての輝かしい第一歩を踏み出しました。`
      : isPro
      ? `実在プロクラブ『${offer.clubName}（${offer.country} / ${offer.proLeagueName || ''}）』と正式にプロ契約を締結。トップカテゴリーでの新たな挑戦が始まります。`
      : `新たな挑戦の舞台として『${offer.clubName}（${offer.country}）』へ完全移籍。新監督・チームメイトと共に新たなシーズンをスタート。`;

    newTimelineEntry = {
      id: `tl_${Date.now()}`,
      age: player.age,
      date: gameState.currentDate,
      title: timelineTitle,
      description: timelineDesc,
      type: offer.isFifteenYoOffer ? 'debut' : 'transfer'
    };

    updatedPlayer = {
      ...updatedPlayer,
      currentTeam: newTeam,
      currentCountry: countryId,
      // High initial coach trust ensuring immediate match eligibility for new signing
      coachTrust: hasStarterPromise ? 85 : 78,
      teamRole: hasStarterPromise ? 'starter' : 'bench',
      fatigue: Math.min(updatedPlayer.fatigue, 20), // Medical clearance and initial rest
      consecutiveMissedPractices: 0, // Fresh start at new club, no carried over absence penalty
      totalMissedPractices: 0,
      todayPracticeStatus: null,
      rehabDoneToday: false,
      wage: offer.wage > 0 ? offer.wage : player.wage,
      schoolStage: (isPro && player.age >= 18) ? 'pro' : player.schoolStage,
      isLoaned: false,
      loanType: undefined,
      loanTerms: undefined
    };
  } else {
    // Loan or Developmental Loan Transfer
    const parentClub = player.isLoaned && player.loanTerms ? player.loanTerms.parentClub : player.currentTeam;
    const parentCoachTrust = player.coachTrust;
    const isDev = offer.transferType === 'developmental_loan';

    const terms: LoanTerms = {
      duration: offer.loanTerms?.duration || '1_year',
      durationDays: offer.loanTerms?.durationDays || 365,
      returnDate: offer.loanTerms?.returnDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      rolePromise: offer.loanTerms?.rolePromise || 'starter',
      promisedPlayingTimeText: offer.loanTerms?.promisedPlayingTimeText || 'スタメン確約での実戦経験',
      developmentPolicy: offer.loanTerms?.developmentPolicy || 'match_experience',
      targetPosition: offer.loanTerms?.targetPosition || player.currentPosition,
      parentClub,
      parentCoachTrust,
      parentClubWageSharePercent: offer.loanTerms?.parentClubWageSharePercent ?? 50,
      developmentGoals: offer.loanTerms?.developmentGoals || [
        '公式戦での先発出場機会の獲得',
        'プレースタイルを活かした実戦での経験値蓄積',
        '親クラブへの逞しい復帰'
      ],
      matchesPlayedOnLoan: 0,
      goalsScoredOnLoan: 0
    };

    newTimelineEntry = {
      id: `tl_${Date.now()}`,
      age: player.age,
      date: gameState.currentDate,
      title: `${offer.clubName} へ${isDev ? '育成型期限付き移籍' : '期限付き移籍'}`,
      description: `親クラブ『${parentClub.name}』に籍を残したまま、実戦経験の蓄積と成長を目的として『${offer.clubName}（${offer.country}）』への武者修行へ出発（期間: ${terms.returnDate}まで）。`,
      type: 'loan' as const
    };

    updatedPlayer = {
      ...updatedPlayer,
      currentTeam: newTeam,
      currentCountry: countryId,
      coachTrust: 80, // Loan club coach actively plays loaned player as key reinforcement
      teamRole: terms.rolePromise === 'starter' ? 'starter' : 'bench',
      fatigue: Math.min(updatedPlayer.fatigue, 20),
      consecutiveMissedPractices: 0,
      totalMissedPractices: 0,
      todayPracticeStatus: null,
      rehabDoneToday: false,
      isLoaned: true,
      loanType: offer.transferType,
      loanTerms: terms
    };
  }

  return {
    player: updatedPlayer,
    contacts: newContacts,
    leagueFixtures: syncedFixtures,
    leagueStandings: syncedStandings,
    currentMatchday: syncedMatchday,
    timeline: [newTimelineEntry, ...gameState.timeline],
    transferOffers: gameState.transferOffers.filter(o => o.id !== offer.id)
  };
}

// Check and handle loan return to parent club
export function checkLoanReturn(gameState: GameState): Partial<GameState> | null {
  const { player, currentDate } = gameState;
  if (!player.isLoaned || !player.loanTerms) return null;

  // Check if loan period expired
  if (currentDate < player.loanTerms.returnDate) return null;

  const parentClub = player.loanTerms.parentClub;
  const matches = player.loanTerms.matchesPlayedOnLoan;
  const goals = player.loanTerms.goalsScoredOnLoan;
  const isDev = player.loanType === 'developmental_loan';

  // Return to parent club
  const countryEntry = Object.entries(COUNTRIES).find(([k, v]) => v.name === parentClub.country);
  const countryId = countryEntry ? countryEntry[0] : player.currentCountry;

  // Generate parent club characters
  const returnedContacts = generateInitialCharacters(
    countryId,
    player.gender,
    player.schoolName,
    parentClub.name,
    player.currentPosition,
    parentClub.coachName,
    parentClub.coachStyle as any
  );

  const parentProClub = findRealProClubByName(parentClub.name);
  const parentDivision: 1 | 2 = parentClub.division || parentProClub?.division || 1;
  const isParentPro = player.age >= 18 || Boolean(parentProClub);

  // Synchronize Parent Club League Schedule and Standings
  const {
    syncedFixtures,
    syncedStandings,
    syncedMatchday
  } = syncTransferLeagueSchedule(
    gameState.leagueFixtures || [],
    gameState.leagueStandings || [],
    parentClub.name,
    countryId,
    currentDate,
    player.age,
    gameState.currentMatchday || 1,
    parentDivision,
    isParentPro
  );

  const newTimelineEntry = {
    id: `tl_return_${Date.now()}`,
    age: player.age,
    date: currentDate,
    title: `親クラブ ${parentClub.name} へ復帰`,
    description: `『${player.currentTeam.name}』での${isDev ? '育成型武者修行' : '期限付き移籍'}（出場${matches}試合、${goals}得点）を完遂し、親クラブ『${parentClub.name}』へ頼もしく復帰しました。`,
    type: 'milestone' as const
  };

  const newLog = {
    date: currentDate,
    text: `【期限満了・復帰】『${player.currentTeam.name}』でのローン期間が満了し、親クラブ『${parentClub.name}』へ復帰しました！親クラブ監督「ローン先での奮闘は見せてもらったぞ。一回り逞しくなったな！」`,
    type: 'event' as const
  };

  return {
    player: {
      ...player,
      currentTeam: parentClub,
      currentCountry: countryId,
      coachTrust: Math.min(100, player.loanTerms.parentCoachTrust + (goals > 0 || matches >= 5 ? 12 : 6)),
      teamRole: 'starter',
      isLoaned: false,
      loanType: undefined,
      loanTerms: undefined
    },
    contacts: returnedContacts,
    leagueFixtures: syncedFixtures,
    leagueStandings: syncedStandings,
    currentMatchday: syncedMatchday,
    timeline: [newTimelineEntry, ...gameState.timeline],
    dailyLogs: [newLog, ...gameState.dailyLogs]
  };
}
