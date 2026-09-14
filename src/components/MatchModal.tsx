import React, { useState } from 'react';
import { GameState, MatchFixture, MatchMoment, OffSeasonData } from '../types/footballLife';
import { evaluateLineupRole, generateMatchMoments, simulateMatchResults, simulateMatchdayForAllTeams } from '../services/matchEngine';
import { calculateMatchExpGains, applyStatGainsAndRecalculateOvr } from '../services/trainingEngine';
import { Shield, Trophy, Activity, ArrowRight, CheckCircle2, XCircle, Award, Star, Flame } from 'lucide-react';

interface MatchModalProps {
  gameState: GameState;
  fixture: MatchFixture;
  onFinishMatch: (updatedGameState: GameState) => void;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  gameState,
  fixture,
  onFinishMatch,
  onClose
}) => {
  const [step, setStep] = useState<'lineup' | 'moments' | 'result'>('lineup');
  
  // Calculate CPU coach lineup decision
  const lineupRole = evaluateLineupRole(gameState);
  
  // Generate interactive moments based on role and opponent
  const opponentName = fixture.isPlayerHome ? fixture.awayTeam : fixture.homeTeam;
  const [moments] = useState<MatchMoment[]>(() => 
    generateMatchMoments(
      lineupRole === 'starter' ? 'starter' : 'bench',
      gameState.player.currentPosition,
      opponentName
    )
  );
  
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [momentDecisions, setMomentDecisions] = useState<Array<{
    momentId: string;
    optionIndex: number;
    success: boolean;
    outcomeText: string;
    outcomeType?: 'goal' | 'assist' | 'chance_created' | 'defensive_stop' | 'turnover' | 'none';
  }>>([]);
  
  const [matchResultData, setMatchResultData] = useState<{
    updatedFixture: MatchFixture;
    playerRating: number;
    playerGoals: number;
    playerAssists: number;
    coachTrustDelta: number;
    fansGained: number;
    ovrIncreased: boolean;
    fatigueCost: number;
  } | null>(null);

  // Lineup role descriptions
  const roleDisplay = {
    starter: { title: 'スタメン（先発出場）', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-600', note: '日頃の練習と好調が認められ、スターティングイレブンに抜擢！' },
    bench: { title: 'ベンチ入り（途中出場待機）', color: 'text-amber-400 bg-amber-950/60 border-amber-600', note: '戦況に応じた交代カードとしてベンチ入り。勝負どころでの起用に備えよ。' },
    out_of_squad: { title: 'ベンチ外（スタンド観戦・休養）', color: 'text-rose-400 bg-rose-950/60 border-rose-600', note: '疲労蓄積またはコンディション不良のため、今節はメンバー外休養となりました。' }
  }[lineupRole];

  // Handle moment decision
  const handleSelectMomentOption = (optionIndex: number) => {
    const currentMoment = moments[currentMomentIndex];
    const option = currentMoment.options[optionIndex];

    // Determine success based on player's stat
    const statVal = gameState.player.stats[option.statUsed] || 50;
    const baseSuccessChance = statVal / 100;
    const riskMod = option.risk === 'low' ? 0.2 : option.risk === 'high' ? -0.2 : 0;
    const isSuccess = Math.random() < Math.max(0.2, Math.min(0.85, baseSuccessChance + riskMod));

    const decisionRecord = {
      momentId: currentMoment.id,
      optionIndex,
      success: isSuccess,
      outcomeText: isSuccess ? option.successOutcome : option.failOutcome,
      outcomeType: option.outcomeType
    };

    const newDecisions = [...momentDecisions, decisionRecord];
    setMomentDecisions(newDecisions);

    if (currentMomentIndex + 1 < moments.length) {
      setCurrentMomentIndex(prev => prev + 1);
    } else {
      // All moments done, simulate full match
      const simResult = simulateMatchResults(
        { ...fixture, playerRole: lineupRole },
        gameState,
        newDecisions
      );
      setMatchResultData(simResult);
      setStep('result');
    }
  };

  // Complete match and update state
  const handleFinalizeMatch = () => {
    if (!matchResultData) return;

    const { updatedFixture, playerRating, playerGoals, playerAssists, coachTrustDelta, fansGained, ovrIncreased, fatigueCost } = matchResultData;

    // Simulate all matches of this matchday and update standings for all 8 clubs
    const { updatedStandings, updatedFixtures } = simulateMatchdayForAllTeams(
      gameState.leagueStandings,
      gameState.leagueFixtures,
      fixture.matchday,
      updatedFixture
    );

    // Update player
    let updatedPlayer = { ...gameState.player };
    updatedPlayer.fatigue = Math.min(100, updatedPlayer.fatigue + fatigueCost);
    // Coach trust display is strictly integer (100-0)
    updatedPlayer.coachTrust = Math.round(Math.max(0, Math.min(100, updatedPlayer.coachTrust + coachTrustDelta)));
    updatedPlayer.fans += fansGained;

    // Calculate realistic match EXP gains based on matchday performance
    const matchExp = calculateMatchExpGains(
      updatedFixture.playerMinutes || 0,
      playerGoals,
      playerAssists,
      playerRating,
      updatedPlayer.currentPosition
    );

    const { updatedPlayer: expUpdatedPlayer } = applyStatGainsAndRecalculateOvr(updatedPlayer, matchExp);
    updatedPlayer = expUpdatedPlayer;

    // Career timeline note if first goal or big rating
    let updatedTimeline = [...gameState.timeline];
    if (playerGoals > 0 && gameState.player.fans < 10) {
      updatedTimeline.unshift({
        id: `tl_first_goal_${Date.now()}`,
        age: updatedPlayer.age,
        date: gameState.currentDate,
        title: '公式戦初ゴール！',
        description: `リーグ第${fixture.matchday}節（vs ${fixture.isPlayerHome ? fixture.awayTeam : fixture.homeTeam}）にて値千金の初ゴールを記録！`,
        type: 'trophy'
      });
    }

    // Check if season is complete
    const isSeasonComplete = updatedFixtures.every(f => f.played);
    let activeOffSeason: OffSeasonData | null = null;

    if (isSeasonComplete) {
      const teamRankIndex = updatedStandings.findIndex(s => s.teamName === updatedPlayer.currentTeam.name);
      const finalPosition = teamRankIndex >= 0 ? teamRankIndex + 1 : 4;
      const isChampion = finalPosition === 1;

      const playerMatches = updatedFixtures.filter(f => f.playerPlayed);
      const totalGoals = playerMatches.reduce((acc, f) => acc + (f.playerGoals || 0), 0);
      const totalAssists = playerMatches.reduce((acc, f) => acc + (f.playerAssists || 0), 0);

      activeOffSeason = {
        seasonNumber: gameState.currentSeason,
        finalPosition,
        totalTeams: updatedStandings.length || 8,
        isChampion,
        playerMatchesPlayed: playerMatches.length,
        playerGoals: totalGoals,
        playerAssists: totalAssists,
        teamPoints: updatedStandings[teamRankIndex]?.points || 0,
        teamWon: updatedStandings[teamRankIndex]?.won || 0,
        teamDrawn: updatedStandings[teamRankIndex]?.drawn || 0,
        teamLost: updatedStandings[teamRankIndex]?.lost || 0
      };
    }

    const updatedState: GameState = {
      ...gameState,
      player: updatedPlayer,
      leagueFixtures: updatedFixtures,
      leagueStandings: updatedStandings,
      currentMatchday: gameState.currentMatchday + 1,
      activeMatch: null,
      activeOffSeason,
      timeline: updatedTimeline,
      dailyLogs: [
        {
          date: gameState.currentDate,
          text: `【公式戦結果】${updatedFixture.homeTeam} ${updatedFixture.homeScore} - ${updatedFixture.awayScore} ${updatedFixture.awayTeam}（評価点: ${playerRating > 0 ? playerRating : '出場なし'} / 獲得ファン: +${fansGained}人）`,
          type: 'match'
        },
        ...gameState.dailyLogs
      ]
    };

    onFinishMatch(updatedState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-5 my-8">
        {/* Match Header */}
        <div className="text-center border-b border-slate-800 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            {fixture.competitionName}
          </div>
          <div className="flex items-center justify-center gap-4 text-base sm:text-lg font-black mt-1">
            <span className={fixture.isPlayerHome ? 'text-emerald-400' : 'text-slate-300'}>
              {fixture.homeTeam}
            </span>
            <span className="text-slate-500 text-xs font-bold">VS</span>
            <span className={!fixture.isPlayerHome ? 'text-emerald-400' : 'text-slate-300'}>
              {fixture.awayTeam}
            </span>
          </div>
        </div>

        {/* STEP 1: Lineup Decision by Coach CPU */}
        {step === 'lineup' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-300">監督CPUによるスタメン選考発表</h3>
              <p className="text-xs text-slate-500 mt-1">
                能力値、ポジション適性、直近の疲労度（{gameState.player.fatigue}%）、監督信頼度（{Math.round(gameState.player.coachTrust)}）を総合評価
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${roleDisplay.color} text-center space-y-2`}>
              <div className="text-lg font-black tracking-wide">{roleDisplay.title}</div>
              <p className="text-xs opacity-90">{roleDisplay.note}</p>
            </div>

            {lineupRole === 'out_of_squad' ? (
              <button
                onClick={() => {
                  const simResult = simulateMatchResults(
                    { ...fixture, playerRole: 'out_of_squad' },
                    gameState,
                    []
                  );
                  setMatchResultData(simResult);
                  setStep('result');
                }}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>スタンドからチームの試合を見届ける</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setStep('moments')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <span>キックオフ！試合に臨む</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Interactive Key Moments */}
        {step === 'moments' && moments[currentMomentIndex] && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                重要場面の選択（{currentMomentIndex + 1} / {moments.length}）
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {moments[currentMomentIndex].minute}分
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">{moments[currentMomentIndex].title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{moments[currentMomentIndex].situation}</p>
            </div>

            {/* Decision options */}
            <div className="space-y-2.5">
              {moments[currentMomentIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectMomentOption(idx)}
                  className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span>{opt.text}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      opt.risk === 'low' ? 'bg-blue-900 text-blue-200' : opt.risk === 'high' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'
                    }`}>
                      リスク: {opt.risk === 'low' ? '低' : opt.risk === 'high' ? '高' : '中'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    参照能力: {opt.statUsed}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Match Result & Post-match Evaluation */}
        {step === 'result' && matchResultData && (
          <div className="space-y-4">
            {/* Scoreboard */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="text-xs text-slate-400">試合終了</div>
              <div className="text-3xl font-black tracking-widest text-white">
                {matchResultData.updatedFixture.homeScore} - {matchResultData.updatedFixture.awayScore}
              </div>
              <div className="text-xs font-semibold text-slate-300">
                {matchResultData.updatedFixture.homeScore === matchResultData.updatedFixture.awayScore
                  ? '引き分け'
                  : (matchResultData.updatedFixture.isPlayerHome
                      ? matchResultData.updatedFixture.homeScore! > matchResultData.updatedFixture.awayScore!
                      : matchResultData.updatedFixture.awayScore! > matchResultData.updatedFixture.homeScore!)
                  ? 'チームの勝利！'
                  : '惜敗'}
              </div>
            </div>

            {/* Player Match Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400">選手採点</div>
                <div className="text-base font-black text-amber-400">
                  {matchResultData.playerRating > 0 ? matchResultData.playerRating : 'なし'}
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400">得点 / アシスト</div>
                <div className="text-base font-black text-emerald-400">
                  {matchResultData.playerGoals}G / {matchResultData.playerAssists}A
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400">本物ファン増加</div>
                <div className="text-base font-black text-pink-400">
                  +{matchResultData.fansGained}人
                </div>
              </div>
            </div>

            {/* Match Experience Event */}
            {matchResultData.playerRating >= 7.0 && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500 text-amber-300 text-xs flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400" />
                <div>
                  <span className="font-bold">【実戦経験獲得！】</span> 試合での際立ったパフォーマンスにより、
                  ポジション適性に応じた能力経験値が大幅に蓄積されました！
                </div>
              </div>
            )}

            {/* Match Event Log Preview */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 max-h-32 overflow-y-auto space-y-1.5 text-xs text-slate-300">
              <div className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">試合ハイライト</div>
              {matchResultData.updatedFixture.logs?.map((log, i) => (
                <div key={i} className={`flex gap-2 ${log.isPlayerInvolved ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                  <span className="text-[10px] text-slate-500 w-8">{log.minute}分</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinalizeMatch}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
            >
              試合を終えて結果を確定する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
