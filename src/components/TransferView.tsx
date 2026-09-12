import React, { useState } from 'react';
import { GameState, TransferOffer } from '../types/footballLife';
import { completeTransfer, negotiateOfferTerms, declineAndStayWithCurrentClub } from '../services/transferEngine';
import { Building2, Globe, DollarSign, Eye, ArrowRight, Check, X, Shield, FileText, Send, Sparkles, MessageSquare, Award, HeartHandshake } from 'lucide-react';

interface TransferViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const TransferView: React.FC<TransferViewProps> = ({ gameState, onUpdateGameState }) => {
  const { player, transferOffers, scoutInterests } = gameState;
  const [activeNegotiateOfferId, setActiveNegotiateOfferId] = useState<string | null>(null);
  const [negotiateFeedback, setNegotiateFeedback] = useState<{ [key: string]: string }>({});
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
  };

  // 1. Finalize Transfer (受ける)
  const handleAcceptTransfer = (offer: TransferOffer) => {
    const transferResult = completeTransfer(gameState, offer);
    onUpdateGameState(prev => ({
      ...prev,
      ...transferResult,
      dailyLogs: [
        {
          date: prev.currentDate,
          text: offer.isFifteenYoOffer
            ? `【15歳プロ契約誕生！】${offer.clubName}（${offer.country}）と15歳プロ特例契約を締結！プロ選手としての人生が始まりました！`
            : `【移籍成立】${offer.clubName}（${offer.country}）への完全移籍が成立しました！`,
          type: 'event'
        },
        ...prev.dailyLogs
      ]
    }));
  };

  // 2. Decline Offer (断る)
  const handleDeclineOffer = (offerId: string) => {
    onUpdateGameState(prev => ({
      ...prev,
      transferOffers: prev.transferOffers.filter(o => o.id !== offerId)
    }));
  };

  // 3. Negotiate Terms (交渉する)
  const handleNegotiate = (offerId: string, demandType: 'higher_wage' | 'guaranteed_starter') => {
    const { updatedOffers, feedback } = negotiateOfferTerms(gameState, offerId, demandType);
    setNegotiateFeedback(prev => ({ ...prev, [offerId]: feedback }));
    onUpdateGameState(prev => ({
      ...prev,
      transferOffers: updatedOffers
    }));
  };

  // 4. Stay with Current Club (現在のクラブに残る)
  const handleStayWithCurrentClub = (offerId: string) => {
    const result = declineAndStayWithCurrentClub(gameState, offerId);
    onUpdateGameState(prev => ({
      ...prev,
      ...result
    }));
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
          <div className="text-[10px] text-slate-500 mt-1">※年齢、OVR、能力、公式戦実績により変動</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>契約形態 / 年俸</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-black text-white">
            {player.wage > 0 ? `${(player.wage / 10000).toLocaleString()} 万円 / 年` : 'アマチュア / アカデミー生'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {player.age >= 15 ? '※15歳から卓越した才能を持つ選手へプロオファーが発生' : '※15歳以上でプロ特例契約が可能'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>現所属クラブ</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-black text-emerald-400 truncate">{player.currentTeam.name}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            役割: {player.teamRole === 'starter' ? 'レギュラー（先発）' : 'サブ（控え）'} | 指揮官信頼度: {player.coachTrust}%
          </div>
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
              公式戦や大会でのプレーをモニタリングしている国内外の実在クラブスカウト一覧
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
              届いている移籍・プロ加入オファー
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              「受ける」「断る」「交渉する」「現在のクラブに残る」から選択できます。
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
            {transferOffers.length} 件のオファー
          </span>
        </div>

        {transferOffers.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            現在、正式なオファーは届いていません。15歳以上で高いOVRや試合実績を出すと、実在プロクラブからのスカウトオファーが届きます。
          </div>
        ) : (
          <div className="space-y-4">
            {transferOffers.map((offer) => {
              const is15Pro = offer.isFifteenYoOffer;
              const feedback = negotiateFeedback[offer.id] || offer.negotiationFeedback;

              return (
                <div
                  key={offer.id}
                  className={`bg-slate-950 p-4 rounded-xl border ${
                    is15Pro ? 'border-amber-500/60 shadow-lg shadow-amber-950/30' : 'border-slate-800'
                  } space-y-3.5`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                        {is15Pro && (
                          <span className="text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-slate-950" />
                            15歳プロ特例契約オファー
                          </span>
                        )}
                        {offer.isProContract && !is15Pro && (
                          <span className="text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full">
                            実在プロクラブ
                          </span>
                        )}
                        <span className="text-base text-white">{offer.clubName}</span>
                        {offer.proLeagueName && (
                          <span className="text-[11px] text-sky-400 font-medium">({offer.proLeagueName})</span>
                        )}
                        <span className="text-xs text-amber-400">★{offer.level}</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {offer.country}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">{offer.notes}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                        {offer.step === 'contact' ? '初期打診' : offer.step === 'review' ? '条件提示中' : offer.step === 'negotiating' ? '条件交渉中' : '最終決断'}
                      </span>
                    </div>
                  </div>

                  {/* Offer Terms */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px] block">役割・起用方針:</span>
                      <span className="text-slate-200 font-bold">{offer.rolePromise}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">提示年俸:</span>
                      <span className="text-amber-400 font-bold">
                        {offer.wage > 0 ? `${(offer.wage / 10000).toLocaleString()} 万円 / 年` : '育成費補助'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">移籍金:</span>
                      <span className="text-slate-200 font-medium">
                        {offer.transferFee > 0 ? `${Math.floor(offer.transferFee / 10000).toLocaleString()} 万円` : '0円（育成年代・特例）'}
                      </span>
                    </div>
                  </div>

                  {/* Negotiation Feedback (if any) */}
                  {feedback && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-800/80 text-xs text-sky-200">
                      {feedback}
                    </div>
                  )}

                  {/* Interactive Negotiation Drawer */}
                  {activeNegotiateOfferId === offer.id && (
                    <div className="p-3.5 bg-slate-900 rounded-xl border border-purple-800/80 space-y-2.5">
                      <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        クラブ強化担当との条件交渉（残り交渉可能: {Math.max(0, 2 - (offer.negotiationRound || 0))} 回）
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleNegotiate(offer.id, 'higher_wage')}
                          className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-bold transition cursor-pointer"
                        >
                          💰 年俸アップを要求する（+25%）
                        </button>
                        <button
                          onClick={() => handleNegotiate(offer.id, 'guaranteed_starter')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 text-xs font-bold transition cursor-pointer"
                        >
                          ⚽ スタメン出場確約を要求する
                        </button>
                        <button
                          onClick={() => setActiveNegotiateOfferId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs transition cursor-pointer"
                        >
                          閉じる
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4 Core User Choice Buttons: 受ける / 断る / 交渉する / 現在のクラブに残る */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-900">
                    {/* 1. 受ける */}
                    <button
                      onClick={() => handleAcceptTransfer(offer)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950"
                    >
                      <Check className="w-4 h-4" />
                      <span>{is15Pro ? 'プロ契約を結んで移籍する（受ける）' : 'オファーを受ける（移籍決定）'}</span>
                    </button>

                    {/* 2. 交渉する */}
                    <button
                      onClick={() => setActiveNegotiateOfferId(activeNegotiateOfferId === offer.id ? null : offer.id)}
                      className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>交渉する</span>
                    </button>

                    {/* 3. 現在のクラブに残る */}
                    <button
                      onClick={() => handleStayWithCurrentClub(offer.id)}
                      className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>現在のクラブに残る（残留）</span>
                    </button>

                    {/* 4. 断る */}
                    <button
                      onClick={() => handleDeclineOffer(offer.id)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>断る</span>
                    </button>
                  </div>
                </div>
              );
            })}
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
