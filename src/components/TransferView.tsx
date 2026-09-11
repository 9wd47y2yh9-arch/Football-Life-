import React, { useState } from 'react';
import { GameState, TransferOffer } from '../types/footballLife';
import { completeTransfer } from '../services/transferEngine';
import { Building2, Globe, DollarSign, Eye, ArrowRight, Check, X, Shield, FileText, Send, Sparkles } from 'lucide-react';

interface TransferViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const TransferView: React.FC<TransferViewProps> = ({ gameState, onUpdateGameState }) => {
  const { player, transferOffers, scoutInterests } = gameState;
  const [activeOffer, setActiveOffer] = useState<TransferOffer | null>(null);
  const [requestReason, setRequestReason] = useState('もっと高いレベルへステップアップしたい');
  const [customReason, setCustomReason] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Handle Offer Advancement Steps
  const handleAdvanceOfferStep = (offer: TransferOffer, nextStep: TransferOffer['step']) => {
    onUpdateGameState(prev => ({
      ...prev,
      transferOffers: prev.transferOffers.map(o => 
        o.id === offer.id ? { ...o, step: nextStep } : o
      )
    }));
    setActiveOffer({ ...offer, step: nextStep });
  };

  // Finalize Transfer
  const handleAcceptTransfer = (offer: TransferOffer) => {
    const transferResult = completeTransfer(gameState, offer);
    onUpdateGameState(prev => ({
      ...prev,
      ...transferResult,
      dailyLogs: [
        {
          date: prev.currentDate,
          text: `【移籍成立】${offer.clubName}（${offer.country}）への完全移籍が成立しました！`,
          type: 'event'
        },
        ...prev.dailyLogs
      ]
    }));
    setActiveOffer(null);
  };

  // Decline Offer
  const handleDeclineOffer = (offerId: string) => {
    onUpdateGameState(prev => ({
      ...prev,
      transferOffers: prev.transferOffers.filter(o => o.id !== offerId)
    }));
    setActiveOffer(null);
  };

  // Submit Player-Initiated Transfer Request
  const handleSubmitTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? customReason.trim() : requestReason;

    // Coach CPU evaluation
    let feedback = '';
    let coachTrustDelta = 0;

    if (player.coachTrust >= 75) {
      feedback = `監督「お前のこれまでの貢献と熱意はよく分かっている。本人の成長を止めるつもりはない。いい話が来たら前向きに検討しよう。」`;
      coachTrustDelta = -2;
    } else if (player.coachTrust <= 40) {
      feedback = `監督「このチームで結果も出していないのに移籍だと？まずはピッチで自分の価値を証明してから言え。」`;
      coachTrustDelta = -8;
    } else {
      feedback = `監督「気持ちは分かった。だがチームの編成もある。正式なオファーが届くまでは目の前の練習に集中しろ。」`;
      coachTrustDelta = -4;
    }

    setRequestFeedback(feedback);

    onUpdateGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        coachTrust: Math.max(0, prev.player.coachTrust + coachTrustDelta)
      },
      dailyLogs: [
        {
          date: prev.currentDate,
          text: `【移籍志願の直訴】「${finalReason}」の理由で監督に移籍希望を申し出ました。`,
          type: 'event'
        },
        ...prev.dailyLogs
      ]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner: Valuation, Wage, Contract */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>推定市場価値</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">
            {player.marketValue >= 100000000
              ? `${(player.marketValue / 100000000).toFixed(1)} 億円`
              : player.marketValue >= 10000
              ? `${Math.floor(player.marketValue / 10000)} 万円`
              : `${player.marketValue} 円`}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">※年齢、OVR、試合実績により変動</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>契約給与（年俸）</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-black text-white">
            {player.wage > 0 ? `${(player.wage / 10000).toLocaleString()} 万円` : 'アマチュア / アカデミー生'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">※プロ契約後に年俸交渉が発生</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>現所属クラブ</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-black text-emerald-400 truncate">{player.currentTeam.name}</div>
          <div className="text-[10px] text-slate-500 mt-1">役割: {player.teamRole === 'starter' ? 'レギュラー' : '控え'}</div>
        </div>
      </div>

      {/* Scout Watchlist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              視察スカウト・関心を寄せるクラブ（スカウト網）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              公式戦や大会でのプレーをモニタリングしている国内外のクラブスカウト一覧
            </p>
          </div>
          <span className="text-xs text-sky-400 font-bold bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-800">
            {scoutInterests.length} クラブが注視中
          </span>
        </div>

        {scoutInterests.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            現在スカウトからの関心はありません。公式戦で結果を出して知名度を高めましょう。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoutInterests.map((scout, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{scout.clubName}</span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                    {scout.country}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 font-medium">評価: {scout.interestLevel}</div>
                <div className="text-[10px] text-slate-500">視察経路: {scout.lastSeen}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incoming Transfer Offers with Multi-Stage Negotiation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              届いている移籍・加入オファー（多段階交渉システム）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              オファーはワンボタンで決まりません。条件確認・監督との相談・交渉を経て受諾・拒否を決定します。
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
            {transferOffers.length} 件のオファー
          </span>
        </div>

        {transferOffers.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            現在、正式な移籍オファーは届いていません。
          </div>
        ) : (
          <div className="space-y-3">
            {transferOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{offer.clubName}</span>
                      <span className="text-xs text-amber-400">★{offer.level}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {offer.country}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{offer.notes}</div>
                  </div>

                  {/* Negotiation Step Badge */}
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">
                      {offer.step === 'contact' ? '初期接触・打診' : offer.step === 'offer' ? '条件確認中' : offer.step === 'in_discussion' ? '監督と相談中' : '最終判断'}
                    </span>
                  </div>
                </div>

                {/* Offer Terms */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px] block">役割の約束:</span>
                    <span className="text-slate-200 font-medium">{offer.rolePromise}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">提示年俸:</span>
                    <span className="text-slate-200 font-medium">{offer.wage > 0 ? `${(offer.wage / 10000).toLocaleString()} 万円` : '育成費補助'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">移籍金:</span>
                    <span className="text-slate-200 font-medium">{Math.floor(offer.transferFee / 10000).toLocaleString()} 万円</span>
                  </div>
                </div>

                {/* Action Buttons based on negotiation step */}
                <div className="flex flex-wrap gap-2 justify-end pt-1">
                  {offer.step === 'contact' && (
                    <button
                      onClick={() => handleAdvanceOfferStep(offer, 'review')}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>詳しい条件の話を聞く</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {offer.step === 'review' && (
                    <button
                      onClick={() => handleAdvanceOfferStep(offer, 'consult_coach')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>現クラブの監督に相談する</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {offer.step === 'consult_coach' && (
                    <button
                      onClick={() => handleAdvanceOfferStep(offer, 'negotiating')}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>熟考し、最終決断へ進む</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {offer.step === 'negotiating' && (
                    <button
                      onClick={() => handleAcceptTransfer(offer)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-950"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>オファーを受諾して移籍決定！</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeclineOffer(offer.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>辞退・断る</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player-Initiated Transfer Request */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-400" />
            プレイヤー自身からの移籍志願・直訴
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            理由を明確にして監督へ移籍希望を伝えます。監督の性格や信頼関係によって反応が異なります。
          </p>
        </div>

        <form onSubmit={handleSubmitTransferRequest} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">移籍を希望する主な理由:</label>
            <select
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
            >
              <option value="もっと高いレベルへステップアップしたい">もっと高いレベルへステップアップしたい</option>
              <option value="出場機会を求めて環境を変えたい">出場機会を求めて環境を変えたい</option>
              <option value="海外リーグへ挑戦したい">海外リーグへ挑戦したい</option>
              <option value="監督の戦術や起用法に合わない">監督の戦術や起用法に合わない</option>
              <option value="クラブに移籍金を残して旅立ちたい">クラブに移籍金を残して旅立ちたい</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">自由記述（監督へのメッセージ・任意）:</label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="例: 自分の可能性を試したいです。認めてください。"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500"
            />
          </div>

          {requestFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-800/80 text-xs text-amber-300 space-y-1">
              <div className="font-bold text-slate-300">監督の返答:</div>
              <p>{requestFeedback}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer"
          >
            監督へ移籍希望を直訴する
          </button>
        </form>
      </div>
    </div>
  );
};
