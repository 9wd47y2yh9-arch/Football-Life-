import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onResetGame }) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>ゲーム設定 & セーブデータ</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Status */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            自動保存システム稼働中
          </div>
          <p className="text-slate-400 leading-relaxed">
            ゲーム内の日付進行、練習、試合、メッセージ、移籍などの全データはブラウザ（ローカルストレージ）に自動保存されています。
          </p>
        </div>

        {/* Game Rules & Concept */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <HelpCircle className="w-4 h-4" />
            FOOTBALL LIFE の遊び方
          </div>
          <ul className="text-slate-400 space-y-1.5 list-disc list-inside">
            <li>10歳からスタートし、60歳までのサッカー人生を歩みます。</li>
            <li>「次の日へ」を押すと日付が1日進みます。</li>
            <li>放課後の「自由時間」は1日1回選択できます。</li>
            <li>スマホのSNSでは自由にテキストを書いて投稿できます。</li>
            <li>疲労が70%を超えると怪我のリスクが急増します。休養や睡眠を大切に。</li>
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
      </div>
    </div>
  );
};
