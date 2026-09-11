import { GameState, Position } from '../types/footballLife';
import { generateSpontaneousMessages } from './characterEngine';
import { generateDailyCPUSNSPosts } from './snsEngine';
import { checkForIncomingOffers, generateScoutInterests } from './transferEngine';
import { checkSchoolEvents, handleAgeTransition } from './schoolEngine';
import { getRandomInt } from '../data/worldData';

export function advanceToNextDay(gameState: GameState): GameState {
  if (gameState.isRetired) {
    return gameState;
  }

  // Parse current date and add 1 day
  const curr = new Date(gameState.currentDate);
  curr.setDate(curr.getDate() + 1);
  const nextDateStr = curr.toISOString().split('T')[0];
  const dayCount = gameState.dayCount + 1;

  let player = { ...gameState.player };
  let contacts = [...gameState.contacts];
  let timeline = [...gameState.timeline];
  let dailyLogs = [...gameState.dailyLogs];
  let pendingEvents = [...gameState.pendingEvents];
  let updatedRecentContext = { ...(gameState.recentContext || {}) };

  // 0. Practice check for concluding day (gameState.currentDate):
  // If concluding day had a scheduled practice (and was not a matchday) and player is not injured:
  const concludingDateObj = new Date(gameState.currentDate);
  const concludingDayOfWeek = concludingDateObj.getDay();
  const concludingIsMatch = gameState.leagueFixtures.some(f => f.date === gameState.currentDate);
  const concludingHadPractice = !concludingIsMatch && player.currentTeam.practiceSchedule.includes(concludingDayOfWeek);

  if (concludingHadPractice && !player.injury) {
    if (!player.todayPracticeStatus) {
      // Penalty: Unexcused abandonment without reporting participation or absence
      player.coachTrust = Math.max(0, player.coachTrust - 12);
      player.practiceAttitude = Math.max(0, player.practiceAttitude - 15);
      player.consecutiveMissedPractices = (player.consecutiveMissedPractices || 0) + 1;
      player.totalMissedPractices = (player.totalMissedPractices || 0) + 1;

      dailyLogs.unshift({
        date: gameState.currentDate,
        text: `【練習無断放置・規律違反】本日の全体練習について参加・不参加の意思表示をしないまま日を跨いだため、監督からチーム規律違反とみなされ、信頼を大きく損ねました。（監督信頼度 -12 / 態度評価低下）`,
        type: 'event'
      });

      updatedRecentContext.lastPracticeEvent = {
        date: gameState.currentDate,
        attended: false,
        reason: 'unexcused_abandoned'
      };
    }
  }

  // 1. Natural overnight slight fatigue recovery
  const naturalRecovery = player.fatigue > 20 ? getRandomInt(4, 7) : getRandomInt(2, 4);
  player.fatigue = Math.max(0, player.fatigue - naturalRecovery);

  // 2. Injury progression
  if (player.injury) {
    const remaining = player.injury.daysRemaining - 1;
    if (remaining <= 0) {
      dailyLogs.unshift({
        date: nextDateStr,
        text: `【怪我完治】『${player.injury.name}』から完全に回復しました！全体練習への復帰が認められました！`,
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

  // 3. Reset consecutive missed practices if attended recently
  if (player.consecutiveMissedPractices > 0 && Math.random() < 0.3) {
    player.consecutiveMissedPractices = Math.max(0, player.consecutiveMissedPractices - 1);
  }

  // 4. Age Check (check if month and day match birthDate)
  const birth = new Date(player.birthDate);
  if (curr.getMonth() === birth.getMonth() && curr.getDate() === birth.getDate()) {
    const ageUpdates = handleAgeTransition({ ...gameState, currentDate: nextDateStr, player, timeline });
    if (ageUpdates.player) player = { ...player, ...ageUpdates.player };
    if (ageUpdates.timeline) timeline = ageUpdates.timeline;

    // Base position lock at age 13
    if (player.age === 13) {
      // Find highest played position
      let highestPos: Position = player.currentPosition;
      let highestCount = 0;
      for (const [pos, count] of Object.entries(player.positionPlayCounts)) {
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

    // Force retirement at age 60
    if (player.age >= 60) {
      timeline.unshift({
        id: `retire_60_${Date.now()}`,
        age: 60,
        date: nextDateStr,
        title: '60歳での現役引退',
        description: '還暦を迎え、長きにわたるフットボール人生に誇りを持って幕を下ろした。',
        type: 'milestone'
      });
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

  // 5. Dual nationality national team choice event
  if (player.dualNationality && !player.selectedNationalTeam && (player.age === 15 || player.age === 18)) {
    const existingEvent = pendingEvents.find(e => e.id === 'event_dual_nation');
    if (!existingEvent && Math.random() < 0.2) {
      pendingEvents.push({
        id: 'event_dual_nation',
        title: '代表国籍の選択（二重国籍）',
        description: `あなたには二重国籍（${player.nationality} / ${player.dualNationality}）の資格があります。将来どちらの国の代表としてプレーするか決断の時が迫っています。`,
        category: 'national',
        options: [
          { label: `${player.nationality}代表を選択`, actionType: 'choose_nation', payload: player.nationality },
          { label: `${player.dualNationality}代表を選択`, actionType: 'choose_nation', payload: player.dualNationality },
          { label: '今はまだ決めず保留にする', actionType: 'choose_nation_hold' }
        ]
      });
    }
  }

  // 6. Generate spontaneous CPU messages
  const incomingMessages = generateSpontaneousMessages({ ...gameState, player, currentDate: nextDateStr });
  if (incomingMessages.length > 0) {
    contacts = contacts.map(c => {
      const msg = incomingMessages.find(m => m.personId === c.id);
      if (msg) {
        return {
          ...c,
          unreadCount: c.unreadCount + 1,
          chatHistory: [
            ...c.chatHistory,
            {
              id: `msg_${Date.now()}_${getRandomInt(100, 999)}`,
              sender: 'cpu' as const,
              text: msg.text,
              timestamp: '新着'
            }
          ]
        };
      }
      return c;
    });
  }

  // 7. Generate Daily CPU SNS posts
  const newCPUSNSPosts = generateDailyCPUSNSPosts({ ...gameState, player, contacts, currentDate: nextDateStr });
  const allPosts = [...newCPUSNSPosts, ...gameState.snsPosts].slice(0, 30);

  // 8. Check for incoming offers and scout interests
  const newOffers = checkForIncomingOffers({ ...gameState, player });
  const allOffers = [...newOffers, ...gameState.transferOffers];
  const updatedScouts = generateScoutInterests({ ...gameState, player });

  // 9. Check for School events
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

  // 10. Check today's match fixture
  let activeMatch = gameState.activeMatch;
  const todayFixture = gameState.leagueFixtures.find(f => f.date === nextDateStr && !f.played);
  if (todayFixture && !activeMatch) {
    activeMatch = todayFixture;
  }

  return {
    ...gameState,
    currentDate: nextDateStr,
    dayCount,
    freeTimeUsedToday: false, // Strictly resets 1 free time per day
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
}
