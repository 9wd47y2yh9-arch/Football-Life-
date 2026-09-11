import { GameState, TransferOffer, TransferType, Team, Position, LoanTerms } from '../types/footballLife';
import { COUNTRIES, getRandomElement, getRandomInt } from '../data/worldData';
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
        interestLevel: player.ovr >= 65 ? '極めて高い（正式獲得・ローン打診を検討中）' : '視察継続中（将来性を評価）',
        lastSeen: '直近の公式戦にて視察'
      });
    }
  }

  // Overseas scout interest if player is exceptional
  if (player.ovr >= 62 || (player.age <= 12 && player.ovr >= 56)) {
    const overseasCountries = Object.values(COUNTRIES).filter(c => c.id !== player.currentCountry);
    const targetCountry = getRandomElement(overseasCountries);
    const overseasClub = getRandomElement(targetCountry.famousClubs);
    interests.push({
      clubName: `${overseasClub} 国際スカウト`,
      country: targetCountry.name,
      interestLevel: '重点モニタリング（将来の引き抜き・武者修行候補）',
      lastSeen: '国際大会・選抜視察'
    });
  }

  return interests;
}

export function checkForIncomingOffers(gameState: GameState): TransferOffer[] {
  const { player, transferOffers, currentDate } = gameState;
  const existingIds = new Set(transferOffers.map(o => o.clubName));
  const newOffers: TransferOffer[] = [];

  // Chance of offer depends on OVR, fans, age, and loan status
  const offerChance = player.ovr >= 68 ? 0.35 : player.ovr >= 56 ? 0.22 : 0.1;
  if (Math.random() > offerChance) return [];

  const currentCountry = COUNTRIES[player.currentCountry] || COUNTRIES.japan;
  const overseasCountries = Object.values(COUNTRIES).filter(c => c.id !== player.currentCountry);

  // Decide domestic vs overseas offer
  const isOverseas = player.ovr >= 65 && Math.random() < 0.4;
  const targetCountryData = isOverseas ? getRandomElement(overseasCountries) : currentCountry;

  const clubNameCandidates = [
    ...targetCountryData.youthTeams.map(t => t.name),
    ...targetCountryData.famousClubs.map(c => `${c} アカデミー`)
  ].filter(c => !c.includes(player.currentTeam.name) && !existingIds.has(c));

  if (clubNameCandidates.length === 0) return [];

  const targetClubName = getRandomElement(clubNameCandidates);
  const targetLevel = getRandomInt(3, 5);

  // Transfer Fee: STRICTLY 0 yen for elementary & middle school (age <= 15)
  const isYouthAge = player.age <= 15 || player.schoolStage === 'elementary' || player.schoolStage === 'middle';
  const transferFee = isYouthAge ? 0 : Math.floor(player.marketValue * getRandomInt(80, 150) / 100);
  const wage = player.age >= 18 ? getRandomInt(450, 1500) * 10000 : 0;

  // Determine Transfer Type:
  // If player is young or bench or not loaned, high chance of loan / developmental loan!
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
  } else if (loanRandom < 0.3) {
    transferType = 'loan';
  }

  // Calculate return date for loan
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

  const policyLabels = {
    match_experience: '実戦経験の蓄積と試合勘の育成',
    position_mastery: '得意ポジションでの専任起用と習熟',
    tactical_growth: '戦術眼・チーム戦術の遂行力強化',
    physical_strengthening: 'ハードワークと対人フィジカルの向上'
  };

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
    notes = isYouthAge
      ? `${targetClubName}より、更なる育成環境とステップアップを目指す加入打診が届きました。（育成年代のため移籍金0円）`
      : `${targetClubName}の強化責任者より、正式な完全移籍の獲得オファーが届きました。`;
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

  // Generate new team details
  const newTeam: Team = {
    id: `team_${Date.now()}`,
    name: offer.clubName,
    country: offer.country,
    category: offer.country !== '日本' ? 'overseas_youth' : 'club_team',
    level: offer.level,
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

  // Generate fresh league schedule for the new club
  const currentYear = new Date(gameState.currentDate).getFullYear();
  const { fixtures, standings } = generateLeagueSeason(newTeam.name, countryId, currentYear);

  let updatedPlayer = { ...player };
  let newTimelineEntry;

  if (offer.transferType === 'permanent') {
    // Complete permanent transfer
    newTimelineEntry = {
      id: `tl_${Date.now()}`,
      age: player.age,
      date: gameState.currentDate,
      title: `${offer.clubName} へ完全移籍`,
      description: `新たな挑戦の舞台として『${offer.clubName}（${offer.country}）』へ完全移籍。新監督・チームメイトと共に新たなシーズンをスタート。`,
      type: 'transfer' as const
    };

    updatedPlayer = {
      ...updatedPlayer,
      currentTeam: newTeam,
      currentCountry: countryId,
      coachTrust: 55,
      teamRole: (offer.rolePromise.includes('スタメン') || offer.rolePromise.includes('レギュラー')) ? 'starter' : 'bench',
      wage: offer.wage > 0 ? offer.wage : player.wage,
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
      coachTrust: 65, // Loan club coach is eager to play the loaned player
      teamRole: terms.rolePromise === 'starter' ? 'starter' : 'bench',
      isLoaned: true,
      loanType: offer.transferType,
      loanTerms: terms
    };
  }

  return {
    player: updatedPlayer,
    contacts: newContacts,
    leagueFixtures: fixtures,
    leagueStandings: standings,
    currentMatchday: 1,
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

  const currentYear = new Date(currentDate).getFullYear();
  const { fixtures, standings } = generateLeagueSeason(parentClub.name, countryId, currentYear);

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
    leagueFixtures: fixtures,
    leagueStandings: standings,
    currentMatchday: 1,
    timeline: [newTimelineEntry, ...gameState.timeline],
    dailyLogs: [newLog, ...gameState.dailyLogs]
  };
}
