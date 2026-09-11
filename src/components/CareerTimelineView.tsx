import React, { useState } from 'react';
import { GameState } from '../types/footballLife';
import { Trophy, Award, Flag, ArrowRightLeft, Sparkles, Heart, Shield, AlertCircle } from 'lucide-react';

interface CareerTimelineViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const CareerTimelineView: React.FC<CareerTimelineViewProps> = ({
  gameState,
  onUpdateGameState
}) => {
  const { player, timeline, isRetired } = gameState;
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);

  // Compute Career Stats from fixtures
  const playedFixtures = gameState.leagueFixtures.filter(f => f.played && f.playerPlayed);
  const totalGoals = playedFixtures.reduce((sum, f) => sum + (f.playerGoals || 0), 0);
  const totalAssists = playedFixtures.reduce((sum, f) => sum + (f.playerAssists || 0), 0);
  const avgRating = playedFixtures.length > 0
    ? (playedFixtures.reduce((sum, f) => sum + (f.playerRating || 0), 0) / playedFixtures.length).toFixed(2)
    : '0.00';

  const handleRetire = () => {
    onUpdateGameState(prev => ({
      ...prev,
      isRetired: true,
      timeline: [
        {
          id: `tl_retire_${Date.now()}`,
          age: prev.player.age,
          date: prev.currentDate,
          title: '現役引退を表明',
          description: `${prev.player.age}歳にしてスパイクを脱ぎ、数々の思い出と情熱を胸に現役生活に幕を下ろした。`,
          type: 'milestone'
        },
        ...prev.timeline
      ],
      dailyLogs: [
        {
          date: prev.currentDate,
          text: '【現役引退】選手生活に幕を下ろしました。偉大なる挑戦の軌跡に拍手が送られます。',
          type: 'event'
        },
        ...prev.dailyLogs
      ]
    }));
    setShowRetireConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Career Summary Stats Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>{player.name} のキャリア軌跡・通算記録</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              10歳のスタートから現在（{player.age}歳）までの歩み
            </p>
          </div>
          {isRetired ? (
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              現役引退済み
            </span>
          ) : (
            <button
              onClick={() => setShowRetireConfirm(true)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-1.5 rounded-lg border border-rose-800 transition cursor-pointer"
            >
              現役引退を申し出る
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500">公式戦出場</div>
            <div className="text-lg font-black text-white">{playedFixtures.length} 試合</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500">通算ゴール</div>
            <div className="text-lg font-black text-emerald-400">{totalGoals} 得点</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500">通算アシスト</div>
            <div className="text-lg font-black text-sky-400">{totalAssists} アシスト</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500">平均評価点</div>
            <div className="text-lg font-black text-amber-400">{avgRating}</div>
          </div>
        </div>
      </div>

      {/* Voluntary Retirement Confirmation Modal */}
      {showRetireConfirm && (
        <div className="p-5 rounded-2xl bg-rose-950/80 border border-rose-600 text-white space-y-3 shadow-2xl">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            本当に現役を引退しますか？
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            引退すると以後の試合出場や移籍は行えなくなり、このキャリアの全記録が確定します。
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRetireConfirm(false)}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleRetire}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              引退を確定する
            </button>
          </div>
        </div>
      )}

      {/* Chronological Timeline Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-xs font-bold text-slate-400">年代別クロニクル・歴史年表</h3>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
          {timeline.map((item) => (
            <div key={item.id} className="relative pl-8 space-y-1">
              {/* Milestone Icon Dot */}
              <div className="absolute left-1.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {item.age}歳
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                <span className="text-xs font-bold text-white">{item.title}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
