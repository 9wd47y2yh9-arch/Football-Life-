import React, { useState } from 'react';
import { GameState, FreeTimeActivity, StatExp, PracticeAbsenceReasonId } from '../types/footballLife';
import { executeFreeTimeActivity } from '../services/freeTimeEngine';
import { processDailyTeamPractice, performRehabilitation } from '../services/trainingEngine';
import { PRACTICE_ABSENCE_REASONS } from '../data/worldData';
import { 
  Calendar, Dumbbell, BookOpen, Gamepad2, Users, Moon, Coffee, 
  Shield, AlertTriangle, Trophy, ArrowRight, HeartPulse, Check, Sparkles, X, Clock, HelpCircle,
  CheckCircle, Heart
} from 'lucide-react';

interface HomeDashboardProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
  onOpenMatchModal: () => void;
  onOpenSmartphone: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  gameState,
  onUpdateGameState,
  onOpenMatchModal,
  onOpenSmartphone
}) => {
  const { player, currentDate, freeTimeUsedToday, leagueFixtures, currentMatchday } = gameState;
  const currentTeam = player.currentTeam;

  // Check if today is a scheduled team practice day
  const todayDayOfWeek = new Date(currentDate).getDay(); // 0: Sun, 1: Mon...
  const isPracticeDay = currentTeam.practiceSchedule.includes(todayDayOfWeek);

  // Check if today is a matchday
  const todayFixture = gameState.activeMatch || leagueFixtures.find(f => f.date === currentDate && !f.played);
  const isTodayMatchDay = !!todayFixture;

  // Next upcoming match fixture
  const nextFixture = leagueFixtures.find(f => !f.played);
  
  // Calculate days until next match
  const getDaysUntilNextMatch = () => {
    if (!nextFixture) return null;
    const current = new Date(currentDate).getTime();
    const next = new Date(nextFixture.date).getTime();
    const diff = Math.ceil((next - current) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };
  const daysUntilNextMatch = getDaysUntilNextMatch();

  // Free Time State
  const [selectedFreeTime, setSelectedFreeTime] = useState<FreeTimeActivity | null>(null);
  const [freeTimeResultText, setFreeTimeResultText] = useState<string | null>(null);
  const [targetStat, setTargetStat] = useState<keyof StatExp>('shooting');
  const [selectedFriendId, setSelectedFriendId] = useState<string>(
    gameState.contacts.find(c => c.role === 'friend')?.id || ''
  );
  const [sleepHours, setSleepHours] = useState<number>(8);

  // Absence Modal State
  const [showAbsenceModal, setShowAbsenceModal] = useState<boolean>(false);
  const [selectedAbsenceReason, setSelectedAbsenceReason] = useState<PracticeAbsenceReasonId>('illness');
  const [customAbsenceReason, setCustomAbsenceReason] = useState<string>('');

  // Handle Team Practice Attendance (Strictly 1 choice per day)
  const handlePracticeAttendance = (
    attend: boolean,
    reasonId?: PracticeAbsenceReasonId,
    customText?: string
  ) => {
    if (player.todayPracticeStatus) return; // Prevent multiple choices per day

    const result = processDailyTeamPractice(gameState, attend, reasonId, customText);

    onUpdateGameState(prev => {
      let updatedPlayer = { ...prev.player };
      updatedPlayer.todayPracticeStatus = attend ? 'attended' : 'missed';
      updatedPlayer.todayPracticeReason = attend ? undefined : (reasonId || 'personal');

      updatedPlayer.fatigue = Math.min(100, Math.max(0, updatedPlayer.fatigue + result.fatigueDelta));
      updatedPlayer.coachTrust = Math.min(100, Math.max(0, updatedPlayer.coachTrust + result.coachTrustDelta));
      updatedPlayer.practiceAttitude = Math.min(100, Math.max(0, updatedPlayer.practiceAttitude + result.attitudeDelta));

      if (result.injuryOccurred) {
        updatedPlayer.injury = result.injuryOccurred;
      }

      if (!attend) {
        updatedPlayer.consecutiveMissedPractices += 1;
        updatedPlayer.totalMissedPractices += 1;
      } else {
        updatedPlayer.consecutiveMissedPractices = 0;
      }

      // Record in recent context for dynamic CPU dialogue
      const updatedRecentContext = {
        ...prev.recentContext,
        lastPracticeEvent: {
          date: prev.currentDate,
          attended: attend,
          reason: attend ? undefined : reasonId,
          coachComment: result.coachComment
        }
      };

      // Add stat exp if attended
      if (result.statExpGained) {
        for (const [key, val] of Object.entries(result.statExpGained)) {
          const k = key as keyof StatExp;
          const currentVal = updatedPlayer.statExp[k] || 0;
          const newVal = currentVal + (val || 0);
          if (newVal >= 100) {
            updatedPlayer.statExp[k] = newVal - 100;
            updatedPlayer.stats[k] = (updatedPlayer.stats[k] || 50) + 1;
          } else {
            updatedPlayer.statExp[k] = newVal;
          }
        }
      }

      return {
        ...prev,
        player: updatedPlayer,
        recentContext: updatedRecentContext,
        dailyLogs: [
          {
            date: prev.currentDate,
            text: result.logText,
            type: 'training'
          },
          ...prev.dailyLogs
        ]
      };
    });

    setShowAbsenceModal(false);
  };

  // Handle Free Time Activity Execution
  const handleExecuteFreeTime = () => {
    if (!selectedFreeTime || freeTimeUsedToday) return;

    if (selectedFreeTime === 'sns_post') {
      onOpenSmartphone();
      return;
    }

    try {
      const result = executeFreeTimeActivity(selectedFreeTime, gameState, {
        targetStat,
        friendId: selectedFriendId,
        sleepHours
      });

      setFreeTimeResultText(result.logText);

      onUpdateGameState(prev => {
        let updatedPlayer = { ...prev.player };
        let updatedContacts = [...prev.contacts];

        updatedPlayer.fatigue = Math.min(100, Math.max(0, updatedPlayer.fatigue + result.fatigueDelta));
        if (result.conditionChange) {
          updatedPlayer.condition = result.conditionChange;
        }
        if (result.academicDelta) {
          updatedPlayer.academicScore = Math.min(100, updatedPlayer.academicScore + result.academicDelta);
        }
        if (result.coachTrustDelta) {
          updatedPlayer.coachTrust = Math.min(100, Math.max(0, updatedPlayer.coachTrust + result.coachTrustDelta));
        }

        // Apply stat exp
        if (result.statExpGained) {
          for (const [key, val] of Object.entries(result.statExpGained)) {
            const k = key as keyof StatExp;
            const currentVal = updatedPlayer.statExp[k] || 0;
            const newVal = currentVal + (val || 0);
            if (newVal >= 100) {
              updatedPlayer.statExp[k] = newVal - 100;
              updatedPlayer.stats[k] = (updatedPlayer.stats[k] || 30) + 1;
            } else {
              updatedPlayer.statExp[k] = newVal;
            }
          }
        }

        // Friend Affinity delta
        if (result.friendAffinityDelta) {
          updatedContacts = updatedContacts.map(c => {
            if (c.id === result.friendAffinityDelta!.personId) {
              const newAffinity = Math.min(100, c.affinity + result.friendAffinityDelta!.delta);
              return {
                ...c,
                affinity: newAffinity,
                relationship: result.friendAffinityDelta!.becameBestFriend ? 'best_friend' : c.relationship
              };
            }
            return c;
          });
        }

        return {
          ...prev,
          player: updatedPlayer,
          contacts: updatedContacts,
          freeTimeUsedToday: true,
          dailyLogs: [
            {
              date: prev.currentDate,
              text: result.logText,
              type: 'event'
            },
            ...prev.dailyLogs
          ]
        };
      });

      setSelectedFreeTime(null);
    } catch (err) {
      console.error('Failed to execute free time:', err);
      setSelectedFreeTime(null);
    }
  };

  // Handle Injury Rehab
  const handleRehab = () => {
    const res = performRehabilitation(gameState);
    onUpdateGameState(prev => {
      let updatedPlayer = { ...prev.player };
      if (updatedPlayer.injury && res.daysReduced > 0) {
        const remaining = updatedPlayer.injury.daysRemaining - res.daysReduced;
        if (remaining <= 0) {
          updatedPlayer.injury = null;
        } else {
          updatedPlayer.injury = {
            ...updatedPlayer.injury,
            daysRemaining: remaining
          };
        }
      }

      return {
        ...prev,
        player: updatedPlayer,
        dailyLogs: [
          {
            date: prev.currentDate,
            text: res.logText,
            type: 'training'
          },
          ...prev.dailyLogs
        ]
      };
    });
  };

  const friendsList = gameState.contacts.filter(c => c.role === 'friend' || c.role === 'teammate' || c.role === 'crush');

  // Reason definitions grouped by category for clear selection
  const absenceReasonGroups = [
    {
      category: 'legitimate',
      title: '正当な理由（監督信頼の低下は最小限またはなし）',
      items: [
        'illness',
        'injury_recovery',
        'school_event',
        'exam',
        'family',
        'hospital',
        'fatigue',
        'coach_consulted'
      ] as PracticeAbsenceReasonId[]
    },
    {
      category: 'doubtful',
      title: '私用・私情（若干のマイナス評価）',
      items: [
        'personal',
        'friend_hangout',
        'other'
      ] as PracticeAbsenceReasonId[]
    },
    {
      category: 'unexcused',
      title: '不当・自己管理不足（監督信頼が大きく低下）',
      items: [
        'overslept',
        'played',
        'gaming',
        'slacked'
      ] as PracticeAbsenceReasonId[]
    }
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: Team Practice & Match Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: Today's Team Practice (1 choice per day!) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                本日のクラブ活動（{currentTeam.name}）
              </div>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                isPracticeDay ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {isPracticeDay ? '全体練習日' : '全体練習なし（自主日）'}
              </span>
            </div>

            <div className="text-xs text-slate-300 mb-4 leading-relaxed">
              {player.injury ? (
                <div className="text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>現在怪我のため全体練習は休止中（全治あと {player.injury.daysRemaining} 日）</span>
                </div>
              ) : isPracticeDay ? (
                `監督: ${currentTeam.coachName} のもとで戦術（${currentTeam.tactic}）と全体練習が予定されています。`
              ) : (
                '本日はチーム全体練習はありません。放課後の自由時間を有効に使いましょう。'
              )}
            </div>
          </div>

          {/* Action buttons for practice: strictly 1 time per day! */}
          {player.injury ? (
            <button
              onClick={handleRehab}
              className="w-full py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              トレーナーとリハビリメニューを行う（復帰促進）
            </button>
          ) : isPracticeDay ? (
            player.todayPracticeStatus === 'attended' ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300">本日の練習に参加しました</div>
                    <div className="text-[10px] text-slate-400">経験値獲得・監督信頼上昇済み（本日決定済）</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                  消化済み
                </span>
              </div>
            ) : player.todayPracticeStatus === 'missed' ? (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">本日の練習は欠席しました</div>
                    <div className="text-[10px] text-slate-400">
                      理由: {PRACTICE_ABSENCE_REASONS[player.todayPracticeReason || 'personal']?.label || '私用'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                  欠席決定済
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn_attend_practice"
                  onClick={() => handlePracticeAttendance(true)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  練習に参加する
                </button>
                <button
                  id="btn_open_absence_modal"
                  onClick={() => setShowAbsenceModal(true)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  練習を休む（理由選択）
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-2 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              本日はオフです。自主練や休息で翌日に備えましょう。
            </div>
          )}
        </div>

        {/* CARD 2: League Match Schedule & Matchday Transition */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                {isTodayMatchDay ? '公式リーグ戦（MATCHDAY!）' : '次節リーグ戦スケジュール'}
              </div>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                isTodayMatchDay 
                  ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isTodayMatchDay ? `第 ${todayFixture?.matchday} 節（試合日）` : `第 ${currentMatchday} 節準備期間`}
              </span>
            </div>

            {isTodayMatchDay ? (
              <div className="space-y-3 mb-4">
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60">
                  <div className="text-[11px] text-amber-400 font-bold mb-1">
                    本日キックオフ！公式リーグ戦 第 {todayFixture?.matchday} 節
                  </div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span className={todayFixture?.isPlayerHome ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {todayFixture?.homeTeam}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">vs</span>
                    <span className={!todayFixture?.isPlayerHome ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {todayFixture?.awayTeam}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    場所: {todayFixture?.isPlayerHome ? 'ホームスタジアム' : 'アウェー遠征'}
                  </div>
                </div>
              </div>
            ) : nextFixture ? (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">次節（第 {nextFixture.matchday} 節）予定日:</span>
                  <span className="text-emerald-400 font-bold font-mono">{nextFixture.date}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-white flex items-center justify-between mb-1">
                    <span>対戦: {nextFixture.isPlayerHome ? nextFixture.awayTeam : nextFixture.homeTeam}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                      {nextFixture.isPlayerHome ? 'HOME' : 'AWAY'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>試合日まであと <strong className="text-white">{daysUntilNextMatch}</strong> 日</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ※通常日は練習や自由行動で能力や体調を整えます。日程を進めて試合日に到達すると自動的にマッチデイへ移行します。
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mb-4">今シーズンの公式リーグ戦は全日程終了しました。</div>
            )}
          </div>

          {/* Match button is strictly displayed ONLY when today is Matchday */}
          {isTodayMatchDay ? (
            <button
              id="btn_play_match"
              onClick={onOpenMatchModal}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>公式戦マッチデイへ突入（スタメン発表・試合キックオフ）</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-center py-2 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              試合日ではありません（日程進行をお待ちください）
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Daily Free Time System (1 choice per day!) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">放課後・自由行動（1日1回選択）</h3>
          </div>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
            freeTimeUsedToday ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            {freeTimeUsedToday ? '本日の行動完了済' : '未消化（選択可能）'}
          </span>
        </div>

        {freeTimeResultText && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{freeTimeResultText}</span>
            </div>
            <button 
              onClick={() => setFreeTimeResultText(null)} 
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {freeTimeUsedToday ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              本日の放課後行動は完了しました。画面右上の『次の日へ進む』を押して日付を進めてください。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'solo_practice', name: '自主練（能力強化）', desc: '集中特訓で特定能力EXP獲得', icon: Dumbbell, color: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/20' },
              { id: 'study', name: '学校の勉強（学力UP）', desc: '成績向上・学業との両立', icon: BookOpen, color: 'text-blue-400 border-blue-800/60 bg-blue-950/20' },
              { id: 'hangout_friend', name: '友達と遊ぶ', desc: '親密度UP・息抜き', icon: Users, color: 'text-purple-400 border-purple-800/60 bg-purple-950/20' },
              { id: 'sleep', name: '早く寝る（睡眠調整）', desc: '疲労回復・コンディション改善', icon: Moon, color: 'text-indigo-400 border-indigo-800/60 bg-indigo-950/20' },
              { id: 'game_relax', name: 'ゲーム・趣味で息抜き', desc: 'リフレッシュ・疲労小回復', icon: Gamepad2, color: 'text-amber-400 border-amber-800/60 bg-amber-950/20' },
              { id: 'rest', name: '休む（ストレッチ）', desc: '軽いストレッチ・疲労回復', icon: Heart, color: 'text-rose-400 border-rose-800/60 bg-rose-950/20' },
              { id: 'tactics_study', name: '試合・戦術研究', desc: '戦術眼EXP・監督信頼微増', icon: Shield, color: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/20' },
              { id: 'sns_post', name: 'スマホを見る（SNS・会話）', desc: 'フォロワーや仲間と連絡', icon: Coffee, color: 'text-pink-400 border-pink-800/60 bg-pink-950/20' }
            ].map((act) => {
              const Icon = act.icon;
              const isSelected = selectedFreeTime === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setSelectedFreeTime(act.id as FreeTimeActivity)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-900/30 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{act.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{act.desc}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Free Time Execution Panel */}
        {selectedFreeTime && !freeTimeUsedToday && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-800/60 space-y-3">
            {selectedFreeTime === 'solo_practice' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">特訓する能力を選択:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'shooting', name: 'シュート' },
                    { id: 'passing', name: 'パス・展開' },
                    { id: 'dribbling', name: 'ドリブル' },
                    { id: 'pace', name: 'スピード' },
                    { id: 'defending', name: 'ディフェンス' },
                    { id: 'tacticalSense', name: '戦術眼' },
                    { id: 'stamina', name: 'スタミナ' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTargetStat(s.id as keyof StatExp)}
                      className={`p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        targetStat === s.id
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedFreeTime === 'hangout_friend' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">遊ぶ相手を選択:</label>
                <select
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  {friendsList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}（{f.relationship} • 親密度: {f.affinity}）
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedFreeTime === 'sleep' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">睡眠時間（時間）:</label>
                <div className="flex gap-2">
                  {[5, 8, 11].map((h) => (
                    <button
                      key={h}
                      onClick={() => setSleepHours(h)}
                      className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        sleepHours === h
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {h}時間 {h === 8 ? '（適正睡眠）' : h === 5 ? '（睡眠不足）' : '（寝すぎ）'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleExecuteFreeTime}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
            >
              この行動を実行する（本日の自由時間を消化）
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: Recent Activity Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-slate-400">直近の出来事・活動ログ</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {gameState.dailyLogs.slice(0, 10).map((log, index) => (
            <div
              key={index}
              className="text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5"
            >
              <span className="text-[10px] text-slate-500 shrink-0 font-mono mt-0.5">{log.date}</span>
              <span className="text-slate-300 leading-relaxed">{log.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED PRACTICE ABSENCE REASON MODAL */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">練習不参加（欠席）の理由を選択</h3>
              </div>
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                理由に応じて監督評価（信頼度）やチーム内の評判が変動します。
                正当な理由は減点が小さく、寝坊やサボりは評価を大きく落とします。
                ただし、正当な理由でも連続して休むと監督から懸念されます。
              </p>

              <div className="space-y-4">
                {absenceReasonGroups.map(group => (
                  <div key={group.category} className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 border-l-2 border-slate-600 pl-2">
                      {group.title}
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map(reasonKey => {
                        const def = PRACTICE_ABSENCE_REASONS[reasonKey];
                        if (!def) return null;
                        const isSelected = selectedAbsenceReason === reasonKey;

                        return (
                          <div
                            key={reasonKey}
                            onClick={() => setSelectedAbsenceReason(reasonKey)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{def.label}</span>
                                {def.baseTrustImpact === 0 ? (
                                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                                    監督評価 ±0
                                  </span>
                                ) : (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                    def.baseTrustImpact >= -2 ? 'text-amber-300 bg-amber-950/60' : 'text-rose-400 bg-rose-950/80 font-bold'
                                  }`}>
                                    監督評価 {def.baseTrustImpact}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 italic">
                                監督「{def.coachMessage}」
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="absence_reason"
                              checked={isSelected}
                              onChange={() => setSelectedAbsenceReason(reasonKey)}
                              className="mt-1 accent-emerald-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Free-text input when "other" is selected */}
              {selectedAbsenceReason === 'other' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    具体的な理由を入力（自由記述）:
                  </label>
                  <input
                    type="text"
                    value={customAbsenceReason}
                    onChange={(e) => setCustomAbsenceReason(e.target.value)}
                    placeholder="例: 親戚の結婚式、英語検定の受験、電車の遅延など"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950">
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={() => handlePracticeAttendance(false, selectedAbsenceReason, customAbsenceReason)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                この理由で練習を休む（本日決定）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
