import React from 'react';
import { GameState } from '../types/footballLife';
import { COUNTRIES } from '../data/worldData';
import { Shield, Heart, Activity, Users, MessageSquare, AlertTriangle, ArrowRight, Smartphone, Settings, FastForward, Calendar, Save } from 'lucide-react';
import { formatDateJapanese } from '../services/gameEngine';

interface HeaderProps {
  gameState: GameState;
  onNextDay: () => void;
  onAutoAdvance: () => void;
  onManualSave: () => void;
  daysUntilMatch?: number;
  onOpenSmartphone: () => void;
  onOpenSettings: () => void;
  isProcessingNextDay: boolean;
  isAutoAdvancing: boolean;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  onNextDay,
  onAutoAdvance,
  onManualSave,
  daysUntilMatch,
  onOpenSmartphone,
  onOpenSettings,
  isProcessingNextDay,
  isAutoAdvancing,
  isSaving
}) => {
  const { player, currentDate } = gameState;
  const country = COUNTRIES[player.currentCountry] || COUNTRIES.japan;

  // Unread messages count
  const unreadMessagesCount = gameState.contacts.reduce((acc, c) => acc + c.unreadCount, 0);

  // Condition icons & colors
  const conditionLabels: Record<string, { label: string; color: string }> = {
    superb: { label: '絶好調', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
    good: { label: '好調', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    normal: { label: '普通', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    poor: { label: '不調', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
    terrible: { label: '絶不調', color: 'text-red-400 bg-red-400/10 border-red-400/30' }
  };

  const currentCond = conditionLabels[player.condition] || conditionLabels.normal;

  const canAutoAdvance = daysUntilMatch !== undefined && daysUntilMatch > 5 && !isAutoAdvancing && !isProcessingNextDay && !gameState.isRetired;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top Row: Title, Date, Age, and Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-sm shadow">
                FL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-wider text-white">
                    FOOTBALL LIFE
                  </span>
                  {daysUntilMatch !== undefined && (
                    daysUntilMatch === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse">
                        試合当日
                      </span>
                    ) : daysUntilMatch <= 5 ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold">
                        試合 {daysUntilMatch}日前
                      </span>
                    ) : null
                  )}
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2 font-medium">
                  <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    {formatDateJapanese(currentDate)}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-200">{player.age}歳</span>
                  <span className="text-slate-600">•</span>
                  <span>{country.flag} {player.schoolName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nav & Main Action */}
          <div className="flex items-center gap-2">
            {/* Smartphone Button */}
            <button
              id="header_phone_btn"
              onClick={onOpenSmartphone}
              className="relative px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="スマートフォン（SNS・メッセージ・連絡先）"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">スマホ</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Manual Save Button */}
            <button
              id="header_save_btn"
              onClick={onManualSave}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                isSaving
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
              }`}
              title="現在の進行状況を手動セーブ（ブラウザに確実に保存）"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-bounce text-emerald-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">{isSaving ? '保存完了' : 'セーブ'}</span>
            </button>

            {/* Settings Button */}
            <button
              id="header_settings_btn"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="設定・最初からやり直す"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* "自動" Button: advances strictly to 5 days before next match */}
            <button
              id="header_auto_btn"
              onClick={onAutoAdvance}
              disabled={!canAutoAdvance}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                canAutoAdvance
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40 active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
              }`}
              title={
                canAutoAdvance
                  ? `次の試合の5日前まで自動進行（あと${daysUntilMatch}日）`
                  : daysUntilMatch !== undefined && daysUntilMatch <= 5
                  ? `現在試合5日前以内のため利用できません。「次の日へ」で1日ずつ進めてください。`
                  : '自動進行は利用できません'
              }
            >
              <FastForward className={`w-3.5 h-3.5 ${isAutoAdvancing ? 'animate-spin' : ''}`} />
              <span>{isAutoAdvancing ? '自動進行中...' : '自動'}</span>
            </button>

            {/* Next Day Action Button: 1 day at a time */}
            <button
              id="header_next_day_btn"
              onClick={onNextDay}
              disabled={isProcessingNextDay || isAutoAdvancing || gameState.isRetired}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                isProcessingNextDay || isAutoAdvancing
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-95'
              }`}
            >
              <span>{isProcessingNextDay ? '日付進行中...' : '次の日へ'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Player Stats Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
          {/* OVR & Position */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">OVR</span>
            <span className="text-sm font-black text-emerald-400">{player.ovr}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
              {player.currentPosition}
            </span>
          </div>

          {/* Fatigue Gauge */}
          <div className="flex flex-col justify-center bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-rose-400" />
                疲労
              </span>
              <span className={`font-bold ${player.fatigue >= 70 ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
                {player.fatigue}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  player.fatigue >= 85
                    ? 'bg-rose-500'
                    : player.fatigue >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, player.fatigue)}%` }}
              />
            </div>
          </div>

          {/* Condition */}
          <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">調子</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${currentCond.color}`}>
              {currentCond.label}
            </span>
          </div>

          {/* Coach Trust */}
          <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">監督評価</span>
            <div className="flex items-center gap-1">
              <span className={`font-bold ${player.coachTrust >= 70 ? 'text-emerald-400' : player.coachTrust < 40 ? 'text-rose-400' : 'text-slate-200'}`}>
                {Math.round(player.coachTrust)}
              </span>
              <span className="text-[10px] text-slate-500">/100</span>
            </div>
          </div>

          {/* Real Fans */}
          <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800" title="試合や大会の活躍で増える本物のファン人数">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-400" />
              ファン
            </span>
            <span className="font-bold text-slate-200">{player.fans.toLocaleString()}人</span>
          </div>

          {/* SNS Followers */}
          <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800" title="SNSフォロワー数（ファン人数とは別管理）">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-400" />
              SNS
            </span>
            <span className="font-bold text-sky-300">{player.snsFollowers.toLocaleString()}人</span>
          </div>
        </div>

        {/* Warning Banner if Injured */}
        {player.injury && (
          <div className="mt-2 py-1 px-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>【怪我療養中】{player.injury.name}（全治あと {player.injury.daysRemaining} 日）</span>
            </div>
            <span className="text-[11px] bg-rose-900/60 px-2 py-0.5 rounded text-rose-200">
              練習・試合出場制限
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
