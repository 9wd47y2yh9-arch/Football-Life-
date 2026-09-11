import React from 'react';
import { GameState } from '../types/footballLife';
import { BookOpen, GraduationCap, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { executeFreeTimeActivity } from '../services/freeTimeEngine';

interface SchoolViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const SchoolView: React.FC<SchoolViewProps> = ({ gameState, onUpdateGameState }) => {
  const { player, freeTimeUsedToday } = gameState;

  const stageLabels = {
    elementary: '小学校（義務教育・基礎課程）',
    middle: '中学校（ユース・部活動の分岐点）',
    high: '高等学校（全国高校サッカー / Jユース / 海外）',
    university: '大学（インカレ・大学サッカー）',
    pro: 'プロフェッショナル（学業修了・サッカー専念）'
  };

  const handleStudy = () => {
    if (freeTimeUsedToday) return;

    const res = executeFreeTimeActivity('study', gameState);
    onUpdateGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        academicScore: Math.min(100, prev.player.academicScore + (res.academicDelta || 0)),
        fatigue: Math.min(100, prev.player.fatigue + res.fatigueDelta)
      },
      freeTimeUsedToday: true,
      dailyLogs: [
        {
          date: prev.currentDate,
          text: res.logText,
          type: 'event'
        },
        ...prev.dailyLogs
      ]
    }));
  };

  return (
    <div className="space-y-6">
      {/* School Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{player.schoolName}</h2>
              <p className="text-xs text-slate-400">{stageLabels[player.schoolStage]}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            在学中（{player.age}歳）
          </span>
        </div>

        {/* Academic Score & Reputation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                定期テスト学力スコア
              </span>
              <span className={`text-base font-black ${
                player.academicScore >= 80 ? 'text-emerald-400' : player.academicScore < 40 ? 'text-rose-400' : 'text-slate-200'
              }`}>
                {player.academicScore} <span className="text-xs text-slate-500 font-normal">/ 100点</span>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${player.academicScore}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              ※赤点（40点未満）になると補習により練習参加に支障が出る恐れがあります。
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                校内評判・クラスでの評価
              </span>
              <span className="text-base font-black text-amber-400">
                {player.schoolReputation} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${player.schoolReputation}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              ※学校行事や普段の態度によってクラスメイトや先生からの好感度が変化します。
            </p>
          </div>
        </div>

        {/* Study Action Button */}
        {player.schoolStage !== 'pro' && (
          <div className="pt-2">
            <button
              onClick={handleStudy}
              disabled={freeTimeUsedToday}
              className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                freeTimeUsedToday
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {freeTimeUsedToday ? '本日の自由時間は消化済みです（勉強不可）' : '放課後に机に向かって勉強する（自由時間を消費・学力+0〜1点）'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* School Life & Academic Events Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          年間の学校行事予定
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-white">5月 / 10月: 体育祭</div>
            <p className="text-slate-400 text-[11px]">全校リレーや競技でアスリートとしての身体能力を発揮するチャンス。</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-white">7月 / 12月: 期末テスト</div>
            <p className="text-slate-400 text-[11px]">日頃の勉強の積み重ねが試される。赤点回避が至上命題。</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-white">11月: 文化祭</div>
            <p className="text-slate-400 text-[11px]">クラスの出し物や友達・気になる人との大切な思い出作り。</p>
          </div>
        </div>
      </div>
    </div>
  );
};
