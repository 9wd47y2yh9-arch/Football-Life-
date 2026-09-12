import React from 'react';
import { GameState, OffSeasonData } from '../types/footballLife';
import { Trophy, Award, Calendar, ArrowRight, Star, Shield, Flame } from 'lucide-react';
import { startNewSeason } from '../services/gameEngine';

interface OffSeasonModalProps {
  offSeasonData: OffSeasonData;
  gameState: GameState;
  onProceedToNextSeason: (updatedState: GameState) => void;
}

export const OffSeasonModal: React.FC<OffSeasonModalProps> = ({
  offSeasonData,
  gameState,
  onProceedToNextSeason
}) => {
  const handleStartNextSeason = () => {
    const nextState = startNewSeason(gameState);
    onProceedToNextSeason(nextState);
  };

  const {
    seasonNumber,
    finalPosition,
    totalTeams,
    isChampion,
    playerMatchesPlayed,
    playerGoals,
    playerAssists,
    teamPoints,
    teamWon,
    teamDrawn,
    teamLost
  } = offSeasonData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner */}
        <div className={`p-6 text-center border-b border-slate-800 ${
          isChampion
            ? 'bg-gradient-to-b from-amber-600/30 via-slate-900 to-slate-900'
            : 'bg-gradient-to-b from-blue-900/30 via-slate-900 to-slate-900'
        }`}>
          <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-amber-400 mb-3 shadow-inner">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block mb-1">
            SEASON #{seasonNumber} REVIEW
          </span>
          <h1 className="text-2xl font-black text-white">
            {isChampion ? `第${seasonNumber}シーズン リーグ優勝！！` : `第${seasonNumber}シーズン 全日程終了`}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {gameState.player.currentTeam.name}（{gameState.player.schoolName}）
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Team Result Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">チーム最終順位</span>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                finalPosition === 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : finalPosition <= 3
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                第 {finalPosition} 位 / 全 {totalTeams} チーム
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800/60">
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[11px] text-slate-500 block">勝点</span>
                <span className="text-lg font-black text-white">{teamPoints}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[11px] text-slate-500 block">勝利</span>
                <span className="text-lg font-black text-emerald-400">{teamWon}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[11px] text-slate-500 block">引分</span>
                <span className="text-lg font-black text-slate-300">{teamDrawn}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[11px] text-slate-500 block">敗戦</span>
                <span className="text-lg font-black text-rose-400">{teamLost}</span>
              </div>
            </div>
          </div>

          {/* Player Individual Record */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center space-x-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>個人シーズン成績</span>
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">出場試合数</span>
                <span className="text-xl font-bold text-white mt-1">{playerMatchesPlayed} <span className="text-xs text-slate-500">試合</span></span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">得点</span>
                <span className="text-xl font-bold text-emerald-400 mt-1">{playerGoals} <span className="text-xs text-slate-500">点</span></span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">アシスト</span>
                <span className="text-xl font-bold text-cyan-400 mt-1">{playerAssists} <span className="text-xs text-slate-500">本</span></span>
              </div>
            </div>
          </div>

          {/* Off-season message */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-600/30 rounded-2xl text-xs text-emerald-200/90 leading-relaxed">
            オフシーズン期間中、選手の疲労は完全回復（0%）し、怪我も完治します。次のシーズンでは学年が上がり、新たな公式戦14節が編成されます。
          </div>

          {/* Next season button */}
          <button
            onClick={handleStartNextSeason}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-900/40 transition flex items-center justify-center space-x-3 cursor-pointer"
          >
            <span>新シーズン（第{seasonNumber + 1}シーズン）へ進む</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
