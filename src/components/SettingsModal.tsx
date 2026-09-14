import React, { useState } from 'react';
import { GameState, AdminFeedbackLog } from '../types/footballLife';
import { X, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle, MessageSquarePlus, CheckCircle2, Send, ListFilter } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onResetGame: () => void;
  gameState?: GameState;
  onUpdateGameState?: (updater: (prev: GameState) => GameState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onResetGame,
  gameState,
  onUpdateGameState
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'feedback'>('general');

  // Feedback Form State
  const [category, setCategory] = useState<'bug' | 'balance' | 'feature' | 'system'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newLog: AdminFeedbackLog = {
      id: `fb_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      category,
      title: title.trim(),
      content: description.trim(),
      resolved: false
    };

    if (onUpdateGameState) {
      onUpdateGameState(prev => ({
        ...prev,
        adminFeedbackLogs: [newLog, ...(prev.adminFeedbackLogs || [])]
      }));
    }

    setTitle('');
    setDescription('');
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 4000);
  };

  const feedbackLogs = gameState?.adminFeedbackLogs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              ゲーム設定 & 運営フィードバック
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'general'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            基本設定 & 遊び方
          </button>
          <button
            onClick={() => setActiveSubTab('feedback')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'feedback'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>不具合報告・ご要望 ({feedbackLogs.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeSubTab === 'general' && (
            <>
              {/* Save Status */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  自動保存システム稼働中
                </div>
                <p className="text-slate-400 leading-relaxed">
                  ゲーム内の日付進行、練習、試合、メッセージ、移籍などの全データはブラウザ（ローカルストレージ）に安全に自動保存されています。ヘッダーの「セーブ」ボタンでいつでも手動保存も可能です。
                </p>
              </div>

              {/* Game Rules & Concept */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <HelpCircle className="w-4 h-4" />
                  FOOTBALL LIFE の遊び方
                </div>
                <ul className="text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>10歳からスタートし、プロ昇格・世界挑戦・代表・引退までの人生を歩みます。</li>
                  <li>高校生の間はどれだけ練習してもOVR45が成長上限となり、プロ契約で解放されます。</li>
                  <li>「次の日へ」で1日進み、試合5日前の場合は「自動」で一気に進められます。</li>
                  <li>放課後行動や練習画面で「重点自主練習」や「ギア・サプリ購入」を行えます。</li>
                  <li>監督評価は整数（0〜100）で管理され、スタメン起用に影響します。</li>
                  <li>疲労が70%を超えると怪我リスクが跳ね上がるため、休養やサプリでケアを。</li>
                </ul>
              </div>

              {/* Reset Section */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    最初からやり直す（ゲームリセット）
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-600 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      本当に最初からやり直しますか？
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      これまでのセーブデータは完全に消去され、10歳のキャラクター新規作成画面に戻ります。この操作は取り消せません。
                    </p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={onResetGame}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
                      >
                        はい、リセットします
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeSubTab === 'feedback' && (
            <div className="space-y-4">
              {/* Feedback Form */}
              <form onSubmit={handleSendFeedback} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    不具合報告・改善要望を送信
                  </span>
                  <span className="text-[10px] text-slate-500">運営・開発ログに即時登録</span>
                </div>

                {feedbackSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>ご報告ありがとうございます！フィードバックが正常に記録されました。</span>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">報告種別:</label>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      { id: 'bug', label: '不具合・バグ' },
                      { id: 'balance', label: 'バランス調整' },
                      { id: 'feature', label: '新機能要望' },
                      { id: 'system', label: 'その他' }
                    ].map(tab => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setCategory(tab.id as any)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          category === tab.id
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">タイトル / 概要:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 移籍後の日程表示について、自主練習の機能について"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">詳細内容:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="発生した状況や改善してほしい内容を自由にご記入ください。"
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                    maxLength={500}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>フィードバックを登録する</span>
                </button>
              </form>

              {/* History of Submitted Feedback */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>登録済みフィードバック履歴:</span>
                  <span className="text-[11px] text-slate-500">{feedbackLogs.length}件</span>
                </div>

                {feedbackLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                    現在登録されているフィードバックはありません。
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {feedbackLogs.map(log => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            log.category === 'bug'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : log.category === 'balance'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {log.category === 'bug' ? 'バグ報告' : log.category === 'balance' ? 'バランス' : '機能要望'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                        </div>
                        <h4 className="font-bold text-slate-200">{log.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{log.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
