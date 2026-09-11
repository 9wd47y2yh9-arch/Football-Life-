import React from 'react';
import { GameState, StatExp } from '../types/footballLife';
import { Dumbbell, Activity, HeartPulse, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { performRehabilitation } from '../services/trainingEngine';

interface TrainingViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ gameState, onUpdateGameState }) => {
  const { player } = gameState;
  const currentTeam = player.currentTeam;

  const statLabels: Array<{ key: keyof StatExp; label: string; desc: string }> = [
    { key: 'shooting', label: 'シュート', desc: '決定力、ミドルシュート' },
    { key: 'passing', label: 'パス', desc: 'ショートパス、ロングキック精度' },
    { key: 'dribbling', label: 'ドリブル', desc: 'キープ力、狭いエリアでの打開' },
    { key: 'pace', label: 'スピード', desc: '最高速度、アジリティ' },
    { key: 'defending', label: '守備', desc: 'タックル、パスカット、対人' },
    { key: 'physical', label: 'フィジカル', desc: '体幹、競り合いの強さ' },
    { key: 'tacticalSense', label: '戦術眼', desc: 'ポジショニング、状況判断' },
    { key: 'stamina', label: 'スタミナ', desc: '試合終了までの運動量' },
    { key: 'mental', label: 'メンタル', desc: '勝負強さ、プレッシャー耐性' }
  ];

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

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-6">
      {/* Team Schedule & Practice Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              所属チーム練習日程（{currentTeam.name}）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              週{currentTeam.practiceDaysPerWeek}日練習 • 監督: {currentTeam.coachName} ({currentTeam.coachStyle}) • 戦術: {currentTeam.tactic}
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
            チーム格: ★{currentTeam.level}
          </span>
        </div>

        {/* Weekly Calendar */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {daysOfWeek.map((day, idx) => {
            const isPractice = currentTeam.practiceSchedule.includes(idx);
            return (
              <div
                key={day}
                className={`p-3 rounded-xl border ${
                  isPractice
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="font-bold text-xs">{day}曜日</div>
                <div className="text-[10px] mt-1 font-semibold">
                  {isPractice ? '全体練習' : '休み'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-2">
          <span>練習態度評価: <strong className="text-emerald-400">{player.practiceAttitude}%</strong></span>
          <span>無断欠席連続日数: <strong className={player.consecutiveMissedPractices > 0 ? 'text-rose-400' : 'text-slate-300'}>{player.consecutiveMissedPractices}日</strong></span>
        </div>
      </div>

      {/* Injury Care & Rehabilitation Section */}
      {player.injury && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-rose-200">怪我治療・リハビリテーション</h3>
            </div>
            <span className="text-xs font-bold text-rose-300 bg-rose-900/60 px-2.5 py-1 rounded-full">
              全治あと {player.injury.daysRemaining} 日
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            診断名: <strong className="text-white">{player.injury.name}</strong>（重症度: {player.injury.severity}）。
            怪我期間中は無理な練習や試合出場は禁止されています。リハビリを行うことで患部の治癒を少し早めることができます。
          </p>

          <button
            onClick={handleRehab}
            className="w-full py-2.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <HeartPulse className="w-4 h-4" />
            リハビリセッションを行う（段階的復帰）
          </button>
        </div>
      )}

      {/* Player Capabilities & Long-term Growth Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              能力値・長期成長ゲージ（Stat Experience）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ※通常練習や自主練で経験値を蓄積。ゲージが100%に達すると能力値が+1向上します。
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">総合能力</span>
            <div className="text-lg font-black text-emerald-400 leading-none">OVR {player.ovr}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {statLabels.map(({ key, label, desc }) => {
            const statValue = player.stats[key] || 50;
            const expValue = player.statExp[key] || 0;

            return (
              <div key={key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{label}</span>
                    <span className="text-[10px] text-slate-500 ml-2">{desc}</span>
                  </div>
                  <span className="font-black text-sm text-emerald-400">{statValue}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>次の成長まで</span>
                    <span className="font-semibold text-slate-300">{expValue} / 100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${expValue}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
