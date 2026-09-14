import React, { useState } from 'react';
import { GameState, ShopItem } from '../types/footballLife';
import { SHOP_ITEMS } from '../data/worldData';
import { purchaseShopItem } from '../services/freeTimeEngine';
import { 
  X, ShoppingBag, Coins, Sparkles, Check, AlertCircle, Shield, 
  Dumbbell, HeartPulse, Zap, CheckCircle2 
} from 'lucide-react';

interface ShopModalProps {
  gameState: GameState;
  onClose: () => void;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  gameState,
  onClose,
  onUpdateGameState
}) => {
  const { player } = gameState;
  const currentFunds = player.funds ?? 30000;
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cleats' | 'nutrition' | 'recovery' | 'lifestyle'>('all');
  const [purchaseMessage, setPurchaseMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filteredItems = SHOP_ITEMS.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleBuy = (item: ShopItem) => {
    const res = purchaseShopItem(gameState, item.id);
    if (res.success) {
      setPurchaseMessage({ text: res.message, type: 'success' });
      onUpdateGameState(() => res.updatedGameState);
      setTimeout(() => setPurchaseMessage(null), 3500);
    } else {
      setPurchaseMessage({ text: res.message, type: 'error' });
      setTimeout(() => setPurchaseMessage(null), 3500);
    }
  };

  const categoryTabs = [
    { id: 'all', label: 'すべて' },
    { id: 'cleats', label: 'スパイク・シューズ' },
    { id: 'nutrition', label: '栄養・サプリメント' },
    { id: 'recovery', label: 'ケア・リカバリー' },
    { id: 'lifestyle', label: 'ギア・戦術用具' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                フットボールギア＆ケアショップ
              </h2>
              <p className="text-xs text-slate-400">
                プロ仕様スパイク、栄養補助食品、リカバリーケアを購入して能力向上と体調管理を徹底
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">所持金</div>
                <div className="text-sm font-black text-amber-400 font-mono">
                  ¥{currentFunds.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Purchase Notification Toast */}
        {purchaseMessage && (
          <div className={`p-3 text-xs font-bold flex items-center justify-between border-b ${
            purchaseMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/80 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {purchaseMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{purchaseMessage.text}</span>
            </div>
            <button onClick={() => setPurchaseMessage(null)} className="text-xs px-2 opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
          {categoryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredItems.map(item => {
              const canAfford = currentFunds >= item.price;
              const alreadyPurchasedCleats = item.category === 'cleats' && (player.inventory || []).some(inv => inv.name === item.name);

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.category === 'cleats'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : item.category === 'nutrition'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : item.category === 'recovery'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}>
                          {item.category === 'cleats' ? 'スパイク' : item.category === 'nutrition' ? '栄養サプリ' : item.category === 'recovery' ? 'ケア' : 'ギア'}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1">{item.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-400 font-mono">
                          ¥{item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Stat Bonuses or Durability details */}
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      {item.statBonus && Object.entries(item.statBonus).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold">
                          {k.toUpperCase()} +{v}
                        </span>
                      ))}
                      {item.durability && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          耐久: 公式戦{item.durability}試合分
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {item.category === 'cleats' ? '購入後インベントリから装備' : '購入時に即時効果・使用可能'}
                    </span>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        !canAfford
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{alreadyPurchasedCleats ? '追加購入' : '購入する'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>※月給・年俸や勝利給、大会賞金などで所持金が増加します。</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
