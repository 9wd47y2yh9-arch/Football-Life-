import React, { useState } from 'react';
import { GameState, StatExp, InventoryItem } from '../types/footballLife';
import { Dumbbell, Activity, HeartPulse, Shield, CheckCircle2, AlertTriangle, ShoppingBag, Sparkles, Zap, Package, ArrowUpRight } from 'lucide-react';
import { performRehabilitation, processSelfPractice, applyStatGainsAndRecalculateOvr } from '../services/trainingEngine';
import { equipCleats, useConsumableItem } from '../services/freeTimeEngine';

interface TrainingViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
  onOpenShop?: () => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ 
  gameState, 
  onUpdateGameState,
  onOpenShop 
}) => {
  const { player } = gameState;
  const currentTeam = player.currentTeam;

  // Selected Self-Practice Focus
  const [selectedFocus, setSelectedFocus] = useState<keyof StatExp>('shooting');
  const [practiceNotification, setPracticeNotification] = useState<string | null>(null);

  const statLabels: Array<{ key: keyof StatExp; label: string; desc: string; category: 'physical' | 'technical' | 'tactical' | 'mental' }> = [
    { key: 'shooting', label: 'シュート（決定力）', desc: '枠内シュート、ミドルシュート、決定力', category: 'technical' },
    { key: 'passing', label: 'パス（配球力）', desc: 'ショートパス、展開ロングフィード、クロス', category: 'technical' },
    { key: 'dribbling', label: 'ドリブル（打開力）', desc: '足元コントロール、狭い局面の打開', category: 'technical' },
    { key: 'pace', label: 'スピード（瞬発力・加速）', desc: '最高速、初速アジリティ、裏抜け', category: 'physical' },
    { key: 'physical', label: 'フィジカル（体幹・筋力）', desc: '体幹の強さ、空中戦、競り合い・キープ力', category: 'physical' },
    { key: 'stamina', label: 'スタミナ（持久力）', desc: '90分間の運動量、連戦耐性', category: 'physical' },
    { key: 'defending', label: '守備（ボール奪取）', desc: 'インターセプト、タックル、対人守備', category: 'tactical' },
    { key: 'tacticalSense', label: '戦術眼（ポジショニング）', desc: '状況判断、マーク、スペース認知', category: 'tactical' },
    { key: 'mental', label: 'メンタル（勝負強さ）', desc: 'プレッシャー耐性、終盤の集中力', category: 'mental' }
  ];

  // Execute Individual Self-Practice (居残り自主練習)
  const handleSelfPractice = () => {
    if (player.injury) {
      setPracticeNotification('怪我療養中は自主練習を行えません。リハビリに専念してください。');
      return;
    }
    if (player.fatigue >= 90) {
      setPracticeNotification('疲労が限界近くに達しています。怪我のリスクが極めて高いため休養をお勧めします。');
    }

    const res = processSelfPractice(gameState, selectedFocus);

    onUpdateGameState(prev => {
      let updatedPlayer = { ...prev.player };
      updatedPlayer.fatigue = Math.min(100, updatedPlayer.fatigue + res.fatigueCost);
      updatedPlayer.coachTrust = Math.min(100, updatedPlayer.coachTrust + 1);
      if (res.injuryOccurred) {
        updatedPlayer.injury = res.injuryOccurred;
      }

      // Apply EXP gains
      const growth = applyStatGainsAndRecalculateOvr(updatedPlayer, res.statExpGained);
      updatedPlayer = growth.updatedPlayer;

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

    setPracticeNotification(res.logText);
    setTimeout(() => setPracticeNotification(null), 4500);
  };

  // Equip Cleats
  const handleEquipCleats = (itemId: string) => {
    const res = equipCleats(gameState, itemId);
    if (res.success) {
      onUpdateGameState(() => res.updatedGameState);
      setPracticeNotification(res.message);
      setTimeout(() => setPracticeNotification(null), 3500);
    }
  };

  // Use Item
  const handleUseItem = (itemId: string) => {
    const res = useConsumableItem(gameState, itemId);
    if (res.success) {
      onUpdateGameState(() => res.updatedGameState);
      setPracticeNotification(res.message);
      setTimeout(() => setPracticeNotification(null), 3500);
    }
  };

  // Handle Rehab
  const handleRehab = () => {
    const res = performRehabilitation(gameState);
    onUpdateGameState(prev => {
      let updatedPlayer = { ...prev.player, rehabDoneToday: true };
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
    setPracticeNotification(res.logText);
    setTimeout(() => setPracticeNotification(null), 3500);
  };

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const equippedCleats = player.equippedGear?.cleats;
  const inventoryItems = player.inventory || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {practiceNotification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{practiceNotification}</span>
          </div>
          <button onClick={() => setPracticeNotification(null)} className="text-slate-400 hover:text-white px-2">
            ✕
          </button>
        </div>
      )}

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
            disabled={player.rehabDoneToday}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              player.rehabDoneToday
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-rose-800 hover:bg-rose-700 text-white'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            {player.rehabDoneToday ? '本日のリハビリは実施済みです' : 'リハビリセッションを行う（段階的復帰）'}
          </button>
        </div>
      )}

      {/* SECTION 1: 自主練習（重点特訓） */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              居残り自主練習（重点特訓・個別指導）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              全体練習とは別に、伸ばしたい能力を集中的に特訓。高いEXPを獲得できますが、疲労蓄積と怪我リスクに注意。
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
            高効率EXP獲得
          </span>
        </div>

        {/* Focus Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">特訓項目を選択:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {statLabels.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedFocus(key)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  selectedFocus === key
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{label.split('（')[0]}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {player.stats[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            現在の疲労: <strong className={player.fatigue >= 70 ? 'text-rose-400' : 'text-emerald-400'}>{player.fatigue}%</strong>
            {player.fatigue >= 70 && (
              <span className="ml-2 text-rose-400">（※疲労度が高いため怪我リスク上昇中）</span>
            )}
          </div>
          <button
            onClick={handleSelfPractice}
            disabled={!!player.injury}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
              player.injury
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40 active:scale-95'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>居残り自主練を実施する（疲労+12〜18%）</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: ギア装備＆インベントリ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              用具・ギア装備＆所持品インベントリ
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              スパイクを装備して公式戦や練習でのパフォーマンスを底上げ。サプリメントで体調を即時回復。
            </p>
          </div>
          {onOpenShop && (
            <button
              onClick={onOpenShop}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ショップで用具を購入</span>
            </button>
          )}
        </div>

        {/* Current Equipped Cleats */}
        <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">現在装備中のスパイク</div>
            <div className="text-sm font-black text-white">
              {equippedCleats ? equippedCleats.name : 'スタンダードトレーニングシューズ（初期装備）'}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              {equippedCleats?.statBonus ? (
                Object.entries(equippedCleats.statBonus).map(([k, v]) => (
                  <span key={k} className="text-emerald-400 font-semibold">
                    {k.toUpperCase()} +{v}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">特別な能力値ボーナスなし</span>
              )}
              {equippedCleats?.durabilityRemaining !== undefined && (
                <span className="text-slate-400">
                  残り耐久: 公式戦 {equippedCleats.durabilityRemaining} 試合分
                </span>
              )}
            </div>
          </div>
          <span className="text-xs font-bold text-sky-300 bg-sky-950/60 border border-sky-800 px-3 py-1 rounded-full">
            装備中
          </span>
        </div>

        {/* Inventory Items List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300">所持品一覧 ({inventoryItems.length}件):</div>
          {inventoryItems.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
              所持しているアイテムはありません。ショップでスパイクやサプリメントを購入できます。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {inventoryItems.map(inv => (
                <div
                  key={inv.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{inv.name}</span>
                      {inv.isEquipped && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          装備中
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {inv.category === 'cleats' ? 'スパイク' : inv.category === 'nutrition' ? '栄養補助' : 'ケア'}
                      {inv.durabilityRemaining ? ` (耐久:${inv.durabilityRemaining}試合)` : ''}
                    </div>
                  </div>

                  {inv.category === 'cleats' ? (
                    <button
                      onClick={() => handleEquipCleats(inv.id)}
                      disabled={inv.isEquipped}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        inv.isEquipped
                          ? 'bg-slate-800 text-slate-500 cursor-default'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                      }`}
                    >
                      {inv.isEquipped ? '装備中' : '装備する'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUseItem(inv.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      使用する
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: 所属チーム練習日程 */}
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

      {/* SECTION 4: 能力値・長期成長ゲージ（Stat Experience） */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              能力値・長期成長ゲージ（Stat Experience）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ※年代ごとの成長限界あり（高校生年代は原則OVR45が上限、プロ契約で上限解放）。各項目EXP100%で能力値+1。
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-emerald-400 font-semibold">{player.currentPosition}適性加重評価</div>
            <div className="text-xl font-black text-white leading-none">OVR {player.ovr}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {statLabels.map(({ key, label, desc, category }) => {
            const statValue = player.stats[key] || 50;
            const expValue = player.statExp[key] || 0;

            const categoryBadges = {
              physical: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              technical: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              tactical: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
              mental: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            };

            const categoryNames = {
              physical: 'フィジカル',
              technical: '技術',
              tactical: '戦術',
              mental: 'メンタル'
            };

            return (
              <div key={key} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${categoryBadges[category]}`}>
                      {categoryNames[category]}
                    </span>
                    <span className="font-bold text-slate-200">{label}</span>
                  </div>
                  <span className="font-black text-sm text-emerald-400">{statValue}</span>
                </div>
                <p className="text-[10px] text-slate-500">{desc}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>次の能力UPまで</span>
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
